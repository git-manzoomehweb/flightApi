// Constants
const DMNID = document.querySelector(".book-layout__main").dataset.dmnid;
const LID = document.querySelector(".book-layout__main").dataset.lid; // Language ID, defaults to 2 (English) if not specified

// DOM Elements
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
let hasReceivedApiResponse = false;

// State
const ObjectId = (m = Math, d = Date, h = 16, s = s => m.floor(s).toString(h)) =>
    s(d.now() / 1000) + ' '.repeat(h).replace(/./g, () => s(m.random() * h));
const sessionId = ObjectId(); // Generate a unique session ID
let isLoading = false;

// Utility Functions
/**
 * Scrolls the messages container to the bottom.
 */
const scrollToBottom = () => {
    try {
        if (!messagesContainer) throw new Error("Messages container not found");
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (err) {
        console.error(`scrollToBottom: ${err.message}, Line: ${err.lineNumber || 'unknown'}`);
    }
};

// Global variable to store entities
let storedEntities = null;

/**
 * Helper function to get search cookie
 * @param {string} name - Cookie name
 * @returns {string} Cookie value
 */
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

/**
 * Generates a random session ID.
 * @returns {string} A unique session ID.
 */
const generateSessionId = () => {
    try {
        return Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
    } catch (err) {
        console.error(`generateSessionId: ${err.message}, Line: ${err.lineNumber || 'unknown'}`);
        return ''; // Fallback to empty string if generation fails
    }
};

/**
 * Formats a price by adding thousand separators.
 * @param {number|string} price - The price to format.
 * @returns {string} The formatted price with commas.
 */
const formatPrice = (price) => {
    try {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } catch (err) {
        console.error(`formatPrice: ${err.message}, Line: ${err.lineNumber || 'unknown'}`);
        return price.toString(); // Fallback to unformatted price
    }
};

/**
 * Formats a date-time string to a localized date and time.
 * @param {string} dateTimeStr - The date-time string to format.
 * @returns {string} The formatted date-time string.
 */
const formatDateTime = (dateTimeStr) => {
    try {
        const date = new Date(dateTimeStr);
        if (isNaN(date.getTime())) throw new Error("Invalid date-time string");
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch (err) {
        console.error(`formatDateTime: ${err.message}, Line: ${err.lineNumber || 'unknown'}`);
        return ' '; // Fallback to space as in original
    }
};

// Helper function to get appropriate icon for each tab
const getTabIcon = (title) => {
    if (!title) return "📋";

    const titleLower = title.toLowerCase();
    if (titleLower.includes('بیسیس') || titleLower.includes('basis')) return "⭐";
    if (titleLower.includes('ارزان') || titleLower.includes('cheap')) return "💰";
    if (titleLower.includes('سریع') || titleLower.includes('fast')) return "⚡";
    if (titleLower.includes('بار') || titleLower.includes('baggage')) return "🧳";

    return "📋";
};

/**
 * Switches between flight tabs with enhanced styling and animation
 * @param {HTMLElement} clickedButton - The clicked tab button
 * @param {number} tabIndex - Index of the tab to show
 */
const switchFlightTab = (clickedButton, tabIndex) => {
    try {
        // Remove active class from all tab buttons
        const allTabButtons = clickedButton.closest(".flight-offers-container").querySelectorAll('.tab-button');
        allTabButtons.forEach(button => {
            button.classList.remove('active');
            button.classList.remove('border-cyan-500', 'bg-cyan-50', 'text-cyan-600', 'shadow-md');
            button.classList.add('border-gray-200', 'bg-white', 'text-gray-600');
        });

        // Add active class to clicked button
        clickedButton.classList.add('active');
        clickedButton.classList.remove('border-gray-200', 'bg-white', 'text-gray-600');
        clickedButton.classList.add('border-cyan-500', 'bg-cyan-50', 'text-cyan-600', 'shadow-md');

        // Hide all tab contents
        const allTabContents = clickedButton.closest(".flight-offers-container").querySelectorAll('.tab-content');
        allTabContents.forEach(content => {
            content.style.display = 'none';
        });

        // Show selected tab content with animation
        const selectedTabContent = clickedButton.closest(".flight-offers-container").querySelector(`#tab-content-${tabIndex}`);
        if (selectedTabContent) {
            selectedTabContent.style.display = 'block';
            selectedTabContent.style.opacity = '0';
            selectedTabContent.style.transform = 'translateY(10px)';

            // Animate in
            setTimeout(() => {
                selectedTabContent.style.transition = 'all 0.3s ease-out';
                selectedTabContent.style.opacity = '1';
                selectedTabContent.style.transform = 'translateY(0)';
            }, 10);
        }
    } catch (err) {
        console.error(`switchFlightTab: ${err.message}, Line: ${err.lineNumber || 'unknown'}`);
    }
};

/**
 * Formats flight offers into an HTML string for display with tabs.
 * @param {Object} data - Object containing offers array and count.
 * @returns {string} HTML string representing the flight offers with tabs.
 */
const formatFlightsResponse = (data) => {
    try {
        console.log("formatFlightsResponse called with:", data);

        const rawOffers = data.offers || [];
        const totalCount = data.count || 0;

        // فیلتر کردن offers معتبر (فقط آنهایی که offer دارند)
        const offers = rawOffers.filter(item => {
            return item &&
                item.offer &&
                typeof item.offer === 'object' &&
                Object.keys(item.offer).length > 0;
        });

        if (!offers.length) {
            return '<div class="text-center text-gray-500 py-8">🔍 هیچ پروازی یافت نشد</div>';
        }

        const arrowByLID = {
            "1": "←", // Persian
            "2": "→", // English
            "3": "←", // Arabic
        };

        const buyLabelsByLID = {
            "1": "خرید",  // Persian
            "2": "Buy",   // English
            "3": "احجز الآن", // Arabic
        };

        const departureLabelsByLID = {
            "1": "تاریخ پرواز",  // Persian
            "2": "Departure",     // English
            "3": "المغادرة",      // Arabic
        };

        const arrivalLabelsByLID = {
            "1": "تاریخ رسیدن",  // Persian
            "2": "Arrival",     // English
            "3": "الوصول",      // Arabic
        };

        const durationLabelsByLID = {
            "1": "مدت پرواز",  // Persian
            "2": "Duration",     // English
            "3": "المدة",      // Arabic
        };

        const baggageLabelsByLID = {
            "1": "بار مجاز",  // Persian
            "2": "Baggage",     // English
            "3": "الأمتعة",      // Arabic
        };

        const seatsLabelsByLID = {
            "1": "صندلی موجود",  // Persian
            "2": "Available Seats",     // English
            "3": "المقاعد المتاحة",      // Arabic
        };

        const allOffersLabelsByLID = {
            "1": (count) => `مشاهده همه ${count} پیشنهاد`,  // Persian
            "2": (count) => `View All ${count} offers`,   // English
            "3": (count) => `عرض جميع ${count} العروض`,  // Arabic
        };

        const buyLabel = buyLabelsByLID[LID] || "Buy";
        const departureLabel = departureLabelsByLID[LID] || "Departure";
        const arrivalLabel = arrivalLabelsByLID[LID] || "Arrival";
        const durationLabel = durationLabelsByLID[LID] || "Duration";
        const baggageLabel = baggageLabelsByLID[LID] || "Baggage";
        const seatsLabel = seatsLabelsByLID[LID] || "Available Seats";
        const allOffersLabel = allOffersLabelsByLID[LID]
            ? allOffersLabelsByLID[LID](totalCount)
            : `View All ${totalCount} offers`;

        let html = `
        <div class="flight-offers-container w-full">
            <!-- Tabs Header -->
            <div class="tabs-header flex flex-wrap gap-2 border-b border-gray-200 mb-4 pb-2">`;

        // Generate tabs with improved styling
        offers.forEach((item, index) => {
            const isActive = index === 0 ? 'active' : '';
            html += `
                <button 
                    class="tab-button ${isActive} px-3 py-2 text-sm font-medium border-2 rounded-lg transition-all duration-300 hover:scale-105 ${isActive
                    ? 'border-cyan-500 bg-cyan-50 text-cyan-600 shadow-md'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-cyan-300 hover:text-cyan-600 hover:bg-cyan-50'
                }" 
                    data-tab="${index}"
                    onclick="switchFlightTab(this, ${index})">
                    <span class="flex items-center gap-1">
                        <span class="text-xs">${getTabIcon(item.title)}</span>
                        <span>${item.title || 'پیشنهاد ' + (index + 1)}</span>
                    </span>
                </button>`;
        });

        html += `
            </div>
            
            <!-- Tabs Content -->
            <div class="tabs-content">`;

        // Generate content for each tab with enhanced design
        offers.forEach((item, index) => {
            const flight = item.offer;
            const isActive = index === 0 ? 'block' : 'none';

            // Safe price extraction
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
                priceText = 'قیمت موجود نیست';
            }

            html += `
                <div class="tab-content" id="tab-content-${index}" style="display: ${isActive};">
                    <div class="flight-card bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 hover:border-cyan-200">
                        
                        <!-- Price Header -->
                        <div class="price-header bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-3">
                            <div class="flex justify-between items-center">
                                <div class="price-section">
                                    <div class="text-xl font-bold">${unitText} ${priceText}</div>
                                </div>
                                <div class="badge bg-white/20 px-2 py-1 rounded-full text-xs font-medium">
                                    ${item.title}
                                </div>
                            </div>
                        </div>

                        <!-- Flight Details -->
                        <div class="flight-content p-4">`;

            if (flight.Routes && Array.isArray(flight.Routes)) {
                flight.Routes.forEach((route, routeIndex) => {
                    html += `
                        <div class="route-section mb-2 ${routeIndex > 0 ? 'pt-2 border-t border-gray-100' : ''}">
                            
                            <!-- Route Header -->
                            <div class="route-header flex justify-between items-center mb-3">
                                <div class="route-path flex items-center gap-3">
                                    <div class="origin text-center">
                                        <div class="text-lg font-bold text-gray-800">${route.Origin || ''}</div>
                                    </div>
                                    
                                    <div class="flight-path flex-1 flex items-center justify-center">
                                        <div class="path-line flex items-center gap-1">
                                            <div class="w-2 h-2 bg-cyan-500 rounded-full"></div>
                                            <div class="flex-1 h-px bg-gradient-to-r from-cyan-500 to-blue-400"></div>
                                            <div class="flight-icon text-sm ${LID === '1' ? 'flip-rtl' : ''}">✈️</div>
                                            <div class="flex-1 h-px bg-gradient-to-r from-blue-400 to-cyan-500"></div>
                                            <div class="w-2 h-2 bg-cyan-500 rounded-full"></div>
                                        </div>
                                    </div>
                                    
                                    <div class="destination text-center">
                                        <div class="text-lg font-bold text-gray-800">${route.Destination || ''}</div>
                                    </div>
                                </div>
                                
                                <!-- Airline Logo -->
                                <div class="airline-section text-center">
                                    <img src="/${route.AirlineName?.image || ''}" 
                                         width="60" height="22" 
                                         alt="${route.AirlineName?.name || ''}" 
                                         class="mx-auto mb-1 rounded shadow-sm"/>
                                    <div class="text-xs text-gray-600">${route.AirlineName?.name || route.Airline || ''}</div>
                                </div>
                            </div>
                            
                            <!-- Time Details -->
                            <div class="time-details grid grid-cols-3 gap-3 bg-gray-50 rounded-lg p-2">
                                <div class="departure-time text-center">
                                    <div class="text-sm font-semibold text-gray-800">${route.DepartureTime || ''}</div>
                                    <div class="text-xs text-gray-600">${route.DepartureDate || ''}</div>
                                    <div class="text-xs text-gray-500">${departureLabel}</div>
                                </div>
                                
                                <div class="duration text-center">
                                    <div class="text-sm font-semibold text-cyan-600">⏱️ ${route.Duration || ''}</div>
                                    <div class="text-xs text-gray-500">${durationLabel}</div>
                                </div>
                                
                                <div class="arrival-time text-center">
                                    <div class="text-sm font-semibold text-gray-800">${route.ArrivalTime || ''}</div>
                                    <div class="text-xs text-gray-600">${route.ArrivalDate || ''}</div>
                                    <div class="text-xs text-gray-500">${arrivalLabel}</div>
                                </div>
                            </div>
                        </div>`;
                });
            }

            // Flight Info Grid
            html += `
                        <div class="flight-info-grid grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">`;

            // Baggage Info
            if (flight.Baggage) {
                const baggageIcon = flight.Baggage.value === "0" ? "🎒" : "🧳";
                const baggageText = flight.Baggage.value === "0" ? "بدون بار" : `${flight.Baggage.value} ${flight.Baggage.unit}`;
                html += `
                    <div class="info-card bg-blue-50 rounded-lg p-3 text-center">
                        <div class="text-2xl mb-1">${baggageIcon}</div>
                        <div class="text-sm font-medium text-gray-800 inline-block ltr">${baggageText}</div>
                        <div class="text-xs text-gray-500">${baggageLabel}</div>
                    </div>`;
            }

            // Stops Info
            if (flight.Stops !== undefined) {
                const stopsIcon = flight.Stops === "0" ? "🛫" : "🔄";
                const stopsText = flight.Stops === "0" ? "مستقیم" : `${flight.Stops} توقف`;
                html += `
                    <div class="info-card bg-cyan-50 rounded-lg p-3 text-center">
                        <div class="text-2xl mb-1">${stopsIcon}</div>
                        <div class="text-sm font-medium text-gray-800">${stopsText}</div>
                        <div class="text-xs text-gray-500">نوع پرواز</div>
                    </div>`;
            }

            // Available Seats
            if (flight.AvailableSeats !== undefined) {
                const seatsIcon = "💺";
                const seatsText = flight.AvailableSeats === "0" ? "تکمیل" : `${flight.AvailableSeats} صندلی`;
                const seatsColor = flight.AvailableSeats === "0" ? "bg-red-50" : "bg-purple-50";
                html += `
                    <div class="info-card ${seatsColor} rounded-lg p-3 text-center">
                        <div class="text-2xl mb-1">${seatsIcon}</div>
                        <div class="text-sm font-medium text-gray-800">${seatsText}</div>
                        <div class="text-xs text-gray-500">${seatsLabel}</div>
                    </div>`;
            }



            html += `
                        </div>
                        
                        <!-- Action Button -->
                        <div class="action-section border-t border-gray-100 p-4 bg-gray-50">
                            <button 
                                class="buy-button w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg transform active:scale-95"
                                data-id="${flight.FlightId || ''}"
                                onclick="selectApiOption(this)">
                                <span class="flex items-center justify-center gap-2">
                                    <span>🛒</span>
                                    <span>${buyLabel}</span>
                                    <span>←</span>
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
        });

        html += `
            </div>
            
            <!-- All Offers Button -->
            <div class="all-offers-section mt-4 text-center">
                <button 
                    class="all-offers-button bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-4 py-2 rounded-md transition-all duration-300 hover:scale-105 hover:shadow-lg transform active:scale-95"
                    onclick="showAllOffers()">
                    <span class="flex items-center justify-center gap-2">
                        <span>📋</span>
                        <span>${allOffersLabel}</span>
                        <span>→</span>
                    </span>
                </button>
            </div>
        </div>`;

        return html;
    } catch (err) {
        console.error(`formatFlightsResponse error:`, err);
        console.error(`Data received:`, data);
        return '<div class="text-center text-red-500 p-8">❌ خطا در نمایش پروازها</div>';
    }
};

/**
 * Shows all offers - creates flight search JSON and redirects
 */
const showAllOffers = () => {
    try {
        if (!storedEntities) {
            console.warn("No stored entities found");
            alert("اطلاعات پرواز یافت نشد");
            return;
        }

        console.log("Building flight search with entities:", storedEntities);

        // Extract values from stored entities with defaults
        const cabinClass = storedEntities.cabin_class || "Economy";
        const adults = storedEntities.adults || "1";
        const children = storedEntities.children || "0";
        const infants = storedEntities.infants || "0";

        // Determine schema ID based on return_date presence
        let schemaId = 291; // One-way default
        if (storedEntities.return_date) {
            schemaId = 290; // Round-trip
        }

        // Build TripGroup based on schema ID
        let TripGroup = [];

        if (schemaId === 291) {
            // One-way trip
            TripGroup = [
                {
                    "Origin": storedEntities.origin || "",
                    "Destination": storedEntities.destination || "",
                    "OriginName": storedEntities.origin_name || storedEntities.origin || "",
                    "DestinationName": storedEntities.destination_name || storedEntities.destination || "",
                    "DepartureDate": storedEntities.departure_date || ""
                }
            ];
        } else if (schemaId === 290) {
            // Round-trip
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

        // Build the flight search object
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

        console.log("Generated flight search:", flightSearch);

        // Store in session storage and redirect
        sessionStorage.setItem('sessionSearch', JSON.stringify(flightSearch));
        window.open('/flight/search', '_blank');

    } catch (err) {
        console.error(`showAllOffers: ${err.message}`);
    }
};

const selectApiOption = (element) => {
    try {
        // Determine schema ID based on return_date presence
        let schemaId = 291; // One-way default
        if (storedEntities.return_date) {
            schemaId = 290; // Round-trip
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
        console.error(`selectApiOption: ${err.message}, Line: ${err.lineNumber || 'unknown'}`);
    }
};

/**
 * Processes API response and displays it as a system message.
 * @param {string|Object} response - The API response (string or object with offers).
 */
const processResponse = (response) => {
    try {
        console.log("processResponse called with:", response);
        console.log(typeof response)

        if (typeof response === 'string') {
            addMessage(response, 'system');
            return;
        }

        let formattedResponse = response.text || response.message;

        if (response.status === 'complete') {
            const mainEl = document.querySelector('main.book-layout__main');
            const sessionId = mainEl?.dataset?.sessionid || '';
            const lid = parseInt(mainEl?.dataset?.lid) || null;

            if (response.intent === 'search_flight' && response.entities) {
                storedEntities = response.entities;
                const fullRequest = {
                    ...response.entities,
                    sessionId,
                    lid
                };

                // فقط اگر text وجود دارد و خالی نیست، آن را نمایش بده
                if (
                    formattedResponse &&
                    formattedResponse.trim() !== '' &&
                    formattedResponse.trim() !== '```'
                ) {
                    addMessage(formattedResponse, 'system');
                }

                // درخواست offers را ارسال کن
                $bc.setSource('offers.request', JSON.stringify(fullRequest));

                // loading indicator را شروع کن برای offers
                showLoading();
                handleLoadingResponse({});

                return; // از تابع خارج شو تا addMessage دوباره اجرا نشه
            }
        }

        if (response.rkey) {
            if (response.rkey.rkey) {
                document.cookie = `rkey=${response.rkey.rkey}; path=/; SameSite=Strict`;
                $bc.setSource('login.response', { rkey: response.rkey.rkey });
            }

            if (Array.isArray(response.rkey.users) && response.rkey.users.length > 0) {
                // لیست انتخابی کاربر بساز
                const userListHtml = response.rkey.users.map((user, index) => {
                    return `
                        <button 
                            class="user-select-btn bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 mb-2 rounded-lg transition-colors w-full text-right"
                            onclick="handleUserSelection('${user.userid}','${user.username}')">
                             ${user.username}
                        </button>
                    `;
                }).join('');

                // استفاده از response.text به جای پیام فارسی
                const mainText = formattedResponse || response.text || "Please choose your account.";

                const containerHtml = `
                    <div class="mb-3 text-gray-700">${mainText}</div>
                    <div class="user-selection-box">
                        <div class="flex flex-col gap-2">
                            ${userListHtml}
                        </div>
                    </div>
                `;

                addMessage(containerHtml, 'system');
                return; // اضافه کردن return برای جلوگیری از پیام دوباره
            }
        }

        // Check for offers in response - اینجا مشکل بود
        if (response.offers) {
            // حتماً loading رو متوقف کن قبل از نمایش offers
            hasReceivedApiResponse = true;
            removeLoadingIndicator();

            if (response.offers.length > 0) {
                formattedResponse = formatFlightsResponse(response);
                addMessage(formattedResponse, 'system');
                // 🚀 اضافه کردن smooth scroll برای نمایش تب‌ها
                setTimeout(() => {
                    const messagesContainer = document.getElementById('messages-container');
                    if (messagesContainer) {
                        // پیدا کردن آخرین پیام AI که حاوی flight offers است
                        const lastAiMessage = messagesContainer.querySelector('.ai__chat:last-of-type');
                        if (lastAiMessage) {
                            lastAiMessage.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start'
                            });
                        }
                    }
                }, 500); // تاخیر بیشتر
            } else {
                if (response.count !== undefined) {
                    const noOffersMessages = {
                        "1": "پروازی برای این مسیر یافت نشد.",
                        "2": "No flights found for this route.",
                        "3": "لم يتم العثور على رحلات لهذا المسار."
                    };

                    formattedResponse = noOffersMessages[LID] || noOffersMessages["2"];
                }

                addMessage(formattedResponse, 'system');
            }
            return; // از تابع خارج شو
        }

        // اگر هیچ offers نداشت، پیام معمولی رو نمایش بده
        if (formattedResponse && formattedResponse.trim() && !response.rkey?.users) {
            addMessage(formattedResponse, 'system');
        }

        if (response.status_code === 429) {
            const placeholderByLID = {
                "1": "دیگه تمومه...",
                "2": "It's over now...",
                "3": "انتهى الأمر..."
            };
            const input = document.querySelector("#message-input");
            input.placeholder = placeholderByLID[LID];
            input.disabled = true;
        }
    } catch (err) {
        console.error(`processResponse error:`, err);
        console.error(`Response received:`, response);

        // در صورت خطا، loading رو متوقف کن
        hasReceivedApiResponse = true;
        removeLoadingIndicator();

        addMessage("خطا در پردازش پاسخ", 'system');
    }
};

