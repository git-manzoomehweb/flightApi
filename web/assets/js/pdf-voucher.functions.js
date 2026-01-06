// ----------------------------- Voucher PDF --------------------------------
// متغیرهای کنترل لودینگ
let loadingStartTime = Date.now();
let isContentLoaded = false;
let isMinTimeElapsed = false;
let apiDataLoaded = false;
const MIN_LOADING_TIME = 4000; // 2 ثانیه حداقل
let mainlid;
let translations;

function setlid(lid) {
  mainlid = lid;
}

function initializePageLanguage(lid) {
   translations = {
    1: {
      // فارسی
      lang: "fa",
      dir: "rtl",
      mainTitle: "واچر",
      contractNumber: "شماره قرارداد",
      issueDate: "تاریخ صدور",
      contractTime: "ساعت قرارداد",
      accessDenied: "شما اجازه دسترسی به این صفحه را ندارید",
      loadingText: "در حال بارگذاری",
      pdfLoadingText: "در حال تولید PDF",
      textAlign: "text-right",
      justifyContent: "!justify-end",
      hotelissue: `<p style="text-align:center">هتل شما صادر نشد</p>
                <p style="text-align:center">Hotel is not issued </p>
                <p style="text-align:center"> جهت هماهنگی و پاسخگویی به سوالات خود با واحد پشتیبانی تماس حاصل نمایید</p>
               <p style="text-align:center">Contact the support unit to coordinate and answer your questions</p>`,


      reject: `<p style="text-align:center"> متاسفانه هتل شما تایید نشد</p>
                <p style="text-align:center">Unfortunately, your hotel was not approved </p>
                <p style="text-align:center"> جهت هماهنگی و پاسخگویی به سوالات خود با واحد پشتیبانی تماس حاصل نمایید</p>
               <p style="text-align:center">Contact the support unit to coordinate and answer your questions</p>`,

      onrequest: `               <p style="text-align:center"> واچر شما منتظر تایید واحد رزواسیون است </p>
              <p style="text-align:center">Your voucher is waiting for the approval of the reservation </p>
   
               <p style="text-align:center"> جهت هماهنگی و پاسخگویی به سوالات خود با واحد پشتیبانی تماس حاصل نمایید</p>
               <p style="text-align:center">Contact the support unit to coordinate and answer your questions</p>`,
    },
    2: {
      // انگلیسی
      lang: "en",
      dir: "ltr",
      mainTitle: "Voucher",
      contractNumber: "Contract Number",
      issueDate: "Issue Date",
      contractTime: "Contract Time",
      accessDenied: "You do not have permission to access this page",
      loadingText: "Loading",
      pdfLoadingText: "Generating PDF",
      textAlign: "text-left",
      justifyContent: "!justify-start",

      hotelissue: `
                <p style="text-align:center">Hotel is not issued </p>
               <p style="text-align:center">Contact the support unit to coordinate and answer your questions</p>`,
      reject: `
                <p style="text-align:center">Unfortunately, your hotel was not approved </p>
               <p style="text-align:center">Contact the support unit to coordinate and answer your questions</p>`,
      onrequest: `<p style="text-align:center">Your voucher is waiting for the approval of the reservation </p>
               <p style="text-align:center">Contact the support unit to coordinate and answer your questions</p>`,

    },
    3: {
      // عربی
      lang: "ar",
      dir: "rtl",
      mainTitle: "قسيمة",
      contractNumber: "رقم العقد",
      issueDate: "تاريخ الإصدار",
      contractTime: "وقت العقد",
      accessDenied: "ليس لديك إذن للوصول إلى هذه الصفحة",
      loadingText: "جاري التحميل",
      pdfLoadingText: "جاري إنشاء PDF",
      textAlign: "text-right",
      justifyContent: "!justify-end",


      hotelissue: `
<p style="text-align:center">لم يتم إصدار حجز الفندق</p>
<p style="text-align:center">تواصل مع وحدة الدعم للتنسيق والإجابة على أسئلتك</p>`,
reject: `
<p style="text-align:center">للأسف، لم تتم الموافقة على حجز فندقك</p>
<p style="text-align:center">تواصل مع وحدة الدعم للتنسيق والإجابة على أسئلتك</p>`,
onrequest: `<p style="text-align:center">قسيمتك في انتظار الموافقة على الحجز</p>
<p style="text-align:center">تواصل مع وحدة الدعم للتنسيق والإجابة على أسئلتك</p>`,



    },
  };

  const t = translations[lid] || translations[1];
  window.currentTranslations = t;

  // تنظیم attributes اصلی HTML
  // const htmlRoot = document.getElementById("html-root");
  // const body = document.body;
  const mainContent = document.getElementById("main-content-wrapper");
  const headerSection = document.getElementById("header-section");
  const accessDeniedMessage = document.getElementById("access-denied-message");
  const pdfLoadingText = document.getElementById("pdf-loading-text");
  const mainLoadingText = document.getElementById("main-loading-text");

  // if (htmlRoot) {
  //   htmlRoot.setAttribute("lang", t.lang);
  //   htmlRoot.setAttribute("dir", t.dir);
  // }

  // if (body) {
  //   body.setAttribute("dir", t.dir);
  //   body.className =
  //     body.className.replace(/dir-(rtl|ltr)/g, "") + ` dir-${t.dir}`;
  // }

  if (mainContent) {
    mainContent.setAttribute("dir", t.dir);
    mainContent.className =
      mainContent.className.replace(/dir-(rtl|ltr)/g, "") + ` dir-${t.dir}`;
  }

  if (headerSection) {
    headerSection.setAttribute("dir", t.dir);
    headerSection.className =
      headerSection.className.replace(/(!justify-start|!justify-end)/g, "") +
      ` ${t.justifyContent}`;
  }

  // تنظیم متن لودینگ اصلی
  if (mainLoadingText) {
    mainLoadingText.textContent = t.loadingText;
  }

  // تنظیم متون ثابت
  setTimeout(() => {
    const mainTitle = document.getElementById("main-title");
    if (mainTitle) {
      mainTitle.textContent = t.mainTitle;
      mainTitle.className =
        mainTitle.className.replace(/(text-left|text-right)/g, "") +
        ` ${t.textAlign}`;
    }

    const contractNumberLabel = document.getElementById("contract-number-label");
    if (contractNumberLabel) {
      contractNumberLabel.innerHTML = `${t.contractNumber}`;
      contractNumberLabel.className =
        contractNumberLabel.className.replace(/(text-left|text-right)/g, "") +
        ` ${t.textAlign}`;
    }

    const issueDateLabel = document.getElementById("issue-date-label");
    if (issueDateLabel) {
      issueDateLabel.innerHTML = `${t.issueDate}`;
      issueDateLabel.className =
        issueDateLabel.className.replace(/(text-left|text-right)/g, "") +
        ` ${t.textAlign}`;
    }

    const contractTimeLabel = document.getElementById("contract-time-label");
    if (contractTimeLabel) {
      contractTimeLabel.innerHTML = `${t.contractTime}`;
      contractTimeLabel.className =
        contractTimeLabel.className.replace(/(text-left|text-right)/g, "") +
        ` ${t.textAlign}`;
    }

    // تنظیم پیغام خطای دسترسی
    if (accessDeniedMessage) {
      accessDeniedMessage.textContent = t.accessDenied;
      accessDeniedMessage.setAttribute("dir", t.dir);
      accessDeniedMessage.className =
        accessDeniedMessage.className.replace(/dir-(rtl|ltr)/g, "") +
        ` dir-${t.dir}`;
    }

    // تنظیم متن لودینگ PDF
    const loadingText = document.getElementById("loading-text");
    if (loadingText) {
      loadingText.textContent = t.pdfLoadingText;
    }

    if (pdfLoadingText) {
      pdfLoadingText.setAttribute("dir", t.dir);
      pdfLoadingText.className =
        pdfLoadingText.className.replace(/dir-(rtl|ltr)/g, "") +
        ` dir-${t.dir}`;
    }
  }, 4000);
}




// function nodata_error(message , status) {
//   console.log("no dataaaaaaaaaaaaaaaa" , status , message);
//   var len = message.length
//   var output = "";
//   if (len > 0) {
//     var msg = message ;
//     var status = status ;
//     if(msg){
//         console.log("no dataaaaaaaaaaaaaaaa2" , status , message);

//       if (status == 'onrequest') {
        
//         document.getElementById("Main_Data").remove();
        
//         return `<div class="bg-red-300 border-2 border-red-500 rounded-xl py-4 px-8 max-sm:px-3 font-danaregular max-w-7xl !text-center w-fit mx-auto my-auto h-fit" >
//         ${translations[mainlid].onrequest}
//         </div>`;
//         console.log("no dataaaaaaaaaaaaaaaa3" , status , message);
//       }else if(status == 'Reject'){
//           console.log("no dataaaaaaaaaaaaaaaa4" , status , message);

