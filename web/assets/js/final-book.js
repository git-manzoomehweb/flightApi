/**
 * Global variables to store session search and booking data from sessionSearch.
 * Initialized as null to be populated on DOM load.
 */
let translations = {};
let currentLanguage = document.documentElement.lang || 'fa';
let isRTL = document.documentElement.dir === 'rtl' || currentLanguage === 'fa' || currentLanguage === 'ar';
const isMobile = document.querySelector("main").dataset.mob === "true";
var selectedMode, share, accounttype, payType, bankIdentifier, bankId, schemaId, sessionId, productGroup, PriceInfo, email, mobile, fullname, BasisFlyBookId, tokenBankTitle;
const loadTranslations = async (lang = 'fa') => {
    try {
        const response = await fetch(`/json/translations?lid=1`);
        const allTranslations = await response.json();
        translations = allTranslations;
    } catch (error) {
        console.error('loadTranslations:', error);
    }
}

// Function to translate text
const translate = (text) => {
    try {
        return translations[text] ? translations[text][currentLanguage] : text;
    } catch (error) {
        console.error('translate:', error);
    }
};

// Function to apply direction-specific styles
const applyDirectionStyles = async () => {
    try {
        const direction = isRTL ? 'rtl' : 'ltr';
        document.documentElement.dir = direction;
        document.documentElement.lang = currentLanguage;

        // Use existing book-rtl and book-ltr classes
        document.body.classList.toggle('book-rtl', isRTL);
        document.body.classList.toggle('book-ltr', !isRTL);
    } catch (error) {
        console.error('applyDirectionStyles:', error);
    }
};
// Function to generate localized URL
function getLocalizedUrl(bookId) {
    let urlPrefix = '';
    if (currentLanguage === 'en') {
        urlPrefix = 'En-';
    } else if (currentLanguage === 'ar') {
        urlPrefix = 'Ar-';
    }
    return `/${urlPrefix}Panel-InvoiceView.bc?id=${bookId}&open=1`;
}
function getLocalizedDocumentUrl(bookId) {
    let urlPrefix = '';
    if (currentLanguage === 'en') {
        urlPrefix = 'En-';
    } else if (currentLanguage === 'ar') {
        urlPrefix = 'Ar-';
    }
    return `/${urlPrefix}Panel-InvoiceView.bc?id=${bookId}&doc=1`;
}
// Declare global variables

// Function to assign values from window.cmsData
async function runApiLogic() {
    try {
        await loadRequestMapping();
        // Initialize translation
        await loadTranslations();
        // Initialize direction styles
        await applyDirectionStyles();

        ({
            selectedMode,
            share,
            accounttype,
            payType,
            bankIdentifier,
            bankId,
            schemaId,
            sessionId,
            productGroup,
            PriceInfo,
            email,
            mobile,
            fullname
        } = window.cmsData);

        tokenBankTitle = await getTravelModeTitle(selectedMode, schemaId, currentLanguage);
    } catch (error) {
        console.error("runApiLogic error: " + error.message);
    }
}
// Helpers (do NOT redefine currentLanguage, selectedMode, or schemaId)
const getTravelModeTitle = (selectedMode, schemaId, currentLanguage) => {
    const translationsModeTitle = {
        flight: {
            291: {
                fa: 'پرواز یکطرفه',
                en: 'One-way Flight',
                ar: 'رحلة ذهاب فقط'
            },
            290: {
                fa: 'پرواز دوطرفه',
                en: 'Round-trip Flight',
                ar: 'رحلة ذهاب وعودة'
            },
            292: {
                fa: 'پرواز چند مسیره',
                en: 'Multi-city Flight',
                ar: 'رحلة متعددة المدن'
            },
            default: {
                fa: 'پرواز',
                en: 'Flight',
                ar: 'رحلة جوية'
            }
        },

        bus: {
            fa: 'اتوبوس',
            en: 'Bus',
            ar: 'حافلة'
        },
        train: {
            fa: 'قطار',
            en: 'Train',
            ar: 'قطار'
        },
        ship: {
            fa: 'کشتی',
            en: 'Ship',
            ar: 'سفينة'
        },
        car: {
            fa: 'خودرو',
            en: 'Car',
            ar: 'سيارة'
        },
        taxi: {
            fa: 'تاکسی',
            en: 'Taxi',
            ar: 'سيارة أجرة'
        }
    };

    if (selectedMode === 'flight') {
        if (translationsModeTitle.flight[schemaId]) {
            return translationsModeTitle.flight[schemaId][currentLanguage] || translationsModeTitle.flight[schemaId]['fa'];
        }
        return translationsModeTitle.flight.default[currentLanguage] || translationsModeTitle.flight.default['fa'];
    }

    if (translationsModeTitle[selectedMode]) {
        return translationsModeTitle[selectedMode][currentLanguage] || translationsModeTitle[selectedMode]['fa'];
    }

    return currentLanguage === 'en' ? 'Transportation' : currentLanguage === 'ar' ? 'وسيلة نقل' : 'وسیله نقلیه';
}


