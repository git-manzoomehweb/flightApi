
/**
* Renders detailed route information for a flight group, including airline, baggage, and flight details.
* @param {Object} element - The flight group data containing FlightGroup and Baggages.
* @returns {Promise<string>} HTML string representing detailed route information.
*/
const renderRoutesInfoMob = async (element) => {
    try {
        /**
         * Renders airline information with an icon, label, and value.
         * @param {string} icon - The icon identifier for the SVG sprite.
         * @param {string} label - The label for the airline information.
         * @param {string} value - The value to display.
         * @returns {string} HTML string for airline information or empty string if value is invalid.
         */
        const renderAirlineInfo = (icon, label, value) => {
            if (value && value !== "") {
                return `
                  <div class="book-text-sm">
                      <div class="book-w-8 book-h-8 book-bg-primary-50 book-flex book-items-center book-justify-center book-rounded">
                           <svg width="25" height="24" class="book-fill-primary-400">
                              <use href="/booking/images/sprite-booking-icons.svg#${icon}"></use>
                          </svg>
                      </div>
                      <div>
                          <p class="book-text-zinc-500 book-my-1">${label}:</p>
                          <p class="book-text-zinc-900">${value}</p>
                      </div>
                  </div>`;
            }
            return "";
        };

        /**
         * Renders HTML for a single route with flight details and optional title for first route in group.
         * @param {Object} item - Route information.
         * @param {Object} baggage - Baggage information for the route.
         * @param {number} baggageIndex - Index for accessing baggage array.
         * @param {number} routeIndex - Index of the route within the group.
         * @param {boolean} isFirstInGroup - Whether this is the first route in the group.
         * @param {number} groupIndex - Index of the flight group.
         * @returns {Promise<string>} HTML string for the route.
         */
        const routeHtml = async (item, baggage, baggageIndex, routeIndex, isFirstInGroup, groupIndex) => {
            let titleDiv = "";
            if (isFirstInGroup && routeIndex === 0) {
                if (schemaId === 290) {
                    titleDiv = `
            <div class="book-route__title book-text-lg book-font-bold book-mb-4">
                ${groupIndex === 0 ? translate("outbound_flight") : translate("return_flight")}
            </div>`;
                } else if (schemaId === 292) {
                    const routeNames = [translate("first_route"), translate("second_route"), translate("third_route"), translate("fourth_route")];
                    const name = routeNames[groupIndex];
                    titleDiv = `
            <div class="book-route__title book-text-lg book-font-bold book-mb-4">
                ${name}
            </div>`;
                }
            }

            return `
          <div class="book-route__info">
              ${titleDiv}
              <div class="book-mb-2">
                  <div class="book-flex book-items-stretch">
                      <div class="book-flight__details__progress__line book-bg-zinc-300 ${isRTL ? 'book-ml-4 book-mr-2 ' : 'book-mr-4 book-ml-2 '} book-relative">
                          <svg width="26" height="40" class="book-fill-primary-400 book-absolute book--right-3 book-top-1.2 book--translate-y-1.2 book-z-10">
                              <use href="/booking/images/sprite-booking-icons.svg#path-icon"></use>
                          </svg>
                      </div>
                      <div class="book-flex book-flex-col book-px-3 book-items-stretch book-w-full">
                          <div class="book-border-b book-border-zinc-300 book-mb-3 book-pb-4">
                              <h5 class="book-text-xm book-font-bold book-text-zinc-900">${item.OriginAirport}</h5>
                              <h5 class="book-text-xm book-font-bold book-text-zinc-900 book-my-1">${item.DepartureTime}</h5>
                              <p class="book-text-zinc-500 book-text-sm">${await renderFormatDate(item.DepartureDate)}</p>
                               ${currentLanguage === 'fa' ? `
                                <p class="book-text-zinc-500 book-text-sm book-mt-1">${item.DepartureDate}</p>
                              ` : ''}
                          </div>
                          <div>
                              <h6 class="book-text-sm book-text-zinc-900">${await renderAirport(item.OriginAirport)}</h6>
                              <p class="book-text-zinc-600 book-text-sm book-my-2">
                                  ${await renderCity(item.OriginAirport)}, ${await renderCountry(item.OriginAirport)}
                              </p>
                              <div class="book-flex book-text-sm book-items-center book-gap-2">
                                  <div>
                                      ${await renderAirlineLogo(item.AirlineCode, '5', '50', '20')}
                                  </div>
                                  <span class="book-text-zinc-900 book-text-sm">
                                      ${await renderAirlineName(item.AirlineCode)} ${item.FlightNumber}
                                  </span>
                              </div>
                              ${await renderOperatingAirlineCode(item)}
                          </div>
                          <div class="book-text-sm book-text-primary-400 book-my-3">
                              ${translate("flight_duration")}<span class="${isRTL ? 'book-mr-1' : 'book-ml-1'}">${await renderFormatterDuration(item.Duration)}</span>
                          </div>
                          <div class="book-flex book-gap-5 book-my-3">
                                ${renderAirlineInfo("class-details-icon", translate("ticket_class"), `${await renderFlightClass(item.Class)}`)}
                                ${renderAirlineInfo("wheel-bag-details-icon", translate("allowed_baggage"), await renderBaggages(baggage))}
                                ${renderAirlineInfo("ticket-details-icon", translate("fare_class"), item.ClassCode)}
                                ${renderAirlineInfo("plane-details-icon", translate("aircraft_type"), item.AirCraft)}
                          </div>
                          <div class="book-border-b book-border-zinc-300 book-my-3 book-pb-4">
                              <h6 class="book-text-sm book-text-zinc-900">${await renderAirport(item.DestinationAirport)}</h6>
                              <p class="book-text-zinc-600 book-text-sm book-my-2">
                                  ${await renderCity(item.DestinationAirport)}, ${await renderCountry(item.DestinationAirport)}
                              </p>
                          </div>
                          <div>
                              <h5 class="book-text-xm book-font-bold book-text-zinc-900">${item.DestinationAirport}</h5>
                              <h5 class="book-text-xm book-font-bold book-text-zinc-900 book-my-1">${item.ArrivalTime}</h5>
                              <p class="book-text-zinc-500 book-text-sm">${await renderFormatDate(item.ArrivalDate)}</p>
                                ${currentLanguage === 'fa' ? `
                                <p class="book-text-zinc-500 book-text-sm book-mt-1">${item.ArrivalDate}</p>
                              ` : ''}
                          </div>
                      </div>
                  </div>
              </div>
              ${await renderConnectionTime(item.ConnectionTime)}
          </div>`;
        };

        let output = "";
        for (let groupIndex = 0; groupIndex < (element.FlightGroup || []).length; groupIndex++) {
            const flightGroup = element.FlightGroup[groupIndex];

            const routeHtmls = await Promise.all(
                (flightGroup.RoutesInfo || []).map((item, routeIndex) =>
                    routeHtml(item, element.Baggages?.[item.SegmentId - 1], item.SegmentId - 1, routeIndex, true, groupIndex)
                )
            );

            output += routeHtmls.join('');
        }

        return output;
    } catch (error) {
        console.error(`renderRoutesInfoMob: ${error.message}`);
        return "";
    }
};