//         document.getElementById("Main_Data").remove();
//         return `<div class="bg-red-300 border-2 border-red-500 rounded-xl py-4 px-8 max-sm:px-3 font-danaregular max-w-7xl !text-center w-fit mx-auto my-auto h-fit" >
//                   ${translations[mainlid].reject}
//                   </div>`
      
//       }else if(status == 'Hotel is not issued'){
//           console.log("no dataaaaaaaaaaaaaaaa5" , status , message);

//         document.getElementById("Main_Data").remove();
//         return `<div class="bg-red-300 border-2 border-red-500 rounded-xl py-4 px-8 max-sm:px-3 font-danaregular max-w-7xl !text-center w-fit mx-auto my-auto h-fit" >
//                   ${translations[mainlid].hotelissue}
//                   </div>`
//       }
//     }
//   }
// }

// function nodata_error(message, status) {
//   console.log("no data", status, message);

//   // if (typeof message !== 'string' || message.length === 0) return '';
//   // if (message.length === 0) return '';


//   const main = document.getElementById("Main_Data");
//   if (main && typeof main.remove === 'function') main.remove();

//   const s = String(status).trim(); 

//   if (s === 'onrequest') {
//     return `
//       <div class="bg-red-300 border-2 border-red-500 rounded-xl py-4 px-8 max-sm:px-3 font-danaregular max-w-7xl !text-center w-fit mx-auto my-auto h-fit">
//         ${translations[mainlid].onrequest}
//       </div>`;
//   } else if (s === 'Reject') {
//     return `
//       <div class="bg-red-300 border-2 border-red-500 rounded-xl py-4 px-8 max-sm:px-3 font-danaregular max-w-7xl !text-center w-fit mx-auto my-auto h-fit">
//         ${translations[mainlid].reject}
//       </div>`;
//   } else if (s === 'Hotel is not issued') {
//     return `
//       <div class="bg-red-300 border-2 border-red-500 rounded-xl py-4 px-8 max-sm:px-3 font-danaregular max-w-7xl !text-center w-fit mx-auto my-auto h-fit">
//         ${translations[mainlid].hotelissue}
//       </div>`;
//   }
//   return '';
// }


function nodata_error(message, status) {
  if(message){
    try {
  
      console.log("nodata_error() inputs:", { status, message });
  
      // حذف امن Main_Data اگر وجود دارد
      const main = document.getElementById("Main_Data");
      if (main && typeof main.remove === 'function') main.remove();
  
      // نرمال‌سازی status
      const s = (status == null ? '' : String(status)).trim().toLowerCase();
  
      // دسترسی امن به ترجمه‌ها
      // const t = (typeof translations === 'object' && translations != null && translations[mainlid])
      //   ? translations[mainlid]
      //   : {};
  
      // نگاشت استیتوس به کلید ترجمه + فالبک متن ثابت
      const map = {
        'onrequest':        translations[mainlid].onrequest ?? 'در حال استعلام / On request',
        'on request':       translations[mainlid].onrequest ?? 'در حال استعلام / On request',
        'on_request':       translations[mainlid].onrequest ?? 'در حال استعلام / On request',
        'reject':           translations[mainlid].reject    ?? 'رد شده / Rejected',
        'rejected':         translations[mainlid].reject    ?? 'رد شده / Rejected',
        'hotel is not issued': translations[mainlid].hotelissue ?? 'هتل صادر نشده',
        'hotel_not_issued':    translations[mainlid].hotelissue ?? 'هتل صادر نشده',
        'hotel-not-issued':    translations[mainlid].hotelissue ?? 'هتل صادر نشده',
      };
  
      // انتخاب متن بر اساس status
      const text = map[s];
  
      // اگر متن پیدا شد، همان را برگردان
      if (text) {
        return `
          <div class="bg-red-300 border-2 border-red-500 rounded-xl py-4 px-8 max-sm:px-3 font-danaregular max-w-7xl !text-center w-fit mx-auto my-auto h-fit">
            ${text}
          </div>`;
      }
  
      // اگر status ناشناخته بود ولی message داریم، خود message را نشان بده
      if (message != null && String(message).trim().length > 0) {
        return `
          <div class="bg-red-300 border-2 border-red-500 rounded-xl py-4 px-8 max-sm:px-3 font-danaregular max-w-7xl !text-center w-fit mx-auto my-auto h-fit">
            ${String(message)}
          </div>`;
      }
  
      // در غیر اینصورت چیزی نشان نده
      return '';
    } catch (err) {
      console.error('nodata_error() failed:', err);
      return '';
    }
  }
}





function initializeLoadingSystem() {
  // شروع تایمر حداقل زمان
  setTimeout(() => {
    isMinTimeElapsed = true;
    checkLoadingComplete();
  }, MIN_LOADING_TIME);

  // بررسی لود شدن تصاویر
  checkImagesLoaded();

  // بررسی لود شدن فونت‌ها
  checkFontsLoaded();

  // بررسی API و محتوا
  checkContentLoaded();
}

function checkImagesLoaded() {
  const images = document.querySelectorAll("img");
  let loadedCount = 0;
  const totalImages = images.length;

  if (totalImages === 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    images.forEach((img) => {
      if (img.complete) {
        loadedCount++;
      } else {
        img.onload = img.onerror = () => {
          loadedCount++;
          if (loadedCount === totalImages) {
            resolve();
          }
        };
      }
    });

    if (loadedCount === totalImages) {
      resolve();
    }
  });
}

function checkFontsLoaded() {
  if (document.fonts && document.fonts.ready) {
    return document.fonts.ready;
  }
  return new Promise((resolve) => setTimeout(resolve, 500));
}

function checkContentLoaded() {
  const checkApiInterval = setInterval(() => {
    const hasApiContent = document.querySelector(
      '[datamembername="db.voucher_pdf"]' // تغییر برای voucher
    );
    const hasGeneratedContent = document.querySelector("h1");

    if (hasApiContent && hasGeneratedContent) {
      apiDataLoaded = true;
      clearInterval(checkApiInterval);
      checkAllResourcesLoaded();
    }
  }, 100);

  setTimeout(() => {
    if (!apiDataLoaded) {
      apiDataLoaded = true;
      clearInterval(checkApiInterval);
      checkAllResourcesLoaded();
    }
  }, 10000);
}

async function checkAllResourcesLoaded() {
  try {
    await Promise.all([checkImagesLoaded(), checkFontsLoaded()]);

    initializePageLanguage(mainlid);
    initializeLoadingSystem();

    isContentLoaded = true;
    checkLoadingComplete();
  } catch (error) {
    console.warn("خطا در لود resources:", error);
    isContentLoaded = true;
    checkLoadingComplete();
  }
}

function checkLoadingComplete() {
  if (isMinTimeElapsed && isContentLoaded && apiDataLoaded) {
    hideLoadingScreen();
  }
}

function hideLoadingScreen() {
  const loadingScreen = document.getElementById("main-loading-screen");
  const mainContent = document.getElementById("main-content-wrapper");
  const mainContentpdf = document.getElementById("main-content");

  if (loadingScreen && mainContent) {
    loadingScreen.classList.add("hidden");
    mainContent.classList.add("loaded");
    loadingScreen.style.display = "none";

    setTimeout(() => {
      if(mainlid == 2){
        mainContentpdf.classList.add("dir-ltr");
      }else{
        mainContentpdf.classList.add("dir-rtl");
      }

    }, 500);
  }
}

// Timeout و hooks
setTimeout(() => {
  if (!isContentLoaded) {
    console.warn("Loading timeout - forcing content display");
    isContentLoaded = true;
    isMinTimeElapsed = true;
    apiDataLoaded = true;
    checkLoadingComplete();
  }
}, 15000);

window.onBasisApiComplete = function () {
  apiDataLoaded = true;
  checkAllResourcesLoaded();
};

window.addEventListener("load", function () {
  setTimeout(() => {
    if (!apiDataLoaded) {
      apiDataLoaded = true;
      checkAllResourcesLoaded();
    }
  }, 500);
});




            // function extractFilenameFromUrl(url) {
            //     if (!url) return "";
            //     try {
            //         const parsedUrl = new URL(url);
            //         return parsedUrl.pathname.split('/').pop();
            //     } catch (e) {
            //         return url.split('/').pop();
            //     }
            // }


// ================= توابع رندر چندزبانه واچر =================

