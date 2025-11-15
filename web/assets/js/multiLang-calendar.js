/* =========================
   Iranian Public Holidays - Loaded from JSON
   ========================= */

// These variables are loaded from the JSON file
let picker = null;
let HOLIDAYS_DATA = null;  // To store the holiday data fetched from the JSON file
let FIXED_JALALI_HOLIDAYS = new Map();  // Map to store fixed Jalali holidays
let LUNAR_HOLIDAYS = new Map();  // Map to store lunar holidays
const HOTEL_PARTIAL_SCOPE_SELECTOR = '.Wrapper-ExteraHoteldate'; // یا [data-hotel-scope="partial"]
const HOTEL_PARTIAL_DATES = { depart: null, return: null };

loadHolidaysData();  // Call the function to load the holidays data from the JSON file

// Loading the JSON holidays file
async function loadHolidaysData() {
    try {
        const response = await fetch('/iran/holidays.json?lid=1');  // Fetch the JSON data from the server
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);  // If fetching fails, throw an error
        }
        HOLIDAYS_DATA = await response.json();  // Parse the response as JSON

        // Processing fixed holidays
        FIXED_JALALI_HOLIDAYS = new Map();  // Initialize the map for fixed holidays
        for (const [key, name] of Object.entries(HOLIDAYS_DATA.fixedHolidays)) {
            FIXED_JALALI_HOLIDAYS.set(key, name);  // Add fixed holidays to the map
        }

        // Processing lunar holidays
        LUNAR_HOLIDAYS = new Map();  // Initialize the map for lunar holidays
        for (const [year, holidays] of Object.entries(HOLIDAYS_DATA.lunarHolidays)) {
            for (const [monthDay, name] of Object.entries(holidays)) {
                const fullKey = `${year}-${monthDay}`;
                LUNAR_HOLIDAYS.set(fullKey, name);  // Add lunar holidays to the map
            }
        }

        return true;  // Return true if data is successfully loaded
    } catch (error) {
        console.warn('⚠️ JSON file not found, using default data:', error.message);  // If there's an error, log it
        return false;  // Return false if there was an error
    }
}

// Holiday check function to check if a given date is a holiday
function isJalaliHoliday(jy, jm, jd) {
    // Checking fixed Jalali holidays
    const fixedKey = `${jm}-${jd}`;
    if (FIXED_JALALI_HOLIDAYS.has(fixedKey)) {
        return { isHoliday: true, name: FIXED_JALALI_HOLIDAYS.get(fixedKey) };  // Return holiday details if it's a fixed holiday
    }

    // Checking lunar holidays
    const lunarKey = `${jy}-${jm}-${jd}`;
    if (LUNAR_HOLIDAYS.has(lunarKey)) {
        return { isHoliday: true, name: LUNAR_HOLIDAYS.get(lunarKey) };  // Return holiday details if it's a lunar holiday
    }

    return { isHoliday: false, name: null };  // Return false if it's not a holiday
}

/* =========================
   Jalali / Gregorian Core
   ========================= */

// Jalali to Gregorian (classic version)
function jalaaliToGregorian(jy, jm, jd) {
    jy += 1595;  // Adjust Jalali year to Gregorian
    let days = -355668 + (365 * jy) + (Math.floor(jy / 33) * 8) + (Math.floor(((jy % 33) + 3) / 4)) + jd;  // Calculate the total days
    if (jm < 7) days += (jm - 1) * 31;  // Add days for months before July
    else days += ((jm - 7) * 30) + 186;  // Add days for months after July

    let gy = 400 * Math.floor(days / 146097);  // Calculate the Gregorian year
    days %= 146097;

    if (days >= 36525) {  // Leap year adjustments
        days--;
        const gy2 = Math.floor(days / 36524);
        days %= 36524;
        if (days >= 365) days++;
        gy += gy2 * 100;
    }

    const gy3 = Math.floor(days / 1461);
    days %= 1461;
    gy += gy3 * 4;
    if (days > 365) {
        days--;
        const gy4 = Math.floor(days / 365);
        days %= 365;
        gy += gy4;
    }

    let gd = days + 1;
    let gm;
    if (gd <= 186) {
        gm = 1 + Math.floor((gd - 1) / 31);  // Calculate Gregorian month and day
        gd = 1 + ((gd - 1) % 31);
    } else {
        gm = 7 + Math.floor((gd - 187) / 30);
        gd = 1 + ((gd - 187) % 30);
    }
    return [gy, gm, gd];  // Return the Gregorian date
}

// Gregorian to Jalali (classic version)
function gregorianToJalaali(gy, gm, gd) {
    let jy, gy2;
    if (gy <= 1600) {
        jy = 0; gy -= 621;  // Adjust Gregorian year to Jalali
    } else {
        jy = 979; gy -= 1600;
    }
    if (gm > 2) gy2 = gy + 1; else gy2 = gy;

    let days = (365 * gy) + Math.floor(gy2 / 4) - Math.floor(gy2 / 100) + Math.floor(gy2 / 400) - 80 + gd;  // Calculate total days
    if (gm > 2) days += Math.floor((gm + 1) * 30.6) - 63;
    else days += Math.floor(gm * 30.6) + 1;

    jy += 33 * Math.floor(days / 12053);  // Convert total days to Jalali year
    days %= 12053;

    jy += 4 * Math.floor(days / 1461);
    days %= 1461;

    if (days > 365) {
        jy += Math.floor((days - 1) / 365);
        days = (days - 1) % 365;
    }

    let jm, jd;
    if (days < 186) {
        jm = 1 + Math.floor(days / 31);  // Calculate month and day
        jd = 1 + (days % 31);
    } else {
        jm = 7 + Math.floor((days - 186) / 30);
        jd = 1 + ((days - 186) % 30);
    }
    return [jy, jm, jd];  // Return the Jalali date
}

// Simple algorithm around reference 1404/01/01 ↔ 2025/03/21
function simpleJalaliToGregorian(jy, jm, jd) {
    const REF_J = { year: 1404, month: 1, day: 1 };  // Reference Jalali date
    const REF_G = new Date(Date.UTC(2025, 2, 21));  // Reference Gregorian date (21 Mar 2025)
    let daysDiff = 0;

    for (let y = REF_J.year; y < jy; y++) daysDiff += isJalaliLeapYear(y) ? 366 : 365;  // Calculate difference in days
    for (let y = jy; y < REF_J.year; y++) daysDiff -= isJalaliLeapYear(y) ? 366 : 365;

    if (jy >= REF_J.year) {
        for (let m = REF_J.month; m < jm; m++) daysDiff += getJalaliMonthDays(jy, m);
        daysDiff += (jd - REF_J.day);
    } else {
        for (let m = jm; m < REF_J.month; m++) daysDiff -= getJalaliMonthDays(REF_J.year, m);
        daysDiff -= (REF_J.day - jd);
    }

    const result = new Date(REF_G.getTime());
    result.setUTCDate(result.getUTCDate() + daysDiff);  // Adjust date by difference
    return [result.getUTCFullYear(), result.getUTCMonth() + 1, result.getUTCDate()];  // Return the Gregorian date
}

// Helper function to convert simple Gregorian to Jalali date
function simpleGregorianToJalali(gy, gm, gd) {
    const REF_G = new Date(Date.UTC(2025, 2, 21));  // Reference Gregorian date (21 Mar 2025)
    const REF_J = { year: 1404, month: 1, day: 1 };  // Reference Jalali date
    const inDate = new Date(Date.UTC(gy, gm - 1, gd));  // Convert input Gregorian date to UTC
    const daysDiff = Math.floor((inDate - REF_G) / 86400000);  // Calculate difference in days

    let jy = REF_J.year, jm = REF_J.month, jd = REF_J.day + daysDiff;  // Initialize Jalali date
    while (jd > getJalaliMonthDays(jy, jm)) {  // Adjust date if it exceeds month days
        jd -= getJalaliMonthDays(jy, jm);
        jm++;
        if (jm > 12) { jm = 1; jy++; }
    }
    while (jd <= 0) {  // Adjust date if it's less than 1
        jm--;
        if (jm <= 0) { jm = 12; jy--; }
        jd += getJalaliMonthDays(jy, jm);
    }
    return [jy, jm, jd];  // Return the Jalali date
}

// Days in Jalali month
// This function returns the number of days in a given Jalali month
function getJalaliMonthDays(year, month) {
    if (month <= 6) return 31;  // First 6 months have 31 days
    if (month <= 11) return 30; // Next 5 months have 30 days
    return isJalaliLeapYear(year) ? 30 : 29;  // Last month has 30 days in a leap year, 29 days otherwise
}