/**
 * Global variables for caching request mapping data
 */
let requestMappingCache = null;

/**
 * Load and cache request mapping data
 */
const loadRequestMapping = async () => {
    if (requestMappingCache) return requestMappingCache;

    try {
        const response = await fetch('/json/request');
        const data = await response.json();
        requestMappingCache = data;
        return data;
    } catch (error) {
        console.error("loadRequestMapping: " + error.message);
        return null;
    }
};

/**
 * Get service mapping info safely
 */
const getServiceMappingInfo = (selectedMode) => {
    if (!requestMappingCache) {
        throw new Error('Request mapping data not loaded yet');
    }

    const serviceType = selectedMode.toLowerCase();
    const currentMapping = requestMappingCache[serviceType];

    if (!currentMapping) {
        throw new Error('Unsupported service type:' + serviceType);
    }

    const { requests, productGroupField, productIdField } = currentMapping;

    return {
        requests,
        productGroupField,
        productIdField
    };
};

/**
   * Processes booking API response, handles price changes, and initiates ticket issuance or payment.
   * @param {Object} args - API response object containing source data with status, price change, and book ID.
   */
const setReserve = async (args) => {
    try {
        // Validate API response
        const response = args.source?.rows?.[0] || args.source;
        if (!response || (response.Status === undefined && response.status === undefined)) {
            throw new Error('Invalid or missing API response data');
        }

        const responseStatus = response.Status !== undefined ? response.Status : response.status;
        // const responseErrorMessage = response.ErrorMessage || response.errorMessage || translate('booking_error');
        const responseErrorMessage = translate('booking_error');
        const responseContainer = document.querySelector(".book-message__booking__container");
        if (!responseContainer) {
            throw new Error('Response container not found');
        }

        const responseFirst = responseContainer.querySelector(".book__first__message__content");
        const responseLast = responseContainer.querySelector(".book__last__message__content");
        if (!responseLast) {
            throw new Error('Last message content element not found');
        }
        const lastMessage = responseLast.querySelector(".book__last__message");
        if (!lastMessage) {
            throw new Error('Last message element not found');
        }

        if (responseStatus === true) {

            const airReservation = response.AirReservation || response.airReservation;
            const priceChange = response.PriceChange !== undefined ? response.PriceChange : response.priceChange;
            const bookId = airReservation?.BasisFlyBookId || airReservation?.basisFlyBookId;
            BasisFlyBookId = airReservation?.BasisFlyBookId || airReservation?.basisFlyBookId;

            if (!bookId) {
                throw new Error('Book ID not found in response');
            }
            if (priceChange === null) {
                // No price change, proceed with booking
                confirmBookingProcesse(bookId);
            } else {
                // Display price change confirmation UI
                if (responseFirst) {
                    responseFirst.classList.add("book-hidden");
                }
                responseLast.classList.remove("book-hidden");
                lastMessage.innerHTML = `
                    <div class="book-price__changed">${translate('price_change_message')} 
                    ${new Intl.NumberFormat().format(priceChange)} ${translate('price_change_question')}</div>
                    <button class="book-cursor-pointer book-mx-2 book-bg-green-600 book-mt-4 book-text-white  book-rounded-lg book-p-2  ${isMobile ? 'book-w-full' : 'book-min-w-28'}" onclick="confirmBookingProcesse('${bookId}')">${translate('continue_booking')}</button>
                    <button class="book-cursor-pointer book-mx-2 book-bg-red-500 book-mt-4 book-text-white  book-rounded-lg book-p-2  ${isMobile ? 'book-w-full' : 'book-min-w-28'}" onclick="rejectBookingProcesse()">${translate('cancel_booking')}</button>`;
            }
        } else {
            // Display error message
            if (responseFirst) {
                responseFirst.classList.add("book-hidden");
            }
            responseLast.classList.remove("book-hidden");
            lastMessage.textContent = responseErrorMessage;
        }
    } catch (error) {
        console.error("setReserve: " + error.message);
    }
};

