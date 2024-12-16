"""
ajax - estimate_population - get_population_estimation
ajax - calculate_file_upload_cost - handle_uploaded_email_list
ajax - validate_address - validate_address_or_zip
ajax - calculate_email_cost - calculate_email_cost
ajax - "" - handle_email_form

"""


def get_population_estimation(request):
    """
    Estimates the population for a given zip code and mileage radius.
    """
    try:
        if request.method == "POST":
            zipcode = request.POST["zipcd"]
            miles_radius = request.POST["mileage_radius"]

            CMAP_API_ZIPS = CMAP_API_HOST + "/api/info/zip_miles"
            mileage_radius_mapping = {
                1: 3,
                2: 5,
                3: 10,
                4: 15,
                5: 20,
            }
            urlparams = {
                "miles": mileage_radius_mapping[int(miles_radius)],
                "zipcode": str(zipcode),
            }

            flag = 0
            if "page" in request.POST:
                flag = 1
                urlparams = {
                    "miles": int(miles_radius),
                    "zipcode": str(zipcode),
                }

            try:
                url = "{}?{}".format(
                    CMAP_API_ZIPS,
                    "&".join(
                        ["{}={}".format(key, value) for key, value in urlparams.items()]
                    ),
                )
                logger.debug(f"Making GET request to {url}")
                response = requests.request("GET", url, verify=False)

                if response.status_code == 200:
                    zipcodes_list = response.json()
                    all_zip_bndry = get_zip_list(
                        request, {"zips": zipcodes_list, "cr_enabled": True}
                    )

                    if all_zip_bndry is None:
                        return JsonResponse(
                            {
                                "status": "error",
                                "message": "Failed to get zip boundary list",
                            },
                            status=500,
                        )

                    carrier_routes_ids = [
                        str(i["properties"].get("GEOCODE", ""))
                        for i in all_zip_bndry
                        if "properties" in i and "GEOCODE" in i["properties"]
                    ]

                    population_count = (
                        CarrierRouteDemographic.objects.filter(
                            carrier_route_id__in=carrier_routes_ids
                        )
                        .aggregate(total_population=Sum("population"))
                        .get("total_population", 0)
                    )

                    population_count_formatted = "{:,}".format(population_count)
                    logger.info(
                        f"Population count for zipcode {zipcode} and radius {miles_radius}: {population_count_formatted}"
                    )

                    if flag == 1:
                        return JsonResponse(
                            {
                                "status": "success",
                                "population_count": population_count_formatted,
                                "carrier_routes": carrier_routes_ids,
                            }
                        )
                    else:
                        return JsonResponse(
                            {
                                "status": "success",
                                "population_count": population_count_formatted,
                            }
                        )

                else:
                    logger.warning(
                        f"Invalid response from CMAP API. Status code: {response.status_code}"
                    )
                    return JsonResponse(
                        {
                            "status": "partial",
                            "message": "Please provide a valid zip code.",
                        }
                    )

            except Exception as e:
                logger.exception(
                    "An error occurred while processing population estimation request."
                )
                return JsonResponse({"status": "error", "message": str(e)})

        else:
            logger.warning("METHOD NOT ALLOWED for get_population_estimation.")
            return JsonResponse(
                {"status": "error", "message": "METHOD NOT ALLOWED"}, status=405
            )
    except Exception as e:
        logger.exception("An unexpected error occurred in get_population_estimation.")
        return JsonResponse(
            {"status": "error", "message": "An unexpected error occurred."}
        )


def get_zip_list(request, params={}):
    """
    Fetches the zip list from CMAP API based on the parameters provided.
    """
    zip_codes = params.get("zips", [])
    cr_enabled = params.get("cr_enabled", "false")

    CMAP_API_ZIP_LIST = CMAP_API_HOST + "/api/bndry/ziplist"
    urlparams = {"cr": cr_enabled}
    url = "{}?{}".format(
        CMAP_API_ZIP_LIST,
        "&".join(["{}={}".format(key, value) for key, value in urlparams.items()]),
    )

    zipcodes_payload = {"zips": zip_codes}
    headers = {"Content-Type": "application/json"}

    try:
        logger.debug(f"Making POST request to {url} with payload: {zipcodes_payload}")
        response = requests.post(url, json=zipcodes_payload, headers=headers)

        if response.status_code == 200:
            response_content = response.json()
            logger.info("Successfully fetched zip boundary list.")
            return response_content
        else:
            logger.error(
                f"Error fetching zip boundary list. Status code: {response.status_code}"
            )
    except requests.RequestException as e:
        logger.exception("An error occurred while fetching zip boundary list.")

    return None