// Compatibility with old code
// This is a compatibility function for older code that calls 'jDaysInMonth', which simply calls getJalaliMonthDays
function jDaysInMonth(jy, jm) { return getJalaliMonthDays(jy, jm); }

// Jalali leap year (approximate)
// This function checks if the given year in Jalali is a leap year or not
function isJalaliLeapYear(year) {
    const cycle = 2816;  // The Jalali calendar has a 2816-year cycle
    const aux1 = year - 1029;
    const aux2 = aux1 % cycle;
    const aux3 = Math.floor(aux2 / 128);
    return ((aux2 % 128) <= ((aux3 * 29) + 29));  // Leap year condition
}

/* ---- API ---- */
// JALALI Object holds the conversion functions and month names for both Jalali and Gregorian calendars
const JALALI = {
    // Convert Gregorian to Jalali using the simple algorithm
    toJalali(gy, gm, gd) { return simpleGregorianToJalali(gy, gm, gd); },

    // Convert Jalali to Gregorian using the simple algorithm
    toGregorian(jy, jm, jd) { return simpleJalaliToGregorian(jy, jm, jd); },

    // Get the Jalali month name in Persian
    monthName(m) {
        return ["", "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
            "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"][m];
    },

    // Get the Jalali month name in English
    monthNameEn(m) {
        return ["", "Farvardin", "Ordibehesht", "Khordad", "Tir", "Mordad", "Shahrivar",
            "Mehr", "Aban", "Azar", "Dey", "Bahman", "Esfand"][m];
    },

    // Get the Gregorian month name in English
    gMonthName(m) {
        return ["", "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"][m];
    }
};

/* =========================
   Utils (UTC-safe)
   ========================= */
// Utility function to format numbers to 2 digits (e.g., "03" for "3")
const fmt2 = n => String(n).padStart(2, '0');

// Utility function to create an ISO date string
const iso = (y, m, d) => `${y}-${fmt2(m)}-${fmt2(d)}`;

// Utility function to create a UTC date object from year, month, and day
const dateUTC = (y, m, d) => new Date(Date.UTC(y, m - 1, d));

// Parse a given ISO string as a UTC date
const parseISOasUTC = s => { const [y, m, d] = s.split('-').map(Number); return dateUTC(y, m, d); };

// Convert a date (year, month, day) to a key for comparison (e.g., 20231010 for 2023/10/10)
const ymdKey = (y, m, d) => y * 10000 + m * 100 + d;

// Convert a UTC date to a comparable ymd key
const ymdKeyFromDateUTC = d => ymdKey(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());

// Check if two UTC dates are the same (ignoring time)
const sameUTC = (a, b) => a && b &&
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate();

const DEFAULT_TZ = 'Asia/Tehran';  // Default timezone for Iran
// Get today's date in the given time zone
function todayYMDAtTZ(tz = DEFAULT_TZ) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date());
    return {
        y: +parts.find(p => p.type === 'year').value,
        m: +parts.find(p => p.type === 'month').value,
        d: +parts.find(p => p.type === 'day').value,
    };
}
const { y: TY, m: TM, d: TD } = todayYMDAtTZ();  // Get today's year, month, and day
const calToday = dateUTC(TY, TM, TD);  // Today's UTC date
const todayKey = ymdKey(TY, TM, TD);  // Today's ymd key
const [currentJY, currentJM, currentJD] = JALALI.toJalali(TY, TM, TD);  // Today's Jalali date

/* =========================
   Weekend helper (Iran = Friday)
   ========================= */
// Check if the given UTC date is a weekend (Friday in Iran)
function isIranWeekendUTC(dUTC) {
    return ((dUTC.getUTCDay() + 1) % 7) === 6; // Friday
}

/* =========================
   Site/Locale detection + i18n
   ========================= */
// Detect if the page uses LTR (left to right) or RTL (right to left) direction
const IS_LTR = (document.documentElement.getAttribute('dir') || '').toLowerCase() === 'ltr';

// Detect the current language of the page
const HTML_LANG = (document.documentElement.getAttribute('lang') || '').toLowerCase();
const IS_EN = HTML_LANG.startsWith('en') || HTML_LANG.startsWith('ar'); // fallback to LTR as English

const LANG = IS_EN ? 'en' : 'fa';  // Set the language to either English or Persian

// Mobile/Desktop flag
const IS_MOBILE = (typeof isMobile !== 'undefined' && isMobile);

// i18n strings
const I18N = {
    fa: {
        selectDepart: 'انتخاب تاریخ رفت',
        selectReturn: 'انتخاب تاریخ برگشت',
        calJalali: 'تقویم شمسی',
        calGregorian: 'تقویم میلادی',
        goToday: 'امروز',
        clear: 'پاک‌کردن',
        okClose: 'تایید و بستن',
        weekdaysJalali: ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'],
        weekdaysGregorian: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        jMonthName: JALALI.monthName,
        gMonthName: JALALI.gMonthName,
    },
    en: {
        selectDepart: 'Select departure date',
        selectReturn: 'Select return date',
        calJalali: 'Persian calendar',
        calGregorian: 'Gregorian calendar',
        goToday: 'Today',
        clear: 'Clear',
        okClose: 'Apply & close',
        weekdaysJalali: ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        weekdaysGregorian: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        jMonthName: JALALI.monthNameEn,
        gMonthName: JALALI.gMonthName,
    }
};

/* =========================
   Popup positioning (RTL-first)
   ========================= */
// This function positions the popup relative to the input field based on RTL or LTR layout.
function placePanel(panelEl, inputEl, margin = 8, preferRight = true) {
    if (typeof isMobile !== 'undefined' && isMobile) {
        panelEl.style.visibility = 'visible';
        return;
    }

    panelEl.style.position = 'absolute';
    panelEl.style.visibility = 'hidden';
    panelEl.classList.remove('book-hidden');

    const r = inputEl.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;

    const panelW = panelEl.offsetWidth;
    const panelH = panelEl.offsetHeight;

    let top = r.bottom + scrollY + margin;
    // if (top + panelH > scrollY + vh - margin) {
    //     const candidateTop = r.top + scrollY - panelH - margin;
    //     if (candidateTop >= scrollY + margin) top = candidateTop;
    //     else top = Math.max(scrollY + margin, Math.min(top, scrollY + vh - margin - panelH));
    // }

    let left;
    if (preferRight) {
        left = r.right + scrollX - panelW;
        if (left < scrollX + margin) left = r.left + scrollX;
        if (left + panelW > scrollX + vw - margin) {
            left = Math.max(scrollX + margin, scrollX + vw - margin - panelW);
        }
    } else {
        left = r.left + scrollX;
        if (left + panelW > scrollX + vw - margin) left = r.right + scrollX - panelW;
        left = Math.max(scrollX + margin, Math.min(left, scrollX + vw - margin - panelW));
    }

    if (panelW > vw - 2 * margin) {
        left = scrollX + margin;
        panelEl.style.maxWidth = (vw - 2 * margin) + 'px';
    }

    panelEl.style.left = left + 'px';
    panelEl.style.top = top + 'px';
    panelEl.style.visibility = 'visible';
}

/* =========================
   Helpers
   ========================= */
// Returns the opposite role input within the same scope (depart or return date input)
function getPairInput(el) {
    const wanted = el.dataset.role === 'return' ? 'depart' : 'return';

    // ✅ First, search within the same container
    const scope = el.closest('.date__searched__container, .Basis_Date_Box') || el.closest('form') || document;

    return scope.querySelector(`.js-date-input[data-role="${wanted}"]`);
}

// Check if the given UTC date is a Friday
function isFriday(utcDate) { return utcDate.getUTCDay() === 5; }

// Flight mode helpers for CalendarLookUp (oneway only)
// This function determines the flight type: oneway, roundtrip, or multi.
function currentFlightMode() {
    // For flight selection
    const flightActive = document.querySelector('.book-module__type .book-active__module__type');
    if (flightActive) {
        const text = (flightActive?.textContent || '').trim();
        if (text.includes('یک طرفه') || text.toLowerCase().includes('one')) return 'oneway';
        if (text.includes('رفت') || text.toLowerCase().includes('round')) return 'roundtrip';
        if (text.includes('چند') || text.toLowerCase().includes('multi')) return 'multi';
    }

    // ✅ For other modules (hotel, tour, ...) - always roundtrip
    const currentModule = getCurrentModule();
    if (currentModule !== 'flight') {
        return 'roundtrip';
    }

    return 'oneway'; // default
}

