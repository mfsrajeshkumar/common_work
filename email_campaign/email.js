// Ensure interestsSection is active by default on page load
window.addEventListener('DOMContentLoaded', (event) => {
    const interestsSection = document.getElementById('interestsSection');
    const interestsCheckbox = document.querySelector('input[type="checkbox"][onchange*="interestsSection"]');
    const radioButtons = document.querySelectorAll('input[type="radio"][name="select-row"]');
    const thirdRadioButton = radioButtons[2];

    // If the interests checkbox is checked by default, add the 'section-active' class and check the third radio button
    if (interestsCheckbox.checked) {
        interestsSection.classList.add('section-active');
        thirdRadioButton.checked = true;  // Check the third radio button
    }
});

function toggleSection(checkbox, sectionId) {
    const section = document.getElementById(sectionId);
    const radioButtons = section.querySelectorAll('input[type="radio"][name="select-row"]');

    // Toggle the section visibility
    if (checkbox.checked) {
        section.classList.add("section-active");
    } else {
        section.classList.remove("section-active");
        // Reset all radio buttons (uncheck them) when the checkbox is unchecked
        radioButtons.forEach(button => {
            button.checked = false;
        });
    }
}

// Function to toggle accordion visibility
function toggleAccordion(event) {
    // Find the closest accordion element to the clicked header
    const accordion = event.target.closest('.accordion');
    const content = accordion.querySelector('.accordion-content');
    const icon = accordion.querySelector('.accordion-icon');

    // Toggle the visibility of the content and the icon
    if (content.style.display === 'block') {
        content.style.display = 'none';  // Hide content
        icon.textContent = '+';          // Change icon to "+"
    } else {
        content.style.display = 'block'; // Show content
        icon.textContent = 'x';          // Change icon to "x"
    }
}

function showForm(formId, sourceId) {
    const sources = document.getElementById(sourceId)
    const forms = sources.querySelectorAll('.form');

    forms.forEach(form => {
        form.style.display = 'none'; // Hide all forms
    });

    if (formId === "form2") {
        handleExtraFields()
    }

    if (formId === "form3" || formId === "form4") {
        const emailField = document.getElementById("email_fields")
        const extraText = document.getElementById("email-field-text")
        extraText.style.display = 'block'
        emailField.style.display = 'flex'
        emailField.style.alignItems = 'center'
        emailField.style.marginBottom = '2rem'
        emailField.style.justifyContent = 'center'
        emailField.style.gap = '1rem'
    }

    document.getElementById(formId).style.display = 'flex';
    document.getElementById(formId).style.alignItems = 'center';
    document.getElementById(formId).style.margin = '30px 0px 30px';
    document.getElementById(formId).style.justifyContent = 'center';
}