const renderRoutesInfoPc = async (element) => {
    try {
        const renderAirlineInfo = (icon, labelKey, value) => {
            try {
                if (value && value !== "") {
                    return `
                        <div class="">
                            <div class="book-w-10 book-h-10 book-bg-primary-50 book-flex book-items-center book-justify-center book-rounded book-ml-2">
                                <svg width="25" height="24" class="book-fill-primary-400">
                                    <use href="/booking/images/sprite-booking-icons.svg#${icon}"></use>
                                </svg>
                            </div>
                            <div>
                                <p class="book-text-zinc-500 book-my-2">${translate(labelKey)}:</p>
                                <p class="book-text-zinc-900">${value}</p>
                            </div>
                        </div>`;
                }
                return "";
            } catch (error) {
                console.error("renderAirlineInfo: " + error.message);
                return "";
            }
        };

        const routeHtml = async (item, baggage, baggageIndex, routeIndex, isFirstInGroup, groupIndex) => {
            let titleDiv = "";

            if (isFirstInGroup && routeIndex === 0) {

                if (schemaId === 290) {

                    const titleKey = groupIndex === 0 ? "flight_outbound" : "flight_inbound";
                    titleDiv = `
                        <div class="book-route__title book-text-lg book-font-bold book-mb-4">
                            ${translate(titleKey)}
                        </div>`;
                } else if (schemaId === 292) {
                    const routeKeys = ["route_1", "route_2", "route_3", "route_4"];
                    const routeKey = routeKeys[groupIndex] || null;
                    const name = routeKey ? translate(routeKey) : `Route ${groupIndex + 1}`;
                    titleDiv = `
                        <div class="book-route__title book-text-lg book-font-bold book-mb-4">
                            ${name}
                        </div>`;
                }
            }

            return `
                <div class="book-route__info">
                    ${titleDiv}
                    <div class="book-flex book-mb-4">
                        <div class="book-flex">
                            <div class="book-flight__details__progress__line book-m-3 book-relative">
                                <svg width="26" height="40" class="book-fill-primary-400 book-absolute book--right-3 book-z-10">
                                    <use href="/booking/images/sprite-booking-icons.svg#path-icon"></use>
                                </svg>
                                <svg width="26" height="40" class="book-fill-primary-400 book-absolute book--right-3 book--bottom-3 book-z-10">
                                    <use href="/booking/images/sprite-booking-icons.svg#tag-details-icon"></use>
                                </svg>
                            </div>
                            <div class="book-flex book-flex-col book-gap-4 ${isRTL ? 'book-border-l book-ml-3 ' : 'book-border-r book-mr-3 '} book-items-center book-justify-between book-border-zinc-300 book-px-2">
                                <div>
                                    <h5 class="book-text-xl book-font-bold book-text-zinc-900">${item.OriginAirport}</h5>
                                    <h5 class="book-text-xl book-font-bold book-text-zinc-900 book-my-2">${item.DepartureTime}</h5>
                                    <p class="book-text-zinc-500 book-text-sm">${await renderFormatDate(item.DepartureDate)}</p>
                                     ${currentLanguage === 'fa' ? `
                                <p class="book-text-zinc-500 book-text-sm book-mt-1">${item.DepartureDate}</p>
                              ` : ''}
                                </div>
                                <div class="book-text-sm book-text-primary-400  book-w-40">
                                     ${translate("flight_duration")}<span class="${isRTL ? 'book-mr-1' : 'book-ml-1'}">${await renderFormatterDuration(item.Duration)}</span>
                                </div>
                                <div>
                                    <h5 class="book-text-xl book-font-bold book-text-zinc-900">${item.DestinationAirport}</h5>
                                    <h5 class="book-text-xl book-font-bold book-text-zinc-900 book-my-2">${item.ArrivalTime}</h5>
                                    <p class="book-text-zinc-500 book-text-sm">${await renderFormatDate(item.ArrivalDate)}</p>
                                       ${currentLanguage === 'fa' ? `
                                <p class="book-text-zinc-500 book-text-sm book-mt-1">${item.ArrivalDate}</p>
                              ` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="book-flex">
                            <div class="book-flex book-flex-col">
                                <div>
                                    <h6 class="book-text-lg book-text-zinc-900">${await renderAirport(item.OriginAirport)}</h6>
                                    <p class="book-text-zinc-600 book-text-sm book-my-2">
                                        ${await renderCity(item.OriginAirport)}, ${await renderCountry(item.OriginAirport)}
                                    </p>
                                    <div class="book-flex book-items-center book-gap-2">
                                        <div class="">
                                            ${await renderAirlineLogo(item.AirlineCode, '5', '50', '20')}
                                        </div>
                                        <span class="book-text-zinc-900 book-text-sm">
                                            ${await renderAirlineName(item.AirlineCode)} ${item.FlightNumber}
                                        </span>
                                    </div>
                                    ${await renderOperatingAirlineCode(item)}
                                </div>
                                <div class="book-text-sm book-my-5">
                                    <div class="book-grid book-grid-cols-2 book-gap-2">
                                        ${renderAirlineInfo("class-details-icon", "ticket_class", `${await renderFlightClass(item.Class)}`)}
                                        ${renderAirlineInfo("wheel-bag-details-icon", "baggage_allowance", await renderBaggages(baggage))}
                                        ${renderAirlineInfo("ticket-details-icon", "fare_class", item.ClassCode)}
                                        ${renderAirlineInfo("plane-details-icon", "aircraft_type", item.AirCraft)}
                                    </div>
                                </div>
                                <div>
                                    <h6 class="book-text-lg book-text-zinc-900">${await renderAirport(item.DestinationAirport)}</h6>
                                    <p class="book-text-zinc-600 book-text-sm book-my-2">
                                        ${await renderCity(item.DestinationAirport)}, ${await renderCountry(item.DestinationAirport)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    ${await renderConnectionTimeRoute(item)}
                </div>`;
        };

        let output = "";
        for (let groupIndex = 0; groupIndex < (element.FlightGroup || []).length; groupIndex++) {
            const flightGroup = element.FlightGroup[groupIndex];
            const routeHtmls = await Promise.all(
                (flightGroup.RoutesInfo || []).map((item, routeIndex) =>
                    routeHtml(item, element.Baggages?.[item.SegmentId - 1], item.SegmentId - 1, routeIndex, true, groupIndex)
                )
            );
            output += routeHtmls.join('');
        }

        return output;
    } catch (error) {
        console.error("renderRoutesInfoPc: " + error.message);
        return "";
    }
};
/**
 * Renders connection time for a route stop in translated format.
 * @param {Object} element - Route data containing ConnectionTime and DestinationAirport.
 * @returns {Promise<string>} HTML string representing connection time or empty string if invalid.
 */

const renderConnectionTimeRoute = async (element) => {
    try {
        if (element?.ConnectionTime > 0) {
            const hours = Math.floor(element.ConnectionTime / 60);
            const minutes = element.ConnectionTime % 60;

            return `<div class="book-my-10 book-flex book-text-zinc-800 book-text-sm book-justify-between book-bg-zinc-100 book-rounded-xl book-p-3">
              <div class="book-flex book-gap-1">
                  <svg width="15" height="16">
                      <use href="/booking/images/sprite-booking-icons.svg#hourglass-icon"></use>
                  </svg>
                  <span>${translate("connection_time")}: ${hours} ${translate("hour")} ${translate("and")} ${minutes} ${translate("minute")}</span>
              </div>
              <div>
                  (${element.DestinationAirport})
                  ${await renderAirport(element.DestinationAirport)}
              </div>
          </div>`;
        }
        return "";
    } catch (error) {
        console.error(`renderConnectionTimeRoute: ${error.message}`);
        return "";
    }
};
/**
 * Formats a date to Persian (Shamsi) format with weekday, day, and month.
 * @param {string} element - The date string to format.
 * @returns {string} Formatted Persian date or empty string on error.
 */

const renderFormatDate = async (element) => {
    try {
        // Parse date as local timezone
        const [year, month, day] = element.split('-').map(Number);
        const gregorianDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));// month is 0-indexed

        let formatter;
        if (currentLanguage === 'fa') {
            formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                timeZone: 'UTC'
            });
        } else if (currentLanguage === 'ar') {
            formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                timeZone: 'UTC'
            });
        } else {
            formatter = new Intl.DateTimeFormat('en-US', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                timeZone: 'UTC'
            });
        }
        return formatter.format(gregorianDate);
    } catch (error) {
        console.error(`renderFormatDate: ${error.message}`);
        return "";
    }
};

/**
 * Renders the country name for a given location code.
 * @param {string} element - Location code.
 * @returns {string} Country name or empty string on error.
 */
const renderCountry = async (element) => {
    try {
        const mergedLocation = dictionaries.reduce((acc, item) => ({ ...acc, ...item.location }), {});
        return mergedLocation[element]?.country || "";
    } catch (error) {
        console.error("renderCountry: " + error.message);
        return "";
    }
};

/**
 * Renders an airline logo image.
 * @param {string} element - Airline code.
 * @param {string} heightClass - CSS class for image height.
 * @param {string} width - Image width.
 * @param {string} height - Image height.
 * @param {Object} [item] - Optional route data for multi-airline check.
 * @returns {string} HTML string for airline logo or empty string on error.
 */

const renderAirlineLogo = async (element, heightClass, width, height, item) => {
    try {
        const mergedCarriers = dictionaries.reduce((acc, item) => ({ ...acc, ...item.carriers }), {});
        const carrier = mergedCarriers[element] || { image: "", name: "" };
        const imgTag = `<img class="book-route__airline book-mx-auto book-h-${heightClass}" src="/${carrier.image}" width="${width}" height="${height}" alt="${carrier.name}"/>`;

        if (item?.RoutesInfo?.length > 1) {
            const codes = item.RoutesInfo.map(route => route.AirlineCode);
            const uniqueCodes = [...new Set(codes)];
            if (uniqueCodes.length > 1) {
                return `<div class="book-multi__airlines">${imgTag}</div>`;
            }
            return imgTag;
        }
        return imgTag;
    } catch (error) {
        console.error("renderAirlineLogo: " + error.message);
        return "";
    }
};

/**
 * Renders codeshare indicator for operating airline.
 * @param {Object} element - Route data containing airline codes.
 * @returns {string} HTML string for codeshare info or empty string.
 */
const renderOperatingAirlineCode = async (element) => {
    try {
        if (element.OperatingAirlineCode) {
            if (element.OperatingAirlineCode !== element.AirlineCode) {
                return `
                    <div class="book-text-zinc-600 book-text-sm book-my-2 book-mx-3">
                        <span class="book-mr-1">Operated By</span>
                        <span class="book-mr-1">${element.OperatingAirlineCode}</span><span>(${await renderAirlineName(element.OperatingAirlineCode)})</span>
                    </div>
                `;
            }
        }
        return "";
    } catch (error) {
        console.error("renderOperatingAirlineCode: " + error.message);
        return "";
    }
};

/**
 * Renders the flight class in Persian.
 * @param {string} element - Flight class code.
 * @returns {string} Persian flight class name or default "economy" on error.
 */