// Read origin and destination IDs from the page
function readODIds() {
    const originEl = document.querySelector('.departure__location__name');
    const destEl = document.querySelector('.arrival__location__name');
    const origin = originEl?.dataset?.id || document.querySelector('.r-flight').querySelector(".locationId.from").value;
    const destination = destEl?.dataset?.id || document.querySelector('.r-flight').querySelector(".locationId.to").value;
    return { origin, destination };
}

// Convert sequential date_id (base Jalali 1369-01-01) to ISO yyyy-mm-dd format
function isoFromCalendarDateId(dateId) {
    const [gy, gm, gd] = JALALI.toGregorian(1369, 1, 1);
    const base = new Date(Date.UTC(gy, gm - 1, gd));
    base.setUTCDate(base.getUTCDate() + ((Number(dateId) || 0) - 1));
    return iso(base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate());
}

/* =========================
   Multi-Module Date Management
   ========================= */
// Helper to get the current module (flight, hotel, etc.)
function getCurrentModule() {
    // Try to find the currently focused input's parent container
    if (picker?.currentEl) {
        const container = picker.currentEl.closest('[data-module]');
        if (container) return container.dataset.module;
    }

    // Fallback: find any visible module container
    const container = document.querySelector('[data-module]');
    return container?.dataset?.module || 'flight'; // default to flight
}

// Store dates per module (flight/hotel/...), with departure and return dates
const MODULE_DATES = new Map(); // key: module name (flight/hotel/...), value: {depart, return}

// Helper to get/set dates for the current module
function getModuleDates() {
    const mod = getCurrentModule();
    if (!MODULE_DATES.has(mod)) {
        MODULE_DATES.set(mod, { depart: null, return: null });
    }
    return MODULE_DATES.get(mod);
}

// Sync global variables with the current module's dates
function syncModuleDates() {
    const mod = getCurrentModule();

    // اگر الان در flighthotel هستیم و پیکر روی ورودی «بخشی» باز شده،
    // تاریخ‌های سطلِ بخشی را به متغیرهای نمایشی تزریق کن.
    if (mod === 'flighthotel' && picker?._enforceFHRange) {
        departDate = HOTEL_PARTIAL_DATES.depart;
        returnDate = HOTEL_PARTIAL_DATES.return;
        return;
    }

    // در غیر این صورت (اصلی یا ماژول‌های دیگر) از همان منطق قبلی استفاده کن
    const dates = getModuleDates(); // همان Map قبلی
    departDate = dates.depart;
    returnDate = dates.return;
}


// Update module dates (depart or return)
function updateModuleDate(field, value) {
    const mod = getCurrentModule();

    // اگر در flighthotel و ورودی «بخشی» است → در سطلِ بخشی ذخیره کن
    if (mod === 'flighthotel' && picker?._enforceFHRange) {
        if (field === 'depart') {
            HOTEL_PARTIAL_DATES.depart = value;
            departDate = value;
        } else if (field === 'return') {
            HOTEL_PARTIAL_DATES.return = value;
            returnDate = value;
        }
        return;
    }

    // بقیه حالت‌ها: همان رفتار قبلی (سطل اصلی ماژول)
    const dates = getModuleDates();
    if (field === 'depart') {
        dates.depart = value;
        departDate = value;
    } else if (field === 'return') {
        dates.return = value;
        returnDate = value;
    }
}

function getPrimaryModuleDates() {
    const currentMod = getCurrentModule();
    if (currentMod === 'flighthotel') {
        if (MODULE_DATES.has('flight')) return MODULE_DATES.get('flight');
        if (MODULE_DATES.has('flighthotel')) return MODULE_DATES.get('flighthotel');
    }
    return null;
}


/* =========================
   Behavior flags
   ========================= */
const GREGORIAN_DEFAULT = IS_EN;     // default mode for English
const GREGORIAN_RTL_START = IS_EN ? false : true;  // grid starts from right in Gregorian when EN (LTR UI)

/* =========================
   DatePicker
   ========================= */
// The current field being interacted with ('depart' for departure date, 'return' for return date)
let currentField = null;
// Store UTC dates for the departure and return dates in the current module
let departDate = null, returnDate = null;
// Keep track of the last field that was selected
let lastPickedField = null;

// Conditional classes for mobile and desktop views
// These classes adjust the layout and behavior based on whether the device is mobile or not
const navWrapHidden = (typeof isMobile !== 'undefined' && isMobile) ? 'book-hidden' : 'book-inline-flex book-gap-2'; // For mobile: hide, for desktop: display inline with some gap
const headerCls = (typeof isMobile !== 'undefined' && isMobile) ? 'book-text-center book-bg-white book-top-0 book-inset-x-0 book-sticky book-z-[1]' : 'book-flex book-items-center book-justify-between book-gap-2'; // For mobile: center, sticky; for desktop: flex with spacing
const headerSubCls = (typeof isMobile !== 'undefined' && isMobile) ? 'book-text-center book-my-3' : 'book-flex book-items-center book-gap-2'; // Adjust alignment and margins for mobile
const bodyCls = (typeof isMobile !== 'undefined' && isMobile) ? '' : 'book-grid book-grid-cols-2 book-gap-2'; // For mobile: no special grid; for desktop: grid with 2 columns
const bodySubCls = (typeof isMobile !== 'undefined' && isMobile) ? 'book-my-2' : ''; // Mobile margin handling
const footerCls = (typeof isMobile !== 'undefined' && isMobile) ? 'book-bg-white book-bottom-0 book-inset-x-0 book-sticky' : ''; // Sticky footer for mobile

class DatePicker {

    constructor(root) {
        this._activeModule = 'flight';
        this._enforceFHRange = false;
        // root: The main DOM element where this component will be mounted
        this.root = root;

        // Select the calendar mode (Gregorian or Jalali)
        // If GREGORIAN_DEFAULT is true, it will use the Gregorian calendar; otherwise, it will use Jalali
        this.mode = GREGORIAN_DEFAULT ? 'gregorian' : 'jalali';

        // Set the current year and month for the Jalali calendar using current dates
        this.currentJalaliYear = currentJY;
        this.currentJalaliMonth = currentJM;

        // Setup for tracking the current element and role
        this.currentEl = null;  // Reference to the currently selected input element
        this.currentRole = null; // Specifies whether the "depart" or "return" date is selected

        // Cache for storing calendar lookup results
        this._lookupMap = new Map();   // Mapping from ISO date to price
        this._lookupKey = '';          // Origin-destination key for lookup
        this._lookupLoading = false;   // Indicates if the data is still loading

        // Ensure price loader CSS is applied
        _ensurePriceLoaderCSS();

        // Build the component's structure
        this._build();

        // Sync mode buttons (Gregorian or Jalali)
        this._syncModeButtons();

        // Render the calendar initially
        this._render();
    }

    // Clears the price tags from the calendar
    _clearPriceTags() {
        this.root.querySelectorAll('.book-day-price').forEach(el => el.remove());
    }

    // Resets the lookup map and clears price tags
    _resetLookup(reason = '') {
        this._lookupMap = new Map();
        this._lookupKey = '';
        this._clearPriceTags();
    }