// Function to handle the extra fields logic
function handleExtraFields() {
    const extraFields = document.getElementById("extra-fields");
    const extraEmailFields = document.getElementById("email_fields");
    const demoGraphicSection = document.getElementById("demographicSection")
    const interestsSection = document.getElementById("interestsSection")
    const zipCodeInput = document.getElementById('zipcd_extra');
    const locationInputs = document.querySelectorAll('#street_address, #city, #state, #location_zipcode');
    let zipCodeOnly = false;

    // Assuming you want to show the extra fields
    extraFields.classList.add("show-extra-fields"); // Show extra fields
    extraEmailFields.style.marginTop = '2rem'; // Adjust margin

    // Reset all inputs and form elements inside the 'extra-fields' container
    const extraFieldsInputs = extraFields.querySelectorAll("input, textarea, select, button");

    // Reset the values of inputs
    extraFieldsInputs.forEach(input => {
        if (input.type === 'checkbox' || input.type === 'radio') {
            input.checked = false;  // Reset checkbox and radio buttons
        } else if (input.type === 'text' || input.type === 'textarea') {
            input.value = '';  // Clear text inputs and textareas
        } else if (input.type === 'number' || input.type === 'range') {
            input.value = input.defaultValue;  // Reset range inputs or numbers to their default value
        }
    });

    // Reset other sections and fields as needed
    if (interestsSection) {
        interestsSection.classList.remove('section-active');
    }

    if (demoGraphicSection) {
        demoGraphicSection.classList.remove('section-active');
    }

    // Reset the mileage radius or any other dynamic content (e.g., sliders)
    destroySlider(".js-nouislider.age");
    destroySlider(".js-nouislider.income");

    // Reset all error messages or warnings if necessary
    const errorLists = extraFields.querySelectorAll('.errorlist');
    errorLists.forEach(errorList => {
        errorList.innerHTML = '';  // Clear error messages
    });

    // Reset the "create-emailList-filters" section visibility
    const createEmailListFilters = document.getElementById("create-emailList-filters");
    createEmailListFilters.style.display = 'none';  // Hide the filters when toggle is unchecked

    // Reset the "List Quantity" and "Estimated Cost" fields to their default state
    const listQuantityField = document.getElementById('create-list-quantity');
    const listCostField = document.getElementById('create-list-cost');
    if (listQuantityField) listQuantityField.value = '';
    if (listCostField) listCostField.value = '';

    // Reset the zip code input
    zipCodeInput.value = '';  // Clear zip code input

    locationInputs.forEach(input => {
        input.value = '';  // Clear each location input field
        input.disabled = false;
    });

    // Re-enable the zip code input since all location inputs are empty
    zipCodeInput.disabled = false;
    zipCodeOnly = true;  // Set this back to true as zip code is now the only input
}

function destroySlider(selector) {
    const sliderElement = document.querySelector(selector);
    if (sliderElement) {
        if (sliderElement.noUiSlider) {
            sliderElement.noUiSlider.destroy();
        }
        // Reset any associated values in your application state
        if (selector === ".js-nouislider.age") {
            sliderDemoGraphicsValues.age = null; // or reset to defaults
        } else if (selector === ".js-nouislider.income") {
            sliderDemoGraphicsValues.income = null; // or reset to defaults
        }
    }
}

