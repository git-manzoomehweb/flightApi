// ===============================
// Constants
// - Read dmnid and lid from <main> data attributes.
// - LID is used to localize labels/messages (1=FA, 2=EN, 3=AR).
// ===============================
let translations = {};
let currentLanguage = document.documentElement.lang || 'fa';
const DMNID = document.querySelector("main").dataset.dmnid;
const isMobile = document.querySelector('main')?.dataset.mob === "true";
const LID = (() => {
    // Try <html lang="fa|en|ar"> first; fallback to dir attribute
    const lang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
    const dir = (document.documentElement.getAttribute('dir') || '').toLowerCase();

    if (lang.startsWith('fa') || dir === 'rtl') return "1";   // Persian
    if (lang.startsWith('ar')) return "3";                    // Arabic
    return "2";                                               // Default: English
})();
let userFullName = '';

// ===============================
// DOM Elements (mapped to the new HTML structure)
// - messagesContainer: chat messages stream wrapper
// - messageInput: the text input users type into
// - sendButton: the submit button of the chat form
// - resultsContainer: the container where API results (offers) render
// - hasReceivedApiResponse: flag to stop/change loading indicators
// ===============================
const messagesContainer = document.querySelector('.ai-messages__content');
const messageInput = document.getElementById('ai-messages__container');
const sendButton = document.querySelector('.ai-form__container button[type="button"]');
const resultsContainer = document.querySelector('#ai-response__container > div.ai-response__content');
let hasReceivedApiResponse = false;

// ===============================
// State & Helpers
// - ObjectId(): quick unique session-like id generator
// - sessionId: unique id per page session
// - isLoading: guards multiple concurrent sends
// - storedEntities: keeps last parsed entities from AI response
// ===============================
const ObjectId = (m = Math, d = Date, h = 16, s = s => m.floor(s).toString(h)) =>
    s(d.now() / 1000) + ' '.repeat(h).replace(/./g, () => s(m.random() * h));
const sessionId = ObjectId();
let isLoading = false;
let storedEntities = null;

// ===============================
// Function to load translations based on the language code
// - lang is the default parameter (can be 'fa' for Persian, 'en' for English, etc.)
// - It fetches translation data from a server endpoint `/json/translations?lid=1`
// - The translations are stored in the `translations` variable for later use
const loadTranslations = async (lang = 'fa') => {
    try {
        // Fetching translation data based on the language ID (LID)
        const response = await fetch(`/json/translations?lid=1`);
        const allTranslations = await response.json();
        translations = allTranslations;  // Store all translations in the translations variable
    } catch (error) {
        console.error('loadTranslations:', error);  // Catch and log any errors
    }
}
// ===============================
// Function to translate text
// - Takes the text string as input
// - Returns the translated text based on the current language (currentLanguage)
// - If no translation is found, returns the original text
const translate = (text) => {
    try {
        // Check if translation exists for the given text and currentLanguage
        return translations[text] ? translations[text][currentLanguage] : text;
    } catch (error) {
        console.error('translate:', error);  // Catch and log any errors
    }
};