def handle_uploaded_email_list(request):
    try:
        # Start processing the file
        logger.info("File upload started.")

        file = request.FILES.get("file")
        if not file:
            logger.error("No file was uploaded.")
            return JsonResponse({"status": "Error", "message": "No file uploaded"})

        # Load the workbook and select the active sheet
        workbook = load_workbook(file)
        sheet = workbook.active
        logger.info("Workbook loaded successfully.")

    except Exception as e:
        logger.error(f"Error occurred during file upload or workbook loading: {str(e)}")
        return JsonResponse(
            {"status": "Error", "message": "Something went wrong with file upload"}
        )

    email_count = 0
    try:
        # Checking the header value
        header_value = sheet.cell(row=1, column=1).value
        logger.info(f"Header value found: {header_value}")

        # Check if the header matches "email" or "email address" and adjust start row
        if header_value and header_value.lower() in [
            "email",
            "email address",
            "email id",
        ]:
            start_row = 2  # Skip header row
            logger.info("Header matches. Starting from row 2.")
        else:
            start_row = 1  # Include header in the count
            logger.info("Header does not match. Starting from row 1.")

        # Count all entries in the first column from the starting row
        for row in range(start_row, sheet.max_row + 1):
            cell_value = sheet.cell(row=row, column=1).value
            if cell_value:
                email_count += 1

        logger.info(f"Total email count: {email_count}")

        # Calculate the estimated cost
        estimated_cost = email_count * 0.5
        logger.info(f"Estimated cost calculated: $ {estimated_cost}")

        # Return the email count and estimated cost as a response
        return JsonResponse(
            {"email_count": email_count, "estimated_cost": "$ " + str(estimated_cost)}
        )

    except Exception as e:
        logger.error(
            f"Error occurred while counting emails or calculating cost: {str(e)}"
        )
        return JsonResponse(
            {"status": "Error", "message": "Error processing the email list"}
        )


def carrier_route_age_mapping(age_range):

    age_range_columns = {
        (15, 24): "population_15_to_24_yrs",
        (25, 34): "population_25_to_34_yrs",
        (35, 44): "population_35_to_44_yrs",
        (45, 54): "population_45_to_54_yrs",
        (55, 64): "population_55_to_64_yrs",
        (65, float("inf")): "population_65_plus_yrs",
    }

    min_age, max_age = age_range

    columns_to_sum = []
    for (start, end), column_name in age_range_columns.items():
        if min_age < end and max_age > start:
            columns_to_sum.append(column_name)

    return columns_to_sum


def carrier_route_income_mapping(income_range):

    income_range_columns = {
        (0, 10000): "households_income_lessthan_10t",
        (10000, 25000): "households_income_10t_to_24_point_9t",
        (25000, 35000): "households_income_25t_to_34_point_9t",
        (35000, 50000): "households_income_35t_to_49_point_9t",
        (50000, 75000): "households_income_50t_to_74_point_9t",
        (75000, 100000): "households_income_75t_to_99_point_9t",
        (100000, 125000): "households_income_100t_to_124_point_9t",
        (125000, 150000): "households_income_125t_to_149_point_9t",
        (150000, 200000): "households_income_150t_to_199_point_9t",
        (200000, float("inf")): "households_income_200t_plus",
    }

    min_income, max_income = income_range

    columns_to_sum = []
    for (start, end), column_name in income_range_columns.items():
        if min_income < end and max_income > start:
            columns_to_sum.append(column_name)

    return columns_to_sum