$(document).ready(function () {
    const locationInputs = document.querySelectorAll('#street_address, #city, #state, #location_zipcode');
    const zipCodeInput = document.getElementById('zipcd_extra');

    const fileInput = document.getElementById("file");
    const pdfInput = document.getElementById("emailAddressList-file")
    const removeFileButton = document.getElementById('removeFileButton');
    const showUploadedListQuantity = document.getElementById('uploadedListQuantity')
    const showUploadedListCost = document.getElementById('UploadedFileEstCost')
    const demoGraphicSection = document.getElementById("demographicSection")
    const interestsSection = document.getElementById("interestsSection")
    let sliderIntialized = false

    let zipCodeOnly = false;

    // Attach the event listener to each accordion header
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', toggleAccordion);
    });


    // Check if all location inputs are empty and enable/disable zipCodeInput accordingly
    locationInputs.forEach((input) => {
        input.addEventListener('input', toggleZipCodeInput);
    });

    zipCodeInput.addEventListener('input', toggleLocationInputs);

    function toggleZipCodeInput() {
        const allEmpty = Array.from(locationInputs).every(input => input.value.length === 0);
        console.log("allempty", allEmpty)
        zipCodeInput.disabled = !allEmpty;
        zipCodeOnly = allEmpty;
    }

    function toggleLocationInputs() {
        const isZipCodeFilled = zipCodeInput.value.length > 0;
        locationInputs.forEach(input => input.disabled = isZipCodeFilled);
        zipCodeOnly = zipCodeInput.value.length ? true : false
    }

    function selectedSection() {
        const sectionSelected = document.querySelectorAll(".section-active");
        const ids = [];

        sectionSelected.forEach(e => {
            if (e.id) {
                ids.push(e.id);
            }
        });

        return ids;
    }

    demoGraphicSection.addEventListener('change', checkClass);

    // Highlight selected row from radio buttons
    const radios = document.querySelectorAll('input[name="select-row"]');
    radios.forEach((radio) => {
        radio.addEventListener("change", highlightSelectedRow);
    });

    function highlightSelectedRow() {
        const row = this.closest('tr');
        const otherRows = document.querySelectorAll("#targeting-objective-table tbody tr");
        otherRows.forEach((otherRow) => {
            otherRow.style.background = (otherRow === row) ? "#f0f0f0" : "";
        });
    }

    function destroySlider(selector) {
        const sliderElement = document.querySelector(selector);
        if (sliderElement) {
            if (sliderElement.noUiSlider) {
                sliderElement.noUiSlider.destroy();
            }
            // Reset any associated values in your application state
            if (selector === ".js-nouislider.age") {
                sliderDemoGraphicsValues.age = null; // or reset to defaults
            } else if (selector === ".js-nouislider.income") {
                sliderDemoGraphicsValues.income = null; // or reset to defaults
            }
        }
    }

    // Global object to store all slider values
    window.sliderDemoGraphicsValues = {
        age: [],
        income: [],
        mileageRadius: 0
    };

    function checkClass() {

        if (demoGraphicSection.classList.contains('section-active')) {

            const ageSlider = document.querySelector(".js-nouislider.age");
            const incomeSlider = document.querySelector(".js-nouislider.income");

            if (!ageSlider.noUiSlider) {
                initializeSlider(".js-nouislider.age", {
                    min: 15,
                    max: 65,
                    start: [25, 35],
                    step: 10,
                    onUpdate: (values) => {
                        sliderDemoGraphicsValues.age = values;
                    }
                });
            }

            if (!incomeSlider.noUiSlider) {
                const points = [0, 10000, 25000, 35000, 50000, 75000, 100000, 125000, 150000, 200000, 210000];

                // Create the NoUI Slider
                noUiSlider.create(incomeSlider, {
                    start: [35000, 50000],
                    connect: true, // Connect the range slider
                    range: {
                        'min': 0,  // Min range is < 10K (0)
                        'max': points.length - 1  // Max range is 210K
                    },
                    step: 1, // Step through the values
                    format: {
                        to: function (value) {
                            return formatTooltip(value);
                        },
                        from: function (value) {
                            return points.indexOf(Number(value)) // Map the value back to the index
                        }
                    },
                    tooltips: true, // Enable tooltips on the handles
                    onUpdate: (values) => {
                        sliderDemoGraphicsValues.income = values;
                    }
                });

                // Function to format the tooltip text
                function formatTooltip(value) {
                    const val = points[Math.round(value)];

                    // Handle the custom labels
                    if (val === 0) {
                        return "<10K"; // First point is "< 10K"
                    } else if (val === 10000) {
                        return "10K"; // Second point is "10K"
                    } else if (val > 200000) {
                        return "200K+"; // Any point >= 200K is "200K+"
                    } else {
                        return `${(val / 1000).toFixed(0)}K`; // Format other values with "K"
                    }
                }
            }
        } else {

            const checkboxes = demoGraphicSection.querySelectorAll('input[type="checkbox"]');

            checkboxes.forEach(checkbox => {
                // If the checkbox is checked, uncheck it
                if (checkbox.checked) {
                    checkbox.checked = false;
                }
            });

            destroySlider(".js-nouislider.age");
            destroySlider(".js-nouislider.income");
        }
    }

    initializeSlider(".js-nouislider.mileageRadius", {
        min: 0,
        max: 10,
        start: 2,
        step: 1,
        onUpdate: (values) => {
            sliderDemoGraphicsValues.mileageRadius = values;

            if (sliderIntialized) {

                let zip_cd = zipCodeOnly ? document.getElementById("zipcd_extra").value : document.getElementById("location_zipcode").value

                var formData = {
                    zipcd: zip_cd,
                    mileage_radius: values[0],
                    page: "email"
                };

                showLoader(overlayText = "calculating estimated list and qauntity ....")
                $.ajax({
                    url: '/estimate_population/',
                    type: "POST",
                    data: formData,
                    dataType: "json",
                    success: function (response) {
                        hideLoader()
                        if (response && response.status === "success") {
                            $("#create-list-quantity")
                                .val(response.population_count)

                            var populationCount = parseInt((response.population_count).replace(",", ""));
                            var cost = populationCount * 0.005;
                            $("#create-list-cost")
                                .val("$ " + Math.trunc(cost));

                        } else if (response && response.status === "partial") {
                            alert(response.message);
                        } else {
                            alert("An unexpected error occurred. Please try again.");
                        }
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        console.log("AJAX error:", textStatus, errorThrown);
                        if (jqXHR.status === 204) {
                            alert("Please provide a valid zip code.");
                        } else {
                            alert(
                                "An error occurred while processing your request. Please try again."
                            );
                        }
                    },
                });
            }

        }
    });

    function initializeSlider(selector, options) {
        const slider = document.querySelector(selector);
        if (!slider) return;

        // Destroy existing slider if it exists
        if (slider.noUiSlider) {
            slider.noUiSlider.destroy();
        }

        noUiSlider.create(slider, {
            range: { min: options.min, max: options.max },
            start: options.start,
            connect: true,
            step: options.step,
            tooltips: true,
            format: {
                to: (value) => {
                    if (options.format) {
                        return options.format(value);
                    }
                    return value >= options.max ? value + " +" : value.toString();
                },
                from: (value) => {
                    return parseFloat(value.replace(/[^\d.-]/g, ""));
                }
            }
        });

        // Add update event listener
        slider.noUiSlider.on('update', values => {
            const parsedValues = values.map(v => parseFloat(v.replace(/[^\d.-]/g, "")));
            if (options.onUpdate) {
                options.onUpdate(parsedValues);
            }
        });
    }

    // File validation function
    fileInput.addEventListener('change', fileValidation);
    pdfInput.addEventListener('change', pdfValidation);

    function fileValidation() {
        const filePath = fileInput.value;
        const allowedExtension = /(\.xlsx)$/i;
        let validFile = true

        if (!allowedExtension.exec(filePath)) {
            alert("Please upload a file with a xlsx extension only !!");
            validFile = false
            fileInput.value = "";
            hideRemoveFileButton();
        }

        if (fileInput.files.length > 0 && validFile == true) {
            showRemoveFileButton();
            calculateUploadedEmailCost();
        } else {
            hideRemoveFileButton();
        }
    }

    function pdfValidation() {
        const filePath = pdfInput.value;
        const allowedExtension = /(\.pdf)$/i;
        let validFile = true

        if (!allowedExtension.exec(filePath)) {
            alert("Please upload a file with a pdf extension only !!");
            validFile = false
            pdfInput.value = "";
        }
    }

    // Generic function to add csrf to email file upload cost calculations 
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                // Check if this cookie string begins with the name we want
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    const csrftoken = getCookie('csrftoken');

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!/^(GET|HEAD|OPTIONS|TRACE)$/.test(settings.type)) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    function calculateUploadedEmailCost() {
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);

        $.ajax({
            type: 'POST',
            url: '/calculate_file_upload_cost/',
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {

                const emailCount = showUploadedListQuantity.querySelector('input[name="total-email-count"]');
                const emailCost = showUploadedListCost.querySelector('input[name="total-email-cost"]');
                emailCount.value = response.email_count;
                emailCost.value = response.estimated_cost;
            },
            error: function (xhr, status, error) {
                console.error(error);
                alert('An error occurred while uploading the file.');
                fileInput.value = "";
                hideRemoveFileButton();
            }
        });

    }

    function showRemoveFileButton() {
        // Show remove file option
        removeFileButton.style.display = 'block';
        // Show the div where the email count and cost is fetched
        showUploadedListQuantity.style.display = 'flex';
        showUploadedListCost.style.display = 'flex';
    }

    function hideRemoveFileButton() {
        // Hide the remove file btn
        removeFileButton.style.display = 'none';
        // Hide the div where the email count and cost is showed
        showUploadedListQuantity.style.display = 'none';
        showUploadedListCost.style.display = 'none';
    }

    // Modify the remove file button event listener
    removeFileButton.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        removeFile();
    });

    function removeFile() {
        fileInput.value = '';
        showUploadedListQuantity.querySelector('input[name="total-email-count"]').value = '';
        showUploadedListCost.querySelector('input[name="total-email-cost"]').value = ''
        hideRemoveFileButton();
    }

    function getSelectedTargetingObjective() {
        const selectedRadio = document.querySelector('input[name="select-row"]:checked');
        if (selectedRadio) {
            const row = selectedRadio.closest('tr');
            const text = row.querySelector('td:nth-child(2)').innerText;
            return { value: selectedRadio.value, text: text };
        }
        return null;
    }

    function getIncomeSliderValues() {
        const incomeSlider = document.querySelector(".js-nouislider.income");
        const incomeSliderValue = incomeSlider.noUiSlider.get()

        return incomeSliderValue
    }

    // Show the loader and overlay
    function showLoader(overlayText = 'Validating address and calculating estimated quantity...') {
        document.getElementById('overlay').style.display = 'block';  // Show overlay
        document.querySelector('.loader').style.display = 'block';   // Show loader
        document.querySelector('.overlay-text').textContent = overlayText;  // Update text
    }

    // Hide the loader and overlay
    function hideLoader() {
        document.getElementById('overlay').style.display = 'none';  // Hide overlay
        document.querySelector('.loader').style.display = 'none';   // Hide loader
    }

    // Prevent submission on "Validate" button click
    $('#validate_address_btn').on('click', function (event) {
        event.preventDefault(); // Prevent form submission

        showLoader();

        // Clear any previous form data
        let formData = new FormData();

        let zipCodeOnly = document.getElementById("zipcd_extra").value.trim() !== "";

        // Validation
        if (zipCodeOnly) {
            const zipcode = document.getElementById("zipcd_extra").value.trim();

            if (!zipcode || zipcode.length !== 5) {
                alert("Please enter a valid ZIP code.");
                return; // Stop further processing
            }

            // If ZIP code is provided, append it
            formData.append('inputValue', JSON.stringify({ zipcode: zipcode }));
        } else {
            const streetAddress = document.getElementById("street_address").value.trim();
            const city = document.getElementById("city").value.trim();
            const state = document.getElementById("state").value.trim();
            const zipcode = document.getElementById("location_zipcode").value.trim();

            // Validation for full address
            if (!streetAddress || !city || !state || !zipcode) {
                alert("Please fill in all fields for the full address.");
                return; // Stop further processing
            }

            if (zipcode.length !== 5) {
                alert("Please enter a valid ZIP code.");
                return;
            }

            // Combine address into a single string
            const fullAddress = `${streetAddress}, ${city}, ${state}, ${zipcode}`;
            formData.append('inputValue', fullAddress);
        }
        // Print FormData to the console before sending it
        for (let [key, value] of formData.entries()) {
            {
                console.log(`${key}: ${value}`); // Log the value
            }
        }

        // Make AJAX request to validate the address
        $.ajax({
            type: 'POST',
            url: '/validate_address/',
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                console.log(response);
                hideLoader();
                if (response.valid) {

                    // Show success message with SweetAlert
                    Swal.fire(
                        "Validated",
                        "Address successfully validated!",
                        "success"
                    )

                    const listQuantity = document.getElementById("create-list-quantity");
                    const estimatedEmailCost = document.getElementById("create-list-cost");
                    listQuantity.value = response.population_count;
                    estimatedEmailCost.value = "$ " + response.estimated_cost;

                    // Display filters after successful validation
                    const showfilters = document.getElementById("create-emailList-filters");
                    showfilters.style.display = "block";
                    sliderIntialized = true

                } else {
                    Swal.fire(
                        "Not found",
                        response.error,
                        "error"
                    );
                }
            },
            error: function (xhr, status, error) {
                console.error(error);
                Swal.fire(
                    "Error",
                    response.error,
                    "error"
                );
            },
        });
    });

    $('#apply_filters_btn').on('click', function (event) {

        event.preventDefault(); // Prevent form submission

        // Clear any previous form data
        let formData = new FormData();

        if (zipCodeOnly) {
            formData.append('address', JSON.stringify({ zipcode: document.getElementById("zipcd_extra").value }));
        } else {
            formData.append('address', JSON.stringify({
                streetAddress: document.getElementById("street_address").value,
                city: document.getElementById("city").value,
                state: document.getElementById("state").value,
                zipcode: document.getElementById("location_zipcode").value
            }));
        }
        const sectionIDs = selectedSection()
        function appendDemographicData(formData) {
            formData.append('mileageRadius', sliderDemoGraphicsValues.mileageRadius);
            formData.append('trgtByDemo_Age', sliderDemoGraphicsValues.age);
            formData.append('trgtByDemo_Income', getIncomeSliderValues());

            // Helper function to handle multi-select values as lists
            const appendFormValues = (inputName, formDataKey) => {
                const selectedElements = $(`input[name="${inputName}"]:checked`);
                // Check if any checkboxes are selected and append them as an array
                if (selectedElements.length > 0) {
                    selectedElements.each(function () {
                        formData.append(`${formDataKey}[]`, $(this).val());
                    });
                } else {
                    formData.append(`${formDataKey}[]`, ''); // To ensure it's sent even when nothing is selected (this may depend on how you want to handle empty values)
                }
            };

            // Handle demographic selections as lists
            appendFormValues('children_in_hh', 'trgtByDemo_ChildrenInHH');
            appendFormValues('homeowner', 'trgtByDemo_HomeOwner');

        }

        // Check for two sections (Demographic and Interest)
        if (sectionIDs.length === 2) {
            appendDemographicData(formData);
            formData.append('trgtByInterests', JSON.stringify(getSelectedTargetingObjective()));
        }
        // Check if the first section is Demographic
        else if (sectionIDs[0] === "demographicSection") {
            appendDemographicData(formData);
        }
        // Check if the first section is Interests
        else if (sectionIDs[0] === "interestsSection") {
            formData.append('trgtByInterests', JSON.stringify(getSelectedTargetingObjective()));
        }

        // Log the form data entries
        for (let pair of formData.entries()) {
            console.log(`${pair[0]}: ${pair[1]}`);
        }

        showLoader(overlayText = "estimating cost based on filter selections ....")
        $.ajax({
            type: 'POST',
            url: '/calculate_email_cost/',
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                if (response.status === "success") {
                    hideLoader()
                    const listQuantityField = document.getElementById('create-list-quantity');
                    const listCostField = document.getElementById('create-list-cost');
                    listQuantityField.value = response.data.list_quantity
                    listCostField.value = "$ " + parseFloat(response.data.est_cost).toFixed(2);

                } else {
                    Swal.fire(
                        "Something went wrong",
                        response.error,
                        "error"
                    );
                }
            },
            error: function (xhr, status, error) {
                console.error(error);
                Swal.fire(
                    "Error",
                    response.error,
                    "error"
                );
            }
        });

    })

    // Function to check if all accordion contents are active
    function checkAccordionsBeforeSubmit() {
        // Get all accordion content elements
        var accordionContents = document.querySelectorAll('.accordion-content');
        var allActive = true; // Flag to track if all are active

        // Loop through all accordion content sections
        accordionContents.forEach(function (content) {
            // If any accordion content is not visible (not active), set allActive to false
            if (content.style.display === "none" || content.hidden) {
                allActive = false;
            }
        });

        // If any accordion is not active, return false to prevent form submission
        if (!allActive) {
            alert("Please select an option from both the 'Design' and 'List Source Selection' sections before proceeding.");
            return false;
        }

        var accordions = document.querySelectorAll('.accordion');
        var allSelected = true; // Flag to track if all accordions have a selected radio button

        // Loop through each accordion
        accordions.forEach(function (accordion) {
            // Check if at least one radio button in this accordion is selected
            var radios = accordion.querySelectorAll('input[type="radio"]');
            var selected = false;

            radios.forEach(function (radio) {
                if (radio.checked) {
                    selected = true; // If any radio button is selected, set selected to true
                }
            });

            // If no radio button is selected, set allSelected to false
            if (!selected) {
                allSelected = false;
            }
        });

        // If any accordion does not have a selected radio button, show an alert and return false
        if (!allSelected) {
            alert("Please make sure you select one option in each 'list' and 'design' section before submitting.");
            return false;
        }

        return true
    }

    function getUserInput() {
        // Initialize an object to store the input values
        let userInput = {};

        // Check which radio button is selected for the design option
        const designOption = document.querySelector('input[name="design_option"]:checked');

        if (designOption) {
            userInput.designOption = designOption.value;
        } else {
            userInput.designOption = 'None';  // If no option is selected
        }

        // If 'Upload My Design' is selected, get the file input value
        if (userInput.designOption === 'upload_design') {
            const emailFileInput = document.getElementById('emailAddressList-file');
            if (emailFileInput.files.length > 0) {
                userInput.uploadedFile = emailFileInput.files[0].name;
            } else {
                alert("Please make sure you upload your design before proceeding")
                return null
            }
        }

        // If 'Create Design For Me' is selected, get the additional information
        if (userInput.designOption === 'create_design') {
            const additionalCost = "75";  // You can adjust this if needed.
            userInput.additionalCost = additionalCost;
        }

        // Check if the email text field is filled in
        const emailText = document.getElementById('email_text').value;
        if (emailText) {
            userInput.emailText = emailText;
        } else {
            userInput.emailText = 'No email text entered';
        }

        // Return the collected user input
        return userInput;
    }

    // Function to call getUserInput and handle the result
    function getDesignSourceData() {
        // Call the getUserInput function to collect data
        let designData = getUserInput();

        if (!designData) {
            return null;  // No data, as user failed to upload the file
        }

        // If design data is collected successfully, return it
        return designData;
    }


    $('form').on('submit', function (event) {
        event.preventDefault();

        if (!checkAccordionsBeforeSubmit()) {
            return
        }

        // Append CSRF-Token
        formData = new FormData();
        let csrftoken = $("input[name=csrfmiddlewaretoken]").val();
        formData.append('csrfmiddlewaretoken', csrftoken);

        // Common fields
        formData.append('campaignName', document.getElementById("campaign_name").value);
        formData.append('dateRange', document.getElementById("campaign_launch_date").value);
        formData.append('emailText', document.getElementById("email_text").value);
        formData.append('additionalComments', document.getElementById("extra_email_info").value);

        let useCreateMeList = document.getElementById("extra-fields")
        let useCreateMeListDisplay = window.getComputedStyle(useCreateMeList).display;


        // Campaign details
        if (useCreateMeListDisplay !== "none") {
            if (zipCodeOnly) {
                formData.append('address', JSON.stringify({ zipcode: document.getElementById("zipcd_extra").value }));
            } else {
                formData.append('address', JSON.stringify({
                    streetAddress: document.getElementById("street_address").value,
                    city: document.getElementById("city").value,
                    state: document.getElementById("state").value,
                    zipcode: document.getElementById("location_zipcode").value
                }));
            }
            const sectionIDs = selectedSection()
            console.log("section actives: ", sectionIDs)

            function appendDemographicData(formData) {
                formData.append('trgtByDemo_Age', sliderDemoGraphicsValues.age);
                formData.append('trgtByDemo_Income', getIncomeSliderValues());
                formData.append('trgtByDemo_ChildrenInHH', $('input[name="children_in_hh"]:checked').val());
                formData.append('trgtByDemo_HomeOwner', $('input[name="homeowner"]:checked').val());
            }

            // Check for two sections (Demographic and Interest)
            if (sectionIDs.length === 2) {
                appendDemographicData(formData);
                formData.append('trgtByInterests', JSON.stringify(getSelectedTargetingObjective()));
            }
            // Check if the first section is Demographic
            else if (sectionIDs[0] === "demographicSection") {
                appendDemographicData(formData);
            }
            // Check if the first section is Interests
            else if (sectionIDs[0] === "interestsSection") {
                formData.append('trgtByInterests', JSON.stringify(getSelectedTargetingObjective()));
            }

            let extraFieldsQuantityField = document.getElementById("create-list-quantity")
            let extraFieldsCostField = document.getElementById("create-list-cost")

            let file = getDesignSourceData()
            if (file) {
                const designFile = document.getElementById('emailAddressList-file');
                formData.append("design_file", designFile.files[0]);
            }

            formData.append('mileageRadius', sliderDemoGraphicsValues.mileageRadius);
            formData.append('extra_fields_quantity', extraFieldsQuantityField.value)
            formData.append('extra_fields_cost', extraFieldsCostField.value)

        } else {

            let file = document.getElementById("file").files[0]

            if (!file) {
                alert("Please make sure you upload your email list before proceeding")
                return
            }

            formData.append('uploadedFile', document.getElementById("file").files[0]);
            formData.append('emailCount', showUploadedListQuantity.querySelector('input[name="total-email-count"]').value);
            formData.append('emailCost', showUploadedListCost.querySelector('input[name="total-email-cost"]').value);
        }

        // Design Source data
        let designData = getDesignSourceData();
        // If data is valid, append it to the FormData object (but only if there's valid data)
        if (!designData) {
            // If no valid design data is collected, exit the function or handle it as needed
            console.log("No valid design data to submit.");
            return;  // Exit function early if there's no valid data
        } if (designData.designOption === "upload_design") {
            // Assuming the file input exists, append the file to FormData
            const emailFileInput = document.getElementById('emailAddressList-file');
            formData.append("design_file", emailFileInput.files[0]); // Append design file directly to formData
        }

        // Append design data as JSON
        formData.append("design_data", JSON.stringify(designData));

        // Print FormData to the console before sending it
        for (let [key, value] of formData.entries()) {
            if (value instanceof File) {
                console.log(`${key}: [File] ${value.name}`); // If the value is a file, log its name
            } else {
                console.log(`${key}: ${value}`); // Log the value
            }
        }

        // AJAX call
        $.ajax({
            url: "",
            type: "POST",
            data: formData,
            processData: false, // Important for file uploads
            contentType: false, // Important for file uploads
            success: function (response) {
                if (response.status === "Success") {
                    console.log(response)
                    Swal.fire(
                        "Added to Cart",
                        response["message"],
                        "success"
                    ).then(function () {
                        // Redirect after the user clicks "OK"
                        window.location.href = "/cart/";
                    });
                } else {
                    Swal.fire(
                        "Something went wrong",
                        response["message"],
                        "error"
                    );
                }
            },
            error: function (xhr, status, error) {
                console.error(error)
                Swal.fire(
                    "Something went wrong",
                    "An error has occured",
                    "error"
                );
            }
        });
    });
});