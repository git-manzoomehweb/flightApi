// Global price-related variables
let activeSchemaId = sessionSearchStorage.SchemaId;
let activeSessionId = sessionSearchStorage.SessionId;
let activeCurrency = sessionBookStorage.PriceInfo?.Currency || sessionBookStorage.priceInfo?.currency;
let activeTotalCommission = sessionBookStorage.PriceInfo?.TotalCommission || sessionBookStorage.priceInfo?.totalCommission;
let activeCommission = sessionBookStorage.PriceInfo?.Commission || (sessionBookStorage.priceInfo?.total - sessionBookStorage.priceInfo?.totalCommission);
let activeTotal = sessionBookStorage.PriceInfo?.Total || sessionBookStorage.priceInfo?.total;
let activeId = sessionBookStorage?.FlightId || sessionBookStorage?.busId;
let activeProviderId = sessionBookStorage.Provider?.ProviderId || 0;


/**
 * Switches between passenger and agency buyer types, updating UI and required fields.
 * @param {HTMLElement} e - The element triggering the buyer type switch.
 * @param {string} t - The buyer type ('passenger' or 'agency').
 */
const selectBuyerType = (e, t) => {
    try {
        const buyerInfoContent = e.closest(".book-buyer__info__content");
        const passengerContent = buyerInfoContent.querySelector(".book-buyer__passenger__content");
        const agencyContent = buyerInfoContent.querySelector(".book-buyer__agency__content");
        const typeContent = buyerInfoContent.closest(".book-buyers__container");

        if (t === "passenger") {
            // Activate passenger type
            e.classList.add("book-buyer__type__active");
            if (e.nextElementSibling) {
                e.nextElementSibling.classList.remove("book-buyer__type__active");
            }
            agencyContent.classList.add("book-hidden");
            passengerContent.classList.remove("book-hidden");
            passengerContent.querySelectorAll(".book-info__item__container").forEach(e => e.classList.remove("book-hidden"));

            // Update required fields for passenger inputs
            const inputs = passengerContent.getElementsByTagName("input");
            for (let n = 0; n < inputs.length; n++) {
                const input = inputs[n];
                if (input.getAttribute("type") !== "hidden") {
                    input.classList.add("book-Required");
                    if (input.classList.contains("book-has-dash")) {
                        input.classList.remove("book-Required");
                    }
                }
            }

            // Reset agency fields
            const agencyName = agencyContent.querySelector(".book-name");
            agencyName.classList.remove("book-Required");
            agencyName.value = "";
            const agencyInfo = agencyContent.querySelector(".book-agency__information__content");
            if (agencyInfo) {
                agencyInfo.innerHTML = '';
            }

            // Set mid attribute for passenger type
            typeContent.setAttribute("data-mid", 24);
        } else {
            // Activate agency type
            e.classList.add("book-buyer__type__active");
            if (e.previousElementSibling) {
                e.previousElementSibling.classList.remove("book-buyer__type__active");
            }
            agencyContent.classList.remove("book-hidden");
            passengerContent.classList.add("book-hidden");
            passengerContent.querySelectorAll(".book-info__item__container").forEach(e => e.classList.add("book-hidden"));

            // Update required fields for agency inputs
            const inputs = passengerContent.getElementsByTagName("input");
            for (let n = 0; n < inputs.length; n++) {
                const input = inputs[n];
                if (input.getAttribute("type") !== "hidden" || !input.classList.contains("book-has-dash")) {
                    input.classList.remove("book-Required");
                    input.setAttribute("name", "");
                }
            }

            // Set agency name as required
            agencyContent.querySelector(".book-name").classList.add("book-Required");
            typeContent.setAttribute("data-mid", 18);
        }
    } catch (error) {
        console.error("selectBuyerType: " + error.message);
    }
};

/**
 * Toggles visibility of additional buyer information content.
 * @param {HTMLElement} e - The element triggering the toggle.
 */
const toggleMoreBuyerInfo = (e) => {
    try {
        e.closest(".book-buyer__info__content").querySelector(".book-more__buyer__info__content").classList.toggle("book-hidden");
    } catch (error) {
        console.error("toggleMoreBuyerInfo: " + error.message);
    }
};

/**
 * Marks an input element as changed by setting its data-changed attribute.
 * @param {HTMLElement} element - The input element.
 */
const checkIsChanged = (element) => {
    try {
        element.dataset.changed = 1;
    } catch (error) {
        console.error("checkIsChanged: " + error.message);
    }
};

/**
 * Processes buyer identity information API response and updates email/mobile fields.
 * @param {Object} args - API response object containing status and data.
 */