async function RenderInfoCard($data, lid = 1) {
    let hotelJson = $data;

    if (!hotelJson || !hotelJson.hotelinfo) {
        console.error("Invalid hotel data:", hotelJson);
        return '<div class="text-red-500">Invalid hotel data provided.</div>';
    }

    const hotel = hotelJson.hotelinfo;
    const hotelImageName = extractFilenameFromUrl(hotel.hotelimage);

    const checkin = hotelJson.checkin?.mstring ? formatDateToReadable(hotelJson.checkin.mstring) : "";
    const checkout = hotelJson.checkout?.mstring ? formatDateToReadable(hotelJson.checkout.mstring) : "";
    const nights = hotelJson.nights || 0;
    const roomsCount = hotelJson.rooms?.length || 0;

    // Language-specific content
    const content = {
        1: { // Farsi
            checkInLabel: 'زمان ورود <span class="mx-1" >/</span> Check In',
            checkOutLabel: 'زمان خروج <span class="mx-1" >/</span> Check Out', 
            nightLabel: 'تعداد شب‌ها <span class="mx-1" >/</span> Nights',
            roomLabel: 'تعداد اتاق‌ها <span class="mx-1" >/</span> Rooms',
            starLabel: "ستاره",
            borderClass: "border-r-2 border-[#E3E3E3] pr-3",
            cityDisplay: hotel.country,
            countryCityDisplay: hotel.city,
            direction: "dir-rtl",
            textAlign: "text-right",
            checkinDisplay: `${checkin} (${hotelJson.checkin?.sstring})`,
            checkoutDisplay: `${checkout} (${hotelJson.checkout?.sstring})`,
            textWrap: "text-nowrap"
        },
        2: { // English
            checkInLabel: "Check in",
            checkOutLabel: "Check out",
            nightLabel: "Nights", 
            roomLabel: "Rooms",
            starLabel: "star",
            borderClass: "border-l-2 border-[#E3E3E3] pl-3",
            cityDisplay: hotel.ecountry,
            countryCityDisplay: hotel.ecity,
            direction: "",
            textAlign: "",
            checkinDisplay: checkin,
            checkoutDisplay: checkout,
            textWrap: ""
        },
        3: { // Arabic
            checkInLabel: "وقت الوصول",
            checkOutLabel: "وقت المغادرة",
            nightLabel: "عدد الليالي",
            roomLabel: "عدد الغرف", 
            starLabel: "النجم",
            borderClass: "border-r-2 border-[#E3E3E3] pr-3",
            cityDisplay: hotel.country,
            countryCityDisplay: hotel.city,
            direction: "dir-rtl",
            textAlign: "text-right",
            checkinDisplay: checkin,
            checkoutDisplay: checkout,
            textWrap: "text-nowrap"
        }
    };

    const lang = content[lid] || content[1];

    let infocard = `
    <div class="w-[55%] max-md:w-full">
    <div class="flex leading-5 gap-x-3">
        <figure class="w-[80px] h-[80px] rounded-[5px] overflow-hidden" >
            <img  class="hotelimage w-[80px] h-[80px] object-cover " width="80" height="80" src="${hotelImageName}"
                alt="${escapeXML(hotel.hotelname)}" />
        </figure>
        <div class="flex flex-col gap-y-1">
            <h2 class="text-lg font-danademibold">
                ${escapeXML(hotel.hotelname)}
            </h2>
            <div class="flex items-center">
                ${RenderRateHotel(hotel.star)}
                <span class="text-sm ml-2 font-danaregular"><span class="${lid === 2 ? 'ml-1' : 'mr-1'}">${hotel.star}</span>  <span class="${lid === 2 ? 'ml-1' : 'mr-1'}">${lang.starLabel}</span> </span>
            </div>
            <div class="text-base font-danaregular ${lang.direction}">
                <span>
                ${lang.cityDisplay}
                </span>
                <span class="mx-1"> / </span>
                 <span>
                 ${lang.countryCityDisplay}
                 </span>
                 </div>
        </div>
    </div>
    
    <div class="mt-3">
                        
    </div>
    </div>
    <div class="w-[45%] ${lang.borderClass} max-md:border-x-0 max-md:w-full">
    <ul class="flex flex-col gap-y-2">
        <li>
            <h2 class="text-base font-danademibold">${lang.checkInLabel}</h2>
            <div class="flex items-center w-full gap-x-2 text-sm text-[#242424] ${lang.textWrap}">
                <svg id="calendar-icon-pdf" class="scale-110 origin-center min-w-3" xmlns="http://www.w3.org/2000/svg"  width="12" height="12" viewBox="0 0 12 12" fill="none">
<path fill-rule="evenodd" clip-rule="evenodd" d="M8.17319 6.2289C7.96769 6.2289 7.80119 6.0624 7.80119 5.8569C7.80119 5.6519 7.96769 5.4854 8.17319 5.4854C8.37869 5.4854 8.54519 5.6519 8.54519 5.8569C8.54519 6.0624 8.37869 6.2289 8.17319 6.2289ZM8.17319 8.1029C7.96769 8.1029 7.80119 7.9364 7.80119 7.7309C7.80119 7.5254 7.96769 7.3589 8.17319 7.3589C8.37869 7.3589 8.54519 7.5254 8.54519 7.7309C8.54519 7.9364 8.37869 8.1029 8.17319 8.1029ZM5.99969 6.2289C5.79469 6.2289 5.62819 6.0624 5.62819 5.8569C5.62819 5.6519 5.79469 5.4854 5.99969 5.4854C6.20519 5.4854 6.37169 5.6519 6.37169 5.8569C6.37169 6.0624 6.20519 6.2289 5.99969 6.2289ZM5.99969 8.1029C5.79469 8.1029 5.62819 7.9364 5.62819 7.7309C5.62819 7.5254 5.79469 7.3589 5.99969 7.3589C6.20519 7.3589 6.37169 7.5254 6.37169 7.7309C6.37169 7.9364 6.20519 8.1029 5.99969 8.1029ZM3.8267 6.2289C3.6212 6.2289 3.4547 6.0624 3.4547 5.8569C3.4547 5.6519 3.6212 5.4854 3.8267 5.4854C4.0322 5.4854 4.1987 5.6519 4.1987 5.8569C4.1987 6.0624 4.0322 6.2289 3.8267 6.2289ZM3.8267 8.1029C3.6212 8.1029 3.4547 7.9364 3.4547 7.7309C3.4547 7.5254 3.6212 7.3589 3.8267 7.3589C4.0322 7.3589 4.1987 7.5254 4.1987 7.7309C4.1987 7.9364 4.0322 8.1029 3.8267 8.1029ZM10.0947 2.6649C9.69269 2.2619 9.11969 2.0349 8.43769 1.9779V1.4414C8.43769 1.2114 8.25069 1.0249 8.02069 1.0249C7.79069 1.0249 7.60419 1.2114 7.60419 1.4414V3.4139C7.56769 3.4239 7.53219 3.4364 7.49269 3.4364C7.26219 3.4364 7.07569 3.2494 7.07569 3.0194V2.0534C7.07569 1.99818 7.03094 1.9534 6.97569 1.9534H4.3957V1.4414C4.3957 1.2114 4.2092 1.0249 3.9792 1.0249C3.7487 1.0249 3.5622 1.2114 3.5622 1.4414V3.4139C3.5262 3.4239 3.4902 3.4364 3.4507 3.4364C3.2207 3.4364 3.0337 3.2494 3.0337 3.0194V2.19141C3.0337 2.12638 2.97244 2.07862 2.91008 2.0971C1.84121 2.41381 1.2207 3.27685 1.2207 4.5534V8.3329C1.2207 9.9879 2.2167 10.9754 3.8847 10.9754H8.11519C9.78319 10.9754 10.7792 10.0019 10.7792 8.3709V4.5544C10.7812 3.7694 10.5447 3.1164 10.0947 2.6649Z" fill="#242424"/>
</svg>
                <span class="font-danaregular ${lid === 2 ? '' : 'dir-ltr'}">
                ${lang.checkinDisplay}
                </span>
            </div>
        </li>
        <li>
            <h2 class="text-base font-danademibold">${lang.checkOutLabel}</h2>
            <div class="flex items-center w-full gap-x-2 text-sm text-[#242424] ${lang.textWrap}">
                <svg id="calendar-icon-pdf" class="scale-110 origin-center min-w-3" xmlns="http://www.w3.org/2000/svg"  width="12" height="12" viewBox="0 0 12 12" fill="none">
<path fill-rule="evenodd" clip-rule="evenodd" d="M8.17319 6.2289C7.96769 6.2289 7.80119 6.0624 7.80119 5.8569C7.80119 5.6519 7.96769 5.4854 8.17319 5.4854C8.37869 5.4854 8.54519 5.6519 8.54519 5.8569C8.54519 6.0624 8.37869 6.2289 8.17319 6.2289ZM8.17319 8.1029C7.96769 8.1029 7.80119 7.9364 7.80119 7.7309C7.80119 7.5254 7.96769 7.3589 8.17319 7.3589C8.37869 7.3589 8.54519 7.5254 8.54519 7.7309C8.54519 7.9364 8.37869 8.1029 8.17319 8.1029ZM5.99969 6.2289C5.79469 6.2289 5.62819 6.0624 5.62819 5.8569C5.62819 5.6519 5.79469 5.4854 5.99969 5.4854C6.20519 5.4854 6.37169 5.6519 6.37169 5.8569C6.37169 6.0624 6.20519 6.2289 5.99969 6.2289ZM5.99969 8.1029C5.79469 8.1029 5.62819 7.9364 5.62819 7.7309C5.62819 7.5254 5.79469 7.3589 5.99969 7.3589C6.20519 7.3589 6.37169 7.5254 6.37169 7.7309C6.37169 7.9364 6.20519 8.1029 5.99969 8.1029ZM3.8267 6.2289C3.6212 6.2289 3.4547 6.0624 3.4547 5.8569C3.4547 5.6519 3.6212 5.4854 3.8267 5.4854C4.0322 5.4854 4.1987 5.6519 4.1987 5.8569C4.1987 6.0624 4.0322 6.2289 3.8267 6.2289ZM3.8267 8.1029C3.6212 8.1029 3.4547 7.9364 3.4547 7.7309C3.4547 7.5254 3.6212 7.3589 3.8267 7.3589C4.0322 7.3589 4.1987 7.5254 4.1987 7.7309C4.1987 7.9364 4.0322 8.1029 3.8267 8.1029ZM10.0947 2.6649C9.69269 2.2619 9.11969 2.0349 8.43769 1.9779V1.4414C8.43769 1.2114 8.25069 1.0249 8.02069 1.0249C7.79069 1.0249 7.60419 1.2114 7.60419 1.4414V3.4139C7.56769 3.4239 7.53219 3.4364 7.49269 3.4364C7.26219 3.4364 7.07569 3.2494 7.07569 3.0194V2.0534C7.07569 1.99818 7.03094 1.9534 6.97569 1.9534H4.3957V1.4414C4.3957 1.2114 4.2092 1.0249 3.9792 1.0249C3.7487 1.0249 3.5622 1.2114 3.5622 1.4414V3.4139C3.5262 3.4239 3.4902 3.4364 3.4507 3.4364C3.2207 3.4364 3.0337 3.2494 3.0337 3.0194V2.19141C3.0337 2.12638 2.97244 2.07862 2.91008 2.0971C1.84121 2.41381 1.2207 3.27685 1.2207 4.5534V8.3329C1.2207 9.9879 2.2167 10.9754 3.8847 10.9754H8.11519C9.78319 10.9754 10.7792 10.0019 10.7792 8.3709V4.5544C10.7812 3.7694 10.5447 3.1164 10.0947 2.6649Z" fill="#242424"/>
</svg>
                <span class="font-danaregular ${lid === 2 ? '' : 'dir-ltr'}">
                ${lang.checkoutDisplay}
                </span>
            </div>
        </li>
        <li>
            <h2 class="text-base font-danademibold">${lang.nightLabel}</h2>
            <div class="flex items-center w-full gap-x-2 text-sm text-[#242424] font-danaregular">
                ${nights}
            </div>
        </li>
        <li>
            <h2 class="text-base font-danademibold">${lang.roomLabel}</h2>
            <div class="flex items-center w-full gap-x-2 text-sm text-[#242424] font-danaregular">
                ${roomsCount}
            </div>
        </li>
    </ul>
    </div>`;

    return infocard;
}