def get_population(zipcd, mileage_radius):
    try:
        logger.info(
            "Starting to get population data for zip code: %s with radius: %s",
            zipcd,
            mileage_radius,
        )

        # Prepare the POST request
        population_api = HttpRequest()
        population_api.method = "POST"
        population_api.POST = {
            "zipcd": zipcd,
            "mileage_radius": mileage_radius,
            "page": "email",
        }

        # Call the API to get population estimation
        logger.info("Making request to population API.")
        response = get_population_estimation(population_api)

        # Load the response content
        updated_response = json.loads(response.content)

        # Check the status of the response
        if updated_response["status"] != "success":
            logger.warning(
                "API response not successful: %s",
                updated_response.get("message", "Unknown error"),
            )
            return 0

        # Extract and log population count
        population_count = int(updated_response["population_count"].replace(",", ""))
        logger.info("Population count retrieved: %d", population_count)

        # Return population data
        return {
            "population_count": population_count,
            "carrier_routes": updated_response["carrier_routes"],
        }

    except Exception as e:
        # Log any error that occurs
        logger.error("Error occurred while getting population data: %s", str(e))
        return 0


def calculate_email_cost(request):
    try:
        if request.method == "POST":
            logger.info("Starting email cost calculation.")

            data = request.POST

            # Extract address data (whether it's zipCodeOnly or full address)
            demographic_data = {
                "age": data.get("trgtByDemo_Age"),
                "income": data.get("trgtByDemo_Income"),
                "children_in_hh": data.getlist("trgtByDemo_ChildrenInHH[]"),
                "homeowner": data.getlist("trgtByDemo_HomeOwner[]"),
            }
            mileage_radius = data.get("mileageRadius")
            address = data.get("address")

            # Log received data for debugging
            logger.debug("Received demographic data: %s", demographic_data)
            logger.debug("Received mileage radius: %s", mileage_radius)
            logger.debug("Received address data: %s", address)

            # Extract other form data such as targeting interests
            interests = data.get("trgtByInterests")

            total_selections = 0
            final_query = {}

            # Process age data
            if demographic_data["age"] is not None:
                total_selections += 1
                age = demographic_data["age"].split(",")
                min_age = age[0]
                max_age = age[1]

                if min_age == "65 +":
                    min_age = 66
                if max_age == "65 +":
                    max_age = 66

                age_query = carrier_route_age_mapping((int(min_age), int(max_age)))
                final_query["age_query"] = age_query
                logger.debug("Age query: %s", age_query)

            # Process income data
            if demographic_data["income"] is not None:
                total_selections += 1
                income = demographic_data["income"].split(",")
                min_income = income[0].replace("K", "000")
                max_income = income[1].replace("K", "000")

                if min_income == "<10000":
                    min_income = "9000"
                elif min_income == "200+":
                    min_income = "210000"
                if max_income == "<10000":
                    max_income = "9000"
                elif max_income == "200+":
                    max_income = "210000"

                income_query = carrier_route_income_mapping(
                    (int(min_income), int(max_income))
                )
                final_query["income_query"] = income_query
                logger.debug("Income query: %s", income_query)

            # Process children in household data
            if demographic_data["children_in_hh"]:
                total_selections += 1
                children_query = []
                if len(demographic_data["children_in_hh"]) == 2:
                    children_query = [
                        "children_in_household",
                        "no_children_in_household",
                    ]
                elif demographic_data["children_in_hh"][0] == "present":
                    children_query = ["children_in_household"]
                elif demographic_data["children_in_hh"][0] == "not present":
                    children_query = ["no_children_in_household"]
                final_query["children_query"] = children_query
                logger.debug("Children query: %s", children_query)

            # Process homeowner data
            if demographic_data["homeowner"]:
                total_selections += 1
                homeowner_query = []
                if len(demographic_data["homeowner"]) == 2:
                    homeowner_query = ["occupied_units_owner", "occupied_units_renter"]
                elif demographic_data["homeowner"][0] == "owner":
                    homeowner_query = ["occupied_units_owner"]
                elif demographic_data["homeowner"][0] == "renter":
                    homeowner_query = ["occupied_units_renter"]
                final_query["homeowner_query"] = homeowner_query
                logger.debug("Homeowner query: %s", homeowner_query)

            if not final_query:
                logger.warning("No selections made, returning success with no data.")
                return JsonResponse({"status": "success"})

            # Process address and population data
            updated_address = json.loads(address)
            population_data = get_population(updated_address["zipcode"], mileage_radius)
            logger.debug("Population data: %s", population_data)

            # Combine the query data into one list
            final_list = []
            for _, val in final_query.items():
                final_list.append(val)

            updated_final_list = [item for sublist in final_list for item in sublist]
            logger.debug("Final combined query list: %s", updated_final_list)

            # Create an aggregation dictionary
            aggregation = {
                "estimated_quantity": sum(Sum(F(field)) for field in updated_final_list)
            }
            logger.debug("Aggregation query: %s", aggregation)

            # Perform the aggregation query on the database
            queryset = CarrierRouteDemographic.objects.filter(
                carrier_route_id__in=population_data["carrier_routes"]
            ).aggregate(**aggregation)

            estimated_quantity = queryset.get("estimated_quantity", 0)
            estimated_cost = (estimated_quantity / total_selections) * 0.05
            logger.info(
                "Calculated email cost. Quantity: %d, Estimated cost: %.2f",
                estimated_quantity,
                estimated_cost,
            )

            return JsonResponse(
                {
                    "status": "success",
                    "data": {
                        "list_quantity": estimated_quantity,
                        "est_cost": estimated_cost,
                    },
                }
            )

        else:
            logger.error("Invalid request method: %s", request.method)
            return HttpResponse("Method Not Allowed", status=405)

    except Exception as e:
        logger.error("An error occurred during email cost calculation: %s", str(e))
        return JsonResponse({"status": "error", "error": str(e)})