    // Opens the DatePicker
    open(targetEl, keepPositionIfOpen = true) {

        this.currentEl = targetEl;
        this.currentRole = targetEl.dataset.role || 'depart'; // Determine the role of the field (depart or return)
        const modEl = targetEl.closest('[data-module]');
        this._activeModule = (modEl?.dataset?.module) || getCurrentModule();

        // فقط اگر ورودی داخل بخش بخشی باشد، قفل‌کردن بازه فعال شود
        this._enforceFHRange = (this._activeModule === 'flighthotel') && !!targetEl.closest(HOTEL_PARTIAL_SCOPE_SELECTOR);

        currentField = this.currentRole;

        // Sync dates for the current module
        syncModuleDates();

        // If no dates are set for this module, remove all classes related to the selected date range
        if (!departDate && !returnDate) {
            this._clearRange();
            this.root.querySelectorAll('.book-tw__selected, .book-tw__range__start, .book-tw__range__end, .book-tw__range__mid')
                .forEach(el => {
                    el.classList.remove('book-tw__selected', 'book-tw__range__start', 'book-tw__range__end', 'book-tw__range__mid');
                });
        }

        // Get the current month and year
        // Get the current month and year
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();

        // For flighthotel module, start from primary depart date if available
        const currentMod = getCurrentModule();
        let startDate = today;
        if (currentMod === 'flighthotel') {
            const primaryDates = getPrimaryModuleDates();
            if (primaryDates?.depart) {
                startDate = primaryDates.depart;
            }
        } else if (departDate && this.currentRole === 'return') {
            // For return date, start from depart date
            startDate = departDate;
        }

        // Set the current month and year for the calendar based on the mode (Jalali or Gregorian)
        if (this.mode === 'jalali') {
            const [jy, jm] = JALALI.toJalali(
                startDate.getUTCFullYear(),
                startDate.getUTCMonth() + 1,
                startDate.getUTCDate()
            );
            this.currentJalaliYear = jy;
            this.currentJalaliMonth = jm;
        } else {
            this.currentGregorianYear = startDate.getUTCFullYear();
            this.currentGregorianMonth = startDate.getUTCMonth() + 1;
        }

        // Desktop only: when switching to "return", lock the month/year to the selected "depart" date
        if (!IS_MOBILE && this.currentRole === 'return' && departDate) {
            if (this.mode === 'jalali') {
                const [jy, jm] = JALALI.toJalali(
                    departDate.getUTCFullYear(),
                    departDate.getUTCMonth() + 1,
                    departDate.getUTCDate()
                );
                this.currentJalaliYear = jy;
                this.currentJalaliMonth = jm;
            } else {
                this.currentGregorianYear = departDate.getUTCFullYear();
                this.currentGregorianMonth = departDate.getUTCMonth() + 1;
            }
        }

        // When opening "depart", maybe fetch CalendarLookUp data (checks eligibility)
        if (this.currentRole === 'depart') {
            this._maybeFetchCalendarLookup();
        }

        const wasOpen = !this.root.classList.contains('book-hidden');

        if (this.root.parentElement !== document.body) {
            document.body.appendChild(this.root);
        }

        // If not eligible to show cached prices, reset lookup map and remove old price tags
        const container = document.querySelector('[data-calendarLookUp="true"]');

        const eligibleForLookup = !!container && currentFlightMode() === 'oneway';

        if (!eligibleForLookup) {
            this._lookupMap = new Map();
            this._lookupKey = '';
            this.root.querySelectorAll('.book-day-price').forEach(el => el.remove());
        }

        this._renderWithScrollPreserved();
        this.root.classList.remove('book-hidden');

        if (IS_MOBILE) {
            lockBodyScroll();
            return;
        }

        // If already open and we want to keep position, do not reposition
        if (wasOpen && keepPositionIfOpen) {
            return;
        }

        // Place the panel normally when freshly opened
        placePanel(this.root, targetEl, 8, !IS_LTR);

        if (this._reposition) {
            window.removeEventListener('resize', this._reposition);
            window.removeEventListener('scroll', this._reposition);
            this._reposition = null;
        }
        this._reposition = () => placePanel(this.root, targetEl, 8, !IS_LTR);
        window.addEventListener('resize', this._reposition, { passive: true });
        window.addEventListener('scroll', this._reposition, { passive: true });
    }

    // Closes the DatePicker
    close() {
        this.root.classList.add('book-hidden');

        if (this._reposition) {
            window.removeEventListener('resize', this._reposition);
            window.removeEventListener('scroll', this._reposition);
            this._reposition = null;
        }
        if (typeof isMobile !== 'undefined' && isMobile) {
            unlockBodyScroll();
        }

        this.currentEl = null;
        this.currentRole = null;
        currentField = null;
    }


    // Builds the DatePicker component
    _build() {
        const isEn = (document.documentElement.lang || '').toLowerCase().startsWith('en')
        const flipCls = isEn ? 'book-scale-x--100' : ''
        // Setting up the root container with HTML structure
        this.root.innerHTML = `
      <div class="${headerCls} book-px-2 book-py-1">
        <div class="${headerSubCls}">
          <span id="which" class="book-badge"></span>
        </div>
        <div class="book-inline-block book-bg-zinc-100 book-rounded-xl book-p-1">
          <button data-m="jalali" class="book-px-4 book-py-1 book-rounded-lg book-bg-white book-shadow-sm" type="button">${I18N[LANG].calJalali}</button>
          <button data-m="gregorian" class="book-px-4 book-py-1 book-rounded-lg" type="button">${I18N[LANG].calGregorian}</button>
        </div>
        <div class="${navWrapHidden}">
          <button data-nav="-1" class="${flipCls} book-w-10 book-h-10 book-rounded-lg book-border book-border-zinc-200 book-flex book-items-center book-justify-center"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="18" height="18">
  <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
</svg></button>
          <button data-nav="1"  class="${flipCls} book-w-10 book-h-10 book-rounded-lg book-border book-border-zinc-200 book-flex book-items-center book-justify-center"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="18" height="18">
  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"></path>
</svg></button>
        </div>
      </div>
      <div class="book-px-3">
        <div id="months" class="${bodyCls}"></div>
      </div>
      <div class="${footerCls} book-flex book-justify-between book-items-center book-px-3 book-py-2">
        <button class="book-px-4 book-py-2 book-rounded-xl book-border book-border-zinc-200" type="button" data-today>${I18N[LANG].goToday}</button>
        <div class="book-flex book-gap-2">
          <button class="book-px-4 book-py-2 book-rounded-xl book-border book-border-zinc-200 book-text-sm" type="button" data-clear>${I18N[LANG].clear}</button>
          <button class="book-px-4 book-py-2 book-rounded-xl book-bg-primary-800 book-text-white" type="button" data-ok>${I18N[LANG].okClose}</button>
        </div>
      </div>`;

        // Calendar mode switch (Jalali/Gregorian)
        this.root.querySelectorAll('[data-m]').forEach(b => {
            b.addEventListener('click', () => {
                this.mode = b.dataset.m; // Switch between Jalali and Gregorian mode
                this._syncModeButtons(); // Update button states
                if (this.mode === 'jalali') {
                    this.currentJalaliYear = currentJY;
                    this.currentJalaliMonth = currentJM;
                } else {
                    this.currentGregorianYear = TY;
                    this.currentGregorianMonth = TM;
                }
                this._render(); // Re-render the calendar
            });
        });

        // Month navigation (previous/next)
        this.root.querySelectorAll('[data-nav]').forEach(b => {
            b.addEventListener('click', () => {
                const dir = Number(b.dataset.nav);
                if (this.mode === 'jalali') {
                    this.currentJalaliMonth += dir;
                    // Adjust year if needed
                    if (this.currentJalaliMonth > 12) { this.currentJalaliMonth = 1; this.currentJalaliYear++; }
                    else if (this.currentJalaliMonth < 1) { this.currentJalaliMonth = 12; this.currentJalaliYear--; }
                    if (this.currentJalaliYear < currentJY ||
                        (this.currentJalaliYear === currentJY && this.currentJalaliMonth < currentJM)) {
                        this.currentJalaliYear = currentJY; this.currentJalaliMonth = currentJM; return;
                    }
                } else {
                    this.currentGregorianMonth = this.currentGregorianMonth || TM;
                    this.currentGregorianYear = this.currentGregorianYear || TY;

                    this.currentGregorianMonth += dir;
                    if (this.currentGregorianMonth > 12) { this.currentGregorianMonth = 1; this.currentGregorianYear++; }
                    else if (this.currentGregorianMonth < 1) { this.currentGregorianMonth = 12; this.currentGregorianYear--; }

                    if (this.currentGregorianYear < TY ||
                        (this.currentGregorianYear === TY && this.currentGregorianMonth < TM)) {
                        this.currentGregorianYear = TY; this.currentGregorianMonth = TM; return;
                    }
                }
                this._render(); // Re-render the calendar with the updated month/year
            });
        });

        // Clear the selected date
        this.root.querySelector('[data-clear]').addEventListener('click', () => {
            if (!this.currentEl) return;
            if (this.currentRole === 'depart') {
                updateModuleDate('depart', null); // Clear the departure date
            } else {
                updateModuleDate('return', null); // Clear the return date
            }

            this.currentEl.value = ''; // Clear the input field
            delete this.currentEl.dataset.gregorian;
            delete this.currentEl.dataset.jalali;
            lastPickedField = null;
            this._renderWithScrollPreserved(); // Re-render the calendar
        });

        // Reset to today's date
        this.root.querySelector('[data-today]').addEventListener('click', () => {
            if (this.mode === 'jalali') { this.currentJalaliYear = currentJY; this.currentJalaliMonth = currentJM; }
            else { this.currentGregorianYear = TY; this.currentGregorianMonth = TM; }
            this._renderWithScrollPreserved(); // Re-render calendar with today's date
            this._flashToday(); // Highlight today's date
        });

        // Close the date picker
        this.root.querySelector('[data-ok]').addEventListener('click', () => this.close());

        // Clear range when mouse leaves the calendar completely
        this.root.addEventListener('mouseleave', () => {
            if (this.currentRole === 'return' && departDate && returnDate) {
                this._drawRange(departDate, returnDate); // Draw range between depart and return dates
            }
        });
    }