// ===============================
// Utility: Smoothly scroll chat to the latest message
// - Also ensures the main container is in view if results are open
// ===============================
const scrollToBottom = () => {
    try {
        if (!messagesContainer) throw new Error("Messages container not found");
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // If results box is present, scroll main for a better UX
        const mainContainer = document.querySelector('main');
        if (mainContainer) {
            mainContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    } catch (err) {
        console.error(`scrollToBottom: ${err.message}`);
    }
};

// ===============================
// Utility: Read a cookie by name (used to fetch rkey)
// ===============================
const getSearchCookie = (name) => {
    try {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return '';
    } catch (err) {
        console.error(`getSearchCookie: ${err.message}`);
        return '';
    }
};

// ===============================
// Utility: Add thousand separators to prices
// ===============================
const formatPrice = (price) => {
    try {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } catch (err) {
        console.error(`formatPrice: ${err.message}`);
        return price.toString();
    }
};

// ===============================
// Utility: Format ISO datetime to locale date + HH:MM
// ===============================
const formatDateTime = (dateTimeStr) => {
    try {
        const date = new Date(dateTimeStr);
        if (isNaN(date.getTime())) throw new Error("Invalid date-time string");
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch (err) {
        console.error(`formatDateTime: ${err.message}`);
        return ' ';
    }
};

// ===============================
// Tabs: activate the clicked tab and show its content
// ===============================
const switchFlightTab = (clickedButton, tabIndex) => {
    try {
        const allTabButtons = clickedButton.closest(".ai-response__container").querySelectorAll('.ai-clicker__list li');
        allTabButtons.forEach(button => {
            button.classList.remove('active');
        });

        clickedButton.classList.add('active');

        const allTabContents = clickedButton.closest(".ai-response__container").querySelectorAll('.tab-content');
        allTabContents.forEach(content => {
            content.classList.add("ai-hidden");
        });

        const selectedTabContent = clickedButton.closest(".ai-response__container").querySelector(`#tab-content-${tabIndex}`);
        if (selectedTabContent) {
            selectedTabContent.classList.remove("ai-hidden");
        }
    } catch (err) {
        console.error(`switchFlightTab: ${err.message}`);
    }
};

// ===============================
// Renderer: Build flight offers HTML for the new UI structure
// - Handles localization labels via LID
// - Protects against malformed/empty data
// ===============================
const formatFlightsResponse = (data) => {
    try {
        console.log("formatFlightsResponse called with:", data);
        const paddingRightClass = LID === "2" ? "ai-pr-3" : "ai-pl-3";
        const paddingRotateClass = LID === "2" ? "ai-scale-x--100" : "";
        const rawOffers = data.offers || [];
        const totalCount = data.count || 0;

        const offers = rawOffers.filter(item => {
            return item && item.offer && typeof item.offer === 'object' && Object.keys(item.offer).length > 0;
        });
        if (!offers.length) {
            return `<div class="ai-text-center ai-text-zinc-500 ai-py-8">${translate("no_flights_found")}</div>`;
        }


        let html = `
<div class="flight-offers-container ai-w-full">
    <!-- Tabs Header -->
    <ul class="ai-flex ai-clicker__list filter ai-gap-3 ai-w-full ai-items-center ai-pb-3 ai-relative ai-overflow-hidden ai-border-b ai-border-zinc-300">`;
        offers.forEach((item, index) => {
            const isActive = index === 0 ? 'active' : '';
            html += `
        <li class="${isActive}  ${isMobile ? 'ai-text-xs ai-px-3 ai-text-center' : 'ai-text-sm ai-px-5'} ai-text-sm ai-cursor-pointer ai-text-zinc-600 ai-relative"
            data-tab="${index}"
            onclick="switchFlightTab(this, ${index})">
            ${item.title || `${translate("offer")} ` + (index + 1)}
        </li>`;
        });

        html += `
    </ul>
    
    <!-- Tabs Content -->
    <div class="ai-w-full ai-mt-6 ai-flex ai-flex-col ai-gap-7">`;

        offers.forEach((item, index) => {
            const flight = item.offer;
            const isActive = index === 0 ? '' : 'ai-hidden';

            let priceText = '';
            let unitText = '';

            try {
                if (flight.Price && flight.Price.Cost) {
                    const cost = flight.Price.Cost.parsedValue || flight.Price.Cost.source || flight.Price.Cost;
                    priceText = formatPrice(cost);
                    unitText = flight.Price.Unit || '';
                }
            } catch (priceErr) {
                console.warn("Price formatting error:", priceErr);
                priceText = '-';
            }

            html += `
        <div class="tab-content ${isActive}" id="tab-content-${index}">
            <article class="ai-w-full ai-response__item ai-p-4 ai-rounded-xl ai-border ai-border-zinc-500 ai-flex ai-flex-col ai-gap-3">
                <div class="ai-w-full ai-flex ai-justify-between ${isMobile ? 'ai-flex-col ai-gap-2' : ''}">`;

            // Airline logo (if available)
            if (flight.Routes && flight.Routes[0] && flight.Routes[0].AirlineName) {
                html += `<img src="/${flight.Routes[0].AirlineName.image || ''}" class="ai-h-10" width="100" height="40" alt="${flight.Routes[0].AirlineName.name || ''}">`;
            }

            html += `
                    <ul class="ai-flex ai-items-center ai-gap-1 label-list ai-mt-2">`;

            // Baggage (badge)
            if (flight.Baggage) {
                const baggageText = flight.Baggage.value === "0" ? `${translate("no_baggage")}` : `${flight.Baggage.value} ${flight.Baggage.unit}`;
                html += `
                        <li class="ai-h-8 ai-text-xs ai-text-special-4 ai-rounded-full ai-bg-special-3 ai-px-2 ai-items-center ai-flex ai-justify-center ai-gap-1">
                            <svg width="17" height="18" class="align-middle">
                                <use xlink:href="/booking/images/sprite-ai-icons.svg#flight-ai-bar"></use>
                            </svg>
                           <span class="ai-inline-block ai-ltr">${baggageText}</span>
                        </li>`;
            }

            // Stops (badge)
            if (flight.Stops !== undefined) {
                const stopsText = flight.Stops === "0" ? `${translate("direct_flight")}` : `${flight.Stops} ${translate("stop")}`;
                html += `
                        <li class="ai-h-8 ai-text-xs ai-rounded-full ai-bg-special-2 ai-px-2 ai-items-center ai-flex ai-justify-center ai-gap-1">
                            <svg width="17" height="18" class="align-middle">
                                <use xlink:href="/booking/images/sprite-ai-icons.svg#flight-ai-stop"></use>
                            </svg>
                            ${stopsText}
                        </li>`;
            }

            html += `
                    </ul>
                </div>`;

            // Each route (leg) box
            if (flight.Routes && Array.isArray(flight.Routes)) {
                flight.Routes.forEach((route, routeIndex) => {
                    // Extract city info
                    const originCity = route.OriginCity || {};
                    const destCity = route.DestCity || {};

                    // Format connection time (convert minutes to hours and minutes)
                    let connectionTimeText = '';
                    if (route.ConnectionTime && routeIndex < flight.Routes.length - 1) {
                        const minutes = route.ConnectionTime.parsedValue || route.ConnectionTime.source || route.ConnectionTime;
                        const hours = Math.floor(minutes / 60);
                        const mins = minutes % 60;
                        connectionTimeText = hours > 0
                            ? `${translate("connection_time")}: ${hours}h ${mins}m `
                            : `${translate("connection_time")}: ${mins}m`;
                    }

                    // Format dates based on LID
                    const departureDate = LID === "1"
                        ? `${route.DepartureDate || ''} ${route.DepartureJalaliDate ? `(${route.DepartureJalaliDate})` : ''}`
                        : route.DepartureDate || '';
                    const arrivalDate = LID === "1"
                        ? `${route.ArrivalDate || ''} ${route.ArrivalJalaliDate ? `(${route.ArrivalJalaliDate})` : ''}`
                        : route.ArrivalDate || '';

                    html += `
        <div class="ai-w-full ${isMobile ? '' : ' ai-min-h-28'} ai-flex ai-flex-col ai-items-center ai-p-3 ai-justify-between ai-bg-zinc-100 ai-border ai-rounded-xl ai-border-dashed ai-border-zinc-300">
            <div class="ai-w-full ai-flex ai-justify-between ai-items-center">
                <div class="ai-flex ai-flex-col ai-gap-1 ${isMobile ? 'ai-text-center' : ''}">
                    <b class="ai-text-base">${route.DepartureTime || ''}</b>
                    <span class="ai-text-sm ai-font-medium">${originCity.city || route.Origin || ''}<span class="ai-text-zinc-600 ai-text-xs ${isMobile ? 'ai-block ai-mt-1' : 'ai-px-1'}">(${originCity.cityCode || route.Origin || ''})</span></span>
                    ${originCity.airport ? `<span class="ai-text-zinc-400 ai-text-xs ${isMobile ? 'ai-block' : ''}">${originCity.airport}</span>` : ''}
                </div>
                
                <div class="ai-w-3/5 ai-h-1 ai-flex ai-justify-center ai-relative ai-bg-primary-700 ai-rounded-full">
                    <span class="ai-absolute -ai-top-2">
                        <svg width="26" height="21" class="align-middle ${paddingRotateClass}">
                            <use xlink:href="/booking/images/sprite-ai-icons.svg#flight-ai-airplane"></use>
                        </svg>
                    </span>
                </div>
                
                <div class="ai-flex ai-flex-col ai-gap-1  ${isMobile ? 'ai-text-center' : 'ai-items-end'}">
                    <b class="ai-text-base">${route.ArrivalTime || ''}</b>
                    <span class="ai-text-sm ai-font-medium">${destCity.city || route.Destination || ''}<span class="ai-text-zinc-600 ai-text-xs ${isMobile ? 'ai-block ai-mt-1' : 'ai-px-1'}">(${destCity.cityCode || route.Destination || ''})</span></span>
                    ${destCity.airport ? `<span class="ai-text-zinc-400 ai-text-xs ${isMobile ? 'ai-block ai-text-center' : 'ai-text-right'}">${destCity.airport}</span>` : ''}
                </div>
            </div>
            
            <!-- Flight details row -->
            ${isMobile ? `
            <div class="ai-w-full ai-mt-4">
                <p class="ai-text-zinc-900 ai-text-xs ai-mb-2">${translate("flight_time")}: ${route.Duration || ''}</p>
                <div class="ai-w-full ai-flex ai-items-center ai-justify-between ai-mb-2">
                    <p class="ai-text-zinc-900 ai-text-xs">${translate("flight")}: <span class="ai-inline-block">${departureDate}</span></p>
                    <p class="ai-text-zinc-900 ai-text-xs">${translate("arrival")}: <span class="ai-inline-block">${arrivalDate}</span></p>
                </div>
                ${connectionTimeText ? `<div class="ai-w-full ai-mt-3">
                <p class="ai-text-xs ai-font-medium">${connectionTimeText}</p>
            </div>` : ''}
            </div>
            ` : `
            <div class="ai-w-full ai-flex ai-items-center ai-justify-between ai-mt-4">
                <p class="ai-text-zinc-900 ai-text-xs">${translate("flight")}: <span class="ai-inline-block">${departureDate}</span></p>
                <p class="ai-text-zinc-900 ai-text-xs">${translate("arrival")}: <span class="ai-inline-block">${arrivalDate}</span></p>
                <p class="ai-text-zinc-900 ai-text-xs">${translate("flight_time")}: ${route.Duration || ''}</p>
            </div>
            ${connectionTimeText ? `
            <div class="ai-w-full ai-mt-3">
                <p class="ai-text-xs ai-font-medium">${connectionTimeText}</p>
            </div>` : ''}
            `}
        </div>`;
                });
            }

            html += `
                <div class="${isMobile ? 'ai-text-xs' : 'ai-flex ai-justify-between ai-items-center'}">`;

            // Remaining seats (badge)
            if (flight.AvailableSeats !== undefined) {
                const seatsText = flight.AvailableSeats === "0" ? `${translate("completed")}` : `${flight.AvailableSeats} ${translate("seat")}`;
                html += `
                    <div class="ai-flex ai-items-center ai-gap-1 ${isMobile ? 'ai-mb-3' : ''}">
                        <svg width="17" height="18" class="align-middle">
                            <use xlink:href="/booking/images/sprite-ai-icons.svg#flight-ai-passenger"></use>
                        </svg>
                        <span class="ai-text-special-5 ai-text-sm">${translate("remaining_seats")}:</span>
                        <span class="ai-text-special-5 ai-text-sm">${seatsText}</span>
                    </div>`;
            }

            html += `
                    <div class="ai-flex ai-gap-7 ai-items-center ai-buy__btn hover:ai-bg-primary-500 ai-h-12 ai-p-4 ai-bg-special-6 ai-rounded-xl !ai-text-white ai-cursor-pointer"
                         data-id="${flight.FlightId || ''}"
                         onclick="selectApiOption(this)">
                        <p><span class="ai-text-xs ai-px-1">${unitText}</span><span class="ai-text-base">${priceText}</span></p>
                        <span class="ai-font-bold ai-flex ai-items-center ai-text-sm">
                        ${translate("book")}
                            <span class="ai-invert ${paddingRotateClass}">
                                <svg width="48" height="48" class="align-middle">
                                    <use xlink:href="/booking/images/sprite-ai-icons.svg#flight-ai-arrow-left"></use>
                                </svg>
                            </span>
                        </span>
                    </div>
                </div>
            </article>
        </div>`;
        });

        html += `
    </div>
    
    <!-- View All Button -->
    <div class="ai-w-full ai-flex ai-justify-center ai-mt-6">
        <button type="button"
            class="ai-flex ai-rounded-xl ${paddingRightClass} ai-text-xs see-all ai-relative ai-text-primary-600 ai-border-primary-600 ai-border ai-items-center"
            onclick="showAllOffers()">
            <svg width="38" height="38" class="align-middle ai-fill-primary-600">
                <use xlink:href="/booking/images/sprite-ai-icons.svg#flight-ai-eye"></use>
            </svg>
             ${translate("view_all")}<span class="ai-px-1">${totalCount}</span>${translate("offer")}
        </button>
    </div>
</div>`;

        return html;
    } catch (err) {
        console.error(`formatFlightsResponse error:`, err);
        return `<div class="ai-text-center ai-text-red-500 ai-p-8">${translate("error_displaying_flights")}</div>`;
    }
};

// ===============================
// Action: "See all offers" → builds a search payload and opens search page
// - Requires storedEntities to be present
// ===============================
const showAllOffers = () => {
    try {
        if (!storedEntities) {
            console.warn("No stored entities found");
            return;
        }

        const cabinClass = storedEntities.cabin_class || "Economy";
        const adults = storedEntities.adults || "1";
        const children = storedEntities.children || "0";
        const infants = storedEntities.infants || "0";

        let schemaId = 291;

        const rd = storedEntities?.return_date ?? '';
        if (rd && String(rd).trim().toLowerCase() !== 'none') {
            schemaId = 290;
        }

        let TripGroup = [];
        if (schemaId === 291) {
            TripGroup = [{
                "Origin": storedEntities.origin || "",
                "Destination": storedEntities.destination || "",
                "OriginName": storedEntities.origin_name || storedEntities.origin || "",
                "DestinationName": storedEntities.destination_name || storedEntities.destination || "",
                "DepartureDate": storedEntities.departure_date || ""
            }];
        } else {
            TripGroup = [
                {
                    "Origin": storedEntities.origin || "",
                    "Destination": storedEntities.destination || "",
                    "OriginName": storedEntities.origin_name || storedEntities.origin || "",
                    "DestinationName": storedEntities.destination_name || storedEntities.destination || "",
                    "DepartureDate": storedEntities.departure_date || ""
                },
                {
                    "Origin": storedEntities.destination || "",
                    "Destination": storedEntities.origin || "",
                    "OriginName": storedEntities.destination_name || storedEntities.destination || "",
                    "DestinationName": storedEntities.origin_name || storedEntities.origin || "",
                    "DepartureDate": storedEntities.return_date || ""
                }
            ];
        }

        const flightSearch = {
            "TripGroup": TripGroup,
            "CabinClass": cabinClass,
            "Adults": adults,
            "Children": children,
            "Infants": infants,
            "rkey": getSearchCookie("rkey") || "",
            "dmnid": DMNID,
            "SchemaId": schemaId,
            "Type": "flight",
            "share": "",
            "lid": LID
        };

        sessionStorage.setItem('sessionSearch', JSON.stringify(flightSearch));
        window.open(
            document.querySelector('main')?.dataset.b2b === "true" ? "/flight/search/B2B" : "/flight/search",
            '_blank'
        );

    } catch (err) {
        console.error(`showAllOffers: ${err.message}`);
    }
};

// ===============================
// Action: User selects a specific offer → open booking page with token
// ===============================
const selectApiOption = (element) => {
    try {
        let schemaId = 291;
        const rd = storedEntities?.return_date ?? '';
        if (rd && String(rd).trim().toLowerCase() !== 'none') {
            schemaId = 290;
        }
        const foundObject = {
            FlightId: element.dataset.id,
            TokenId: document.querySelector("main").dataset.sessionid,
            SchemaId: schemaId,
            Mode: "AI",
            Type: "flight"
        };
        sessionStorage.setItem('sessionSearch', JSON.stringify(foundObject));
        window.open('/flight/book', '_blank');
    } catch (err) {
        console.error(`selectApiOption: ${err.message}`);
    }
};

// ===============================
// Response Orchestrator:
// - Renders text/system messages
// - Drives login/select-user flow
// - Pushes offers into chat stream
// - Controls loading lifecycle + rate-limit lock
// ===============================
const processResponse = (response) => {
    try {
        console.log("processResponse called with:", response);

        if (typeof response === 'string') {
            addMessage(response, 'system');
            return;
        }

        let formattedResponse = response.text || response.message;

        // Handle rkey & optional user selection list
        if (response.rkey) {
            if (response.rkey.rkey) {
                document.cookie = `rkey=${response.rkey.rkey}; path=/; SameSite=Strict`;
                $bc.setSource('login.response', { rkey: response.rkey.rkey });
            }

            if (Array.isArray(response.rkey.users) && response.rkey.users.length > 0) {
                const textClass = LID === "2" ? "ai-text-left" : "ai-text-right";
                const arrowClass = LID === "2" ? "ai-scale-x--100" : "";
                const userListHtml = response.rkey.users.map((user, index) => {
                    return `
                    <button 
                        class="user-select-btn ai-w-full ai-p-1 ai-mb-3 ai-bg-white  ai-border-2  ai-rounded-xl ai-transition-all ai-duration-300 hover:ai-shadow-lg ai-group"
                        onclick="handleUserSelection('${user.userid}','${user.username}', '${response.rkey.hashid || ''}')">
                        <div class="ai-flex ai-items-center ai-gap-3">
                            <div class="ai-w-10 ai-h-10 ai-bg-zinc-700 ai-rounded-full ai-flex ai-items-center ai-justify-center ai-text-white ai-font-bold ai-text-lg">
                                ${index + 1}
                            </div>
                            <div class="${textClass} ai-flex-1">
                                <p class="ai-text-zinc-800 ai-font-medium">${user.username}</p>
                            </div>
                            <svg class="ai-w-5 ai-h-5 ai-text-zinc-600 ${arrowClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                            </svg>
                        </div>
                    </button>
                `;
                }).join('');

                const mainText = formattedResponse || response.text || "Please choose your account.";
                const containerHtml = `
                <div class="ai-p-5">
                    <div class="ai-my-2">
                        <p>${mainText}</p>
                    </div>
                    <div class="user-selection-box">
                        <div class="ai-flex ai-flex-col">
                            ${userListHtml}
                        </div>
                    </div>
                </div>
            `;

                addMessage(containerHtml, 'system');
                return;
            }
        }

        // Auth required (no side effects, only inform)
        if (response.authentication_required === true && !response.is_authenticated) {

            if (formattedResponse && formattedResponse.trim()) {
                addMessage(formattedResponse, 'system');
            }
            return;
        }

        // Bot needs more info from the user
        if (response.status === 'need_more_info') {

            if (formattedResponse && formattedResponse.trim()) {
                addMessage(formattedResponse, 'system');
            }
            return;
        }

        // Task complete (e.g., parsed flight search entities)
        if (response.status === 'complete') {

            const mainEl = document.querySelector('main');
            const sessionId = mainEl?.dataset?.sessionid || '';
            const lid = LID;

            if (response.intent === 'search_flight' && response.entities) {
                storedEntities = response.entities;
                const fullRequest = {
                    ...response.entities,
                    sessionId,
                    lid
                };

                if (formattedResponse && formattedResponse.trim() !== '' && formattedResponse.trim() !== '```') {
                    addMessage(formattedResponse, 'system');
                }

                $bc.setSource('offers.request', JSON.stringify(fullRequest));
                handleLoadingResponse({});
                //showLoading();
                return;
            }
        }

        // Handle offers:
        // Case 1) Single object with error info
        if (typeof response.offers === 'object' && !Array.isArray(response.offers) && response.offers.error) {

            removeLoadingIndicator();
            hasReceivedApiResponse = true;

            const errorMessages = {
                "1": "متأسفانه پروازی یافت نشد. لطفاً دوباره تلاش کنید.",
                "2": "Unfortunately, no flights were found. Please try again.",
                "3": "للأسف، لم يتم العثور على رحلات. يرجى المحاولة مرة أخرى."
            };

            addMessage(errorMessages[LID] || errorMessages["2"], 'system');
            return;
        }
        // Case 2) Non-empty array of offers
        if (Array.isArray(response.offers) && response.offers.length > 0) {
            removeLoadingIndicator();
            hasReceivedApiResponse = true;

            // Validate offers content
            const validOffers = response.offers.filter(item =>
                item && item.offer && typeof item.offer === 'object' && Object.keys(item.offer).length > 0
            );

            console.log("Valid offers:", validOffers);

            // If we have valid offers, render them into the chat stream
            if (validOffers.length > 0) {
                formattedResponse = formatFlightsResponse({
                    offers: validOffers,
                    count: response.count || validOffers.length
                });

                // Push results block as a system message container
                const resultsHtml = `
<div id="ai-response__container-${Date.now()}" class="ai-response__container ai-w-full ai-bg-white ai-rounded-3xl ${isMobile ? 'ai-px-3 ai-py-4' : 'ai-p-6'}  ai-shadow-lg">
<div class="ai-response__content ai-w-full  ai-flex ai-flex-col ai-gap-7">
${formattedResponse}
</div>
</div>
`;

                addMessage(resultsHtml, 'system');

                if (response.text && response.text.trim()) {
                    addMessage(response.text, 'system');
                }
                return;
            } else {
                // No valid offers after filtering
                const noOffersMessages = {
                    "1": "پروازی برای این مسیر یافت نشد.",
                    "2": "No flights found for this route.",
                    "3": "لم يتم العثور على رحلات لهذا المسار."
                };
                addMessage(noOffersMessages[LID] || noOffersMessages["2"], 'system');
                return;
            }
        }

        // Default: show any non-empty text as a system message
        if (formattedResponse && formattedResponse.trim()) {
            addMessage(formattedResponse, 'system');
        }

        // Rate limited → lock input with a localized placeholder
        if (response.status_code === 429) {
            const placeholderByLID = {
                "1": "دیگه تمومه...",
                "2": "It's over now...",
                "3": "انتهى الأمر..."
            };
            messageInput.placeholder = placeholderByLID[LID];
            messageInput.disabled = true;
        }
    } catch (err) {
        console.error(`processResponse error:`, err);
        hasReceivedApiResponse = true;
        removeLoadingIndicator();
        addMessage("خطا در پردازش پاسخ", 'system');
    }
};

// ===============================
// User selection (multi-account flow)
// - Sends a selectuser request through BasisCore ($bc)
// ===============================
const handleUserSelection = (userid, username, hashid) => {
    try {
        addMessage(username, 'user');
        showLoading();
        hasReceivedApiResponse = false;

        // Dispatch selectuser API call via BasisCore source
        $bc.setSource('flight.request', {
            text: userid,
            dmnid: DMNID,
            sessionId: sessionId,
            run: true
        });
    } catch (err) {
        console.error(`handleUserSelection: ${err.message}`);
    }
};

// ===============================
// Loading bubble: show a typing/progress indicator
// - Creates a message-like block with animated dots
// ===============================
const showLoading = () => {
    try {
        isLoading = true;
        const loadingEl = document.createElement('div');
        loadingEl.id = 'loading-indicator';
        loadingEl.className = 'ai-bot__answers ai-w-full ai-flex ai-justify-start';
        const paddingRightClass = LID === "2" ? "ai-pl-10" : "ai-pr-10";
        loadingEl.innerHTML = `
        <div class="ai-message ai-w-fit ai-max-w-[80%] ai-p-3 ${paddingRightClass} ${isMobile ? 'ai-text-xs' : 'ai-text-sm'}  ai-rounded-2xl ai-bg-white ai-text-zinc-800 ai-rounded-bl-sm ai-shadow-sm">
            <div class="ai-flex ai-items-center ai-gap-3">
                <span>${translate("processing")}</span>
                <div class="ai-flex ai-gap-1">
                    <div class="ai-loading__dot ai-w-2 ai-h-2 ai-bg-zinc-100 ai-rounded-full"></div>
                    <div class="ai-loading__dot ai-w-2 ai-h-2 ai-bg-zinc-100 ai-rounded-full"></div>
                    <div class="ai-loading__dot ai-w-2 ai-h-2 ai-bg-zinc-100 ai-rounded-full"></div>
                </div>
            </div>
        </div>
    `;

        if (!messagesContainer) throw new Error("Messages container not found");
        messagesContainer.appendChild(loadingEl);
        scrollToBottom();
    } catch (err) {
        console.error(`showLoading: ${err.message}`);
        isLoading = false;
    }
};

// ===============================
// Loading bubble: remove all active loading indicators
// - Clears any running intervals used for rotating loading messages
// ===============================
const removeLoadingIndicator = () => {
    try {
        isLoading = false;
        hasReceivedApiResponse = true;

        const loadingEls = document.querySelectorAll('#loading-indicator, [data-bc-typing-indicator]');
        loadingEls.forEach(el => {
            const intervalId = el.dataset?.loadingIntervalId;
            if (intervalId) {
                clearInterval(parseInt(intervalId));
            }
            el.remove();
        });
    } catch (err) {
        console.error(`removeLoadingIndicator: ${err.message}`);
    }
};

// ===============================
// Chat message append helper
// - Supports plain text and prebuilt HTML blocks
// - Auto-scrolls and removes loading afterward
// ===============================
const addMessage = (content, type) => {
    try {
        if (typeof content !== 'string' || !content.trim()) {
            console.warn("addMessage: Empty or invalid content");
            return;
        }

        const messageEl = document.createElement('div');
        const messageContent = document.createElement('div');
        // If content is a results container, inject as-is
        if (content.includes('ai-response__container-')) {
            messageEl.className = 'ai-w-full ai-mb-4';
            messageEl.innerHTML = content;
        } else {
            // Standard bubble (user or system)
            messageEl.className = type === 'user' ? 'ai-user__questions ai-w-full ai-flex ai-justify-end' : 'ai-bot__answers ai-w-full ai-flex ai-justify-start';
            const paddingRightClass = LID === "2" ? "ai-pl-10" : "ai-pr-10";

            messageContent.className = `ai-message ai-w-fit ai-max-w-[80%] ai-p-3 ${paddingRightClass} ${isMobile ? 'ai-text-xs' : 'ai-text-sm'} ai-rounded-2xl ${type === 'user'
                ? 'ai-bg-cyan-500 ai-text-white ai-rounded-br-sm'
                : 'ai-bg-white ai-text-zinc-800 ai-rounded-bl-sm ai-shadow-sm'
                }`;

            if (content.trim().startsWith('<') && content.trim().endsWith('>')) {
                messageContent.innerHTML = content;
            } else {
                const formattedContent = content
                    .replace(/\n{2,}/g, '<br>')
                    .replace(/\n/g, '<br>');
                messageContent.innerHTML = formattedContent;
            }

            messageEl.appendChild(messageContent);
        }
        if (type === 'user' && userFullName) {
            const span = document.createElement('span');
            span.className = 'ai-user__name ai-bg-zinc-100 ai-p-2 ai-rounded-xl ai-text-xs';
            span.textContent = userFullName;

            switch (parseInt(LID, 10)) {
                case 2:
                    span.className += ' ai-mr-2';
                    if (messageContent.firstChild) {
                        messageContent.insertBefore(span, messageContent.firstChild);
                    } else {
                        messageContent.appendChild(span);
                    }
                    break;
                case 1:
                case 3:
                default:
                    span.className += ' ai-ml-2';
                    if (messageContent.firstChild) {
                        messageContent.insertBefore(span, messageContent.firstChild);
                    } else {
                        messageContent.appendChild(span);
                    }
            }
        }

        if (!messagesContainer) throw new Error("Messages container not found");
        messagesContainer.appendChild(messageEl);

        // Keep the latest message in view
        setTimeout(() => {
            scrollToBottom();
        }, 100);

        removeLoadingIndicator();
    } catch (err) {
        console.error(`addMessage: ${err.message}`);
    }
};

// ===============================
// Send message flow
// - Reads input, appends user bubble, shows loading, triggers BasisCore source
// ===============================
const sendMessage = () => {
    try {
        if (!messageInput) throw new Error("Message input not found");
        const messageText = messageInput.value.trim();
        if (!messageText || isLoading) return;

        hasReceivedApiResponse = false;
        addMessage(messageText, 'user');
        messageInput.value = '';
        showLoading();

        $bc.setSource('flight.request', {
            text: messageText,
            dmnid: DMNID,
            sessionId: sessionId,
            run: true
        });
    } catch (err) {
        console.error(`sendMessage: ${err.message}`);
        isLoading = false;
    }
};

// ===============================
// BasisCore API handler wrapper
// - Parses JSON and forwards to processResponse()
// ===============================
const handleApiResponse = async (args) => {
    try {
        console.log("API response received", args);
        const response = args.response;
        const responseJson = await response.json();
        hasReceivedApiResponse = true;
        processResponse(responseJson);
    } catch (err) {
        console.error(`handleApiResponse: ${err.message}`);
        addMessage("Error receiving API response", 'system');
    }
};

// ===============================
// Loading message rotator
// - Periodically swaps messages until a response is received
// ===============================
const handleLoadingResponse = () => {
    try {
        const messagesByLanguage = {
            "1": [
                "در حال جستجوی بهترین پیشنهادها",
                "در حال بررسی صدها پرواز",
                "در حال یافتن ارزان‌ترین قیمت‌ها",
                "در حال بررسی سریع‌ترین مسیرها",
                "در حال بارگذاری خطوط هوایی موجود",
                "تقریباً آماده‌ایم، لطفاً صبر کنید"
            ],
            "2": [
                "Looking for the best offers",
                "Searching hundreds of flights",
                "Securing the cheapest prices",
                "Finding the fastest connections",
                "Loading available airlines",
                "Almost there, hang tight!"
            ],
            "3": [
                "جارٍ البحث عن أفضل العروض",
                "جارٍ فحص مئات الرحلات",
                "جارٍ تأمين أرخص الأسعار",
                "جارٍ إيجاد أسرع الاتصالات",
                "جارٍ تحميل شركات الطيران المتاحة",
                "اقتربنا من الانتهاء، الرجاء الانتظار"
            ]
        };

        const messages = messagesByLanguage[LID] || messagesByLanguage["2"];
        hasReceivedApiResponse = false;

        let currentIndex = Math.floor(Math.random() * messages.length);

        const updateLoadingMessage = () => {
            const loadingEl = document.getElementById('loading-indicator');
            if (!loadingEl) return false;
            const messageDiv = loadingEl.querySelector('.ai-message');
            if (messageDiv) {
                messageDiv.innerHTML = ` <div class="ai-flex ai-items-center ai-gap-3"><span>${messages[currentIndex]}</span><div class="ai-flex ai-gap-1">
                    <div class="ai-loading__dot ai-w-2 ai-h-2 ai-bg-zinc-100 ai-rounded-full"></div>
                    <div class="ai-loading__dot ai-w-2 ai-h-2 ai-bg-zinc-100 ai-rounded-full"></div>
                    <div class="ai-loading__dot ai-w-2 ai-h-2 ai-bg-zinc-100 ai-rounded-full"></div>
                </div></div>`;
            }
            return true;
        };

        if (!updateLoadingMessage()) return;

        const intervalId = setInterval(() => {
            if (hasReceivedApiResponse) {
                clearInterval(intervalId);
                return;
            }

            const loadingEl = document.getElementById('loading-indicator');
            if (!loadingEl) {
                clearInterval(intervalId);
                return;
            }

            let newIndex;
            let attempts = 0;
            do {
                newIndex = Math.floor(Math.random() * messages.length);
                attempts++;
                if (attempts > 10) break;
            } while (newIndex === currentIndex && messages.length > 1);

            currentIndex = newIndex;
            updateLoadingMessage();
        }, 2000);

        const loadingEl = document.getElementById('loading-indicator');
        if (loadingEl) {
            loadingEl.dataset.loadingIntervalId = intervalId;
        }
    } catch (err) {
        console.error(`handleLoadingResponse: ${err.message}`);
    }
};

// ===============================
// Trust Login Schema handler
// - Extracts first/last name for potential UI usage
// ===============================
const handleUserSchema = async (args) => {
    try {
        const responseJson = await args.response.json();

        const props = responseJson?.errorMessage
            ? null
            : responseJson?.sources?.[0]?.data?.[0]?.properties;

        if (!props) return;

        let firstName = '', lastName = '';
        props.forEach((e) => {
            if (e?.prpId == 1) {
                firstName = e?.answers?.[0]?.parts?.[0]?.values?.[0]?.value || translate("no_name");
            } else if (e?.prpId == 2) {
                lastName = e?.answers?.[0]?.parts?.[0]?.values?.[0]?.value || '';
            }
        });

        const fullName = ([firstName, lastName].filter(Boolean).join(' ') || translate("no_name")).trim();
        userFullName = fullName;
        document.querySelectorAll(".ai-user__questions").forEach(element => {
            const aiMessage = element.querySelector(".ai-message");
            if (!aiMessage) return;

            if (aiMessage.querySelector('.ai-user__name')) return;

            const span = document.createElement('span');
            span.className = 'ai-user__name ai-bg-zinc-100 ai-p-2 ai-rounded-xl ai-text-xs';
            span.textContent = fullName;

            switch (parseInt(LID, 10)) {
                case 2:
                    span.className += ' ai-mr-2';
                    if (aiMessage.firstChild) {
                        aiMessage.insertBefore(span, aiMessage.firstChild);
                    } else {
                        aiMessage.appendChild(span);
                    }
                    break;
                case 1:
                case 3:
                default:
                    span.className += ' ai-ml-2';
                    if (aiMessage.firstChild) {
                        aiMessage.insertBefore(span, aiMessage.firstChild);
                    } else {
                        aiMessage.appendChild(span);
                    }
            }
        });

    } catch (err) {
        console.error(`handleUserSchema: ${err.message}`);
    }
};


// ===============================
// Sidebar quick actions
// - Sends predefined intents via the same send flow
// ===============================
const handleSidebarAction = (index) => {
    const messages = {
        0: `${translate("check_flight_status")}`,
        1: `${translate("book_ticket")}`,
        2: `${translate("search_flight")}`,
        3: `${translate("need_support")}`
    };

    if (messages[index] && messageInput) {
        messageInput.value = messages[index];
        sendMessage();
    }
};

// ===============================
// Init: bootstraps chat on DOM ready
// - Clears old session cookies/storage
// - Adds localized welcome
// - Wires form + keyboard + sidebar handlers
// ===============================
document.addEventListener("DOMContentLoaded", async function () {
    try {
        // Initialize translation
        await loadTranslations();
        // Initialize direction styles
        document.cookie = "rkey=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        sessionStorage.removeItem('searchSession');
        sessionStorage.removeItem('sessionBook');
        sessionStorage.removeItem('sessionAmenities');

        if (!messagesContainer) throw new Error("Messages container not found");
        if (!messageInput) throw new Error("Message input not found");
        if (!sendButton) throw new Error("Send button not found");

        // Localized welcome message (by LID)
        if (LID === "2") {
            addMessage("Hello! Welcome to the flight search system. Please search for your desired flight.", 'system');
        } else if (LID === "1") {
            addMessage("سلام! به سامانه جستجوی پرواز خوش آمدید. پرواز مورد نظر خود را جستجو کنید.", 'system');
        } else if (LID === "3") {
            addMessage("مرحبًا! مرحبًا بكم في نظام البحث عن الرحلات. الرجاء البحث عن الرحلة المطلوبة.", 'system');
        }

        // Form submit → send message
        const chatForm = document.querySelector('form');
        if (chatForm) {
            chatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                sendMessage();
            });
        }

        // Send button click 
        if (sendButton) {
            sendButton.addEventListener('click', (e) => {
                e.preventDefault();
                sendMessage();
            });
        }

        // Enter to send (Shift+Enter = newline)
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Sidebar buttons → quick intents
        const sidebarButtons = document.querySelectorAll('aside button');
        sidebarButtons.forEach((button, index) => {
            button.addEventListener('click', () => {
                handleSidebarAction(index);
            });
        });

    } catch (err) {
        console.error(`DOMContentLoaded: ${err.message}`);
    }
});