def set_design_query(data):
    try:
        logger.info("Starting to set design query with provided data.")

        design_query = {}
        design_data = json.loads(data["design_data"])

        logger.info("Successfully loaded design data.")

        if "design_file" in data:
            # If there is a design file in the data, set the design query accordingly
            design_query = {
                "design_fileobj": data["file_obj"],
                "design_option": "Use my design",
                "file_name": design_data["uploadedFile"],
                "email_text": design_data["emailText"],
            }
            logger.info(f"Using design file. File name: {design_data['uploadedFile']}")
        else:
            # If there is no design file, set it for creating a new design
            design_query = {
                "design_option": "Create design for me",
                "email_text": design_data["emailText"],
            }
            logger.info("No design file provided. Option set to create a new design.")

        logger.info("Design query set successfully.")
        return design_query

    except json.JSONDecodeError as json_err:
        logger.error(f"Error decoding JSON for design_data: {str(json_err)}")
        return {}
    except KeyError as key_err:
        logger.error(f"Missing key in the provided data: {str(key_err)}")
        return {}
    except Exception as e:
        logger.error(f"Unexpected error occurred while setting design query: {str(e)}")
        return {}


def check_list_file_status(order, ops):
    try:
        file_obj = order["file_obj"]
        user_id = order["user_id"]

        file_name = (file_obj.name).replace(".xlsx", "")
        file_count = 0

        logger.info(
            f"Checking list file status for user_id: {user_id}, file_name: {file_name}, operation: {ops}"
        )

        # Filter the cart data for the specific user and cart type
        cart_data = Cart.objects.filter(user__id=user_id, cart_type="2")

        # Use a list comprehension to extract filenames, safely handle missing keys
        filenames = []
        for data in cart_data:
            try:
                # Attempt to load cart data and extract 'file_name'
                cart_item = json.loads(data.cart_data)
                file_name_from_cart = cart_item.get("file_name", None)

                # Only append to filenames if 'file_name' exists
                if file_name_from_cart:
                    filenames.append(file_name_from_cart)
            except (json.JSONDecodeError, KeyError) as e:
                logger.error(
                    f"Error decoding cart data or missing key for cart data: {str(e)}"
                )
                continue  # Skip this cart item if there's an error

        # Count occurrences of the specific file_name
        file_count = filenames.count(file_name)
        logger.info(
            f"File '{file_name}' appears {file_count} time(s) in the user's cart data."
        )

        if ops == "save":
            # Check if the count is greater than 1
            if file_count > 1:
                logger.info(f"File '{file_name}' count exceeds 1. Calling save_cart.")
                save_cart(user_id, order, file_name)
            else:
                # Call the helper function to save the file
                logger.info(
                    f"Saving uploaded file for user_id: {user_id}, file_name: {file_name}"
                )
                save_uploaded_file(file_obj, user_id, "source_list")

                # Now, save the cart
                save_cart(user_id, order, file_name)

        elif ops == "check":
            logger.info(f"Returning file count for check operation: {file_count}")
            return file_count

        logger.info(
            f"Operation '{ops}' completed successfully for user_id: {user_id}, file_name: {file_name}"
        )
        return {"status": "Success", "message": "Order submitted successfully!"}

    except Exception as e:
        logger.error(
            f"Error occurred during check_list_file_status for user_id: {user_id}, error: {str(e)}"
        )
        return {"status": "Error", "message": f"{str(e)}"}