    // Highlights today's date on the calendar
    _flashToday() {
        const todayCell = this.root.querySelector('.book-tw__today');
        if (!todayCell) return;
        if (IS_MOBILE) {
            todayCell.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
        }
        todayCell.classList.add('book-flash-today');
        const remove = () => todayCell.classList.remove('book-flash-today');
        todayCell.addEventListener('animationend', remove, { once: true });
        setTimeout(remove, 2200); // Remove the highlight after 2.2 seconds
    }

    // Syncs the mode buttons to reflect the current mode
    _syncModeButtons() {
        this.root.querySelectorAll('[data-m]').forEach(x =>
            x.classList.remove('book-bg-white', 'book-shadow-sm') // Remove active class from all buttons
        );
        const active = this.root.querySelector(`[data-m="${this.mode}"]`);
        if (active) active.classList.add('book-bg-white', 'book-shadow-sm'); // Add active class to the current mode button
    }

    // Updates the state of the previous month navigation button
    _updatePrevState() {
        const prev = this.root.querySelector('[data-nav="-1"]');
        let atMin = false;

        if (this.mode === 'jalali') {
            atMin = (this.currentJalaliYear === currentJY && this.currentJalaliMonth === currentJM);
        } else {
            const cgy = this.currentGregorianYear || TY;
            const cgm = this.currentGregorianMonth || TM;
            atMin = (cgy === TY && cgm === TM);
        }
        prev.disabled = atMin;
        prev.classList.toggle('book-tw__disabled__btn', atMin);
    }

    // Writes the selected date to the input field
    _write(el, dUTC) {
        if (this.mode === 'jalali') {
            const [jy, jm, jd] = JALALI.toJalali(dUTC.getUTCFullYear(), dUTC.getUTCMonth() + 1, dUTC.getUTCDate());
            el.value = `${jy}-${fmt2(jm)}-${fmt2(jd)}`;
        } else {
            el.value = `${dUTC.getUTCFullYear()}-${fmt2(dUTC.getUTCMonth() + 1)}-${fmt2(dUTC.getUTCDate())}`;
        }
        const [jy2, jm2, jd2] = JALALI.toJalali(dUTC.getUTCFullYear(), dUTC.getUTCMonth() + 1, dUTC.getUTCDate());
        el.dataset.gregorian = iso(dUTC.getUTCFullYear(), dUTC.getUTCMonth() + 1, dUTC.getUTCDate());
        el.dataset.jalali = `${jy2}-${fmt2(jm2)}-${fmt2(jd2)}`;
    }

    // Renders the calendar based on the selected mode
    _render() {
        this.root.querySelector('#which').textContent =
            (this.currentRole === 'return') ? I18N[LANG].selectReturn : I18N[LANG].selectDepart;

        const box = this.root.querySelector('#months');
        box.innerHTML = '';

        if (this.mode === 'jalali') {
            if (typeof isMobile !== 'undefined' && isMobile) {
                let y = this.currentJalaliYear;
                let m = this.currentJalaliMonth;
                for (let i = 0; i < 12; i++) {
                    box.appendChild(this._renderJalaliMonth(y, m));
                    m++;
                    if (m > 12) { m = 1; y++; }
                }
            } else {
                box.appendChild(this._renderJalaliMonth(this.currentJalaliYear, this.currentJalaliMonth));
                let nm = this.currentJalaliMonth + 1, ny = this.currentJalaliYear;
                if (nm > 12) { nm = 1; ny++; }
                box.appendChild(this._renderJalaliMonth(ny, nm));
            }
        } else {
            const cgy = this.currentGregorianYear || TY;
            const cgm = this.currentGregorianMonth || TM;

            if (typeof isMobile !== 'undefined' && isMobile) {
                let y = cgy, m = cgm;
                for (let i = 0; i < 12; i++) {
                    box.appendChild(this._renderGregorianMonth(dateUTC(y, m, 1)));
                    m++;
                    if (m > 12) { m = 1; y++; }
                }
            } else {
                const mUTC = dateUTC(cgy, cgm, 1);
                box.appendChild(this._renderGregorianMonth(mUTC));
                let nm = cgm + 1, ny = cgy;
                if (nm > 12) { nm = 1; ny++; }
                box.appendChild(this._renderGregorianMonth(dateUTC(ny, nm, 1)));
            }
        }

        if (departDate && returnDate) this._drawRange(departDate, returnDate);
        this._updatePrevState();

        const monthsContainer = this.root.querySelector('#months');
        if (monthsContainer) {
            // Remove previous listener if any
            const oldListener = monthsContainer._mouseLeaveHandler;
            if (oldListener) {
                monthsContainer.removeEventListener('mouseleave', oldListener);
            }

            // Add new mouse leave listener
            const newListener = () => {
                if (this.currentRole === 'return' && departDate && returnDate) {
                    this._drawRange(departDate, returnDate);
                } else if (this.currentRole === 'return' && departDate && !returnDate) {
                    this._clearRange();
                }
            };
            monthsContainer.addEventListener('mouseleave', newListener);
            monthsContainer._mouseLeaveHandler = newListener;
        }
    }


    // Disable only dates prior to today
    _isDisabledCell(dUTC) {
        // 1) تاریخ‌های گذشته همیشه بسته‌اند
        if (ymdKeyFromDateUTC(dUTC) < todayKey) return true;

        // 2) فقط اگر ورودیِ تاریخ داخل بخش «هتلِ بخشی» باشد، به بازه‌ی پرواز قفل کن
        if (this._enforceFHRange) {
            // منبع بازه‌ی پرواز: اول flight، بعد flighthotel (fallback)
            const pd =
                getPrimaryModuleDates() ||
                MODULE_DATES.get('flighthotel') ||
                MODULE_DATES.get('flight');

            if (pd?.depart && pd?.return) {
                const cellKey = ymdKeyFromDateUTC(dUTC);
                const startKey = ymdKeyFromDateUTC(pd.depart);
                const endKey = ymdKeyFromDateUTC(pd.return);
                if (cellKey < startKey || cellKey > endKey) return true; // بیرون از بازه را ببند
            } else if (pd?.depart) {
                const cellKey = ymdKeyFromDateUTC(dUTC);
                const startKey = ymdKeyFromDateUTC(pd.depart);
                if (cellKey < startKey) return true;
            }
        }

        // 3) در غیر این صورت (جفت اصلی یا ماژول‌های دیگر) آزاد است
        return false;
    }


    // Renders a Jalali month grid
    _renderJalaliMonth(jy, jm) {
        const wrap = document.createElement('div');
        wrap.className = `book-border book-border-zinc-200 book-rounded-2xl book-overflow-hidden ${bodySubCls}`;
        const title = `${I18N[LANG].jMonthName(jm)} ${jy}`; // Title with the month and year
        wrap.innerHTML = `
      <div class="book-text-center book-font-bold book-bg-zinc-50 book-py-2">${title}</div>
      <div class="book-grid book-grid-cols-7 book-gap-1 book-p-2 book-text-center book-select-none"></div>`;
        const grid = wrap.querySelector('.book-grid');

        // Set grid direction to RTL for Jalali month
        grid.style.direction = 'rtl';

        // Add weekdays to the calendar
        I18N[LANG].weekdaysJalali.forEach(n => {
            const h = document.createElement('div');
            h.className = 'book-text-xs book-text-zinc-500';
            h.textContent = n;
            grid.appendChild(h);
        });

        const dim = getJalaliMonthDays(jy, jm); // Get number of days in the month

        // Convert the first day of the month to Gregorian
        const [fgy, fgm, fgd] = JALALI.toGregorian(jy, jm, 1);
        const firstUTC = dateUTC(fgy, fgm, fgd);
        const jsWeekDay = firstUTC.getUTCDay(); // 0..6
        const persianWeekDay = (jsWeekDay + 1) % 7; // Adjust the Persian weekday

        // Empty cells before the first day
        for (let i = 0; i < persianWeekDay; i++) {
            const d = document.createElement('div');
            d.className = 'book-h-9 book-rounded-lg book-text-zinc-400';
            grid.appendChild(d);
        }

        // Render each day in the grid
        for (let day = 1; day <= dim; day++) {
            const [gy, gm, gd] = JALALI.toGregorian(jy, jm, day); // Convert each day to Gregorian
            const dUTC = dateUTC(gy, gm, gd); // Get the UTC date

            const cell = document.createElement('div');
            cell.className = 'book-h-9 book-flex book-items-center book-justify-center book-rounded-lg book-cursor-pointer book-text-sm book-cell';
            cell.dataset.iso = iso(gy, gm, gd); // Store ISO date in data attribute
            const inner = document.createElement('div');
            inner.className = "book-flex book-flex-col book-items-center book-justify-center leading-tight";
            inner.textContent = day;
            cell.appendChild(inner);

            // Disable past dates
            if (this._isDisabledCell(dUTC)) cell.classList.add('book-pointer-events-none', 'book-text-zinc-400', 'book-line-through');
            // Highlight today's date
            if (sameUTC(dUTC, calToday)) cell.classList.add('book-tw__today');

            // Highlight holidays and weekends
            const holidayInfo = isJalaliHoliday(jy, jm, day);
            const dayOfWeek = (dUTC.getUTCDay() + 1) % 7;

            if (holidayInfo.isHoliday || dayOfWeek === 6) {
                cell.classList.add('book-text-red-600', 'book-font-bold');
                if (holidayInfo.isHoliday) {
                    cell.dataset.tip = holidayInfo.name;
                    cell.classList.add('book-holiday');
                    cell.removeAttribute('title');
                    cell.setAttribute('aria-label', holidayInfo.name);
                }
            }

            // Highlight selected depart and return dates
            if (departDate && sameUTC(dUTC, departDate)) cell.classList.add('book-tw__selected');
            if (returnDate && sameUTC(dUTC, returnDate)) cell.classList.add('book-tw__selected');

            // Add event listeners to each cell
            this._addCellEvents(cell, dUTC);
            grid.appendChild(cell);
            this._attachPriceIfAny(cell);
        }
        return wrap;
    }