/**
 * Handles user selection and sends username as message
 * @param {string} userid - Selected user ID
 * @param {string} username - Selected username
 */
const handleUserSelection = (userid, username) => {
    try {
        // پیام کاربر که username انتخاب شده رو نشان می‌ده
        addMessage(username, 'user');

        // شروع loading
        showLoading();

        // Reset the API response flag for new request
        hasReceivedApiResponse = false;

        // ارسال درخواست برای login
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

/**
 * Shows a loading indicator in the messages container.
 */
const showLoading = () => {
    try {
        isLoading = true;
        const loadingEl = document.createElement('div');
        loadingEl.id = 'loading-indicator';
        loadingEl.className = 'message flex gap-4 max-w-4xl';
        loadingEl.innerHTML = `
            <div class="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-400 rounded-full flex items-center justify-center text-white text-xl shadow-lg">
                 <img src="/booking/images/chat-ai-icon.png" width="" height=""
                                alt="chat-ai-icon" class="mx-auto">
            </div>
            <div class="bg-white rounded-2xl rounded-br-md p-5 shadow-lg border border-gray-100">
                <div class="flex items-center gap-3">
                    <span class="text-gray-600 text-sm">در حال پردازش</span>
                    <div class="flex gap-1">
                        <div class="typing-dot w-2 h-2 bg-gray-400 rounded-full"></div>
                        <div class="typing-dot w-2 h-2 bg-gray-400 rounded-full"></div>
                        <div class="typing-dot w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                </div>
            </div>
        `;

        if (!messagesContainer) throw new Error("Messages container not found");
        messagesContainer.appendChild(loadingEl);
        scrollToBottom();
    } catch (err) {
        console.error(`showLoading: ${err.message}, Line: ${err.lineNumber || 'unknown'}`);
        isLoading = false;
    }
};

/**
 * Removes the loading indicator from the messages container.
 */
const removeLoadingIndicator = () => {
    try {
        isLoading = false;
        hasReceivedApiResponse = true; // متوقف کردن interval

        const loadingEl = document.getElementById('loading-indicator');
        if (loadingEl) {
            // پاک کردن interval اگر وجود دارد
            const intervalId = loadingEl.dataset.loadingIntervalId;
            if (intervalId) {
                clearInterval(parseInt(intervalId));
            }

            // حذف loading element
            loadingEl.remove();
        }
    } catch (err) {
        console.error(`removeLoadingIndicator: ${err.message}, Line: ${err.lineNumber || 'unknown'}`);
    }
};

/**
 * Adds a message to the chat interface.
 * @param {string} content - The message content (text or HTML).
 * @param {string} type - The message type ('user' or 'system').
 */
const addMessage = (content, type) => {
    try {
        if (typeof content !== 'string' || !content.trim()) {
            console.warn("addMessage: Empty or invalid content");
            return;
        }
        const messageEl = document.createElement('div');
        messageEl.className = `max-w-[80%] relative ${type === 'user'
            ? `self-start flex items-end user__chat${LID == 2 ? ` ltr` : ` rtl`}`
            : `self-end ai__chat${LID == 2 ? ` ltr` : ` rtl`}`
            }`;

        if (type === 'user') {
            const existingUserName = messagesContainer.querySelector('.user-name');
            if (existingUserName) {
                const clonedUserName = existingUserName.cloneNode(true);
                messageEl.appendChild(clonedUserName);
            }
        }

        // Add copy button and action buttons for system messages BEFORE content
        if (type === 'system') {
            const actionsWrapper = document.createElement('div');
            actionsWrapper.className = 'absolute mb-2 opacity-70 left-0';

            // Copy button with different labels based on LID
            const copyLabels = {
                "1": "📋", // Persian
                "2": "📋", // English
                "3": "📋", // Arabic
            };

            const copyButton = document.createElement('button');
            copyButton.className = 'action-btn p-2 hover:bg-gray-100 rounded-lg transition-colors';
            copyButton.innerHTML = copyLabels[LID] || "📋";
            copyButton.title = LID === "1" ? "کپی کردن" : LID === "3" ? "نسخ" : "Copy";
            copyButton.onclick = () => copyToClipboard(copyButton, content);

            actionsWrapper.appendChild(copyButton);
            messageEl.appendChild(actionsWrapper);
        }

        // Create message content wrapper AFTER action buttons
        const contentWrapper = document.createElement('div');
        contentWrapper.className = `p-3 pl-8 rounded-xl ${type === 'user'
            ? `bg-cyan-500 text-white rounded-br-sm `
            : `bg-gray-100 text-gray-800 rounded-bl-sm `
            }`;

        // Check if content is HTML or plain text
        if (content.trim().startsWith('<') && content.trim().endsWith('>')) {
            contentWrapper.innerHTML = content;
        } else {
            const formattedContent = content
                .replace(/\n{2,}/g, '<br>')  // چندتا \n پشت سر هم = یک <br>
                .replace(/\n/g, '<br>');     // باقی \n ها = <br>
            contentWrapper.innerHTML = formattedContent;
        }

        messageEl.appendChild(contentWrapper);

        if (!messagesContainer) throw new Error("Messages container not found");
        messagesContainer.appendChild(messageEl);

        // Scroll to bottom and remove loading indicator
        scrollToBottom();
        removeLoadingIndicator();
    } catch (err) {
        console.error(`addMessage: ${err.message}, Line: ${err.lineNumber || 'unknown'}`);
    }
};

/**
 * Sends a user message and triggers an API request.
 */
const sendMessage = () => {
    try {
        if (!messageInput) throw new Error("Message input not found");
        const messageText = messageInput.value.trim();
        if (!messageText || isLoading) return;

        // Reset the API response flag for new request
        hasReceivedApiResponse = false;

        // Add user message to the chat
        addMessage(messageText, 'user');

        // Clear input
        messageInput.value = '';

        // Show loading indicator
        showLoading();

        // Set request data to trigger API call
        $bc.setSource('flight.request', {
            text: messageText,
            dmnid: DMNID,
            sessionId: sessionId,
            run: true
        });
    } catch (err) {
        console.error(`sendMessage: ${err.message}, Line: ${err.lineNumber || 'unknown'}`);
        isLoading = false;
    }
};

// BasisCore Callback Handlers
/**
 * Handles API response from BasisCore and processes the flight data.
 * @param {Object} args - API response object containing the response data.
 */
const handleApiResponse = async (args) => {
    try {
        console.log("API response received", args);
        const response = args.response;
        const responseJson = await response.json();
        hasReceivedApiResponse = true;
        processResponse(responseJson);
    } catch (err) {
        console.error(`handleApiResponse: ${err.message}, Line: ${err.lineNumber || 'unknown'}`);
        addMessage("Error receiving API response", 'system'); // Fallback message
    }
};

/**
 * Updates the loading indicator with a message after a delay.
 * @param {Object} args - API request arguments.
 */
const handleLoadingResponse = (args) => {
    try {
        console.log("API request in progress", args);

        const messagesByLanguage = {
            "1": [
                "در حال جستجوی بهترین پیشنهادها...",
                "در حال بررسی صدها پرواز...",
                "در حال یافتن ارزان‌ترین قیمت‌ها...",
                "در حال بررسی سریع‌ترین مسیرها...",
                "در حال بارگذاری خطوط هوایی موجود...",
                "تقریباً آماده‌ایم، لطفاً صبر کنید..."
            ],
            "2": [
                "Looking for the best offers...",
                "Searching hundreds of flights...",
                "Securing the cheapest prices...",
                "Finding the fastest connections...",
                "Loading available airlines...",
                "Almost there, hang tight!"
            ],
            "3": [
                "جارٍ البحث عن أفضل العروض...",
                "جارٍ فحص مئات الرحلات...",
                "جارٍ تأمين أرخص الأسعار...",
                "جارٍ إيجاد أسرع الاتصالات...",
                "جارٍ تحميل شركات الطيران المتاحة...",
                "اقتربنا من الانتهاء، الرجاء الانتظار..."
            ]
        };

        const directionByLID = {
            "1": "rtl",
            "2": "ltr",
            "3": "rtl"
        };

        const textDirection = directionByLID[LID] || "ltr";
        const messages = messagesByLanguage[LID] || messagesByLanguage["2"];

        // مطمئن بشیم که hasReceivedApiResponse = false
        hasReceivedApiResponse = false;

        // شروع با پیام رندوم
        let currentIndex = Math.floor(Math.random() * messages.length);

        // تابع برای به‌روزرسانی پیام
        const updateLoadingMessage = () => {
            const loadingEl = document.getElementById('loading-indicator');
            if (!loadingEl) return false;

            loadingEl.innerHTML = `<div class="text-gray-500 text-sm ${textDirection}">${messages[currentIndex]}</div>`;
            return true;
        };

        // نمایش اولین پیام
        if (!updateLoadingMessage()) return;

        // شروع interval برای تغییر پیام‌ها
        const intervalId = setInterval(() => {
            // چک کنیم response دریافت شده یا نه
            if (hasReceivedApiResponse) {
                clearInterval(intervalId);
                return;
            }

            // چک کنیم loading element هنوز وجود دارد یا نه
            const loadingEl = document.getElementById('loading-indicator');
            if (!loadingEl) {
                clearInterval(intervalId);
                return;
            }

            // انتخاب پیام رندوم جدید (مختلف از قبلی)
            let newIndex;
            let attempts = 0;
            do {
                newIndex = Math.floor(Math.random() * messages.length);
                attempts++;
                if (attempts > 10) break; // جلوگیری از infinite loop
            } while (newIndex === currentIndex && messages.length > 1);

            currentIndex = newIndex;

            // به‌روزرسانی پیام
            updateLoadingMessage();

        }, 2000); // هر 2 ثانیه

        // ذخیره interval ID برای پاک کردن بعدی
        const loadingEl = document.getElementById('loading-indicator');
        if (loadingEl) {
            loadingEl.dataset.loadingIntervalId = intervalId;
        }

    } catch (err) {
        console.error(`handleLoadingResponse: ${err.message}, Line: ${err.lineNumber || 'unknown'}`);
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    try {
        document.cookie = "rkey=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        sessionStorage.removeItem('searchSession');
        sessionStorage.removeItem('sessionBook');
        sessionStorage.removeItem('sessionAmenities');
        // Validate DOM elements
        if (!messagesContainer) throw new Error("Messages container not found");
        if (!messageInput) throw new Error("Message input not found");
        if (!sendButton) throw new Error("Send button not found");

        // Add welcome message based on LID
        if (LID === "2") {
            addMessage("Hello! Welcome to the flight search system. Please search for your desired flight.", 'system');
        } else if (LID === "1") {
            addMessage("سلام! به سامانه جستجوی پرواز خوش آمدید. پرواز مورد نظر خود را جستجو کنید.", 'system');
        } else if (LID === "3") {
            addMessage("مرحبًا! مرحبًا بكم في نظام البحث عن الرحلات. الرجاء البحث عن الرحلة المطلوبة.", 'system');
        }

        // Add event listeners
        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // این خط مهم است!
                sendMessage();
            }
        });

        // Listen for BasisCore API responses
        document.addEventListener('basiscore:source:flight.response', (event) => {
            if (!isLoading) return;
            const response = event.detail.rows[0];
            if (!response || response.status !== 'complete') {
                removeLoadingIndicator();
            }
            processResponse(response);
        });
    } catch (err) {
        console.error(`DOMContentLoaded: ${err.message}, Line: ${err.lineNumber || 'unknown'}`);
    }
});