/**
 * Confirms price change or booking and triggers ticket issuance or payment gateway.
 * @param {string} bookId - The booking ID for ticket issuance.
 */
const confirmBookingProcesse = async (bookId) => {
    try {
        // Validate DOM elements
        const responseContainer = document.querySelector(".book-message__booking__container");
        if (!responseContainer) {
            throw new Error('Response container not found');
        }
        const responseFirst = responseContainer.querySelector(".book__first__message__content");
        const responseLast = responseContainer.querySelector(".book__last__message__content");
        if (!responseLast) {
            throw new Error('Last message content element not found');
        }
        const lastMessage = responseLast.querySelector(".book__last__message");
        if (!lastMessage) {
            throw new Error('Last message element not found');
        }

        if (!accounttype || !bankIdentifier) {
            throw new Error('Missing required templating placeholders');
        }
        if (Number(accounttype) === 1) {
            if (responseFirst) {
                responseFirst.classList.add("book-hidden");
            }
            responseLast.classList.remove("book-hidden");

            // Set the success message
            lastMessage.innerText = translate('preBooking_success');

            // Add button if not already added
            const existingButton = responseLast?.querySelector("button");
            if (!responseContainer || !responseLast || !lastMessage || !existingButton) {
                throw new Error('Required DOM elements not found');
            }
            const buttonContainer = existingButton.parentElement;
            if (!buttonContainer.querySelector(".book-contract__button")) {
                const contractButton = document.createElement("button");
                contractButton.className = `book-contract__button ${isMobile ? 'book-w-full book-mb-4' : 'book-min-w-28 book-mx-4'} book-text-white book-bg-green-600 book-border book-border-solid book-border-green-600 book-rounded-lg book-p-3 hover:book-bg-white hover:book-text-green-600 book-cursor-pointer`;
                contractButton.textContent = translate('viewPre_booking');
                contractButton.onclick = () => {
                    const url = getLocalizedUrl(bookId);
                    window.open(url, '_blank');
                };
                buttonContainer.insertBefore(contractButton, existingButton);
            }

        } else {

            const issueTicketPayload = {
                bookId: bookId,
                run: true
            };
            const { requests } = getServiceMappingInfo(selectedMode);
            const issueTicketUrl = requests.issueTicket;
            issueTicketPayload.url = issueTicketUrl;
            issueTicketPayload.rkey = (selectedMode === "flight") ? 'rkey' : 'rKey';

            if (payType === 'credit') {
                if (responseFirst) {
                    responseFirst.classList.add("book-hidden");
                }
                responseLast.classList.remove("book-hidden");
                lastMessage.innerHTML = `<div class="book-final__loader book-mx-auto book-mb-10"></div><div class="book-text-2xl book-font-bold book-mt-6">${translate('issuing_booking')}</div><div class="book-text-zinc-500 book-mt-3">${translate('please_wait')}</div>`;
                $bc.setSource("cms.issueTicket", [issueTicketPayload]);
            } else {
                if (Number(share) === 1) {

                    if (responseFirst) {
                        responseFirst.classList.add("book-hidden");
                    }
                    responseLast.classList.remove("book-hidden");
                    lastMessage.innerHTML = `<div class="book-final__loader book-mx-auto book-mb-10"></div><div class="book-text-2xl book-font-bold book-mt-6">${translate('issuing_booking')}</div><div class="book-text-zinc-500 book-mt-3">${translate('please_wait')}</div>`;
                    $bc.setSource("cms.issueTicket", [issueTicketPayload]);
                } else {

                    if (bankIdentifier === '-1') {
                        if (responseFirst) {
                            responseFirst.classList.add("book-hidden");
                        }
                        responseLast.classList.remove("book-hidden");
                        lastMessage.textContent = translate('preBooking_success');

                        // Add button if not already added
                        const existingButton = responseLast?.querySelector("button");

                        if (!responseContainer || !responseLast || !lastMessage || !existingButton) {
                            throw new Error('Required DOM elements not found');
                        }
                        const buttonContainer = existingButton.parentElement;

                        if (!buttonContainer.querySelector(".book-contract__button")) {
                            const contractButton = document.createElement("button");
                            contractButton.className = `book-contract__button ${isMobile ? 'book-w-full book-mb-4' : 'book-min-w-28 book-mx-4'} book-text-white book-bg-green-600 book-border book-border-solid book-border-green-600 book-rounded-lg book-p-3 hover:book-bg-white hover:book-text-green-600 book-cursor-pointer`;
                            contractButton.textContent = translate('viewPre_booking');
                            contractButton.onclick = () => {
                                const url = getLocalizedUrl(bookId);
                                window.open(url, '_blank');
                            };
                            buttonContainer.insertBefore(contractButton, existingButton);
                        }
                    } else {
                        let pnr = bookId;
                        let fliNo = "";
                        let typ = "";
                        let pri = "";
                        let pax = "";
                        let adu = 0;
                        let chi = 0;
                        let inf = 0;
                        let from = "";
                        let to = "";
                        let dep = "";
                        let ret = "";
                        let nam = fullname;
                        let pho = mobile;
                        let ema = email;
                        let rFTyp = "";
                        let rPnr = bookId;
                        let rFliNo = "";
                        // Chack safarmarket api
                        if (bankIdentifier === "206") {
                            fliNo = productGroup[0].RoutesInfo[0].FlightNumber;
                            typ = productGroup[0].isSystemFlight === "true" || productGroup[0].isSystemFlight === true ? "SYSTEM" : "CHARTER";
                            pri = PriceInfo.PassengerFare[0].Unit;
                            pax = PriceInfo.TotalCommission;
                            adu = PriceInfo.PassengerFare.find(p => p.passengerType === "Adult")?.Count || 0;
                            chi = PriceInfo.PassengerFare.find(p => p.passengerType === "Child")?.Count || 0;
                            inf = PriceInfo.PassengerFare.find(p => p.passengerType === "Infant")?.Count || 0;
                            from = productGroup[0].RoutesInfo[0].OriginAirport;
                            to = productGroup[0].RoutesInfo[0].DestinationAirport;
                            dep = `${productGroup[0].RoutesInfo[0].DepartureDate} ${productGroup[0].RoutesInfo[0].DepartureTime}`;
                            ret = productGroup.length > 1 ? `${productGroup[1].RoutesInfo[0].DepartureDate} ${productGroup[1].RoutesInfo[0].DepartureTime}` : "";
                            rFTyp = productGroup[1] ? (productGroup[1].isSystemFlight === "true" || productGroup[1].isSystemFlight === true ? "SYSTEM" : "CHARTER") : "";
                            rFliNo = productGroup[1]?.RoutesInfo?.[0]?.FlightNumber || "";

                            $bc.setSource("cms.safarmarket", [{
                                pnr,
                                fliNo,
                                typ,
                                pri,
                                pax,
                                adu,
                                chi,
                                inf,
                                from,
                                to,
                                dep,
                                ret,
                                nam,
                                pho,
                                ema,
                                rFTyp,
                                rPnr,
                                rFliNo,
                                run: true
                            }]);
                        };
                        $bc.setSource("cms.token", [{
                            bookId: bookId,
                            accountEmail: email,
                            accountMobile: mobile,
                            title: tokenBankTitle,
                            flightData: bankIdentifier === "206"
                                ? `https://safarmarket.com/api/v1/trace/pixel/babanowrouz/3/?smId=${getSearchCookie("safarmarketId") || ""}&pnr=${pnr}&fliNo=${fliNo}&typ=${typ}&pri=${pri}&pax=${pax}&adu=${adu}&chi=${chi}&inf=${inf}&from=${from}&to=${to}&dep=${dep}&ret=${ret}&nam=${nam}&pho=${pho}&ema=${ema}&rFTyp=${rFTyp}&rPnr=${rPnr}&rFliNo=${rFliNo}&bck=false`
                                : "",
                            run: true
                        }]);
                    }
                }
            }
        }
    } catch (error) {
        console.error("confirmBookingProcesse: " + error.message);
    }
};