def check_design_file_status(order, ops):
    try:
        file_obj = order["file_obj"]
        user_id = order["user_id"]

        file_name = (file_obj.name).replace(".pdf", "")
        file_count = 0

        logger.info(
            f"Checking design file status for user_id: {user_id}, file_name: {file_name}, operation: {ops}"
        )

        # Filter the cart data for the specific user and cart type
        cart_data = Cart.objects.filter(user__id=user_id, cart_type="2")

        # Use a list comprehension to extract filenames, safely check for the presence of 'design_file_name'
        filenames = []
        for data in cart_data:
            try:
                # Attempt to load cart data and extract 'design_file_name'
                cart_item = json.loads(data.cart_data)
                design_file_name = cart_item.get("design_file_name", None)

                # Only append to filenames if 'design_file_name' exists
                if design_file_name:
                    filenames.append(design_file_name)
            except (json.JSONDecodeError, KeyError) as e:
                logger.error(
                    f"Error decoding cart data or missing key for cart data: {str(e)}"
                )
                continue  # Skip this cart item if there's an error

        # Count occurrences of the specific file_name
        file_count = filenames.count(file_name)
        logger.info(
            f"Design file '{file_name}' appears {file_count} time(s) in the user's cart data."
        )

        if ops == "save":
            # Check if the count is greater than 1
            if file_count > 1:
                logger.info(
                    f"Design file '{file_name}' already exists in the cart. No further action taken."
                )
                return {"status": "Success", "message": "File already present"}
            else:
                # Call the helper function to save the file
                logger.info(
                    f"Saving design file for user_id: {user_id}, file_name: {file_name}"
                )
                save_uploaded_file(file_obj, user_id, "design_list")

            return {"status": "Success", "message": "File uploaded"}

        elif ops == "check":
            logger.info(f"Returning file count for check operation: {file_count}")
            return file_count

        logger.info(
            f"Operation '{ops}' completed successfully for user_id: {user_id}, file_name: {file_name}"
        )
        return {"status": "Success", "message": "Operation completed successfully"}

    except Exception as e:
        logger.error(
            f"Error occurred during check_design_file_status for user_id: {user_id}, error: {str(e)}"
        )
        return {"status": "Error", "message": f"{str(e)}"}