// async function renderRules($data, lid = 1) {
//     const rules = $data?.pdf_description;
//     if (!rules || !Array.isArray(rules)) {
//         console.warn("هیچ آیتمی در pdf_description پیدا نشد");
//         return null;
//     }

//     let direction = detectDirection(rules?.[0]?.note.text);
//     let ulitem = '';
    
//     rules.forEach((item, index) => {
//         const text = item?.note?.text?.trim();
//         if (text) {
//             ulitem += `<li>${text}</li>`;
//         } else {
//             console.warn(`آیتم ${index} متن معتبری ندارد`, item);
//         }
//     });

//     // Apply RTL text fix for Farsi and Arabic
//     if (lid === 1 || lid === 3) {
//         return `<ul dir="${direction}" class="text-right">${fixRTLTextCompletely(ulitem)}</ul>`;
//     } else {
//         return `<ul dir="${direction}">${ulitem}</ul>`;
//     }
// }


function sanitizeHtml(input) {
    // لیستی از تگ‌های مجاز برای خروجی
    const allowedTags = [
        'a', 'b', 'i', 'u', 'ul', 'ol', 'li', 'strong', 'em', 'br', 'p', 'span', 'div', 'img', 'hr', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'footer', 'header'
    ];

    // استفاده از regex برای پاک‌سازی تگ‌های غیرمجاز
    return input.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tag) => {
        if (allowedTags.includes(tag.toLowerCase())) {
            return match; // اگر تگ مجاز است، آن را به همون صورت بگذار
        } else {
            return ''; // در غیر این صورت، تگ را حذف کن
        }
    });
}

async function renderRules($data, lid = 1) {
    const rules = $data?.pdf_description;
    if (!rules || !Array.isArray(rules)) {
        console.warn("هیچ آیتمی در pdf_description پیدا نشد");
        return null;
    }

    let direction = detectDirection(rules?.[0]?.note.text);
    let ulitem = '';
    
    rules.forEach((item, index) => {
        const text = item?.note?.text?.trim();
        if (text) {
            // قبل از اضافه کردن به ul، سانیتایز می‌کنیم
            const sanitizedText = sanitizeHtml(text);
            ulitem += `<li>${sanitizedText}</li>`;
        } else {
            console.warn(`آیتم ${index} متن معتبری ندارد`, item);
        }
    });

    // اعمال اصلاحات برای متن RTL
    if (lid === 1 || lid === 3) {
        return `<ul dir="${direction}" class="text-right">${fixRTLTextCompletely(ulitem)}</ul>`;
    } else {
        return `<ul dir="${direction}">${ulitem}</ul>`;
    }
}


function RenderRateHotel(starCount) {
    let stars = '';
    for (let i = 0; i < starCount; i++) {
        stars += `
                    <svg id="star-icon-pdf" width="14" height="14" viewBox="0 0 14 14" fill="none" >
<path d="M10.2667 8.62758C10.2323 8.41991 10.3017 8.20816 10.4528 8.06175L12.6344 5.99675C12.8141 5.82816 12.88 5.5715 12.8036 5.33758C12.7225 5.10425 12.5178 4.93508 12.2728 4.90008L9.37359 4.4795C9.16418 4.44741 8.98276 4.315 8.88943 4.12425L7.59501 1.51675C7.49409 1.32075 7.30101 1.1895 7.08168 1.16675H6.83609L6.73693 1.20758L6.67334 1.23091C6.63834 1.25133 6.60684 1.27641 6.57943 1.30675L6.52693 1.34758C6.47968 1.39308 6.44059 1.44675 6.41026 1.50508L5.13276 4.12425C5.03359 4.32258 4.83993 4.45675 4.61943 4.4795L1.72026 4.90008C1.47934 4.938 1.27984 5.10658 1.20168 5.33758C1.12118 5.56916 1.18243 5.82583 1.35859 5.99675L3.46501 8.03841C3.61609 8.18716 3.68551 8.40008 3.65109 8.6095L3.13193 11.4795C3.07534 11.8266 3.30576 12.1556 3.65109 12.2209C3.79284 12.2437 3.93751 12.2209 4.06526 12.1567L6.64943 10.8028C6.69843 10.776 6.75209 10.7585 6.80693 10.7503H6.96501C7.06709 10.7532 7.16684 10.7789 7.25668 10.8267L9.84026 12.1742C10.0578 12.2909 10.3233 12.2734 10.5228 12.1276C10.7263 11.987 10.829 11.7408 10.7853 11.4976L10.2667 8.62758Z" fill="#FFBF1C"/>
</svg>`;
    }
    return stars;
}

// async function renderRooms($data, lid = 1) {
//   let hotelinfo = $data?.hotelinfo;
//   let roominfo = $data?.rooms;
//   let roomcontent = '';

//   const labels = {
//       1: { // Farsi
//           room: 'اطلاعات مسافران - اتاق <span class="mx-1" >/</span> PASSENGERS AND ROOMS',
//           roomType: "نوع اتاق<br />Room Type",
//           services: "خدمات<br />Board", 
//           passengers: "مسافران<br />Passengers",
//           passengerType: "جنسیت<br />Gender",
//           nationality: "ملیت<br />Nationality",
//           status: "وضعیت<br />Status",
//           transferTitle: ' اطلاعات ترنسفر به ازای هر مسافر <span class="mx-1" >/</span> TRANSFER DETAILS ',
//           passengerName: "نام مسافر<br />Passenger Name",
//           arrivalAirport: "فرودگاه ورود<br />Arrival Airport",
//           arrivalFlightNo: "شماره پرواز ورود<br />Arrival Flight No",
//           departureAirport: "فرودگاه خروج<br />Departure Airport",
//           departureFlightNo: "شماره پرواز خروج<br />Departure Flight No",
//           wrapClass: "text-nowrap",
//           centerClass: "!text-center",
//           direction: 'dir="rtl"',
//           textAlign: "text-right"
//       },
//       2: { // English
//           room: "PASSENGERS AND ROOMS",
//           roomType: "Room type",
//           services: "Board",
//           passengers: "Passenger", 
//           passengerType: "Gender",
//           nationality: "Nationality",
//           status: "Status",
//           transferTitle: "TRANSFER DETAILS",
//           passengerName: "Passenger Name",
//           arrivalAirport: "Arrival Airport",
//           arrivalFlightNo: "Arrival Flight No",
//           departureAirport: "Departure Airport", 
//           departureFlightNo: "Departure Flight No",
//           wrapClass: "",
//           centerClass: "!text-center",
//           direction: "",
//           textAlign: "text-left"
//       },
//       3: { // Arabic
//           room: "الركاب والغرف الغرفة", 
//           roomType: "نوع الغرفة",
//           services: "خدمات",
//           passengers: "الركاب",
//           passengerType: "الجنس", 
//           nationality: "الجنسية",
//           status: "حالة",
//           transferTitle: "تفاصيل النقل",
//           passengerName: "اسم الراكب",
//           arrivalAirport: "مطار الوصول",
//           arrivalFlightNo: "رقم رحلة الوصول",
//           departureAirport: "مطار المغادرة",
//           departureFlightNo: "رقم رحلة المغادرة",
//           wrapClass: "text-nowrap",
//           centerClass: "!text-center",
//           direction: 'dir="rtl"',
//           textAlign: "text-right"
//       }
//   };