const handleUserSchema = async (args) => {
    try {
        const response = args.response;
        const responseJson = await response.json();

        if (!responseJson.errorMessage && responseJson.sources) {
            const properties = responseJson.sources[0].data[0].properties;

            let firstName = '';
            let lastName = '';

            properties?.forEach((e) => {
                if (e.prpId == 1) {
                    firstName = e.answers[0].parts[0].values[0].value || 'بدون نام';
                } else if (e.prpId == 2) {
                    lastName = e.answers[0].parts[0].values[0].value || '';
                }
            });

            const fullName = `${firstName} ${lastName}`.trim() || 'بدون نام';

            const userChatElements = document.querySelectorAll('.user__chat');

            userChatElements.forEach(element => {
                if (!element.querySelector('.user-name')) {
                    const span = document.createElement('span');
                    span.className = 'user-name bg-gray-500 text-white p-2 rounded-xl ml-2 text-xs';
                    span.textContent = fullName;
                    console.log(LID)
                    switch (parseInt(LID)) {
                        case 2:
                            element.appendChild(span);
                            break;
                        case 1:
                        case 3:
                        default:
                            element.insertBefore(span, element.firstChild);
                    }
                }
            });
        }
    } catch (err) {
        console.error(`handleUserSchema: ${err.message}, Line: ${err.lineNumber || 'unknown'}`);
    }
};

/**
 * Copies text to clipboard with visual feedback
 * @param {HTMLElement} button - The copy button element
 * @param {string} text - Text to copy
 */
const copyToClipboard = async (button, text) => {
    try {
        // Extract plain text from HTML content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = text;
        const plainText = tempDiv.textContent || tempDiv.innerText || '';

        await navigator.clipboard.writeText(plainText);

        // Visual feedback
        const originalIcon = button.innerHTML;
        const copiedMessages = {
            "1": "✅", // Persian
            "2": "✅", // English
            "3": "✅", // Arabic
        };

        button.innerHTML = copiedMessages[LID] || "✅";
        button.classList.add('bg-green-100');

        setTimeout(() => {
            button.innerHTML = originalIcon;
            button.classList.remove('bg-green-100');
        }, 2000);

    } catch (err) {
        console.error('Failed to copy text: ', err);

        // Fallback visual feedback for error
        const originalIcon = button.innerHTML;
        button.innerHTML = "❌";
        button.classList.add('bg-red-100');

        setTimeout(() => {
            button.innerHTML = originalIcon;
            button.classList.remove('bg-red-100');
        }, 2000);
    }
};