const renderFlightClass = async (element) => {
    try {
        const key = element.toLowerCase();
        const classKeys = {
            economy: "flight_class_economy",
            businessclass: "flight_class_business",
            firstclass: "flight_class_first"
        };

        const translationKey = classKeys[key] || "flight_class_first";
        return translate(translationKey);
    } catch (error) {
        console.error("renderFlightClass: " + error.message);
        return "";
    }
};


/**
 * Renders airline logo based on airline code.
 * @param {string} element - Airline code.
 * @returns {string} HTML string of airline logo or empty string on error.
 */
const renderAirlineCode = async (element) => {
    try {
        const mergedCarriers = dictionaries.reduce((acc, item) => ({ ...acc, ...item.carriers }), {});
        return `<img src="/${mergedCarriers[element].image}" width="70" height="28" alt="${mergedCarriers[element].name}"/>`;
    } catch (error) {
        console.error("renderAirlineCode: " + error.message);
        return "";
    }
};

/**
 * Renders the airline name for a given airline code.
 * @param {string} element - Airline code.
 * @returns {string} Airline name or empty string on error.
 */
const renderAirlineName = async (element) => {
    try {
        const mergedCarriers = dictionaries.reduce((acc, item) => ({ ...acc, ...item.carriers }), {});
        return mergedCarriers[element]?.name || "";
    } catch (error) {
        console.error("renderAirlineName: " + error.message);
        return "";
    }
};

/**
 * Renders baggage information.
 * @param {Object} element - Baggage data.
 * @param {string} [style] - Optional CSS style for baggage info.
 * @returns {string} HTML string for baggage info or empty string on error.
 */
const renderBaggages = async (element, style) => {
    try {
        if (!element) return "";
        if (Number(element?.Baggage) === 0) {
            return `<span class="book-baggage__info ${style ? 'book-font-bold' : ''}">${translate("no_baggage_allowed")}</span>`;
        };
        const marginLeftClass = isRTL ? 'book-ml-1' : 'book-mr-1';
        const baggageHTML = `
    <span class="book-baggage__info ${style ? 'book-relative book-top-[2px] book-font-bold' : ''}">
        ${element.Baggage}
        <span class="${marginLeftClass}">${element.Unit || ""}</span>
    </span>`;
        return baggageHTML.trim();
    } catch (error) {
        console.error("renderBaggages: " + error.message);
        return "";
    }
};


/**
 * Renders connection time for a route stop.
 * @param {Object} element - Route data with connection time.
 * @returns {string} HTML string for connection time or empty string.
 */
const renderConnectionTime = async (element) => {
    try {
        if (element > 0) {
            const hours = Math.floor(element / 60);
            const minutes = element % 60;
            const marginRightClass = isRTL ? 'book-mr-1' : 'book-ml-1';

            return `<div class="book-text-xs book-text-zinc-600 ${isMobile ? 'book-mb-2' : 'book-mt-2'} book-flex book-items-center">
              <svg width="15" height="15" class="${isMobile ? '' : 'book-mx-auto'}">
                  <use href="/booking/images/sprite-booking-icons.svg#time-circle-icon"></use>
              </svg>
              <span class="${marginRightClass} book-relative book-top-[2px]">${hours}:${minutes}</span>
          </div>`;
        }
        return "";
    } catch (error) {
        console.error(`renderConnectionTime: ${error.message}`);
        return "";
    }
};


/**
 * Renders the city name for a given location code.
 * @param {string} element - Location code.
 * @returns {string} City name or empty string on error.
 */
const renderCity = async (element) => {
    try {
        const mergedLocation = dictionaries.reduce((acc, item) => ({ ...acc, ...item.location }), {});
        return mergedLocation[element]?.city || "";
    } catch (error) {
        console.error("renderCity: " + error.message);
        return "";
    }
};

/**
 * Renders airport name based on airport code.
 * @param {string} element - Airport code.
 * @returns {string} Airport name or empty string on error.
 */
const renderAirport = async (element) => {
    try {
        const mergedLocation = dictionaries.reduce((acc, item) => ({ ...acc, ...item.location }), {});
        return mergedLocation[element].airport;
    } catch (error) {
        console.error("renderAirport: " + error.message);
        return "";
    }
};
/**
 * Renders the flight search UI based on stored flight group data.
 * Updates cabin class, flight type, passenger summary, and trip details in the UI.
 */
const renderResearch = async () => {
    try {
        // Validate sessionStorage data
        if (!sessionSearchStorage || !sessionSearchStorage.SchemaId) {
            throw new Error("Missing SchemaId in sessionSearchStorage");
        }
        if (!sessionBookStorage || !sessionBookStorage.FlightGroup || !sessionBookStorage.PriceInfo) {
            throw new Error("Invalid or missing data in sessionBookStorage");
        }



        // Update cabin class display
        const cabinClass = document.querySelector(".book-cabinClass__searched__content");
        if (!cabinClass) {
            throw new Error("Cabin class element not found");
        }

        const cabinMap = {
            Economy: { text: translate("economy_class"), class: "Economy" },
            BusinessClass: { text: translate("business_class"), class: "BusinessClass" },
            FirstClass: { text: translate("first_class"), class: "FirstClass" }
        };
        const flightClass = sessionBookStorage.FlightGroup[0].Class;
        const cabin = cabinMap[flightClass] || { text: "اکونومی", class: "Economy" }; // Fallback to Economy
        cabinClass.textContent = cabin.text;
        cabinClass.dataset.class = cabin.class;

        // Update flight type selection
        const flightTypes = document.querySelectorAll('.book-module__type li');
        if (flightTypes.length < 3) {
            throw new Error("Flight type elements not found or insufficient");
        }
        flightTypes.forEach(item => item.classList.remove('book-active__module__type'));
        const typeIndex = { 291: 0, 290: 1, 292: 2 }[schemaId];
        if (flightTypes[typeIndex]) {
            flightTypes[typeIndex].classList.add('book-active__module__type');
        } else {
            console.warn(`Invalid schemaId: ${schemaId}, defaulting to first flight type`);
            flightTypes[0].classList.add('book-active__module__type');
        }

        // Update passenger summary
        const passengerItems = document.querySelectorAll('.book-passenger__searched__items li');
        const passengerCountInput = document.querySelector('.book-passenger__count');
        if (passengerItems.length < 3 || !passengerCountInput) {
            throw new Error("Passenger items or count input not found");
        }

        const passengerFare = sessionBookStorage.PriceInfo.PassengerFare;
        const passengerParts = [];
        if (passengerFare[0].Count > 0) passengerParts.push(`${passengerFare[0].Count} ${translate("passenger_adult")}`);
        if (passengerFare[1].Count > 0) passengerParts.push(`${passengerFare[1].Count} ${translate("passenger_child")}`);
        if (passengerFare[2].Count > 0) passengerParts.push(`${passengerFare[2].Count} ${translate("passenger_infant")}`);
        const passengerSummary = passengerParts.join(' / ') || `1 ${translate("passenger_adult")}`;

        passengerCountInput.value = passengerSummary;

        passengerItems[0].querySelector(".book-passenger__count__value").innerHTML = passengerFare[0].Count || 0;
        passengerItems[1].querySelector(".book-passenger__count__value").innerHTML = passengerFare[1].Count || 0;
        passengerItems[2].querySelector(".book-passenger__count__value").innerHTML = passengerFare[2].Count || 0;

        // Update passenger UI for single adult case
        if (passengerFare[0].Count === 1 && passengerFare[1].Count === 0 && passengerFare[2].Count === 0) {
            updateBookPassengerUI(); // Assumed to be defined elsewhere
        }

        // Update trip details
        if (sessionBookStorage.FlightGroup.length === 0) {
            throw new Error("No flight group data available");
        }

        const departureLocationName = document.querySelector(".departure__location__name");
        const arrivalLocationName = document.querySelector(".arrival__location__name");
        const departureDate = document.querySelector(".departure__date");
        const arrivalDate = document.querySelector(".arrival__date");
        const arrivalDateContainer = document.querySelector(".arrival__date__container");
        if (!departureLocationName || !arrivalLocationName || !departureDate || !arrivalDate || !arrivalDateContainer) {
            throw new Error("Trip detail elements not found");
        }

        const flightGroup = sessionBookStorage.FlightGroup;
        const lastIndex = flightGroup.length - 1;

        if (schemaId === 291) {
            // One-way trip
            departureLocationName.value = await renderCity(flightGroup[0].Origin) || "";
            arrivalLocationName.value = await renderCity(flightGroup[0].Destination) || "";
            departureLocationName.dataset.id = flightGroup[0].Origin;
            arrivalLocationName.dataset.id = flightGroup[0].Destination;
            departureDate.value = convertToSearchedDate(flightGroup[0].DepartureDate) || "";
            departureDate.dataset.gregorian = flightGroup[0].DepartureDate || "";
        } else if (schemaId === 290) {
            // Round-trip
            departureLocationName.value = await renderCity(flightGroup[0].Origin) || "";
            arrivalLocationName.value = await renderCity(flightGroup[lastIndex].Origin) || "";
            departureLocationName.dataset.id = flightGroup[0].Origin;
            arrivalLocationName.dataset.id = flightGroup[lastIndex].Origin;
            departureDate.value = convertToSearchedDate(flightGroup[0].DepartureDate) || "";
            departureDate.dataset.gregorian = flightGroup[0].DepartureDate || "";
            arrivalDate.value = convertToSearchedDate(flightGroup[lastIndex].ArrivalDate) || "";
            arrivalDate.dataset.gregorian = flightGroup[lastIndex].ArrivalDate || "";
            arrivalDateContainer.classList.remove("disabled__date__container");
            arrivalDate.removeAttribute("disabled");
        } else {
            // Multi-city trip
            const container = document.querySelector("#route__template");
            if (!container) {
                throw new Error("Route template container not found");
            }
            const templateHTML = container.innerHTML;
            container.innerHTML = "";

            for (let index = 0; index < flightGroup.length; index++) {
                const trip = flightGroup[index];
                const tripClone = document.createElement("div");
                tripClone.innerHTML = templateHTML.trim();
                const tripElement = tripClone.firstElementChild;

                // Add trip name
                const tripNameDiv = document.createElement("div");
                tripNameDiv.classList.add("route__name", "book-text-sm", "book-mb-1");
                tripNameDiv.textContent = `${translate("route")} ${tripNames[index] || (index + 1)}`;
                // Fallback to index
                tripElement.insertAdjacentElement("afterbegin", tripNameDiv);

                // Update trip details
                const depInput = tripElement.querySelector(".departure__location__name");
                const arrInput = tripElement.querySelector(".arrival__location__name");
                const depDate = tripElement.querySelector(".departure__date");
                const arrDateContainer = tripElement.querySelector(".arrival__date__container");
                if (!depInput || !arrInput || !depDate || !arrDateContainer) {
                    throw new Error("Trip element inputs not found");
                }

                depInput.value = await renderCity(trip.Origin) || "";
                arrInput.value = await renderCity(trip.Destination) || "";
                depInput.dataset.id = trip.Origin;
                arrInput.dataset.id = trip.Destination;
                depDate.value = convertToSearchedDate(trip.DepartureDate) || "";
                depDate.dataset.gregorian = trip.DepartureDate || "";
                arrDateContainer.classList.add("book-hidden");

                // Add delete button for trips 3 and 4
                if (index === 2 || index === 3) {
                    const deleteButton = document.createElement("button");
                    deleteButton.textContent = translate("delete");
                    deleteButton.type = "button";
                    deleteButton.classList.add("route__delete", "book-bg-red-500", "book-text-sm", "book-text-white", "book-px-2", "book-py-1", "book-rounded", "book-left-5", "book-top-0", "book-absolute");
                    deleteButton.onclick = () => deleteRoute(deleteButton); // Assumed to be defined elsewhere
                    tripElement.appendChild(deleteButton);
                }

                container.appendChild(tripElement);
            }

            // Update container styling for multi-city trips
            container.classList.remove("book-w-3/5");
            container.classList.add("book-grid", "book-grid-cols-2", "book-gap-4");
            container.querySelectorAll(".book-min-w-48").forEach(e => e.classList.remove("book-min-w-48"));
            container.querySelectorAll(".departure__date__container").forEach(e => e.classList.add("book-w-11/12"));
            const addRouteContainer = document.querySelector(".book__add__roue__container");
            if (addRouteContainer) {
                addRouteContainer.classList.remove("book-hidden");
            }
        }
    } catch (error) {
        console.error("renderResearch: " + error.message);
    }
};