//   const lang = labels[lid] || labels[1];

//   // جمع‌آوری همه مسافران با transfer برای جدول نهایی
//   let allTransfers = [];
  
//   // اضافه کردن عنوان فقط یکبار
//   roomcontent += `<h2 class="font-bold text-lg my-2 font-danabold">${lang.room}</h2>`;
  
//   roominfo.forEach((room , index) => {
//       const parsedPassengers = room.passengers.map(p => {
//           const typeRaw = p.type || '';
//           // const typeMatch = typeRaw.match(/^([^\(]+)(?:\s*\((.+)\))?/);
//           // const passengerGender = typeMatch?.[1]?.trim() || '–';
//           const passengerNationality = p.countryofresidence?.ecountryname || '–';

//           return {
//               name: `${p.fullname.firstname.trim()} ${p.fullname.lastname.trim()}`,
//               gender: typeRaw,
//               nationality: passengerNationality,
//               transfer: p.transfer_data || null
//           };
//       });

//       const passengerNames = parsedPassengers.map(p =>
//           `<h2 class="text-[#292929] text-sm font-danademibold ${lang.centerClass} ${lang.wrapClass}">${p.name}</h2>`
//       ).join('');

//       const passengerGenders = parsedPassengers.map(p =>
//           `<h2 class="text-[#292929] text-sm font-danademibold ${lang.centerClass}">${p.gender}</h2>`
//       ).join('');

//       const passengerNationalities = parsedPassengers.map(p =>
//           `<h2 class="text-[#292929] text-sm font-danademibold ${lang.centerClass} ${lang.wrapClass}">${p.nationality}</h2>`
//       ).join('');

//       roomcontent += `
//       <div class="bg-[#F8F8F8] rounded-xl p-4 flex justify-between gap-4 max-md:flex-col max-md:justify-center max-md:items-center   ${index > 0 ? 'mt-3' : ''} ${lid === 2 ? 'flex-wrap' : ''}">
//           <div class="gap-y-2 flex flex-col">
//               <span class="text-[#6D6D6D] text-sm font-danaregular ${lang.centerClass} ${lang.wrapClass}">${lang.roomType}</span>
//               <div class="text-[#292929] text-sm font-danademibold self-center flex justify-center items-center h-[calc(100%-20px)] ${lang.centerClass}">${room.roomtype.trim()}</div>
//           </div>

//           <div class="gap-y-2 flex flex-col">
//               <span class="text-[#6D6D6D] text-sm font-danaregular ${lang.centerClass} ">${lang.services}</span>
//               <div class="text-[#292929] text-sm font-danademibold self-center flex justify-center items-center h-[calc(100%-20px)] ${lang.centerClass}">
//                   ${escapeXML(hotelinfo.services)}
//               </div>
//           </div>

//           <div class="gap-y-2 flex flex-col">
//               <span class="text-[#6D6D6D] text-sm font-danaregular ${lang.centerClass}" >${lang.passengers}</span>
//               ${passengerNames}
//           </div>

//           <div class="gap-y-2 flex flex-col">
//               <span class="text-[#6D6D6D] text-sm font-danaregular ${lang.wrapClass} ${lang.centerClass}">${lang.passengerType}</span>
//               ${passengerGenders}
//           </div>

//           <div class="gap-y-2 flex flex-col">
//               <span class="text-[#6D6D6D] text-sm font-danaregular ${lang.centerClass}">${lang.nationality}</span>
//               ${passengerNationalities}
//           </div>

//           <div class="gap-y-2 flex flex-col">
//               <span class="text-[#6D6D6D] text-sm font-danaregular ${lang.centerClass}">${lang.status}</span>
//               <div class="text-[#292929] text-sm font-danademibold self-center flex justify-center items-center h-[calc(100%-20px)] ${lang.centerClass}">
//                   ${room.onrequest === "1" ? "On Request" : "Available"}
//               </div>
//           </div>
//       </div>
//       `;

//       // جمع‌آوری transfers برای جدول نهایی
//       const transfers = parsedPassengers.filter(p => p.transfer);
//       transfers.forEach(p => {
//           allTransfers.push(p);
//       });
//   });

//   // اگر transfer وجود دارد، جدول جامع ایجاد کن
//   if (allTransfers.length > 0) {
//       roomcontent += `
//       <h3 class="font-bold text-lg my-2 font-danabold">${lang.transferTitle}</h3>
//       <div class="bg-[#F8F8F8] rounded-xl p-4 overflow-x-auto" ${lang.direction}>
//           <table class="w-full border-collapse">
//               <thead>
//                   <tr >
//                       <td class="text-[#6D6D6D] text-sm font-danaregular !text-center">${lang.passengerName}</td>
//                       <td class="text-[#6D6D6D] text-sm font-danaregular !text-center">${lang.arrivalAirport}</td>
//                       <td class="text-[#6D6D6D] text-sm font-danaregular !text-center">${lang.arrivalFlightNo}</td>
//                       <td class="text-[#6D6D6D] text-sm font-danaregular !text-center">${lang.departureAirport}</td>
//                       <td class="text-[#6D6D6D] text-sm font-danaregular !text-center">${lang.departureFlightNo}</td>
//                   </tr>
//               </thead>
//               <tbody>`;

//       allTransfers.forEach((passenger, index) => {           
//           roomcontent += `
//                   <tr >
//                       <td class="p-1 text-[#292929] text-sm font-danademibold !text-center">${passenger.name}</td>
//                       <td class="p-1 text-[#292929] text-sm font-danademibold !text-center">${passenger.transfer?.airport_arrival || '–'}</td>
//                       <td class="p-1 text-[#292929] text-sm font-danademibold !text-center">${passenger.transfer?.arrival_flight_number || '–'}</td>
//                       <td class="p-1 text-[#292929] text-sm font-danademibold !text-center">${passenger.transfer?.airport_departure || '–'}</td>
//                       <td class="p-1 text-[#292929] text-sm font-danademibold !text-center">${passenger.transfer?.departure_flight_number || '–'}</td>
//                   </tr>`;
//       });

//       roomcontent += `
//               </tbody>
//           </table>
//       </div>`;
//   }

//   return roomcontent;
// }