def handle_email_form(request):
    if request.method == "POST":
        data = request.POST.dict()

        # Log the incoming POST request data
        logger.info(f"Received POST request with data: {data}")

        # use my mailing list
        if "emailCount" and "emailCost" in data:

            file_obj = request.FILES.get("uploadedFile")
            design_file = request.FILES.get("design_file")

            order_query = {
                "user_id": request.user.id,
                "campaign_name": data["campaignName"],
                "date_range": data["dateRange"],
                "additional_text": (
                    data["additionalComments"] if data["additionalComments"] else "NA"
                ),
                "budget": data["emailCost"],
                "list_quantity": data["emailCount"],
                "media_type": "Email Campaign",
                "platform_type": "Use a Mailing List",
                "file_obj": file_obj,
            }

            logger.info(f"Order query for mailing list: {order_query}")

            flag = 0
            if design_file:
                flag = 1
                design_query = set_design_query(
                    {
                        "design_file": design_file,
                        "design_data": data["design_data"],
                        "file_obj": design_file,
                    }
                )
                logger.info(f"Design file provided, design query: {design_query}")

            else:
                design_query = set_design_query({"design_data": data["design_data"]})
                budget = float(order_query["budget"].replace("$ ", "")) + 75
                order_query["budget"] = "$ " + str(budget)
                logger.info(f"Updated budget for mailing list: {order_query['budget']}")

            order_query["design_query"] = design_query

            ops = "save"
            response = check_list_file_status(order_query, ops)

            logger.info(f"Response from check_list_file_status: {response}")

            if response["status"] == "Success":

                if flag == 1:
                    time.sleep(1)
                    check_file = check_design_file_status(
                        {
                            "file_obj": design_file,
                            "user_id": request.user.id,
                        },
                        "save",
                    )

                    logger.info(f"Design file check status: {check_file}")

                    if "status" not in check_file:
                        logger.error("Error in design file check: Missing status.")
                        return JsonResponse(
                            {
                                "status": "Error",
                                "message": "There was some error, Please try again later!",
                            }
                        )

                    elif check_file["status"] != "Success":
                        logger.error(
                            f"Error in design file check: {check_file['message']}"
                        )
                        return JsonResponse(
                            {
                                "status": "Error",
                                "message": f"Something went wrong: {check_file['message']}",
                            }
                        )

                logger.info("Order processed successfully for mailing list.")
                return JsonResponse(
                    {"status": "Success", "message": response["message"]}
                )
            else:
                logger.error(f"Error in list file check: {response['message']}")
                return JsonResponse(
                    {
                        "status": "Error",
                        "message": response["message"],
                    }
                )

        # build me list logic
        elif "address" in data:
            design_file = request.FILES.get("design_file")

            address = json.loads(data["address"])
            zipcode = ""
            if "zipcode" in address:
                zipcode = address["zipcode"]
            full_address = []

            if "city" in address:
                full_address.append(address["streetAddress"])
                full_address.append(address["city"])
                full_address.append(address["state"])
                full_address.append(address["zipcode"])

                zipcode = ",".join(full_address)

            logger.info(f"Full address for 'build me list': {zipcode}")

            if not design_file:

                budget = float(data["extra_fields_cost"].replace("$ ", "")) + 75
                design_data = set_design_query({"design_data": data["design_data"]})

                order_query = {
                    "user_id": request.user.id,
                    "campaign_name": data["campaignName"],
                    "date_range": data["dateRange"],
                    "additional_text": (
                        data["additionalComments"]
                        if data["additionalComments"]
                        else "NA"
                    ),
                    "budget": "$ " + str(budget),
                    "list_quantity": data["extra_fields_quantity"],
                    "media_type": "Email Campaign",
                    "platform_type": "Build me a list",
                    "zipcode": zipcode,
                    "design_query": design_data,
                }

                save_cart(request.user.id, order_query)
                logger.info(f"Order saved for 'build me list': {order_query}")

                return JsonResponse(
                    {"status": "Success", "message": "Order submitted successfully!"}
                )

            else:

                order_query = {
                    "user_id": request.user.id,
                    "campaign_name": data["campaignName"],
                    "date_range": data["dateRange"],
                    "additional_text": (
                        data["additionalComments"]
                        if data["additionalComments"]
                        else "NA"
                    ),
                    "budget": data["extra_fields_cost"],
                    "list_quantity": data["extra_fields_quantity"],
                    "media_type": "Email Campaign",
                    "platform_type": "Build me a list",
                    "zipcode": zipcode,
                }

                design_query = set_design_query(
                    {
                        "design_file": design_file,
                        "design_data": data["design_data"],
                        "file_obj": design_file,
                    }
                )
                order_query["design_query"] = design_query
                save_cart(request.user.id, order_query)

                logger.info(
                    f"Order saved with design file for 'build me list': {order_query}"
                )

                check_file = check_design_file_status(
                    {"file_obj": design_file, "user_id": request.user.id}, "save"
                )

                logger.info(f"Design file check status: {check_file}")

                if check_file["status"] != "Success":
                    logger.error(f"Error in design file check: {check_file['message']}")
                    return JsonResponse(
                        {
                            "status": "Error",
                            "message": check_file["message"],
                        }
                    )
                else:
                    logger.info("Order processed successfully for 'build me list'.")
                    return JsonResponse(
                        {
                            "status": "Success",
                            "message": "Order submitted successfully!",
                        }
                    )

        else:
            logger.warning("Neither 'emailCount' nor 'address' found in POST data.")
            return JsonResponse(
                {
                    "message": "Make sure to either select build me list or create me list"
                }
            )
    return render(request, "email.html")