    // Renders a Gregorian month grid
    _renderGregorianMonth(gregorianMonthUTC) {
        const y = gregorianMonthUTC.getUTCFullYear();
        const m = gregorianMonthUTC.getUTCMonth() + 1;
        const days = new Date(Date.UTC(y, m, 0)).getUTCDate(); // Get the number of days in the month

        const wrap = document.createElement('div');
        wrap.className = `book-border book-border-zinc-200 book-rounded-2xl book-overflow-hidden ${bodySubCls}`;

        const title = `${I18N[LANG].gMonthName(m)} ${y}`;
        wrap.innerHTML = `
    <div class="book-text-center book-font-bold book-bg-zinc-50 book-py-2 book-font-arial">${title}</div>
    <div class="book-grid book-grid-cols-7 book-gap-1 book-p-2 book-text-center book-select-none"></div>`;
        const grid = wrap.querySelector('.book-grid');

        // Set grid direction based on the Gregorian mode (LTR or RTL)
        grid.style.direction = GREGORIAN_RTL_START ? 'rtl' : 'ltr';

        // Add weekdays to the calendar
        I18N[LANG].weekdaysGregorian.forEach(n => {
            const h = document.createElement('div');
            h.className = 'book-text-xs book-text-zinc-500';
            h.textContent = n;
            grid.appendChild(h);
        });

        // Determine the first day of the month
        const firstDayUTC = dateUTC(y, m, 1);
        for (let i = 0; i < firstDayUTC.getUTCDay(); i++) {
            const d = document.createElement('div');
            d.className = 'book-h-9 book-rounded-lg book-text-zinc-400';
            grid.appendChild(d);
        }

        // Render each day in the grid
        for (let day = 1; day <= days; day++) {
            const dUTC = dateUTC(y, m, day);

            const cell = document.createElement('div');
            cell.className = 'book-h-9 book-flex book-items-center book-justify-center book-rounded-lg book-cursor-pointer book-text-sm book-cell';
            cell.dataset.iso = iso(y, m, day); // Store ISO date in data attribute
            const inner = document.createElement('div');
            inner.className = "book-flex book-flex-col book-items-center book-justify-center leading-tight book-font-arial";
            inner.textContent = day;
            cell.appendChild(inner);

            // Disable past dates
            if (this._isDisabledCell(dUTC)) {
                cell.classList.add('book-pointer-events-none', 'book-text-zinc-400', 'book-line-through');
            }

            // Highlight today's date
            if (sameUTC(dUTC, calToday)) {
                cell.classList.add('book-tw__today');
            }

            // Highlight weekends (Saturday and Sunday)
            const dow = dUTC.getUTCDay(); // 0=Sun .. 6=Sat
            if (dow === 0 || dow === 6) {
                cell.classList.add('book-text-red-600', 'book-font-bold');
            }

            // Highlight selected depart and return dates
            if (departDate && sameUTC(dUTC, departDate)) {
                cell.classList.add('book-tw__selected');
            }
            if (returnDate && sameUTC(dUTC, returnDate)) {
                cell.classList.add('book-tw__selected');
            }

            // Add event listeners to each cell
            this._addCellEvents(cell, dUTC);
            grid.appendChild(cell);
            this._attachPriceIfAny(cell);
        }
        return wrap;
    }

    // Adds event listeners to each calendar cell
    _addCellEvents(cell, dUTC) {
        // Hover effect for return date selection
        cell.addEventListener('mouseenter', () => {
            if (this.currentRole === 'return' && departDate && !cell.classList.contains('book-pointer-events-none')) {
                const hoverKey = ymdKeyFromDateUTC(dUTC);
                const departKey = ymdKeyFromDateUTC(departDate);

                if (hoverKey > departKey) {
                    if (!returnDate || hoverKey <= ymdKeyFromDateUTC(returnDate)) {
                        this._drawRange(departDate, dUTC); // Draw the range between depart and return dates
                    }
                }
            }
        });

        // Mouse leave event to clear the range
        cell.addEventListener('mouseleave', () => {
            if (this.currentRole === 'return' && departDate && returnDate) {
                this._drawRange(departDate, returnDate); // Redraw the range
            } else if (this.currentRole === 'return' && departDate && !returnDate) {
                this._clearRange(); // Clear the range if there's no return date selected
            }
        });

        // Click event to select the date
        cell.addEventListener('click', () => {
            if (cell.classList.contains('book-pointer-events-none')) return; // Prevent selecting disabled dates
            if (!this.currentEl) return;
            if (this.currentRole === 'depart') {
                // Handle selecting "depart" date
                updateModuleDate('depart', dUTC);
                this._write(this.currentEl, dUTC); // Update the input field
                lastPickedField = 'depart';

                // Handle multi-city date selection
                const isMultiCity = currentFlightMode() === 'multi';
                if (isMultiCity) {
                    this._handleMultiCityDateSelection(this.currentEl, dUTC);
                }

                const pair = getPairInput(this.currentEl);
                const returnEnabled = pair && !pair.disabled && pair.offsetParent !== null;
                if (returnEnabled) {
                    this.open(pair, true); // Open the return date picker
                    return;
                }
            }

            else {
                // Handle selecting "return" date
                if (!departDate) {
                    const departInput = getPairInput(this.currentEl);
                    if (departInput && departInput.dataset.gregorian) {
                        updateModuleDate('depart', parseISOasUTC(departInput.dataset.gregorian)); // Sync depart date
                    } else {
                        updateModuleDate('depart', calToday); // Default to today
                        if (departInput) this._write(departInput, departDate);
                    }
                }

                // Handle return date selection after depart date is selected
                if (ymdKeyFromDateUTC(dUTC) < ymdKeyFromDateUTC(departDate)) {
                    // Select return date immediately after depart date
                    updateModuleDate('depart', dUTC);
                    const next = new Date(Date.UTC(dUTC.getUTCFullYear(), dUTC.getUTCMonth(), dUTC.getUTCDate()));
                    next.setUTCDate(next.getUTCDate() + 1);
                    updateModuleDate('return', next);

                    // Write both dates to the inputs
                    const departInput = getPairInput(this.currentEl);
                    if (departInput) this._write(departInput, departDate);
                    this._write(this.currentEl, returnDate);
                } else {
                    // Normal case for selecting return date
                    updateModuleDate('return', dUTC);
                    this._write(this.currentEl, dUTC);
                }
                lastPickedField = 'return';
            }

            this._renderWithScrollPreserved(); // Re-render the calendar
        });
    }