async function renderRooms($data, lid = 1) {
  let hotelinfo = $data?.hotelinfo;
  let roominfo = $data?.rooms;
  let roomcontent = '';

  const labels = {
      1: { // Farsi
          room: 'اطلاعات مسافران - اتاق <span class="mx-1" >/</span> PASSENGERS AND ROOMS',
          roomType: "نوع اتاق<br />Room Type",
          services: "خدمات<br />Board", 
          passengers: "مسافران<br />Passengers",
          age: "سن<br />Age",
          gender: "جنسیت<br />Gender",
          nationality: "ملیت<br />Nationality",
          status: "وضعیت<br />Status",
          transferTitle: ' اطلاعات ترنسفر به ازای هر مسافر <span class="mx-1" >/</span> TRANSFER DETAILS ',
          passengerName: "نام مسافر<br />Passenger Name",
          arrivalAirport: "فرودگاه ورود<br />Arrival Airport",
          arrivalFlightNo: "شماره پرواز ورود<br />Arrival Flight No",
          departureAirport: "فرودگاه خروج<br />Departure Airport",
          departureFlightNo: "شماره پرواز خروج<br />Departure Flight No",
          wrapClass: "text-nowrap",
          centerClass: "!text-center",
          direction: 'dir="rtl"',
          adult: "بزرگسال",
          child: "کودک",
          infant: "نوزاد",
          female: "خانم",
          male: "آقا",
          textAlign: "text-right"
      },
      2: { // English
          room: "PASSENGERS AND ROOMS",
          roomType: "Room type",
          services: "Board",
          passengers: "Passenger", 
          age: "Age",
          gender: "Gender",
          nationality: "Nationality",
          status: "Status",
          transferTitle: "TRANSFER DETAILS",
          passengerName: "Passenger Name",
          arrivalAirport: "Arrival Airport",
          arrivalFlightNo: "Arrival Flight No",
          departureAirport: "Departure Airport", 
          departureFlightNo: "Departure Flight No",
          wrapClass: "",
          centerClass: "!text-center",
          direction: "",
          adult: "Adult",
          child: "Child",
          infant: "Infant",
          female: "Female",
          male: "Male",
          textAlign: "text-left"
      },
      3: { // Arabic
          room: "الركاب والغرف الغرفة", 
          roomType: "نوع الغرفة",
          services: "خدمات",
          passengers: "الركاب",
          age: "العمر",
          gender: "الجنس", 
          nationality: "الجنسية",
          status: "حالة",
          transferTitle: "تفاصيل النقل",
          passengerName: "اسم الراكب",
          arrivalAirport: "مطار الوصول",
          arrivalFlightNo: "رقم رحلة الوصول",
          departureAirport: "مطار المغادرة",
          departureFlightNo: "رقم رحلة المغادرة",
          wrapClass: "text-nowrap",
          centerClass: "!text-center",
          direction: 'dir="rtl"',
          adult: "بالغ",
          child: "طفل",
          infant: "رضيع",
          female: "السّيدة",
          male: "سيد",
          textAlign: "text-right"
      }
  };

  const lang = labels[lid] || labels[1];

  // جمع‌آوری همه مسافران با transfer برای جدول نهایی
  let allTransfers = [];
  
  // اضافه کردن عنوان فقط یکبار
  roomcontent += `<h2 class="font-bold text-lg my-2 font-danabold">${lang.room}</h2>`;
  
  roominfo.forEach((room , index) => {
      const parsedPassengers = room.passengers.map(p => {
          const ageRaw = p.type || '';  // سن مسافر
          let genderRaw;

          // تشخیص جنسیت بر اساس مقدار gender
          switch (p.gender) {
            case "1":
                genderRaw = lang.male;
                break;
            case "0":
                genderRaw = lang.female;
                break;
            default:
                genderRaw = "";
                break;
          }

          const passengerNationality = p.countryofresidence?.ecountryname || '–';

          return {
              name: `${p.fullname.firstname.trim()} ${p.fullname.lastname.trim()}`,
              age: ageRaw || '–',
              gender: genderRaw || '–',
              nationality: passengerNationality,
              transfer: p.transfer_data || null
          };
      });

      const passengerNames = parsedPassengers.map(p =>
          `<h2 class="text-[#292929] text-sm font-danademibold ${lang.centerClass} ${lang.wrapClass}">${p.name}</h2>`
      ).join('');

      const passengerAges = parsedPassengers.map(p =>
          `<h2 class="text-[#292929] text-sm font-danademibold ${lang.centerClass}">${p.age}</h2>`
      ).join('');

      const passengerGenders = parsedPassengers.map(p =>
          `<h2 class="text-[#292929] text-sm font-danademibold ${lang.centerClass}">${p.gender}</h2>`
      ).join('');

      const passengerNationalities = parsedPassengers.map(p =>
          `<h2 class="text-[#292929] text-sm font-danademibold ${lang.centerClass} ${lang.wrapClass}">${p.nationality}</h2>`
      ).join('');

      roomcontent += `
      <div class="bg-[#F8F8F8] rounded-xl p-4 flex justify-between gap-2 max-md:flex-col max-md:justify-center max-md:items-center   ${index > 0 ? 'mt-3' : ''} ${lid === 2 ? 'flex-wrap' : ''}">
          <div class="gap-y-2 flex flex-col">
              <span class="text-[#6D6D6D] text-sm font-danaregular ${lang.centerClass} ${lang.wrapClass}">${lang.roomType}</span>
              <div class="text-[#292929] text-sm font-danademibold self-center flex justify-center items-center h-[calc(100%-20px)] ${lang.centerClass}">${room.roomtype.trim()}</div>
          </div>

          <div class="gap-y-2 flex flex-col">
              <span class="text-[#6D6D6D] text-sm font-danaregular ${lang.centerClass} ">${lang.services}</span>
              <div class="text-[#292929] text-sm font-danademibold self-center flex justify-center items-center h-[calc(100%-20px)] ${lang.centerClass}">
                  ${escapeXML(hotelinfo.services)}
              </div>
          </div>

          <div class="gap-y-2 flex flex-col">
              <span class="text-[#6D6D6D] text-sm font-danaregular ${lang.centerClass}" >${lang.passengers}</span>
              ${passengerNames}
          </div>

          <div class="gap-y-2 flex flex-col">
              <span class="text-[#6D6D6D] text-sm font-danaregular ${lang.wrapClass} ${lang.centerClass}">${lang.age}</span>
              ${passengerAges}
          </div>

          <div class="gap-y-2 flex flex-col">
              <span class="text-[#6D6D6D] text-sm font-danaregular ${lang.wrapClass} ${lang.centerClass}">${lang.gender}</span>
              ${passengerGenders}
          </div>

         

          <div class="gap-y-2 flex flex-col">
              <span class="text-[#6D6D6D] text-sm font-danaregular ${lang.centerClass}">${lang.status}</span>
              <div class="text-[#292929] text-sm font-danademibold self-center flex justify-center items-center h-[calc(100%-20px)] ${lang.centerClass}">
                  ${room.onrequest === "1" ? "On Request" : "Available"}
              </div>
          </div>
      </div>
      `;

      // جمع‌آوری transfers برای جدول نهایی
      const transfers = parsedPassengers.filter(p => p.transfer);
      transfers.forEach(p => {
          allTransfers.push(p);
      });
  });


  //  <div class="gap-y-2 flex flex-col">
  //             <span class="text-[#6D6D6D] text-sm font-danaregular ${lang.centerClass}">${lang.nationality}</span>
  //             ${passengerNationalities}
  //         </div>

  // اگر transfer وجود دارد، یک box جامع ایجاد کن
  if (allTransfers.length > 0) {
      roomcontent += `<h3 class="font-bold text-lg my-2 font-danabold">${lang.transferTitle}</h3>`;

      // ایجاد آرایه‌های جداگانه برای هر ستون
      const transferNames = allTransfers.map(p =>
          `<h2 class="text-[#292929] text-sm font-danademibold ${lang.centerClass} ${lang.wrapClass}">${p.name}</h2>`
      ).join('');

      const transferArrivalAirports = allTransfers.map(p =>
          `<h2 class="text-[#292929] text-sm font-danademibold ${lang.centerClass}">${p.transfer?.airport_arrival || '–'}</h2>`
      ).join('');

      const transferArrivalFlights = allTransfers.map(p =>
          `<h2 class="text-[#292929] text-sm font-danademibold ${lang.centerClass} ${lang.wrapClass}">${p.transfer?.arrival_flight_number || '–'}</h2>`
      ).join('');

      const transferDepartureAirports = allTransfers.map(p =>
          `<h2 class="text-[#292929] text-sm font-danademibold ${lang.centerClass}">${p.transfer?.airport_departure || '–'}</h2>`
      ).join('');

      const transferDepartureFlights = allTransfers.map(p =>
          `<h2 class="text-[#292929] text-sm font-danademibold ${lang.centerClass} ${lang.wrapClass}">${p.transfer?.departure_flight_number || '–'}</h2>`
      ).join('');

      roomcontent += `
      <div class="bg-[#F8F8F8] rounded-xl p-4 flex justify-between gap-4 max-md:flex-col max-md:justify-center max-md:items-center ${lid === 2 ? 'flex-wrap' : ''}" ${lang.direction}>
          <div class="gap-y-2 flex flex-col">
              <span class="text-[#6D6D6D] text-sm font-danaregular ${lang.centerClass} ${lang.wrapClass}">${lang.passengerName}</span>
              ${transferNames}
          </div>

          <div class="gap-y-2 flex flex-col">
              <span class="text-[#6D6D6D] text-sm font-danaregular ${lang.centerClass} ${lang.wrapClass}">${lang.arrivalAirport}</span>
              ${transferArrivalAirports}
          </div>

          <div class="gap-y-2 flex flex-col">
              <span class="text-[#6D6D6D] text-sm font-danaregular ${lang.centerClass} ${lang.wrapClass}">${lang.arrivalFlightNo}</span>
              ${transferArrivalFlights}
          </div>

          <div class="gap-y-2 flex flex-col">
              <span class="text-[#6D6D6D] text-sm font-danaregular ${lang.centerClass} ${lang.wrapClass}">${lang.departureAirport}</span>
              ${transferDepartureAirports}
          </div>

          <div class="gap-y-2 flex flex-col">
              <span class="text-[#6D6D6D] text-sm font-danaregular ${lang.centerClass} ${lang.wrapClass}">${lang.departureFlightNo}</span>
              ${transferDepartureFlights}
          </div>
      </div>`;
  }

  return roomcontent;
}

// async function renderRooms($data, lid = 1) {
//   let hotelinfo = $data?.hotelinfo;
//   let roominfo = $data?.rooms;
//   let roomcontent = '';