/**
* Converts a Gregorian date to a Persian (Shamsi) date string.
*/
const convertToSearchedDate = (element) => {
    try {

        const [year, month, day] = element.split('-').map(Number);
        const gregorianDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

        // Check currentLanguage and format accordingly
        if (currentLanguage === 'fa') {
            // Persian calendar for Farsi
            const formatter = new Intl.DateTimeFormat('fa-IR', {
                calendar: 'persian',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: 'UTC'
            });
            return formatter.format(gregorianDate);
        }
        else if (currentLanguage === 'en') {
            // Gregorian calendar for English
            const formatter = new Intl.DateTimeFormat('en-US', {
                calendar: 'gregory',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: 'UTC'
            });
            return formatter.format(gregorianDate);
        }
        else if (currentLanguage === 'ar') {
            // Hijri (Islamic) calendar for Arabic
            const formatter = new Intl.DateTimeFormat('ar-SA', {
                calendar: 'islamic',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: 'UTC'
            });
            return formatter.format(gregorianDate);
        }
        else {
            // Default to Gregorian if language not recognized
            const formatter = new Intl.DateTimeFormat('en-US', {
                calendar: 'gregory',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: 'UTC'
            });
            return formatter.format(gregorianDate);
        }
    } catch (error) {
        console.error("convertToSearchedDate: " + error.message);
        return "";
    }
};

/**
 * Processes Safarmarket flight API response, updates sessionStorage, and displays warning modal if needed.
 * @param {Object} args - API response object containing status and data.
 */
const onProcessedFlightSafarmarket = async (args) => {
    try {
        // Trigger research API call
        $bc.setSource("cms.session", true);

        const response = args.response;
        if (response.status !== 200) {
            throw new Error(`Unexpected response status: ${response.status}`);
        }

        const responseJson = await response.json();
        if (!responseJson) {
            throw new Error("Invalid response JSON or missing SessionId");
        }

        // Save flight data to sessionStorage
        sessionStorage.setItem("sessionBook", JSON.stringify(responseJson));

        // Update global variable
        sessionBookStorage = responseJson;

        // Initialize or update sessionSearch in sessionStorage
        sessionStorage.setItem("sessionSearch", JSON.stringify({}));
        sessionSearchStorage = sessionStorage.getItem("sessionSearch")
            ? JSON.parse(sessionStorage.getItem("sessionSearch"))
            : {};

        // Set schemaId based on FlightGroup length
        if (Array.isArray(responseJson.FlightGroup)) {
            const flightGroupCount = responseJson.FlightGroup.length;
            if (flightGroupCount === 1) {
                sessionSearchStorage.SchemaId = 291;
                sessionSearchStorage.Type = "flight";
            } else if (flightGroupCount === 2) {
                sessionSearchStorage.SchemaId = 290;
                sessionSearchStorage.Type = "flight";
            }
            // Initialize selectedMode 
            selectedMode = "flight";

            // Update sessionSearch in sessionStorage
            sessionStorage.setItem("sessionSearch", JSON.stringify(sessionSearchStorage));
        }

        // Show modal if message exists
        if (responseJson.message && responseJson.message.description) {
            console.log('Warning message received:', responseJson.message.description);
            const modalHtml = `
                <div class="book-warning__message__modal__container book-modal__container book-fixed book-top-0 book-left-0 book-w-screen book-h-screen book-overflow-hidden book-z-50">
                    <div class="book-modal__content book-bg-white book-fixed book-inset-x-0 book-top-1.2 book-w-[560px] book-rounded-2xl book-mx-auto book-p-5 book-text-center">
                        <svg class="book-stroke-secondary-400 book-mx-auto book-w-44">
                            <use xlink:href="/booking/images/sprite-booking-icons.svg#warning-icon"></use>
                        </svg>
                        <div class="book-warning__message book-text-2xl book-font-bold book-mt-6">
                            ${responseJson.message.description}
                        </div>
                        <div class="book-flex book-justify-between book-mt-6">
                            <button onclick="warningConfirm(this)" type="button"
                                class="book-min-w-48 book-text-white book-bg-primary-400 book-border book-border-solid book-border-primary-400 book-rounded-lg book-p-3 hover:book-bg-white hover:book-text-primary-400">
                                حله
                            </button>
                            <button onclick="warningReject(this)" type="button"
                                class="book-min-w-48 book-text-primary-400 book-border book-border-solid book-border-primary-400 book-rounded-lg book-p-3 hover:book-bg-primary-400 hover:book-text-white">
                                کنکله
                            </button>
                        </div>
                    </div>
                </div>`;
            document.body.insertAdjacentHTML("beforeend", modalHtml);
        }
    } catch (error) {
        console.error("onProcessedFlightSafarmarket: " + error.message);
    }
};

/**
 * Processes flight group API response, updates sessionStorage, and displays a warning modal if needed.
 * @param {Object} args - API response object containing the response data.
 */