def extract_zipcode(data):
    try:
        logger.info("Starting to extract zip code from the provided data.")

        # Case 1: If the data is a dictionary with a key 'zipcode'
        if isinstance(data, dict) and "zipcode" in data:
            logger.info(f"Zip code found in dictionary: {data['zipcode']}")
            return data["zipcode"]

        # Case 2: If the data is a string containing the zip code
        elif isinstance(data, str):
            logger.info(f"Extracting zip code from string: {data}")
            # Use regular expression to find a 5-digit zip code
            match = re.search(r"\b\d{5}\b", data)
            if match:
                logger.info(f"Zip code found in string: {match.group(0)}")
                return match.group(0)

        # Return None if no zip code is found
        logger.warning("No zip code found in the provided data.")
        return None

    except Exception as e:
        logger.error(f"Error occurred while extracting zip code: {str(e)}")
        return None


def validate_address_or_zip(request):
    try:
        logger.info("Starting address or ZIP code validation.")

        # Define the Mapbox API endpoint
        geocoding_url = "https://api.mapbox.com/geocoding/v5/mapbox.places/"

        # Get the input value from the request
        input_value = request.POST.get("inputValue")
        if not input_value:
            logger.warning("Input value is missing or empty.")
            return JsonResponse(
                {"valid": False, "error": "Input value is missing or empty."}
            )

        logger.info("Received input value: %s", input_value)

        # Get the Mapbox access token from environment variables
        mapbox_access_token = os.getenv("MAPBOX_API_ACCESS_TOKEN")
        if not mapbox_access_token:
            logger.warning("Mapbox API access token is missing.")
            return JsonResponse(
                {"valid": False, "error": "Mapbox API access token is missing."}
            )

        query = f"{input_value}.json"

        # Build the full URL with query parameters
        url = f"{geocoding_url}{query}?access_token={mapbox_access_token}&limit=1&country=US"
        logger.info("Requesting Mapbox API with URL: %s", url)

        try:
            # Make a request to the Mapbox API
            response = requests.get(url)
            response.raise_for_status()  # Raise an HTTPError if the response code is not 200
        except requests.exceptions.RequestException as e:
            # Handle errors related to the request (e.g., network issues, invalid URL)
            logger.error("API request failed: %s", str(e))
            return JsonResponse(
                {"valid": False, "error": f"API request failed: {str(e)}"}
            )

        # Handle the response
        if response.status_code == 200:
            data = response.json()

            if data.get("features"):  # Ensure "features" key exists in the response
                # Extract the most relevant result
                result = data["features"][0]
                place_name = result.get("place_name", "Unknown location")
                logger.info("Place name found: %s", place_name)

                zip_cd = extract_zipcode(input_value)
                logger.info("Extracted ZIP code: %s", zip_cd)

                population_count = get_population(zip_cd, 2)

                if population_count == 0:
                    logger.warning("Population count is 0, invalid address.")
                    return JsonResponse(
                        {"valid": False, "error": "Please provide a valid address"}
                    )

                estimated_cost = round(
                    int(population_count["population_count"]) * 0.005
                )
                logger.info(
                    "Population count: %d, Estimated cost: %s",
                    population_count["population_count"],
                    estimated_cost,
                )

                return JsonResponse(
                    {
                        "valid": True,
                        "place_name": place_name,
                        "population_count": population_count["population_count"],
                        "estimated_cost": estimated_cost,
                    }
                )
            else:
                logger.warning("No matching address or ZIP code found.")
                return JsonResponse(
                    {"valid": False, "error": "No matching address or ZIP code found."}
                )
        else:
            logger.error("API request failed with status code %d", response.status_code)
            return JsonResponse(
                {
                    "valid": False,
                    "error": f"API request failed with status code {response.status_code}",
                }
            )

    except Exception as e:
        # Catch all other exceptions (e.g., issues with request processing, environment variable access)
        logger.error("An error occurred: %s", str(e))
        return JsonResponse({"valid": False, "error": f"An error occurred: {str(e)}"})