//   const labels = {
//       1: { // Farsi
//           room: 'اطلاعات مسافران - اتاق <span class="mx-1" >/</span> PASSENGERS AND ROOMS',
//           roomType: "نوع اتاق<br />Room Type",
//           services: "خدمات<br />Board", 
//           passengers: "مسافران<br />Passengers",
//           passengerType: "سن<br />Age",
//           nationality: "ملیت<br />Nationality",
//           status: "وضعیت<br />Status",
//           transferTitle: ' اطلاعات ترنسفر به ازای هر مسافر <span class="mx-1" >/</span> TRANSFER DETAILS ',
//           passengerName: "نام مسافر<br />Passenger Name",
//           arrivalAirport: "فرودگاه ورود<br />Arrival Airport",
//           arrivalFlightNo: "شماره پرواز ورود<br />Arrival Flight No",
//           departureAirport: "فرودگاه خروج<br />Departure Airport",
//           departureFlightNo: "شماره پرواز خروج<br />Departure Flight No",
//           wrapClass: "text-nowrap",
//           centerClass: "!text-center",
//           direction: 'dir="rtl"',
//           adult: "بزرگسال",
//           child: "کودک",
//           infant: "نوزاد",
//           textAlign: "text-right"
//       },
//       2: { // English
//           room: "PASSENGERS AND ROOMS",
//           roomType: "Room type",
//           services: "Board",
//           passengers: "Passenger", 
//           passengerType: "Age",
//           nationality: "Nationality",
//           status: "Status",
//           transferTitle: "TRANSFER DETAILS",
//           passengerName: "Passenger Name",
//           arrivalAirport: "Arrival Airport",
//           arrivalFlightNo: "Arrival Flight No",
//           departureAirport: "Departure Airport", 
//           departureFlightNo: "Departure Flight No",
//           wrapClass: "",
//           centerClass: "!text-center",
//           direction: "",
//           adult: "Adult",
//           child: "Child",
//           infant: "Infant",
//           textAlign: "text-left"
//       },
//       3: { // Arabic
//           room: "الركاب والغرف الغرفة", 
//           roomType: "نوع الغرفة",
//           services: "خدمات",
//           passengers: "الركاب",
//           passengerType: "العمر", 
//           nationality: "الجنسية",
//           status: "حالة",
//           transferTitle: "تفاصيل النقل",
//           passengerName: "اسم الراكب",
//           arrivalAirport: "مطار الوصول",
//           arrivalFlightNo: "رقم رحلة الوصول",
//           departureAirport: "مطار المغادرة",
//           departureFlightNo: "رقم رحلة المغادرة",
//           wrapClass: "text-nowrap",
//           centerClass: "!text-center",
//           direction: 'dir="rtl"',
//           adult: "بالغ",
//           child: "طفل",
//           infant: "رضيع",
//           textAlign: "text-right"
//       }
//   };

//   const lang = labels[lid] || labels[1];

//   // جمع‌آوری همه مسافران با transfer برای جدول نهایی
//   let allTransfers = [];
  
//   // اضافه کردن عنوان فقط یکبار
//   roomcontent += `<h2 class="font-bold text-lg my-2 font-danabold">${lang.room}</h2>`;
  
//   roominfo.forEach((room , index) => {
//       const parsedPassengers = room.passengers.map(p => {
//           const typeRaw = p.type || '';
//           let genderRaw ;

//           switch (p.gender) {
//             case "0":
//                 genderRaw = lang.infant || "نوزاد";
//             case "1":
//                 genderRaw = lang.child || "کودک";
//             case "2":
//                 genderRaw = lang.adult || "بزرگسال";
//             default:
//                 genderRaw = "";
//         }


//           // const typeMatch = typeRaw.match(/^([^\(]+)(?:\s*\((.+)\))?/);
//           // const passengerGender = typeMatch?.[1]?.trim() || '–';
//           const passengerNationality = p.countryofresidence?.ecountryname || '–';

//           return {
//               name: `${p.fullname.firstname.trim()} ${p.fullname.lastname.trim()}`,
//               age: typeRaw,
//               gender: genderRaw,
//               nationality: passengerNationality,
//               transfer: p.transfer_data || null
//           };
//       });

//       const passengerNames = parsedPassengers.map(p =>
//           `<h2 class="text-[#292929] text-sm font-danademibold ${lang.centerClass} ${lang.wrapClass}">${p.name}</h2>`
//       ).join('');

//       const passengerGenders = parsedPassengers.map(p =>
//           `<h2 class="text-[#292929] text-sm font-danademibold ${lang.centerClass}">${p.gender}</h2>`
//       ).join('');

//       const passengerNationalities = parsedPassengers.map(p =>
//           `<h2 class="text-[#292929] text-sm font-danademibold ${lang.centerClass} ${lang.wrapClass}">${p.nationality}</h2>`
//       ).join('');

//       roomcontent += `
//       <div class="bg-[#F8F8F8] rounded-xl p-4 flex justify-between gap-4 max-md:flex-col max-md:justify-center max-md:items-center   ${index > 0 ? 'mt-3' : ''} ${lid === 2 ? 'flex-wrap' : ''}">
//           <div class="gap-y-2 flex flex-col">
//               <span class="text-[#6D6D6D] text-sm font-danaregular ${lang.centerClass} ${lang.wrapClass}">${lang.roomType}</span>
//               <div class="text-[#292929] text-sm font-danademibold self-center flex justify-center items-center h-[calc(100%-20px)] ${lang.centerClass}">${room.roomtype.trim()}</div>
//           </div>

//           <div class="gap-y-2 flex flex-col">
//               <span class="text-[#6D6D6D] text-sm font-danaregular ${lang.centerClass} ">${lang.services}</span>
//               <div class="text-[#292929] text-sm font-danademibold self-center flex justify-center items-center h-[calc(100%-20px)] ${lang.centerClass}">
//                   ${escapeXML(hotelinfo.services)}
//               </div>
//           </div>

//           <div class="gap-y-2 flex flex-col">
//               <span class="text-[#6D6D6D] text-sm font-danaregular ${lang.centerClass}" >${lang.passengers}</span>
//               ${passengerNames}
//           </div>

//           <div class="gap-y-2 flex flex-col">
//               <span class="text-[#6D6D6D] text-sm font-danaregular ${lang.wrapClass} ${lang.centerClass}">${lang.passengerType}</span>
//               ${passengerGenders}
//           </div>

//           <div class="gap-y-2 flex flex-col">
//               <span class="text-[#6D6D6D] text-sm font-danaregular ${lang.centerClass}">${lang.nationality}</span>
//               ${passengerNationalities}
//           </div>

//           <div class="gap-y-2 flex flex-col">
//               <span class="text-[#6D6D6D] text-sm font-danaregular ${lang.centerClass}">${lang.status}</span>
//               <div class="text-[#292929] text-sm font-danademibold self-center flex justify-center items-center h-[calc(100%-20px)] ${lang.centerClass}">
//                   ${room.onrequest === "1" ? "On Request" : "Available"}
//               </div>
//           </div>
//       </div>
//       `;

//       // جمع‌آوری transfers برای جدول نهایی
//       const transfers = parsedPassengers.filter(p => p.transfer);
//       transfers.forEach(p => {
//           allTransfers.push(p);
//       });
//   });

//   // اگر transfer وجود دارد، یک box جامع ایجاد کن
//   if (allTransfers.length > 0) {
//       roomcontent += `<h3 class="font-bold text-lg my-2 font-danabold">${lang.transferTitle}</h3>`;

//       // ایجاد آرایه‌های جداگانه برای هر ستون
//       const transferNames = allTransfers.map(p =>
//           `<h2 class="text-[#292929] text-sm font-danademibold ${lang.centerClass} ${lang.wrapClass}">${p.name}</h2>`
//       ).join('');

//       const transferArrivalAirports = allTransfers.map(p =>
//           `<h2 class="text-[#292929] text-sm font-danademibold ${lang.centerClass}">${p.transfer?.airport_arrival || '–'}</h2>`
//       ).join('');

//       const transferArrivalFlights = allTransfers.map(p =>
//           `<h2 class="text-[#292929] text-sm font-danademibold ${lang.centerClass} ${lang.wrapClass}">${p.transfer?.arrival_flight_number || '–'}</h2>`
//       ).join('');

//       const transferDepartureAirports = allTransfers.map(p =>
//           `<h2 class="text-[#292929] text-sm font-danademibold ${lang.centerClass}">${p.transfer?.airport_departure || '–'}</h2>`
//       ).join('');

//       const transferDepartureFlights = allTransfers.map(p =>
//           `<h2 class="text-[#292929] text-sm font-danademibold ${lang.centerClass} ${lang.wrapClass}">${p.transfer?.departure_flight_number || '–'}</h2>`
//       ).join('');

//       roomcontent += `
//       <div class="bg-[#F8F8F8] rounded-xl p-4 flex justify-between gap-4 max-md:flex-col max-md:justify-center max-md:items-center ${lid === 2 ? 'flex-wrap' : ''}" ${lang.direction}>
//           <div class="gap-y-2 flex flex-col">
//               <span class="text-[#6D6D6D] text-sm font-danaregular ${lang.centerClass} ${lang.wrapClass}">${lang.passengerName}</span>
//               ${transferNames}
//           </div>