const onProcessedBuyerIdentityInfo = async (args) => {
    try {
        const response = args.response;
        if (response.status === 200) {
            const responseJson = await response.json();
            if (responseJson && !responseJson.errorMessage) {
                if (responseJson.errorid === 1) {
                    console.log(translate("user_identity_info") + ': ' + responseJson.message);
                } else {
                    // Update email and mobile fields
                    document.querySelectorAll(".book-check__has__data").forEach(ie => {
                        ie.querySelector(".book-email").value = responseJson.emailInfo.email;
                        ie.querySelector(".book-mobile").value = responseJson.mobileInfo.mobile;
                    });
                }
            }
        }
    } catch (error) {
        console.error("onProcessedBuyerIdentityInfo: " + error.message);
    }
};

/**
 * Processes buyer schema API response and updates buyer UI based on account type.
 * @param {Object} args - API response object containing status and data.
 */
const onProcessedBuyerSchema = async (args) => {
    try {
        const response = args.response;
        if (response.status === 200) {
            const responseJson = await response.json();
            if (responseJson && !responseJson.errorMessage) {
                const buyersContainer = document.querySelector(".book-buyers__container");
                // Remove loader
                const loader = buyersContainer.querySelector("#ballsWaveG");
                if (loader) loader.remove();
                buyersContainer.setAttribute("data-load", 1);

                // Extract account type and properties
                const accounttype = responseJson.sources[0].data[0].accounttype;
                const properties = responseJson.sources[0].data[0].user_info.sources[0].data[0].properties;
                const typeContent = buyersContainer.querySelector(".book-buyer__type__content");
                typeContent.classList.add(`book-buyer-${accounttype}`);
                buyersContainer.setAttribute("data-accounttype", accounttype);

                // Set mid based on account type
                let mid = 24;
                switch (accounttype) {
                    case 1:
                    case 2:
                    case 3:
                        mid = 24;
                        break;
                }
                buyersContainer.setAttribute("data-mid", mid);

                // Update UI based on account type
                if (accounttype === 3) {
                    // Remove type content for individual buyers
                    const typeContent1 = buyersContainer.querySelector(".book-buyer__type__content-1");
                    const typeContent2 = buyersContainer.querySelector(".book-buyer__type__content-2");
                    if (typeContent1) typeContent1.remove();
                    if (typeContent2) typeContent2.remove();
                } else {
                    // Add counter info header with translation
                    const checkHasData = buyersContainer.querySelector(".book-check__has__data");
                    checkHasData.classList.add("book-counter__info__content");
                    checkHasData.querySelector(".book-email").readOnly = true;
                    // Create counter info header with proper direction classes
                    const headerClass = isRTL ? 'book-text-right' : 'book-text-left';
                    checkHasData.insertAdjacentHTML('afterbegin',
                        `<div class="book-buyer__info__content book-border-slate-600 book-text-sm book-mb-3 ${headerClass}">${translate("counter_information")}</div>`);

                    if (accounttype === 2) {
                        // Configure agency type
                        const typeContent1 = buyersContainer.querySelector(".book-buyer__type__content-1");
                        if (typeContent1) typeContent1.remove();
                        const typeContent2 = buyersContainer.querySelector(".book-buyer__type__content-2");
                        typeContent2.classList.remove("book-hidden");

                        // Populate agency fields
                        const buyerInformation = responseJson.sources[0].data[0].buyer_information;
                        typeContent2.querySelector(".book-agencyid").value = buyerInformation.id;
                        typeContent2.querySelector(".book-Agencyname").value = buyerInformation.name;
                        typeContent2.querySelector(".book-Agencymanagername").value = buyerInformation.manager;
                        typeContent2.querySelector(".book-email").value = buyerInformation.email;
                        typeContent2.querySelector(".book-tel").value = buyerInformation.phones[0].phone;
                        typeContent2.querySelector(".book-mobile").value = buyerInformation.mobile;
                        typeContent2.querySelector(".book-address").value = buyerInformation.address;
                        typeContent2.querySelector(".book-web").value = buyerInformation.website;
                    } else {
                        // Configure passenger type
                        const typeContent2 = buyersContainer.querySelector(".book-buyer__type__content-2");
                        if (typeContent2) typeContent2.remove();
                        buyersContainer.querySelector(".book-buyer__type__content-1").classList.remove("book-hidden");
                    }
                }

                // Update user properties
                const checkHasData = buyersContainer.querySelector(".book-check__has__data");
                checkHasData.setAttribute("data-hashId", responseJson.sources[0].data[0].user_info.sources[0].data[0].schemaId);
                properties?.forEach(e => {
                    const setField = (selector, value, id, valueId) => {
                        const field = checkHasData.querySelector(selector);
                        field.value = value;
                        field.setAttribute("data-id", id || '');
                        field.setAttribute("data-valueId", valueId || id || '');
                    };

                    if (e.prpId === 1) {
                        setField(".book-firstname", e.answers[0].parts[0].values[0].value, e.answers[0].id, e.answers[0].parts[0].values[0].id);
                    } else if (e.prpId === 2) {
                        setField(".book-lastname", e.answers[0].parts[0].values[0].value, e.answers[0].id, e.answers[0].parts[0].values[0].id);
                    } else if (e.prpId === 4) {
                        setField(".book-tel", e.answers[0].parts[0].values[0].value, e.answers[0].id, e.answers[0].parts[0].values[0].id);
                    } else if (e.prpId === 6) {
                        setField(".book-address", e.answers[0].parts[0].values[0].value, e.answers[0].id, e.answers[0].parts[0].values[0].id);
                    } else if (e.prpId === 7) {
                        const genderField = checkHasData.querySelector(".book-gender");
                        const genderDataId = genderField.closest(".book-info__item__container").querySelector(".book-data-id");
                        const genderTrust = checkHasData.querySelector(".book-gender-id-trust");
                        if (e.answers[0].parts[0].values[0].value === 666) {
                            genderTrust.value = 666;
                            genderDataId.value = 0;
                            genderField.value = translate("female");
                        } else {
                            genderTrust.value = 668;
                            genderDataId.value = 1;
                            genderField.value = translate("male");
                        }
                        genderTrust.setAttribute("data-id", e.answers[0].id || '');
                        genderTrust.setAttribute("data-valueId", e.answers[0].parts[0].values[0].id || '');
                    } else if (e.prpId === 8) {
                        setField(".book-birthdate", e.answers[0].parts[0].values[0].value, e.answers[0].id, e.answers[0].parts[0].values[0].id);
                    } else if (e.prpId === 9) {
                        setField(".book-codepost", e.answers[0].parts[0].values[0].value, e.answers[0].id, e.answers[0].parts[0].values[0].id);
                    }
                });

                // Set readonly for non-accounttype-3 fields with values
                if (accounttype !== 3) {
                    checkHasData.querySelectorAll("input").forEach(e => {
                        if (e.value.length > 1 && e.getAttribute("data-changed")) {
                            e.readOnly = true;
                        }
                    });
                }
            }
        }
    } catch (error) {
        console.error("onProcessedBuyerSchema: " + error.message);
    }
};