const onProcessedFlightAi = async (args) => {
    try {
        // Trigger research API call
        $bc.setSource("cms.research", true);

        const response = args.response;
        if (response.status !== 200) {
            throw new Error(`Unexpected response status: ${response.status}`);
        }

        const responseJson = await response.json();
        if (!responseJson || !responseJson.SessionId) {
            throw new Error("Invalid response JSON or missing SessionId");
        }

        // Update session ID in sessionStorage
        sessionSearchStorage.SessionId = responseJson.SessionId;
        sessionStorage.setItem("sessionSearch", JSON.stringify(sessionSearchStorage));
        sessionStorage.setItem("sessionBook", JSON.stringify(responseJson));

        // Update sessionBookStorage
        sessionBookStorage = sessionStorage.getItem("sessionBook")
            ? JSON.parse(sessionStorage.getItem("sessionBook"))
            : "";
        if (!sessionBookStorage) {
            throw new Error("Failed to parse sessionSearch from sessionStorage");
        }

        // Set flight group (assumed to be defined elsewhere)
        setProductGroup();

        // Display warning modal if message exists
        if (responseJson.message && responseJson.message.description) {
            console.log('Warning message received:', responseJson.message.description);
            const modalHtml = `
                <div class="book-warning__message__modal__container book-modal__container book-fixed book-top-0 book-left-0 book-w-screen book-h-screen book-overflow-hidden book-z-50">
                    <div class="book-modal__content book-bg-white book-fixed book-inset-x-0 book-top-1.2 book-w-[560px] book-rounded-2xl book-mx-auto book-p-5 book-text-center">
                        <svg class="book-stroke-secondary-400 book-mx-auto book-w-44">
                            <use xlink:href="/booking/images/sprite-booking-icons.svg#warning-icon"></use>
                        </svg>
                        <div class="book-warning__message book-text-2xl book-font-bold book-mt-6">
                            ${responseJson.message.description}
                        </div>
                        <div class="book-flex book-justify-between book-mt-6">
                            <button onclick="warningConfirm(this)" type="button"
                                class="book-min-w-48 book-text-white book-bg-primary-400 book-border book-border-solid book-border-primary-400 book-rounded-lg book-p-3 hover:book-bg-white hover:book-text-primary-400">
                                حله
                            </button>
                            <button onclick="warningReject(this)" type="button"
                                class="book-min-w-48 book-text-primary-400 book-border book-border-solid book-border-primary-400 book-rounded-lg book-p-3 hover:book-bg-primary-400 hover:book-text-white">
                                کنکله
                            </button>
                        </div>
                    </div>
                </div>`;
            document.body.insertAdjacentHTML("beforeend", modalHtml);
        }
    } catch (error) {
        console.error("onProcessedFlightAi: " + error.message);
    }
};

/**
 * Processes flight API rules for rendering flight rules, baggage, and services.
 * @param {Object} args - API response object containing the response data.
 */
