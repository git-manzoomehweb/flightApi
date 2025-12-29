/**
 * Global variables to store session search and booking data from sessionSearch.
 * Initialized as null to be populated on DOM load.
 */
let translations = {};
let currentLanguage = document.documentElement.lang || 'fa';
let isRTL = document.documentElement.dir === 'rtl' || currentLanguage === 'fa' || currentLanguage === 'ar';
const isMobile = document.querySelector("main").dataset.mob === "true";
var selectedMode, safarmarketURL, bookId;
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

// Function to assign values from window.cmsData
async function runApiLogic() {
    try {
        await loadRequestMapping();
        // Initialize translation
        await loadTranslations();
        // Initialize direction styles
        await applyDirectionStyles();
        // Initialize lid
        await deletePersistentCookie("lid");
        if (!window.cmsData) {
            console.warn('window.cmsData is not available yet');
            return;
        }

        ({
            selectedMode,
            safarmarketURL,
            bookId
        } = window.cmsData);

        console.log('runApiLogic completed', { selectedMode, safarmarketURL, bookId });
    } catch (error) {
        console.error(`runApiLogic: ${error.message}`);
    }
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
        throw new Error('"Request mapping data not loaded yet.');
    }

    if (!selectedMode) {
        throw new Error('selectedMode is not defined or empty');
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
 * Processes verification API response, triggers ticket issuance, and updates UI.
 * @param {Object} args - API response object containing source data with status and title.
 */
const setVerify = async (args) => {
    try {
        if (!selectedMode) {
            console.warn('selectedMode is not defined yet, calling runApiLogic...');
            await runApiLogic();

            if (!selectedMode) {
                throw new Error('selectedMode could not be loaded from window.cmsData');
            }
        }

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

        // Validate API response
        const source = args.source?.rows;
        if (!source || !source[0] || source[0].status === undefined || !source[0].title) {
            throw new Error('Invalid or missing API response data');
        }

        // Update UI: Hide first message, show last message, and set message content
        if (responseFirst) {
            responseFirst.classList.add("book-hidden");
        }
        responseLast.classList.remove("book-hidden");
        const lastMessage = responseLast.querySelector(".book__last__message");
        if (!lastMessage) {
            throw new Error('Last message element not found');
        }


        // Trigger ticket issuance if status is 1
        if (Number(source[0].status) === 1) {
            lastMessage.textContent = source[0].title;
            if (safarmarketURL && safarmarketURL !== "") {
                safarmarketURL = safarmarketURL.replace(/\/(\d+)\//, "/4/");
                $bc.setSource("cms.safarmarket", safarmarketURL)
            };

            lastMessage.insertAdjacentHTML("beforeend", `<div class="book__final__message__content book-my-10"><div class="book-final__loader book-mx-auto book-mb-10"></div><div class="book-text-2xl book-font-bold book-mt-6">${translate('issuing_booking')}</div><div class="book-text-zinc-500 book-mt-3">${translate('please_wait')}</div></div>`);
            const issueTicketPayload = {
                run: true
            };
            const { requests } = getServiceMappingInfo(selectedMode);
            const issueTicketUrl = requests.issueTicket;
            issueTicketPayload.url = issueTicketUrl;
            issueTicketPayload.rkey = (selectedMode === "flight") ? 'rkey' : 'rKey';
            $bc.setSource("cms.issueTicket", [issueTicketPayload]);
        } else {
            lastMessage.textContent = translate('payment_verify_error');
            if (safarmarketURL && safarmarketURL !== "") {
                safarmarketURL = safarmarketURL.replace(/\/(\d+)\//, "/5/");
                $bc.setSource("cms.safarmarket", safarmarketURL)
            };
        }

    } catch (error) {
        console.error(`setVerify: ${error.message}`);
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
                        const url = getLocalizedUrl(bookId);
                        window.open(url, '_blank');
                    };
                    const contractdDocumentButton = document.createElement("button");
                    contractdDocumentButton.className = `book-document__contract__button ${marginClass} book-text-white book-bg-green-600 book-border book-border-solid book-border-green-600 book-rounded-lg book-p-3 hover:book-bg-white hover:book-text-green-600 book-cursor-pointer`;
                    contractdDocumentButton.textContent = translate('view_document');
                    contractdDocumentButton.onclick = () => {
                        const url = getLocalizedDocumentUrl(bookId);
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
 * Processes deleting lid in Cookie.
 * @param {Object} args - API response object containing source data with status and error message.
 */
const deletePersistentCookie = async (name) => {
    try {
        if (!name) throw new Error("Cookie name is required");

        const isHttps = location.protocol === "https:";

        const parts = [
            `${encodeURIComponent(name)}=`, // empty value
            "Max-Age=0",                    // expire immediately
            "Path=/",
            "SameSite=None",
        ];

        if (isHttps) parts.push("Secure");

        document.cookie = parts.join("; ");
        return true;
    } catch (error) {
        console.error("deletePersistentCookie: " + error.message);
        return false;
    }
};