    /**
     * Handles the date selection for multi-city routes by adjusting dates for all subsequent routes
     * based on the selected departure date and previous routes' dates.
     */
    _handleMultiCityDateSelection(selectedInput, selectedDateUTC) {
        try {
            const routeBlock = selectedInput.closest('.route-content'); // Find the closest route block to the selected input
            const allRoutes = document.querySelectorAll('.route-content'); // Get all route blocks
            const currentIndex = parseInt(routeBlock.dataset.index) - 1; // Get the index of the current route

            let minPreviousDate = null;
            // Iterate through previous routes to find the earliest departure date
            for (let i = 0; i < currentIndex; i++) {
                const prevRoute = allRoutes[i];
                const prevDateInput = prevRoute.querySelector('.departure__date');
                if (prevDateInput && prevDateInput.dataset.gregorian) {
                    const prevDate = parseISOasUTC(prevDateInput.dataset.gregorian);
                    if (!minPreviousDate || ymdKeyFromDateUTC(prevDate) < ymdKeyFromDateUTC(minPreviousDate)) {
                        minPreviousDate = prevDate; // Store the earliest date
                    }
                }
            }

            // Adjust dates for all routes based on the selected date
            if (minPreviousDate && ymdKeyFromDateUTC(selectedDateUTC) < ymdKeyFromDateUTC(minPreviousDate)) {
                let currentDate = new Date(selectedDateUTC.getTime());

                // Iterate through all routes and adjust their departure dates
                allRoutes.forEach((route, index) => {
                    const dateInput = route.querySelector('.departure__date');
                    if (dateInput) {
                        this._write(dateInput, currentDate); // Update the date input with the new date

                        currentDate = new Date(currentDate.getTime()); // Update to the next day
                        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
                    }
                });
            } else {
                let nextDate = new Date(selectedDateUTC.getTime());
                nextDate.setUTCDate(nextDate.getUTCDate() + 1); // Set the next date to be the following day

                // Adjust dates for all subsequent routes
                for (let i = currentIndex + 1; i < allRoutes.length; i++) {
                    const nextRoute = allRoutes[i];
                    const nextDateInput = nextRoute.querySelector('.departure__date');

                    if (nextDateInput && nextDateInput.dataset.gregorian) {
                        const existingDate = parseISOasUTC(nextDateInput.dataset.gregorian);

                        // If the existing date is before the next date, update the route date
                        if (ymdKeyFromDateUTC(existingDate) < ymdKeyFromDateUTC(nextDate)) {
                            this._write(nextDateInput, nextDate);
                        } else {
                            nextDate = new Date(existingDate.getTime()); // Set next date to the existing date
                        }
                    }

                    // Move to the next day
                    nextDate = new Date(nextDate.getTime());
                    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
                }
            }
        } catch (error) {
            console.error("_handleMultiCityDateSelection: " + error.message); // Log any errors
        }
    }

    // Clears the date range highlight on the calendar
    _clearRange() {
        this.root.querySelectorAll('.book-grid .book-h-9').forEach(c =>
            c.classList.remove('book-tw__range__start', 'book-tw__range__end', 'book-tw__range__mid')); // Remove range classes
    }

    // Draws the date range between two selected dates
    _drawRange(aUTC, bUTC) {
        this._clearRange(); // Clear any existing range
        if (!aUTC || !bUTC) return; // If no dates are selected, return early
        const sKey = Math.min(ymdKeyFromDateUTC(aUTC), ymdKeyFromDateUTC(bUTC)); // Get the start date key
        const eKey = Math.max(ymdKeyFromDateUTC(aUTC), ymdKeyFromDateUTC(bUTC)); // Get the end date key
        this.root.querySelectorAll('[data-iso]').forEach(cell => {
            const cd = parseISOasUTC(cell.dataset.iso); // Get the ISO date from the cell
            const key = ymdKeyFromDateUTC(cd); // Get the date key
            if (key === sKey) cell.classList.add('book-tw__range__start'); // Highlight the start of the range
            else if (key === eKey) cell.classList.add('book-tw__range__end'); // Highlight the end of the range
            else if (key > sKey && key < eKey) cell.classList.add('book-tw__range__mid'); // Highlight the dates in between
        });
    }

    // Attach price information to a calendar cell, if available
    _attachPriceIfAny(cell) {
        if (!cell?.dataset?.iso) return; // If no ISO date, return early

        // If the cell is disabled, remove any existing price tag
        if (cell.classList.contains('book-pointer-events-none')) {
            const old = cell.querySelector('.book-day-price');
            if (old) old.remove();
            return;
        }

        let tag = cell.querySelector('.book-day-price');
        const ensureTag = () => {
            if (!tag) {
                tag = document.createElement('small'); // Create a new tag for the price
                tag.className = 'book-day-price';
                const inner = cell.firstChild;
                if (inner) inner.appendChild(tag);
            }
            return tag;
        };

        if (this._lookupLoading) {
            const t = ensureTag(); // If lookup is loading, show loading dots
            t.classList.add('-dots');
            t.innerHTML = '<span></span><span></span><span></span>';
            return;
        }

        const price = this._lookupMap?.get(cell.dataset.iso); // Get the price for the selected date
        if (price != null) {
            const t = ensureTag();
            t.classList.remove('-dots'); // Remove loading dots
            t.textContent = formatPriceCompact(price, 'biasFloor'); // Display the price
        } else {
            if (tag) tag.remove(); // If no price, remove the price tag
        }
    }