const onProcessedFlightApiRule = async (args) => {
    try {
        // Validate response
        const { response } = args;
        if (!response || response.status !== 200) return;

        // Parse JSON response
        const responseJson = await response.json();
        if (!responseJson) return;

        // Get main rendering container
        const renderingContainer = document.querySelector(".book-api__container__rendering");
        if (!renderingContainer) return;

        // Helper function to create container if it doesn't exist
        const ensureContainer = (parent, className) => {
            let container = parent.querySelector(`.${className}`);
            if (!container) {
                container = document.createElement("div");
                container.className = className;
                parent.appendChild(container);
            }
            return container;
        };

        // Helper function to generate passenger table
        const generatePassengerTable = (tableId, type) => {
            let rows = '';
            let passengerIndex = 1;
            const ordinals = [
                translate("first"),
                translate("second"),
                translate("third"),
                translate("fourth"),
                translate("fifth"),
                translate("sixth"),
                translate("seventh"),
                translate("eighth"),
                translate("ninth")
            ];
            const typeCounters = { Adult: 0, Child: 0, Infant: 0 };
            const typeMap = {
                Adult: translate("passenger_adult"),
                Child: translate("passenger_child"),
                Infant: translate("passenger_infant")
            };

            const passengers = sessionBookStorage?.PriceInfo?.PassengerFare || [];
            const passengersData = document.querySelector('.book-passengers__content:not(.book-hidden)');
            const passengerContainers = passengersData?.querySelectorAll('.book-passenger__container') || [];

            passengers.forEach(p => {
                const count = Number(p.Count || 0);
                if (count <= 0) return;

                const passengerTypeFa = typeMap[p.passengerType] || p.passengerType;
                for (let i = 0; i < count; i++) {
                    const ordinalIndex = typeCounters[p.passengerType]++;
                    const ordinalText = ordinals[ordinalIndex] || `${translate("number")} ${ordinalIndex + 1}`;
                    let fullTitle = `${passengerTypeFa} ${ordinalText}`;

                    const container = passengerContainers[passengerIndex - 1];
                    if (container) {
                        const firstName = container.querySelector('.book-FirstName')?.value?.trim();
                        const lastName = container.querySelector('.book-LastName')?.value?.trim();
                        if (firstName && lastName) fullTitle = `${firstName} ${lastName}`;
                    }
                    rows += `
                        <tr class="book-border book-passenger__row" data-index="${passengerIndex}">
                            <td class="book-p-2">
                                <span class="warning-icon book-h-5 book-leading-6 book-w-5 book-inline-block book-mr-2 book-rounded-full">
                                    <svg width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <use href="/booking/images/sprite-booking-icons.svg#check-icon"></use>
                                    </svg>
                                </span>
                                ${fullTitle}
                            </td>
                            <td class="book-p-2">${translate("not_selected")}</td>
                            <td class="book-p-2">---</td>
                        </tr>`;
                    passengerIndex++;
                }
            });

            return `
                <table class="book-passenger__table book-text-center book-w-full book-text-sm book-border-collapse book-mt-2" id="${tableId}">
                    <thead>
                        <tr>
                            <th class="book-bg-zinc-100 book-border book-p-2 book-rounded-xl">${translate("passenger")}</th>
                            <th class="book-bg-zinc-100 book-border book-p-2 book-rounded-xl">${type === 'baggage' ? `${translate("baggage")}` : type === 'meal' ? `${translate("meal")}` : type === 'seat' ? `${translate("seat")}` : ''}</th>
                            <th class="book-bg-zinc-100 book-border book-p-2 book-rounded-xl">${translate("price")}</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>`;
        };

        // Helper function to generate service card
        const generateServiceCard = async (service, tableId, extraParam = '') => {
            const currency = await renderCurrency(service.Currency);
            return `
                <div class="book-service__card book-p-2 book-border book-mb-2 book-border-zinc-200 book-rounded-md book-text-center book-cursor-pointer book-bg-zinc-50 book-flex book-flex-col book-justify-center hover:book-border-primary-400"
                    data-id="${service.ServiceId}" onclick="updatePassengerServices(this,'${tableId}', '${service.Description}', ${service.Price}, '${service.Currency}', '${extraParam}')">
                    <div class="book-mb-2 book-font-arial book-ltr book-text-xs">${service.Description}</div>
                    <div class="book-text-zinc-500">
                    ${await priceWithCurrency(service.Price)}
                    ${currency}</div>
                </div>`;
        };

        // Helper function to generate route section
        const generateRouteSection = (index, fromCity, toCity, fromCode, toCode, tableId, serviceCards, type) => {
            const gridClasses = (type !== 'seat' && !isMobile)
                ? 'book-grid book-grid-cols-3 book-gap-2'
                : '';
            return `
                <div class="book-mb-5 book-excessService__content">
                    <div
                        class="book-flex book-justify-between book-items-center book-mb-2 book-text-sm book-font-bold book-cursor-pointer${index === 1 ? ` book-active__roue__excessService` : ''}"
                        onclick="toggleServiceTable(this,'book-route__service-${type}-${index}')">
                        <div>
                            <span>${fromCity}<span class="book-mr-1">(${fromCode})</span></span>
                            <svg width="24" height="24" class="book-mx-1">
                               <use href="/booking/images/sprite-booking-icons.svg#${(currentLanguage === 'fa' || currentLanguage === 'ar') ? 'left-arrow-icon' : 'right-arrow-icon'}"></use>
                            </svg>
                            <span>${toCity}<span class="book-mr-1">(${toCode})</span></span>
                        </div>
                        <div class="book-arrow__icon">
                            <svg width="24" height="24">
                                <use href="/booking/images/sprite-booking-icons.svg#${index === 1 ? 'down-arrow-icon' : 'up-arrow-icon'}"></use>
                            </svg>
                        </div>
                    </div>
                    <div id="book-route__service-${type}-${index}" class="book-route__service ${isMobile ? '' : 'book-flex book-gap-8'} ${index === 1 ? '' : 'book-hidden'}">
                        <div class="${isMobile ? 'book-w-full book-mb-4' : 'book-w-2/5'}">
                            ${generatePassengerTable(tableId, type)}
                        </div>
                        <div class="${isMobile ? 'book-w-full book-mb-4' : 'book-w-3/5'} book-max-h-80 book-overflow-auto ${gridClasses}">
                            ${serviceCards.join('')}
                        </div>
                    </div>
                </div>`;
        };

        const noRules = translate("no_rules_available");
        const noServices = translate("no_services_available");
        const noMeals = translate("no_meals_available");
        const noMealForRoute = translate("no_meal_for_this_route");
        const noSeats = translate("no_seats_available");

        // Render flight rules if available
        if (responseJson.FlightRules) {
            if (responseJson.FlightRules.length > 0) {
                let output = "";
                for (const item of responseJson.FlightRules) {
                    if (item.Rule?.length > 0) {
                        output += `
                            <div class="book-text-zinc-900 book-text-sm book-text-justify book-ltr">
                                <div class="book-mb-2 book-flex book-gap-1">
                                    <span>${item.From}</span>
                                    <svg width="24" height="24">
                                        <use href="/booking/images/sprite-booking-icons.svg#right-arrow-icon"></use>
                                    </svg>
                                    <span>${item.To}</span>
                                </div>
                                <div>${await renderRule(item.Rule)}</div>
                            </div>`;
                    } else {
                        renderingContainer.innerHTML = noRules;
                    }
                }
                renderingContainer.innerHTML = output || noRules;
            } else {
                renderingContainer.innerHTML = noRules;
            }
        }
        // Render baggage details
        else if (responseJson.Baggages) {
            if (responseJson.Baggages.length > 0) {
                let output = `
                    <table class="book-w-full book-table-auto book-border-separate [border-spacing:0_8px]">
                        <thead>
                            <tr>
                                <th class="book-pt-2 book-pb-4 book-pr-2 book-text-center book-text-primary-400">${translate("origin")}</th>
                                <th class="book-pt-2 book-pb-4 book-text-center book-text-primary-400">${translate("destination")}</th>
                                <th class="book-pt-2 book-pb-4 book-pl-2 book-text-center book-text-primary-400">${translate("baggage")}</th>
                            </tr>
                        </thead>
                        <tbody>`;
                for (const item of responseJson.Baggages) {
                    output += `
                        <tr>
                            <td class="book-py-2 book-bg-zinc-100 book-rounded-s-lg book-pr-2 book-text-center">${item.Origin}</td>
                            <td class="book-py-2 book-bg-zinc-100 book-text-center">${item.Destination}</td>
                            <td class="book-py-2 book-bg-zinc-100 book-rounded-e-lg book-pl-2 book-text-center book-ltr book-font-arial">${item.Baggage} ${item.Unit}</td>
                        </tr>`;
                }
                output += `</tbody></table>`;
                renderingContainer.innerHTML = output;
            } else {
                renderingContainer.innerHTML = noRules;
            }
        }
        // Render flight services (baggage, meals)
        else if (responseJson.FlightServices) {
            // Remove loader and create service containers
            renderingContainer.querySelector(".book-api__container__loader")?.remove();
            const renderingServiceContainer = ensureContainer(renderingContainer, "book-api__container__rendering__baggageService");
            const renderingMealContainer = ensureContainer(renderingContainer, "book-api__container__rendering__mealService");
            renderingServiceContainer.classList.add("book-services__content");
            renderingMealContainer.classList.add("book-services__content");
            renderingMealContainer.classList.add("book-hidden");

            // Excess Baggage
            let baggageOutput = `<div>`;
            let hasAnyBaggageService = false;

            for (const [index, item] of responseJson.FlightServices.entries()) {
                const baggageServices = item.Services?.filter(s => s.ServiceType === "Excess Baggage") || [];
                if (baggageServices.length === 0) continue;

                hasAnyBaggageService = true;
                const fromCity = await renderCity(item.From);
                const toCity = await renderCity(item.To);

                const baggageServiceCards = await Promise.all(
                    baggageServices.map(service => generateServiceCard(service, `book-passenger__baggage__table-${index}`, ''))
                );

                baggageOutput += generateRouteSection(
                    index + 1,
                    fromCity,
                    toCity,
                    item.From,
                    item.To,
                    `book-passenger__baggage__table-${index}`,
                    baggageServiceCards,
                    'baggage'
                );
            }

            baggageOutput += `</div>`;
            renderingServiceContainer.innerHTML = hasAnyBaggageService ? baggageOutput : noServices;

            // Meal Services
            let mealOutput = `<div>`;
            let hasAnyMealService = false;
            const routesInfo = sessionBookStorage?.FlightGroup?.flatMap(group => group.RoutesInfo) || [];
            const routeIds = [1, 2, 3, 4];

            for (const routeId of routeIds) {
                const routeInfo = routesInfo.find(route => route.SegmentId === routeId);
                if (!routeInfo) continue;

                const fromCity = await renderCity(routeInfo.OriginAirport);
                const toCity = await renderCity(routeInfo.DestinationAirport);
                const fromAirport = routeInfo.OriginAirport;
                const toAirport = routeInfo.DestinationAirport;

                const mealServices = responseJson.FlightServices.flatMap(item =>
                    item.Services.filter(s => s.ServiceType === "Meal" && s.routeID === routeId)
                );

                if (mealServices.length > 0) {
                    hasAnyMealService = true;
                    const mealServiceCards = await Promise.all(
                        mealServices.map(service => generateServiceCard(service, `book-passenger__meal__table-${routeId}`))
                    );

                    mealOutput += generateRouteSection(
                        routeId,
                        fromCity,
                        toCity,
                        fromAirport,
                        toAirport,
                        `book-passenger__meal__table-${routeId}`,
                        mealServiceCards,
                        'meal'
                    );
                } else {
                    mealOutput += `
                        <div class="book-mb-5 book-excessService__content">
                            <div
                                class="book-flex book-justify-between book-items-center book-mb-2 book-text-sm book-font-bold book-cursor-pointer${routeId === 1 ? ' book-active__roue__excessService' : ''}"
                                onclick="toggleServiceTable(this,'book-route__service-meal-${routeId}')">
                                <div>
                                    <span>${fromCity}<span class="book-mr-1">(${fromAirport})</span></span>
                                    <svg width="24" height="24" class="book-mx-1">
                                        <use href="/booking/images/sprite-booking-icons.svg#${(currentLanguage === 'fa' || currentLanguage === 'ar') ? 'left-arrow-icon' : 'right-arrow-icon'}"></use>
                                    </svg>
                                    <span>${toCity}<span class="book-mr-1">(${toAirport})</span></span>
                                </div>
                                <div class="book-arrow__icon">
                                    <svg width="24" height="24">
                                        <use href="/booking/images/sprite-booking-icons.svg#${routeId === 1 ? 'down-arrow-icon' : 'up-arrow-icon'}"></use>
                                    </svg>
                                </div>
                            </div>
                            <div id="book-route__service-meal-${routeId}" class="book-route__service book-flex book-gap-8 ${routeId === 1 ? '' : 'book-hidden'}">
                                <div class="book-w-full book-text-center">${noMealForRoute}</div>
                            </div>
                        </div>`;
                }
            }

            mealOutput += `</div>`;
            renderingMealContainer.innerHTML = hasAnyMealService ? mealOutput : noMeals;
        }
        // Render seat services
        else if (responseJson[0]?.FlightSegmentRefID) {
            renderingContainer.querySelector(".book-api__container__loader")?.remove();
            const renderingServiceContainer = ensureContainer(renderingContainer, "book-api__container__rendering__seatService");
            renderingServiceContainer.classList.add("book-services__content");

            let seatOutput = `<div>`;
            let hasAnySeatService = false;

            const generateSeatSVG = async (seatLabel, isAvailable, seatId, priceRaw, currency, characteristicText, tableId) => {
                const currencyText = await renderCurrency(currency);
                const priceText = priceWithCurrency(priceRaw) + " " + currencyText;
                const defaultFill = isAvailable ? "#3b82f6" : "#d1d5db";
                const hoverFill = isAvailable ? "#10b981" : "#d1d5db";

                return `
                    <div class="book-relative book-group" style="width: 40px; height: 40px;">
                        <svg width="50" height="50" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg"
                            style="cursor: ${isAvailable ? 'pointer' : 'not-allowed'};" data-id="${seatId}"
                            ${isAvailable ? `onclick="updatePassengerServices(this,'${tableId}', '${seatLabel}', ${priceRaw}, '${currency}')"` : ""}
                            onmouseenter="this.querySelectorAll('.book-seat__part').forEach(el => el.setAttribute('fill', '${hoverFill}'))"
                            onmouseleave="this.querySelectorAll('.book-seat__part').forEach(el => {
                                if (!this.classList.contains('book-seat__selected')) {
                                    el.setAttribute('fill', '${defaultFill}');
                                }
                            })"
                        >
                            <rect class="book-seat__part" x="10" y="2" width="16" height="14" rx="3" fill="${defaultFill}" stroke="#374151" stroke-width="1.2"/>
                            <path class="book-seat__part" d="M10 16 L26 16 L24 22 L12 22 Z" fill="${defaultFill}" stroke="#374151" stroke-width="1.2"/>
                            <line x1="8" y1="16" x2="10" y2="22" stroke="#374151" stroke-width="1.2"/>
                            <line x1="28" y1="16" x2="26" y2="22" stroke="#374151" stroke-width="1.2"/>
                            <text x="18" y="12" text-anchor="middle" fill="white" font-size="8" font-family="Arial" font-weight="bold">${seatLabel}</text>
                        </svg>
                        ${isAvailable ? `
                            <div class="book-absolute book-z-10 book-hidden book-group-hover:book-block  book-top-full book-left-1/2 book--translate-x-1/2 book-bg-white book-shadow-md book-rounded book-text-xs book-p-2">
                                ${characteristicText ? `<div class="book-font-bold book-mb-2 book-pb-2 book-border-b-1 book-border-solid book-text-center book-font-arial">${characteristicText}</div>` : ""}
                                <div class="book-flex book-justify-between book-items-center book-gap-2">
                                    <div class="book-font-arial">${seatLabel}</div> 
                                    <div><span class="book-ml-1">${translate("price")}:</span><span class="book-text-sm book-font-bold book-mx-1">${priceText}</span></div>
                                </div>
                            </div>
                        ` : ""}
                    </div>`;
            };

            for (const [index, item] of responseJson.entries()) {
                hasAnySeatService = true;

                const fromCity = await renderCity(item.Route.Departure.AirportCode);
                const toCity = await renderCity(item.Route.Arrival.AirportCode);

                const seatMap = {};
                for (const seat of item.Seats || []) {
                    const cabinType = seat.Cabin?.CabinTypeName || "OTHER";
                    if (!seatMap[cabinType]) seatMap[cabinType] = [];
                    seatMap[cabinType].push(seat);
                }

                const seatServiceCards = [];

                for (const [cabin, seats] of Object.entries(seatMap)) {
                    seats.sort((a, b) => {
                        const rowA = parseInt(a.Row, 10);
                        const rowB = parseInt(b.Row, 10);
                        if (rowA !== rowB) return rowA - rowB;

                        const colA = a.Column.toLowerCase();
                        const colB = b.Column.toLowerCase();
                        if (colA < colB) return -1;
                        if (colA > colB) return 1;
                        return 0;
                    });

                    const layoutType = item.Aircraft?.LayoutType || "3-3";
                    const [leftSeats, rightSeats] = layoutType.split("-").map(Number);
                    const totalSeatsPerRow = leftSeats + rightSeats;

                    const seatsByRow = {};
                    for (const seat of seats) {
                        const row = seat.Row;
                        if (!seatsByRow[row]) seatsByRow[row] = [];
                        seatsByRow[row].push(seat);
                    }

                    seatServiceCards.push(`<div><div class="book-font-bold book-mb-2">${cabin}</div>`);
                    for (const [row, rowSeats] of Object.entries(seatsByRow)) {
                        rowSeats.sort((a, b) => {
                            const colA = a.Column.toLowerCase();
                            const colB = b.Column.toLowerCase();
                            if (colA < colB) return -1;
                            if (colA > colB) return 1;
                            return 0;
                        });

                        const leftGroup = rowSeats.filter(seat => ["A", "B", "C"].includes(seat.Column.toUpperCase()));
                        const rightGroup = rowSeats.filter(seat => ["D", "E", "F"].includes(seat.Column.toUpperCase()));

                        const leftSeatSVGs = await Promise.all(leftGroup.map(seat => {
                            const seatId = seat.Seat_Id;
                            const seatLabel = seat.SeatID;
                            const isAvailable = seat.Available === "true";
                            const priceRaw = seat.Price?.Total || 0;
                            const currency = seat.Price?.Currency || "IRR";
                            const characteristic = seat.SeatCharacteristicCode?.[0] || '';
                            const characteristicMap = {
                                WN: "Window",
                                AS: "Aisle",
                                "Middle": "Middle",
                                EX: "ExitRow",
                                PR: "Premium",
                                PR2: "Premium",
                                FR: "FrontRow"
                            };
                            const characteristicText = characteristicMap[characteristic] || '';
                            return generateSeatSVG(seatLabel, isAvailable, seatId, priceRaw, currency, characteristicText, `book-passenger__seat__table-${index}`);
                        }));

                        const rightSeatSVGs = await Promise.all(rightGroup.map(seat => {
                            const seatId = seat.Seat_Id;
                            const seatLabel = seat.SeatID;
                            const isAvailable = seat.Available === "true";
                            const priceRaw = seat.Price?.Total || 0;
                            const currency = seat.Price?.Currency || "IRR";
                            const characteristic = seat.SeatCharacteristicCode?.[0] || '';
                            const characteristicMap = {
                                WN: "Window",
                                AS: "Aisle",
                                "Middle": "Middle",
                                EX: "ExitRow",
                                PR: "Premium",
                                PR2: "Premium",
                                FR: "FrontRow"
                            };
                            const characteristicText = characteristicMap[characteristic] || '';
                            return generateSeatSVG(seatLabel, isAvailable, seatId, priceRaw, currency, characteristicText, `book-passenger__seat__table-${index}`);
                        }));

                        seatServiceCards.push(`
                            <div class="book-flex book-items-center book-mb-2">
                                <div class="book-flex book-gap-2" style="width: ${leftSeats * 48}px;">
                                    ${leftSeatSVGs.join('')}
                                </div>
                                <div class="book-aisle book-bg-zinc-100 book-h-10 book-w-8 book-flex book-items-center book-justify-center book-text-sm book-font-bold book-bg-zinc-200">
                                    ${row}
                                </div>
                                <div class="book-flex book-gap-2" style="width: ${rightSeats * 48}px;">
                                    ${rightSeatSVGs.join('')}
                                </div>
                            </div>`);
                    }
                    seatServiceCards.push(`</div>`);
                }

                seatOutput += generateRouteSection(
                    index + 1,
                    fromCity,
                    toCity,
                    item.Route.Departure.AirportCode,
                    item.Route.Arrival.AirportCode,
                    `book-passenger__seat__table-${index}`,
                    seatServiceCards,
                    'seat'
                );
            }

            seatOutput += `</div>`;
            renderingServiceContainer.innerHTML = hasAnySeatService ? seatOutput : noSeats;
        }
    } catch (error) {
        console.error("onProcessedFlightApiRule: " + error.message);
    }
};