/**
 * Processes commission API response and updates total costs with commission deduction.
 * @param {Object} args - API response object containing status and data.
 */
const onProcessedCommission = async (args) => {
    try {
        const response = args.response;
        if (response.status === 200) {
            const responseJson = await response.json();
            if (responseJson && responseJson.CommissionCost !== 0) {
                // Direction-aware text alignment
                const textAlignClass = isRTL ? 'book-text-right' : 'book-text-left';
                const firstPayElement = document.querySelector(".book-firstpay__cost");
                let currentFirstPay = parseFloat(firstPayElement.textContent.replace(/,/g, "")) || 0;
                // Add commission display with translation
                document.querySelector(".book-totalcom__container").insertAdjacentHTML('beforebegin',
                    `<div class="book-mb-2 book-total__container ${textAlignClass}">
                        <div class="book-text-sm book-text-zinc-500">${translate("amount")}</div>
                        <div class="book-flex book-items-center ${isRTL ? 'book-flex-row-reverse' : ''}">
                            <span class="book-font-bold book-text-lg book-total__cost">
                            ${await priceWithCurrency(currentFirstPay)}
                            </span>
                            ${await renderCurrency(activeCurrency)}
                        </div>
                    </div><div class="book-mb-2 book-commission__container ${textAlignClass}">
                        <div class="book-text-sm book-text-zinc-500">${translate("commission")}</div>
                        <div class="book-flex book-items-center ${isRTL ? 'book-flex-row-reverse' : ''}">
                            <span class="book-font-bold book-text-lg book-commission__cost">
                             ${await priceWithCurrency(responseJson.CommissionCost)}</span>
                            ${await renderCurrency(activeCurrency)}
                        </div>
                    </div>`);

                // Update total commercial cost
                const totalComElement = document.querySelector(".book-totalcom__cost");
                if (totalComElement) {
                    let currentTotalCom = parseFloat(totalComElement.textContent.replace(/,/g, "")) || 0;
                    let newTotalCom = currentTotalCom - parseFloat(responseJson.CommissionCost);
                    totalComElement.textContent = priceWithCurrency(newTotalCom);

                }

                // Update first pay cost

                let newFirstPay = currentFirstPay - parseFloat(responseJson.CommissionCost);
                firstPayElement.textContent = priceWithCurrency(newFirstPay);
            }
        }
    } catch (error) {
        console.error("onProcessedCommission: " + error.message);
    }
};

/**
 * Processes payment step API response and updates first pay and total costs.
 * @param {Object} args - API response object containing status and data.
 */