//           <div class="gap-y-2 flex flex-col">
//               <span class="text-[#6D6D6D] text-sm font-danaregular ${lang.centerClass} ${lang.wrapClass}">${lang.arrivalAirport}</span>
//               ${transferArrivalAirports}
//           </div>

//           <div class="gap-y-2 flex flex-col">
//               <span class="text-[#6D6D6D] text-sm font-danaregular ${lang.centerClass} ${lang.wrapClass}">${lang.arrivalFlightNo}</span>
//               ${transferArrivalFlights}
//           </div>

//           <div class="gap-y-2 flex flex-col">
//               <span class="text-[#6D6D6D] text-sm font-danaregular ${lang.centerClass} ${lang.wrapClass}">${lang.departureAirport}</span>
//               ${transferDepartureAirports}
//           </div>

//           <div class="gap-y-2 flex flex-col">
//               <span class="text-[#6D6D6D] text-sm font-danaregular ${lang.centerClass} ${lang.wrapClass}">${lang.departureFlightNo}</span>
//               ${transferDepartureFlights}
//           </div>
//       </div>`;
//   }

//   return roomcontent;
// }


function renderFlightInfo(flightinfo, lid = 1) {
  if (!flightinfo || Object.keys(flightinfo).length === 0 ) return '';

  const labels = {
      1: { // Farsi
          departureFlight: 'پرواز رفت <span class="mx-1" >/</span> DEPARTURE FLIGHT',
          returnFlight: 'پرواز برگشت <span class="mx-1" >/</span> RETURN FLIGHT',
          airline: "ایرلاین<br />Airline",
          flightNumber: "شماره پرواز<br />Flight Number",
          date: "تاریخ<br />Date",
          departureTime: "ساعت حرکت<br />Departure Time",
          arrivalTime: "ساعت رسیدن<br />Arrival Time",
          direction: "",
          centerText: "!text-center"
      },
      2: { // English
          departureFlight: "DEPARTURE FLIGHT",
          returnFlight: "RETURN FLIGHT",
          airline: "Airline",
          flightNumber: "Flight Number",
          date: "Date",
          departureTime: "Departure Time",
          arrivalTime: "Arrival Time",
          direction: "",
          centerText: "!text-center"
      },
      3: { // Arabic
          departureFlight: "رحلة الذهاب",
          returnFlight: "رحلة الإياب",
          airline: "شركة الطيران",
          flightNumber: "رقم الرحلة",
          date: "التاريخ",
          departureTime: "وقت المغادرة",
          arrivalTime: "وقت الوصول",
          direction: 'dir="rtl"',
          centerText: "!text-center"
      }
  };

  const lang = labels[lid] || labels[1];

  const renderSegment = (title, flight) => `
      <h2 class="font-bold text-lg my-2 font-danabold">${title}</h2>
      <div class="bg-[#F8F8F8] rounded-xl p-4 flex justify-between gap-4 max-md:flex-col max-md:justify-center max-md:items-center  " ${lang.direction}>
          <div class="flex flex-col">
              <span class="text-[#6D6D6D] text-sm font-danaregular ${lang.centerText}">${lang.airline}</span>
              <div class="text-[#292929] text-sm font-danademibold ${lang.centerText}">${flight.airlines}</div>
          </div>
          <div class="flex flex-col">
              <span class="text-[#6D6D6D] text-sm font-danaregular ${lang.centerText}">${lang.flightNumber}</span>
              <div class="text-[#292929] text-sm font-danademibold ${lang.centerText}">${flight.flightno}</div>
          </div>
          <div class="flex flex-col">
              <span class="text-[#6D6D6D] text-sm font-danaregular ${lang.centerText}">${lang.date}</span>
              <div class="text-[#292929] text-sm font-danademibold ${lang.centerText}">${flight.date.sstring} (${flight.date.mstring})</div>
          </div>
          <div class="flex flex-col">
              <span class="text-[#6D6D6D] text-sm font-danaregular ${lang.centerText}">${lang.departureTime}</span>
              <div class="text-[#292929] text-sm font-danademibold ${lang.centerText} dir-ltr">${flight.etime}</div>
          </div>
          <div class="flex flex-col">
              <span class="text-[#6D6D6D] text-sm font-danaregular ${lang.centerText}">${lang.arrivalTime}</span>
              <div class="text-[#292929] text-sm font-danademibold ${lang.centerText} dir-ltr">${flight.atime}</div>
          </div>
      </div>
  `;

  // بررسی اینکه آیا پرواز برگشت معتبر است یا نه
  const isReturnFlightValid = (exitflight) => {
      if (!exitflight) return false;
      
      const invalidValues = ['-', '_', '', 'undefined', 'null'];
      
      return !(
          invalidValues.includes(exitflight.airlines) ||
          invalidValues.includes(exitflight.flightno) ||
          invalidValues.includes(exitflight.date) ||
          invalidValues.includes(exitflight.etime) ||
          invalidValues.includes(exitflight.atime) ||
          (typeof exitflight.date === 'object' && (
              invalidValues.includes(exitflight.date.sstring) ||
              invalidValues.includes(exitflight.date.mstring)
          ))
      );
  };

  let result = renderSegment(lang.departureFlight, flightinfo.enterflight);
  
  // فقط اگر پرواز برگشت معتبر باشد، آن را اضافه کن
  if (isReturnFlightValid(flightinfo.exitflight)) {
      result += renderSegment(lang.returnFlight, flightinfo.exitflight);
  }

  return result;
}


function renderBrokerInfo(broker, lid = 1) {
    if (!broker?.brokerinfo) return '';

    const b = broker.brokerinfo;
    const transfer = broker.support?.person?.[0]?.info || {};

    const labels = {
        1: { // Farsi
            broker: 'ترنسفر <span class="mx-1" >/</span> TRANSFER',
            brokerName: "نام ترنسفر<br />Transfer Name",
            country: "کشور<br />Country", 
            managerName: "نام مدیر<br />Manager Name",
            phone: "تلفن<br />Phone",
            email: "ایمیل<br />Email",
            website: "وب‌سایت<br />Website",
            transfer: "راهنمای تور / TOUR LEADER",
            name: "نام<br />Name",
            board: "برد <br /> Board",
            direction: ""
        },
        2: { // English
            broker: "TRANSFER",
            brokerName: "Transfer Name",
            country: "Country",
            managerName: "Manager Name", 
            phone: "Phone",
            email: "Email",
            website: "Website",
            transfer: "TOUR LEADER",
            name: "Name",
            board: "Board",
            direction: ""
        },
        3: { // Arabic
            broker: "الوسيط", 
            brokerName: "اسم الوسيط",
            country: "الدولة",
            managerName: "اسم المدير",
            phone: "الهاتف",
            email: "البريد الإلكتروني",
            website: "الموقع الإلكتروني", 
            transfer: "قائد الجولة",
            name: "الاسم",
            board: "سبورة",
            direction: 'dir="rtl"'
        }
    };

    const lang = labels[lid] || labels[1];

    return `
        <h2 class="font-bold text-lg my-2 font-danabold">${lang.broker}</h2>
        <div class="bg-[#F8F8F8] rounded-xl p-4 flex justify-between gap-4 max-md:flex-col max-md:justify-center max-md:items-center  " ${lang.direction}>
            <div class="flex flex-col w-1/2">
                <span class="text-[#6D6D6D] text-sm font-danaregular !text-center">${lang.board}</span>
                <div class="text-[#292929] text-sm font-danademibold !text-center">${b.board}</div>
            </div>
            <div class="flex flex-col w-1/2">
                <span class="text-[#6D6D6D] text-sm font-danaregular !text-center">${lang.phone}</span>
                <div class="text-[#292929] text-sm font-danademibold dir-ltr !text-center">${(b.phone || []).map(p => p.number).join(', ')}</div>
            </div>
        </div>

        ${transfer.name || transfer.tel ? `
        <h3 class="font-bold text-lg my-2 font-danabold">${lang.transfer}</h3>
        <div class="bg-[#F8F8F8] rounded-xl flex flex-col gap-2">
            <div class="flex gap-4 p-3 rounded-lg justify-between max-md:flex-col max-md:justify-center max-md:items-center">
                <div class="flex flex-col w-1/2 ">
                    <span class="text-[#6D6D6D] text-sm font-danaregular !text-center">${lang.name}</span>
                    <div class="text-[#292929] text-sm font-danademibold !text-center">${transfer.name || '–'}</div>
                </div>
                <div class="flex flex-col w-1/2 ">
                    <span class="text-[#6D6D6D] text-sm font-danaregular !text-center">${lang.phone}</span>
                    <div class="text-[#292929] text-sm font-danademibold dir-ltr !text-center">${transfer.tel || '–'}</div>
                </div>
            </div>
        </div>` : ''}
    `;
}

// ----------------------------- Voucher PDF --------------------------------