/**
 * Rejects price change or booking and redirects to the homepage.
 */
const rejectBookingProcesse = async () => {
    try {
        window.location.href = '/';
    } catch (error) {
        console.error("rejectBookingProcesse: " + error.message);
    }
};

/**
    * Processes ticket issuance API response and updates UI with status or error message.
    * @param {Object} args - API response object containing source data with status and error message.
    */
const setIssueTicket = async (args) => {
    try {
        const marginClass = isMobile ? 'book-w-full book-mb-4' : (isRTL ? 'book-min-w-28 book-ml-4' : 'book-min-w-28 book-mr-4');
        // Validate API response
        const response = args.source?.rows?.[0] || args.source;
        if (!response || (response.Status === undefined && response.status === undefined)) {
            throw new Error('Invalid or missing API response data');
        }
        const responseStatus = response.Status !== undefined ? response.Status : response.status;

        // Validate DOM elements
        const responseContainer = document.querySelector(".book-message__booking__container");
        if (!responseContainer) throw new Error('Response container not found');

        const responseLast = responseContainer.querySelector(".book__last__message__content");
        if (!responseLast) throw new Error('Last message content element not found');

        const lastMessage = responseLast.querySelector(".book__last__message");
        if (!lastMessage) throw new Error('Last message element not found');
        const existingButton = responseLast?.querySelector("button");

        if (!responseContainer || !responseLast || !lastMessage || !existingButton) {
            throw new Error('Required DOM elements not found');
        }

        if (responseStatus === true) {
            const bookingStatus = response.BookingStatus;

            if (bookingStatus === 10) {
                // Success
                lastMessage.textContent = translate('booking_success')
            } else if (bookingStatus === 11) {
                // Pending
                lastMessage.textContent = translate('booking_status_pending');
            } else {
                // Error
                // lastMessage.textContent = response.ErrorMessage || translate('booking_error');
                lastMessage.textContent = translate('booking_error');
            }

            // Add button only for success or pending
            if (bookingStatus === 10 || bookingStatus === 11) {
                const buttonContainer = existingButton.parentElement;

                if (!buttonContainer.querySelector(".book-contract__button")) {
                    const contractButton = document.createElement("button");
                    contractButton.className = `book-contract__button ${isMobile ? 'book-w-full book-mb-4' : 'book-min-w-28 book-mx-4'} book-text-white book-bg-green-600 book-border book-border-solid book-border-green-600 book-rounded-lg book-p-3 hover:book-bg-white hover:book-text-green-600 book-cursor-pointer`;
                    contractButton.textContent = translate('view_booking');
                    contractButton.onclick = () => {
                        const url = getLocalizedUrl(BasisFlyBookId);
                        window.open(url, '_blank');
                    };
                    const contractdDocumentButton = document.createElement("button");
                    contractdDocumentButton.className = `book-document__contract__button ${marginClass} book-text-white book-bg-green-600 book-border book-border-solid book-border-green-600 book-rounded-lg book-p-3 hover:book-bg-white hover:book-text-green-600 book-cursor-pointer`;
                    contractdDocumentButton.textContent = translate('view_document');
                    contractdDocumentButton.onclick = () => {
                        const url = getLocalizedDocumentUrl(BasisFlyBookId);
                        window.open(url, '_blank');
                    };
                    buttonContainer.insertBefore(contractButton, existingButton);
                    buttonContainer.insertBefore(contractdDocumentButton, existingButton);
                }

            }

        } else {
            // Show error message if reservation failed
            // lastMessage.textContent = response.ErrorMessage || translate('booking_error');
            lastMessage.textContent = translate('booking_error');
        }

    } catch (error) {
        console.error(`setIssueTicket: ${error.message}`);
    }
};