const onProcessedPaymentStep = async (args) => {
    try {
        const response = args.response;
        if (response.status === 200) {
            const responseJson = await response.json();
            if (responseJson) {
                const firstPayElement = document.querySelector(".book-firstpay__cost");
                const firstPayContainer = document.querySelector(".book-firstpay__container");
                const totalComContainer = document.querySelector(".book-totalcom__container");

                let currentFirstPay = parseFloat(firstPayElement.textContent.replace(/,/g, "")) || 0;

                // Direction-aware classes
                const textAlignClass = isRTL ? 'book-text-right' : 'book-text-left';
                const flexDirection = isRTL ? 'book-flex-row-reverse' : '';

                if (responseJson.firstpay !== 1) {
                    // Partial payment case
                    firstPayElement.textContent = priceWithCurrency(currentFirstPay * responseJson.firstpay);
                    firstPayContainer.querySelector(".book-title").textContent = translate("first_payment");
                    totalComContainer.insertAdjacentHTML('beforeend',
                        `<div class="book-text-sm book-title ${textAlignClass}">${translate("payable_amount")}</div>
                   <div class="book-flex book-items-center ${flexDirection}">
                       <span class="book-font-bold book-text-sm book-totalcom__cost">
                       ${await priceWithCurrency(currentFirstPay)}
                       </span> 
                       <span class="book-text-xs book-mx-1">${await renderCurrency(activeCurrency)}</span>
                   </div>`);
                    originalFirstPay = currentFirstPay * responseJson.firstpay;
                }

                // If commission is not already calculated (== 0), trigger the commission request
                if (Number(activeCommission) === 0) {
                    const {
                        requests,
                        productIdField
                    } = getServiceMappingInfo(selectedMode);
                    const commissionUrl = requests.commission;
                    $bc.setSource("cms.commission", [{
                        schemaid: activeSchemaId,            // Schema ID used for identifying service structure
                        selectedMode: selectedMode,          // Mode selected by user (e.g., "flight", "bus")
                        SessionId: activeSessionId,          // Current session ID
                        Id: activeId,                        // Always included — static identifier
                        url: commissionUrl,                  // API endpoint for commission, dynamic based on service
                        productIdField: productIdField,      // Expose field name to use dynamically in HTML (e.g., "FlightId", "productId")
                        run: true                            // Control flag for <basis> engine to execute this
                    }]);
                }
            }
        }
    } catch (error) {
        console.error("onProcessedPaymentStep: " + error.message);
    }
};

// This function handles payment logic, including setting sources for commission and payment steps.
const runApiLogic = async () => {
    try {
        const {
            requests,
            productGroupField,
        } = getServiceMappingInfo(selectedMode);
        const paymentStepUrl = requests.paymentStep;
        // --- if language is not fa, patch all .book-code and .book-code__number ---
        if (typeof currentLanguage !== 'undefined' && currentLanguage !== 'fa') {
            const inputs = document.querySelector(".book-buyers__container").querySelectorAll('.book-code, .book-code__number');
            inputs.forEach(inp => {
                inp.value = selectedCountryCode !== null ? selectedCountryCode : inp.value;
            });

            const countryInput = document.querySelector(".book-buyers__container").querySelector(".book-country");
            const countryIdInput = document.querySelector(".book-buyers__container").querySelector(".book-countryid");
            const cityInput = document.querySelector(".book-buyers__container").querySelector(".book-city");
            const cityIdInput = document.querySelector(".book-buyers__container").querySelector(".book-cityid");

            countryInput.value = selectedCountry !== null ? selectedCountry : countryInput.value;
            countryIdInput.value = selectedCountryId !== null ? selectedCountryId : countryIdInput.value;
            cityInput.value = selectedCity !== null ? selectedCity : cityInput.value;
            cityIdInput.value = selectedCityId !== null ? selectedCityId : cityIdInput.value;
        }

        // Always set the source for the payment step request
        $bc.setSource("cms.paymentStep", [{
            SessionId: activeSessionId,             // Session ID for payment step
            selectedMode: selectedMode,             // Selected mode (e.g., "flight", "bus")
            providerId: activeProviderId,           // Provider for the selected product
            productType: 1,                         // Product type (constant for now)
            run: true,                              // Trigger for <basis> execution
            url: paymentStepUrl,                    // API endpoint for payment step
            productGroupField: productGroupField              // Group name for the product, passed statically
        }]);
        // Trigger API call
        $bc.setSource(`cms.runbuyer`, true);

    } catch (error) {
        // Log the error with message and optional line number
        console.error("runApiLogic: " + error.message);
    }
};

/**
 * Initializes commission and payment step API calls if commission is zero.
 */
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runApiLogic);
} else {
    runApiLogic(); // DOM is already ready
}