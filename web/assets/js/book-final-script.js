// 🎯 کد بهینه شده با 100% تضمین اجرای یکبار
(function() {
    'use strict';
    
    // ✅ جلوگیری از اجرای مکرر
    if (window.__CMS_DATA_INITIALIZED__) {
        console.warn('⚠️ CMS data already initialized, skipping duplicate execution');
        return;
    }
    
    // ✅ فلگ گذاری فوری
    window.__CMS_DATA_INITIALIZED__ = true;
    
    // ✅ تابع اصلی
    async function initializeCmsData() {
        try {
            console.log('🚀 CMS data initialization started');
            
            // Load request mapping
            await loadRequestMapping();
            
            // Parse session data با error handling
            let sessionSearchDataRaw = null;
            let sessionBookDataRaw = null;
            
            try {
                sessionSearchDataRaw = JSON.parse(sessionStorage.getItem("sessionSearch") || "null");
            } catch (e) {
                console.warn('⚠️ Failed to parse sessionSearch:', e);
            }
            
            try {
                sessionBookDataRaw = JSON.parse(sessionStorage.getItem("sessionBook") || "null");
            } catch (e) {
                console.warn('⚠️ Failed to parse sessionBook:', e);
            }
            
            // Get selected mode
            const selectedModeFinal = sessionSearchDataRaw?.Type || "";
            
            // Set CMS source
            if (selectedModeFinal && typeof $bc !== 'undefined' && $bc.setSource) {
                $bc.setSource(`cms.${selectedModeFinal}`, {
                    run: true
                });
            }
            
            // Parse flight group
            const flightGroupRaw = '[##cms.form.Group##]';
            let productGroup = {};
            
            if (flightGroupRaw && flightGroupRaw.trim() !== "" && flightGroupRaw !== "[]") {
                try {
                    productGroup = JSON.parse(flightGroupRaw);
                } catch (e) {
                    console.warn('⚠️ Failed to parse productGroup:', e);
                    productGroup = {};
                }
            }
            
            // Parse account data
            let accountData = {};
            try {
                const accountRaw = '[##cms.form.account##]';
                accountData = accountRaw ? JSON.parse(accountRaw) : {};
            } catch (e) {
                console.warn('⚠️ Failed to parse account:', e);
            }
            
            // Parse travelers data
            let travelersData = [];
            try {
                const travelersRaw = '[##cms.form.Travelers##]';
                travelersData = travelersRaw ? JSON.parse(travelersRaw) : [];
            } catch (e) {
                console.warn('⚠️ Failed to parse Travelers:', e);
            }
            
            // Build window.cmsData object
            window.cmsData = {
                accounttype: "[##cms.form.accounttype##]",
                share: "[##cms.form.share##]",
                payType: "[##cms.form.payType##]",
                bankIdentifier: "[##cms.form.bankIdentifier##]",
                schemaId: "[##cms.form.SchemaId##]",
                sessionId: "[##cms.form.SessionId##]",
                productGroup: productGroup,
                PriceInfo: sessionBookDataRaw?.PriceInfo || {},
                account: accountData,
                Travelers: travelersData,
                selectedMode: selectedModeFinal
            };
            
            // Extract and set email
            window.cmsData.email = 
                window.cmsData.account.agencyemail || 
                window.cmsData.account.email || 
                "";
            
            // Extract and set mobile
            window.cmsData.mobile = 
                window.cmsData.account.agencymobile || 
                window.cmsData.account.mobile || 
                "";
            
            // Extract and set fullname
            const firstName = window.cmsData.Travelers?.[0]?.FirstName || "";
            const lastName = window.cmsData.Travelers?.[0]?.LastName || "";
            window.cmsData.fullname = `${firstName} ${lastName}`.trim();
            
            // Run API logic
            if (typeof runApiLogic === 'function') {
                console.log('🔄 Running API logic...');
                await runApiLogic();
            }
            
            // Cleanup session storage
            sessionStorage.removeItem('sessionSearch');
            sessionStorage.removeItem('sessionBook');
            sessionStorage.removeItem('sessionAmenities');
            
            console.log('✅ CMS data initialized successfully');
            console.log('📦 Window.cmsData:', window.cmsData);
            
        } catch (error) {
            console.error('❌ CMS initialization failed:', error?.message || error);
            console.error('Stack:', error?.stack);
            
            // Reset flag در صورت خطا برای retry
            window.__CMS_DATA_INITIALIZED__ = false;
            throw error;
        }
    }
    
    // ✅ اجرا بر اساس وضعیت DOM
    if (document.readyState === 'loading') {
        // DOM هنوز لود نشده
        document.addEventListener('DOMContentLoaded', initializeCmsData, { once: true });
        console.log('📌 Waiting for DOMContentLoaded...');
    } else {
        // DOM آماده است
        console.log('📌 DOM already loaded, running immediately');
        initializeCmsData();
    }
    
})();

// ✅ Global helper function برای دسترسی به cmsData
window.getCmsData = function(key) {
    if (!window.cmsData) {
        console.warn('⚠️ cmsData not initialized yet');
        return null;
    }
    return key ? window.cmsData[key] : window.cmsData;
};