    /**
   * Fetches calendar data for a specific origin and destination if they meet the criteria.
   * This function checks if the flight mode is "oneway" and fetches the available dates and prices.
   */
    async _maybeFetchCalendarLookup() {
        try {
            // Eligibility check: Ensure the container is opt-in and flight mode is "oneway"
            const container = document.querySelector('[data-calendarLookUp="true"]');

            const eligible = !!container && currentFlightMode() === 'oneway';

            if (!eligible) return; // If not eligible, exit

            // Fetch origin and destination IDs
            const { origin, destination } = readODIds();
            if (!origin || !destination) return; // Exit if either origin or destination is missing

            const newKey = `${origin}_${destination}`; // Create a key based on origin and destination

            // If origin and destination changed, clear previous lookup data
            if (this._lookupKey !== newKey && this._lookupMap.size) {
                this._lookupMap = new Map();
                this._lookupKey = '';
                this._clearPriceTags?.(); // Remove any existing price tags
            }

            // If the data has already been fetched for the current origin and destination, return early
            if (this._lookupKey === newKey && this._lookupMap.size) return;

            // Show loading indicators and render placeholders
            this._lookupLoading = true;
            this._renderWithScrollPreserved();

            // Prepare request body for API call
            const dmnid = document.querySelector('[data-dmnid]')?.dataset?.dmnid || '';
            const body = {
                origin: String(origin),
                destination: String(destination),
                dmnid: String(dmnid),
            };

            // Fetch data from the API
            const res = await fetch('https://basisfly.com/apihub/flight/calendarLookUp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`); // If request fails, throw error

            // Parse the response data
            const data = await res.json();

            const map = new Map();
            for (const row of (Array.isArray(data) ? data : [])) {
                const id = row?.date_id;
                const raw = row?.min_price?.parsedValue ?? row?.min_price; // Extract price
                const num = Number(raw);
                if (!id || !Number.isFinite(num)) continue; // Skip invalid data
                const isoKey = isoFromCalendarDateId(id); // Convert date_id to ISO format
                map.set(isoKey, num); // Map the ISO key to the price
            }

            // Update the lookup map with the fetched data
            this._lookupMap = map;
            this._lookupKey = newKey; // Set the new key for future lookups
        } catch (err) {
            console.error('calendarLookUp fetch failed:', err); // Log any errors
            this._clearPriceTags?.(); // Clear price tags in case of failure
        } finally {
            this._lookupLoading = false; // Turn off loading indicator
            this._renderWithScrollPreserved(); // Re-render with scroll position preserved
        }
    }

    /**
     * Renders the calendar while preserving the scroll position on mobile.
     */
    _renderWithScrollPreserved() {
        if (!IS_MOBILE) {
            this._render(); // For non-mobile, just render the calendar normally
            return;
        }

        const scroller = this.root;
        const prev = scroller.scrollTop; // Store the previous scroll position

        const anchorBefore = scroller.querySelector('.book-tw__selected') ||
            scroller.querySelector('.book-tw__today'); // Find the previously selected or today's date

        this._render(); // Re-render the calendar

        // Ensure the previously selected or today's date stays in view after rendering
        requestAnimationFrame(() => {
            const anchorAfter = scroller.querySelector('.book-tw__selected') ||
                scroller.querySelector('.book-tw__today');
            if (anchorAfter) {
                anchorAfter.scrollIntoView({ block: 'nearest', inline: 'nearest' }); // Scroll to the selected or today's date
            } else {
                scroller.scrollTop = prev; // Otherwise, keep the scroll position
            }
        });
    }

}

/* =========================
   init + global listeners
   ========================= */
picker = new DatePicker(document.getElementById('picker'));
// Add event listener to flight type buttons to manage return date when flight mode changes
document.querySelectorAll('.book-module__type').forEach(moduleTypeContainer => {
    moduleTypeContainer.querySelectorAll('li').forEach(btn => {
        btn.addEventListener('click', () => {
            setTimeout(() => {
                // Find which module this belongs to
                const moduleElement = moduleTypeContainer.closest('[data-module]');
                const moduleName = moduleElement?.dataset?.module || 'flight';

                // Get the flight mode for this specific module
                const activeBtn = moduleTypeContainer.querySelector('.book-active__module__type');
                let mode = 'oneway';
                if (activeBtn) {
                    const text = (activeBtn?.textContent || '').trim();
                    if (text.includes('یک طرفه') || text.toLowerCase().includes('one')) mode = 'oneway';
                    else if (text.includes('رفت') || text.toLowerCase().includes('round')) mode = 'roundtrip';
                    else if (text.includes('چند') || text.toLowerCase().includes('multi')) mode = 'multi';
                }

                if (mode !== 'roundtrip') {
                    // Get dates for this specific module
                    const moduleData = MODULE_DATES.get(moduleName) || { depart: null, return: null };
                    const oldReturnDate = moduleData.return;

                    // Clear return date for this module
                    moduleData.return = null;
                    MODULE_DATES.set(moduleName, moduleData);

                    // Sync if this is the current module
                    if (moduleName === getCurrentModule()) {
                        returnDate = null;
                    }

                    // Clear return date inputs for this specific module
                    const returnInputs = moduleElement.querySelectorAll('.js-date-input[data-role="return"]');
                    returnInputs.forEach(inp => {
                        inp.value = '';
                        delete inp.dataset.gregorian;
                        delete inp.dataset.jalali;
                    });

                    // Clear the range in the date picker if it's open for this module
                    if (picker?.root && moduleName === getCurrentModule()) {
                        picker._clearRange();
                        if (oldReturnDate) {
                            picker.root.querySelectorAll('[data-iso]').forEach(cell => {
                                try {
                                    const cellDate = parseISOasUTC(cell.dataset.iso);
                                    if (sameUTC(cellDate, oldReturnDate)) {
                                        cell.classList.remove('book-tw__selected');
                                    }
                                } catch (e) {
                                    // Skip invalid cells
                                }
                            });
                        }

                        // Re-render the date picker if it was open
                        const isOpen = !picker.root.classList.contains('book-hidden');
                        if (isOpen) {
                            picker._renderWithScrollPreserved();
                        }
                    }
                }
            }, 150);
        });
    });
});
// Function to open date picker when a date input is clicked
function openIfDateInput(target) {
    if (target && target.matches('.js-date-input')) picker.open(target);
}

// Track if the last key press was 'Tab' (for accessibility)
let _lastKeyWasTab = false;
document.addEventListener('keydown', (e) => {
    _lastKeyWasTab = (e.key === 'Tab'); // If the 'Tab' key is pressed, set the flag to true
});

// Open date picker when a date input is clicked
document.addEventListener('click', (e) => openIfDateInput(e.target));

// Open date picker on focus for date input, only on mobile or after pressing 'Tab' on desktop
document.addEventListener('focusin', (e) => {
    const t = e.target;
    if (!t || !t.matches('.js-date-input')) return;

    const mobile = (typeof isMobile !== 'undefined' && isMobile); // Check if the user is on mobile
    if (mobile) {
        picker.open(t); // Open picker on mobile immediately
    } else {
        if (_lastKeyWasTab) picker.open(t); // On desktop, open picker if 'Tab' was pressed
    }
    _lastKeyWasTab = false; // Reset the flag after focus
});

// Close the date picker if a click occurs outside of it
document.addEventListener('mousedown', (event) => {
    const t = event.target;
    if (picker && !picker.root.classList.contains('book-hidden')) {
        if (!picker.root.contains(t) && !(t.closest && t.closest('.js-date-input'))) {
            picker.close(); // Close picker if the click is outside of the picker or a date input
        }
    }
});

// Close the date picker when the 'Escape' key is pressed
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && picker && !picker.root.classList.contains('book-hidden')) {
        picker.close(); // Close picker on Escape key press
    }
});

/* =========================
   Reset helper
   ========================= */
// Function to reset the calendar state
function resetCalendarState(schemaId) {
    try {
        // Reset date picker and close if it's open
        if (typeof picker !== 'undefined' && picker?.root) {
            // Remove the selected and range classes from the date cells
            picker.root
                .querySelectorAll('.book-tw__range__start, .book-tw__range__end, .book-tw__range__mid, .book-tw__selected')
                .forEach(el => el.classList.remove('book-tw__range__start', 'book-tw__range__end', 'book-tw__range__mid', 'book-tw__selected'));
            picker.close?.(); // Close the picker if open
        }

        // Reset the current field and last picked field
        if (typeof currentField !== 'undefined') currentField = null;
        if (typeof lastPickedField !== 'undefined') lastPickedField = null;

        // Clear current module dates (depart and return)
        const dates = getModuleDates();
        dates.depart = null;
        dates.return = null;
        departDate = null;
        returnDate = null;

        // Clear the date inputs, reset values and remove any date-related dataset properties
        document.querySelectorAll('.js-date-input, .departure__date, .arrival__date')
            .forEach(inp => {
                if (schemaId === 292) {
                    inp.value = '';
                    if (inp.dataset) {
                        delete inp.dataset.gregorian;
                        delete inp.dataset.jalali;
                    }
                }
            });

        // Re-render the picker if it's available
        if (typeof picker !== 'undefined') picker?._render?.();
    } catch (e) {
        console.error('resetCalendarState:', e); // Catch and log any errors
    }
}

// Helper to lock the body scroll position (used when date picker is open)
let _scrollY = 0;
function lockBodyScroll() {
    _scrollY = window.scrollY || window.pageYOffset; // Store the current scroll position
    document.body.style.position = 'fixed'; // Fix the body in place
    document.body.style.top = `-${_scrollY}px`; // Prevent scroll by fixing the body position
    document.body.style.width = '100%'; // Ensure body width is 100%
    document.body.style.overflow = 'hidden'; // Disable body overflow (scrolling)
}

// Helper to unlock the body scroll position (used when date picker is closed)
function unlockBodyScroll() {
    document.body.style.position = ''; // Reset body position
    document.body.style.top = ''; // Reset top position
    document.body.style.width = ''; // Reset width
    document.body.style.overflow = ''; // Enable overflow (scrolling)
    window.scrollTo(0, _scrollY || 0); // Restore the scroll position
}

// Function to format price (Rial → million Toman, rounded or floored)
function formatPriceCompact(rial, mode = 'biasFloor') {
    if (rial == null) return ''; // If no price provided, return an empty string
    // Convert Rial to Toman and then to million
    const x = Number(rial) / 1e7; // Convert Rial to Toman and then to million
    let val;
    if (mode === 'round') val = Math.round(x * 10) / 10; // Round to 1 decimal place
    else if (mode === 'floor') val = Math.floor(x * 10) / 10; // Floor to 1 decimal place
    else {
        val = Math.floor((x - 0.05) * 10) / 10; // Bias floor to 1 decimal place
    }
    return val.toFixed(1); // Return the formatted value with 1 decimal place
}

// Function to add the price loader CSS (for animated dots during loading)
function _ensurePriceLoaderCSS() {
    if (document.getElementById('price-loader-css')) return; // If the CSS is already added, return
    const css = `
    .book-day-price{display:block;font-size:11px;line-height:1.1;margin-top:2px;opacity:.9}
    .book-day-price.-dots{display:flex;gap:3px;align-items:center;justify-content:center}
    .book-day-price.-dots span{width:3px;height:3px;border-radius:50%;background:currentColor;opacity:.25;animation:bdots 1.2s infinite}
    .book-day-price.-dots span:nth-child(2){animation-delay:.2s}
    .book-day-price.-dots span:nth-child(3){animation-delay:.4s}
    @keyframes bdots{0%,80%,100%{opacity:.25}40%{opacity:1}}
    .book-holiday{cursor:help}    `;
    const el = document.createElement('style');
    el.id = 'price-loader-css'; // Set the ID of the new style element
    el.textContent = css; // Add the CSS content
    document.head.appendChild(el); // Append the CSS to the document head
}