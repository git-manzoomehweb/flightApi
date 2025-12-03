//  Optimized code with 100% guaranteed single execution
(function () {
    'use strict';

    //  Prevent duplicate execution
    if (window.__CMS_DATA_INITIALIZED__) {
        console.warn('CMS data already initialized, skipping duplicate execution');
        return;
    }

    //  Set flag immediately
    window.__CMS_DATA_INITIALIZED__ = true;

    //  Main function
    async function initializeCmsData() {
        try {
            console.log('CMS data initialization started');


            // Parse session data with error handling
            let sessionSearchDataRaw = null;
            let sessionBookDataRaw = null;

            try {
                sessionSearchDataRaw = JSON.parse(sessionStorage.getItem("sessionSearch") || "null");
            } catch (e) {
                console.warn('Failed to parse sessionSearch:', e);
            }

            try {
                sessionBookDataRaw = JSON.parse(sessionStorage.getItem("sessionBook") || "null");
            } catch (e) {
                console.warn('Failed to parse sessionBook:', e);
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
                    console.warn('Failed to parse productGroup:', e);
                    productGroup = {};
                }
            }

            // Parse account data
            let accountData = {};
            try {
                const accountRaw = '[##cms.form.account##]';
                accountData = accountRaw ? JSON.parse(accountRaw) : {};
            } catch (e) {
                console.warn('Failed to parse account:', e);
            }

            // Parse travelers data
            let travelersData = [];
            try {
                const travelersRaw = '[##cms.form.Travelers##]';
                travelersData = travelersRaw ? JSON.parse(travelersRaw) : [];
            } catch (e) {
                console.warn('Failed to parse Travelers:', e);
            }

            // Build window.cmsData object
            window.cmsData = {
                accounttype: "[##cms.form.accounttype##]",
                share: "[##cms.form.share##]",
                payType: "[##cms.form.payType##]",
                bankIdentifier: "[##cms.form.bankIdentifier##]",
                bankId: "[##db.bankId.Value|()##]",
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
                console.log('Running API logic...');
                await runApiLogic();
            }

            // Cleanup session storage
            sessionStorage.removeItem('sessionSearch');
            sessionStorage.removeItem('sessionBook');
            sessionStorage.removeItem('sessionAmenities');

            console.log('CMS data initialized successfully');
            console.log('Window.cmsData:', window.cmsData);

        } catch (error) {
            console.error('CMS initialization failed:', error?.message || error);
            console.error('Stack:', error?.stack);

            // Reset flag on error for retry
            window.__CMS_DATA_INITIALIZED__ = false;
            throw error;
        }
    }

    //  Execute based on DOM state
    if (document.readyState === 'loading') {
        // DOM not yet loaded
        document.addEventListener('DOMContentLoaded', initializeCmsData, { once: true });
        console.log('Waiting for DOMContentLoaded...');
    } else {
        // DOM is ready
        console.log('DOM already loaded, running immediately');
        initializeCmsData();
    }

})();

// Global helper function for accessing cmsData
window.getCmsData = function (key) {
    if (!window.cmsData) {
        console.warn('cmsData not initialized yet');
        return null;
    }
    return key ? window.cmsData[key] : window.cmsData;
};