/**
 * Sets up flight group data and initializes booking UI.
 * Loads booking data, passenger counts, and extra services UI.
 */
const setProductGroup = async () => {
    try {
        if (sessionStorage.getItem("sessionBook")) {
            const dict = sessionBookStorage.dictionaries;
            if (Array.isArray(dict)) {
                dictionaries = dict;
            } else if (typeof dict === "object" && dict !== null) {
                dictionaries = [dict];
            }
        };
        $bc.setSource("flight.book", sessionBookStorage);
        sessionSearchStorage = sessionStorage.getItem("sessionSearch")
            ? JSON.parse(sessionStorage.getItem("sessionSearch"))
            : null;

        const Adults = sessionBookStorage.PriceInfo.PassengerFare[0].Count;
        const Children = sessionBookStorage.PriceInfo.PassengerFare[1].Count;
        const Infants = sessionBookStorage.PriceInfo.PassengerFare[2].Count;
        ExcessService = sessionBookStorage.FlightGroup?.[0]?.ExcessService || false;
        SeatSelection = sessionBookStorage.FlightGroup?.[0]?.SeatSelection || false;
        lastDepartureDate = sessionBookStorage.FlightGroup?.[0].DepartureDate;
        if (sessionBookStorage.TemporaryHold) {

            TemporaryHold = String(sessionBookStorage.TemporaryHold)
        }
        if (ExcessService || SeatSelection) {
            const container = document.querySelector(".book-passengers__container");
            if (!container) throw new Error("Passengers container not found");
            const div = document.createElement("div");
            div.innerHTML = `
                <div class="book-services__container book-api__container book-bg-white book-shadow-md book-border-slate-600 book-rounded-2xl book-border-b-3 book-p-5 book-mb-10">
                    <div class="book-text-base book-flex book-justify-between book-items-center book-cursor-pointer" onclick="toggleContentApi(this,'','book-services__container')" data-run="0">
                        <div>
                            ${translate("optional_services_title")}
                            <div class="book-text-zinc-500 book-text-xs book-mt-2 book-mb-5">
                                ${translate("optional_services_description")}
                            </div>
                        </div>
                        <svg class="book-api__container__arrow" width="24" height="24">
                            <use href="/booking/images/sprite-booking-icons.svg#down-arrow-icon"></use>
                        </svg>
                    </div>
                    <div class="book-api__content">
                        <div class="book-tab__navigation__container ${isMobile ? '' : 'book-flex book-justify-around book-space-x-2 book-space-x-reverse'} book-mb-10">
                            <button onclick="selectServiceTab(this,'baggageService','ExcessService')" data-run="0" type="button" class="book-tab__navigation__content ${isMobile ? 'book-w-full book-mb-4' : 'book-min-w-52'} book-p-4 book-rounded-xl book-border-zinc-400 book-border book-transition-colors book-text-zinc-500 hover:book-bg-primary-400 hover:book-border-primary-400 hover:book-text-white">
                                <svg width="51" height="50"><use href="/booking/images/sprite-booking-icons.svg#wheel-bag-icon"></use></svg>
                                <h6 class="book-text-sm">${translate("extra_baggage")}</h6>
                            </button>
                            <button onclick="selectServiceTab(this,'mealService','ExcessService')" data-run="0" type="button" class="book-tab__navigation__content ${isMobile ? 'book-w-full book-mb-4' : 'book-min-w-52'} book-p-4 book-rounded-xl book-border-zinc-400 book-border book-transition-colors book-text-zinc-500 hover:book-bg-primary-400 hover:book-border-primary-400 hover:book-text-white">
                                <svg width="41" height="50"><use href="/booking/images/sprite-booking-icons.svg#meal-icon"></use></svg>
                                <h6 class="book-text-sm">${translate("meal")}</h6>
                            </button>
                            <button onclick="selectServiceTab(this,'seatService','SeatAvailability')" data-run="0" type="button" class="book-tab__navigation__content ${isMobile ? 'book-w-full book-mb-4' : 'book-min-w-52'} book-p-4 book-rounded-xl book-border-zinc-400 book-border book-transition-colors book-text-zinc-500 hover:book-bg-primary-400 hover:book-border-primary-400 hover:book-text-white">
                                <svg width="41" height="50"><use href="/booking/images/sprite-booking-icons.svg#seat-icon"></use></svg>
                                <h6 class="book-text-sm">${translate("seat_selection")}</h6>
                            </button>
                        </div>
                        <div class="book-api__container__content book-mt-4 book-hidden">
                            <span class="book-api__container__loader book-bg-white book-relative book-block book-w-3 book-h-3 book-rounded-full book-mx-auto book-my-3"></span>
                        </div>
                    </div>
                </div>`;
            container.appendChild(div);
        }

        const internal = dictionaries[0]?.internal || false;

        if (internal) {
            const internalContainer = document.querySelector(".book-passengers__container__internal");
            if (!internalContainer) throw new Error("Internal passengers container not found");
            internalContainer.classList.remove("book-hidden");
            const countryElement = internalContainer.querySelector('.book-NameOfCountry');
            countryElement.removeAttribute('onclick');
            countryElement.closest(".book-info__item__container").classList.remove("book-has__drop__item");
            countryElement.setAttribute(`readonly`, true);
            addPassenger(".book-passengers__container__internal", Adults, Children, Infants);
        } else {
            const externalContainer = document.querySelector(".book-passengers__container__external");
            if (!externalContainer) throw new Error("External passengers container not found");
            externalContainer.classList.remove("book-hidden");
            addPassenger(".book-passengers__container__external", Adults, Children, Infants);
        }

        startTimer();
        getWithExpiry("sessionSearch", "sessionBook", "sessionAmenities");


        const {
            requests,
            productGroupField,
            productIdField
        } = getServiceMappingInfo(selectedMode);
        const supplierCreditUrl = requests.supplierCredit;

        $bc.setSource("cms.supplierCredit", [{
            SessionId: sessionSearchStorage?.SessionId,
            Id: sessionBookStorage.FlightId,
            Group: JSON.stringify(sessionBookStorage.FlightGroup),
            selectedMode: selectedMode,
            rkey: getSearchCookie("rkey") || "",
            url: supplierCreditUrl,
            productIdField: productIdField,
            productGroupField: productGroupField,
            run: true
        }]);

        originalFirstPay = sessionBookStorage.PriceInfo.TotalCommission;
        originalTotalCom = sessionBookStorage.PriceInfo.TotalCommission;
        originalTotal = sessionBookStorage.PriceInfo.Total;
        if (sessionStorage.getItem("sessionAmenities")) {
            sessionAmenitiesStorage = JSON.parse(sessionStorage.getItem("sessionAmenities"));
            if (sessionAmenitiesStorage?.FlightGroup?.length > 0) {
                const fareFamilyHtml = document.createElement("div");
                fareFamilyHtml.className = "book-flight__fareFamily book-api__container book-p-4 book-border book-border-zinc-300 book-rounded-2xl book-mb-4";

                const flightGroups = sessionAmenitiesStorage.FlightGroup;
                const hasMultipleRoutes = flightGroups.length > 1;

                fareFamilyHtml.innerHTML = `
                  <div class="book-border-b book-border-zinc-300 book-pb-8 book-mb-2">
                      <div class="book-content__api book-flex book-justify-between book-items-center book-mb-2 book-cursor-pointer" onclick="toggleContentApi(this,'','book-flight__fareFamily','')" data-run="1">
                          <h6 class="book-text-lg book-font-bold book-text-zinc-800">${translate("fare_family") || "گروه نرخی"}</h6>
                          <svg class="book-api__container__arrow" width="24" height="24">
                              <use href="/booking/images/sprite-booking-icons.svg#down-arrow-icon"></use>
                          </svg>
                      </div>
                  </div>
                  <div class="book-api__container__content">
                      <div class="book-grid book-grid-cols-1 book-gap-4 book-ltr">
                          <div class="book-border book-rounded-2xl book-border-zinc-200 book-cursor-pointer book-active__amenities">
                              <div class="book-p-3" id="book-amenities__container"></div>
                          </div>
                      </div>
                  </div>
                `;

                const container = fareFamilyHtml.querySelector("#book-amenities__container");
                if (hasMultipleRoutes) {
                    const tabsHtml = document.createElement("div");
                    tabsHtml.className = "book-flex book-gap-2 book-mb-4 book-border-b book-border-zinc-200 book-justify-between book-items-center";

                    for (let i = 0; i < flightGroups.length; i++) {
                        const group = flightGroups[i];
                        const routeTitle = translate(`route_${i + 1}`) || `مسیر ${convertToPersianNumber(i + 1)}`;
                        const isActive = i === 0 ? 'book-border-b-2 book-border-primary-400 book-text-primary-400' : 'book-text-zinc-600';

                        const tabButton = document.createElement("button");
                        tabButton.type = "button";
                        tabButton.className = `book-route__tab book-px-4 book-py-2 book-font-bold book-text-sm book-transition-all ${isActive}`;
                        tabButton.setAttribute("data-route-index", i);
                        tabButton.innerHTML = `
                            ${routeTitle}
                            <span class="book-text-xs book-block book-font-normal book-mt-1">${group.Origin} - ${group.Destination}</span>
                        `;

                        tabButton.addEventListener("click", function (e) {
                            e.stopPropagation();
                            toggleSessionRouteTab(i);
                        });

                        tabsHtml.appendChild(tabButton);
                    }

                    container.appendChild(tabsHtml);
                }

                for (let i = 0; i < flightGroups.length; i++) {
                    const group = flightGroups[i];
                    const isVisible = i === 0 ? '' : 'book-hidden';

                    const routeContent = document.createElement("div");
                    routeContent.className = `book-route__content ${isVisible}`;
                    routeContent.setAttribute("data-route-index", i);

                    // Render amenities
                    const amenitiesHtml = await renderAmenities(group.Amenities);
                    routeContent.innerHTML = `
                        <h6 class="book-font-bold book-mb-2 book-text-zinc-900">${group.BrandedFare}</h6>
                        <p class="book-mb-2 book-text-zinc-900">Included | NotOffered</p>
                        <ul class="book-font-arial book-space-y-2 book-text-sm book-text-zinc-700 book-h-[21rem] book-overflow-auto">
                            ${amenitiesHtml}
                        </ul>
                    `;

                    container.appendChild(routeContent);
                }



                const intervalId = setInterval(() => {
                    const asideContent = document.querySelector(".book-aside__content");
                    if (asideContent) {
                        const tabNav = asideContent.querySelector(".book-tab__navigation__container");
                        if (tabNav) {
                            tabNav.insertAdjacentElement("afterend", fareFamilyHtml);
                            clearInterval(intervalId);
                        } else {
                            asideContent.insertAdjacentElement("afterbegin", fareFamilyHtml);
                            clearInterval(intervalId);
                        }
                    }
                }, 300);
            }
        };
        schemaId = sessionSearchStorage.SchemaId;
        if (utmSource === "safarmarket" || (getSearchCookie("safarmarketId") && domainId.includes("4869"))) {
            fetch(`https://safarmarket.com/api/v1/trace/pixel/babanowrouz/2/?smId=${getSearchCookie("safarmarketId") || ""}&bck=false`)
                .then(response => {
                    console.log('Content-Type:', response.headers.get('content-type'));
                    console.log('Status:', response.status);
                    return response.text();
                })
                .then(data => {
                    console.log('Response:', data);
                });
        };
    } catch (error) {
        console.error("setProductGroup: " + error.message);
    }
};
/**
* Renders amenities list with chargeable status indicators.
* @param {Array} element - List of amenities with description and isChargeable status.
* @returns {Promise<string>} HTML string of amenities list or empty string on error.
*/
const renderAmenities = async (element) => {
    try {
        let output = "";
        for (const item of element || []) {
            const icon = item.isChargeable == 0 ? "check-circle-icon" : "dash-circle-icon";
            output += `<li class="book-flex book-items-center book-gap-2 book-my-1">
              <svg width="${icon === "check-circle-icon" ? 17 : 20}" height="${icon === "check-circle-icon" ? 16 : 20}" class="book-shrink-0">
                  <use href="/booking/images/sprite-booking-icons.svg#${icon}"></use>
              </svg>
              <span>${item.description}</span>
          </li>`;
        }
        return output;
    } catch (error) {
        console.error("renderAmenities" + error.message);
        return "";
    }
};
const toggleSessionRouteTab = (routeIndex) => {
    const card = document.querySelector(".book-flight__fareFamily").querySelector(".book-active__amenities");
    if (!card) return;

    const tabs = card.querySelectorAll(".book-route__tab");
    tabs.forEach(tab => {
        tab.classList.remove("book-border-b-2", "book-border-primary-400", "book-text-primary-400");
        tab.classList.add("book-text-zinc-600");
    });

    const activeTab = card.querySelector(`.book-route__tab[data-route-index="${routeIndex}"]`);
    if (activeTab) {
        activeTab.classList.add("book-border-b-2", "book-border-primary-400", "book-text-primary-400");
        activeTab.classList.remove("book-text-zinc-600");
    }

    const contents = card.querySelectorAll(".book-route__content");
    contents.forEach(content => {
        content.classList.add("book-hidden");
    });

    const activeContent = card.querySelector(`.book-route__content[data-route-index="${routeIndex}"]`);
    if (activeContent) {
        activeContent.classList.remove("book-hidden");
    }
}