/**
 * Processes payment gateway token API response and initiates payment form submission or redirect.
 * @param {Object} args - API response object containing source data with URL, method, and form.
 */
const setToken = async (args) => {
    try {
        // Validate DOM elements
        const responseContainer = document.querySelector(".book-message__booking__container");
        if (!responseContainer) {
            throw new Error('Response container not found');
        }
        const responseLast = responseContainer.querySelector(".book__last__message__content");
        if (!responseLast) {
            throw new Error('Last message content element not found');
        }
        const lastMessage = responseLast.querySelector(".book__last__message");
        if (!lastMessage) {
            throw new Error('Last message element not found');
        }

        // Validate API response
        const source = args.source?.rows;
        if (!source || !source[0]) {
            throw new Error('Source data not found');
        }

        if (!bankIdentifier || !payType || !schemaId || !sessionId) {
            throw new Error('Missing required templating placeholders');
        }

        // Get bookId from DOM
        if (!BasisFlyBookId) {
            throw new Error('Book ID not found in response');
        }

        if (source[0].url_gateway) {

            // Initiate payment gateway request
            const safarmarketURL = bankIdentifier === "206"
                ? `https://safarmarket.com/api/v1/trace/pixel/babanowrouz/3/` +
                `?smId=${encodeURIComponent(getSearchCookie("safarmarketId") || "")}` +
                `&amp;pnr=${encodeURIComponent(BasisFlyBookId)}` +
                `&amp;fliNo=${encodeURIComponent(productGroup[0].RoutesInfo[0].FlightNumber)}` +
                `&amp;typ=${encodeURIComponent(
                    productGroup[0].isSystemFlight === "true" || productGroup[0].isSystemFlight === true
                        ? 'SYSTEM' : 'CHARTER'
                )}` +
                `&amp;pri=${encodeURIComponent(PriceInfo.PassengerFare[0].Unit)}` +
                `&amp;pax=${encodeURIComponent(PriceInfo.TotalCommission)}` +
                `&amp;adu=${encodeURIComponent(
                    PriceInfo.PassengerFare.find(p => p.passengerType === "Adult")?.Count || 0
                )}` +
                `&amp;chi=${encodeURIComponent(
                    PriceInfo.PassengerFare.find(p => p.passengerType === "Child")?.Count || 0
                )}` +
                `&amp;inf=${encodeURIComponent(
                    PriceInfo.PassengerFare.find(p => p.passengerType === "Infant")?.Count || 0
                )}` +
                `&amp;from=${encodeURIComponent(productGroup[0].RoutesInfo[0].OriginAirport)}` +
                `&amp;to=${encodeURIComponent(productGroup[0].RoutesInfo[0].DestinationAirport)}` +
                `&amp;dep=${encodeURIComponent(
                    `${productGroup[0].RoutesInfo[0].DepartureDate} ${productGroup[0].RoutesInfo[0].DepartureTime}`
                )}` +
                `&amp;ret=${encodeURIComponent(
                    productGroup.length > 1
                        ? `${productGroup[1].RoutesInfo[0].DepartureDate} ${productGroup[1].RoutesInfo[0].DepartureTime}`
                        : ''
                )}` +
                `&amp;nam=${encodeURIComponent(fullname)}` +
                `&amp;pho=${encodeURIComponent(mobile)}` +
                `&amp;ema=${encodeURIComponent(email)}` +
                `&amp;rFTyp=${encodeURIComponent(
                    productGroup[1]
                        ? (productGroup[1].isSystemFlight === "true" || productGroup[1].isSystemFlight === true
                            ? "SYSTEM" : "CHARTER")
                        : ''
                )}` +
                `&amp;rPnr=${encodeURIComponent(BasisFlyBookId)}` +
                `&amp;rFliNo=${encodeURIComponent(
                    productGroup[1]?.RoutesInfo?.[0]?.FlightNumber || ''
                )}` +
                `&amp;bck=false`
                : '';

            const response = await fetch("/book/saveInput", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    bankIdentifier,
                    bankId,
                    schemaid: schemaId,
                    sessionId,
                    BasisFlyBookId,
                    session: source[0].session,
                    orderid: source[0].orderid,
                    selectedMode: selectedMode,
                    safarmarketURL

                })
            });
            const result = await response.text();

            if (source[0].method === 'POST') {
                // Submit payment form
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = source[0].form;
                const form = tempDiv.querySelector('form');
                if (!form) {
                    throw new Error('Payment form not found');
                }
                document.body.appendChild(form);
                form.submit();
            } else {
                // Redirect to gateway URL
                window.location = source[0].url_gateway;
            }
            if (document.querySelector(".book-price__changed")) {
                lastMessage.insertAdjacentHTML("beforeend", `<div class="book__final__message__content book-my-10"><div class="book-final__loader book-mx-auto book-mb-10"></div><div class="book-text-2xl book-font-bold book-mt-6">${translate('connecting_bank')}</div><div class="book-text-zinc-500 book-mt-3">${translate('please_wait')}</div></div>`);
            }
        } else {
            // Display error if no gateway URL
            lastMessage.textContent = translate('payment_gateway_error');
        }
    } catch (error) {
        console.error("setToken: " + error.message);
    }

};
/**
* Retrieves the value of a specific cookie by name.
* @param {string} element - The cookie name.
* @returns {string|null} The cookie value or null if not found.
*/
const getSearchCookie = (element) => {
    try {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${element}=`);
        return parts.length === 2 ? parts.pop().split(';').shift() : null;
    } catch (error) {
        console.error("getCogetSearchCookieokie: " + error.message);
        return null;
    }
};
