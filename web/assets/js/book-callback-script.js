// 🎯 بهترین و امن‌ترین روش - تضمین اجرای یکبار
(function () {
    'use strict';

    // ✅ گام 1: چک کردن اجرای قبلی
    if (window.__BANK_SETUP_INITIALIZED__) {
        console.warn('⚠️ Bank setup already running, skipping duplicate execution');
        return;
    }

    // ✅ گام 2: فلگ گذاری فوری (قبل از async)
    window.__BANK_SETUP_INITIALIZED__ = true;

    // ✅ گام 3: تابع اصلی
    async function setupBankParameters() {
        try {
            console.log('🚀 Bank setup started at:', new Date().toISOString());

            // Load mapping
            await loadRequestMapping();

            // Set CMS data
            window.cmsData = {
                selectedMode: "[##db.selectedMode.value##]",
                safarmarketURL: "[##db.safarmarketURL.value##]",
                bookId: "[##db.id.value##]"
            };

            // Run API logic
            if (typeof runApiLogic === 'function') {
                await runApiLogic();
            }

            // Bank parameters
            const bankIdentifier = '[##db.bankIdentifier.value##]';
            let params = {};

            switch (bankIdentifier) {
                case "31": // Saman
                    params = {
                        "RefNum": "[##cms.form.RefNum##]",
                        "ResNum": "[##cms.form.ResNum##]",
                        "ResNSecurePanum": "[##cms.form.SecurePan##]",
                        "CID": "[##cms.form.CID##]",
                        "RRN": "[##cms.form.RRN##]",
                        "TRACENO": "[##cms.form.TRACENO##]",
                        "session": "[##db.session.value##]"
                    };
                    break;

                case "206": // SafarMarket
                    params = {
                        "paymentId": "[##cms.query.paymentId##]"
                    };
                    break;

                case "54": // Sepah
                    params = {
                        "Token": "[##cms.form.Token##]"
                    };
                    break;

                case "32": // Mellat
                    params = {
                        "RefId": "[##cms.form.RefId##]",
                        "ResCode": "[##cms.form.ResCode##]",
                        "SaleOrderId": "[##cms.form.SaleOrderId##]",
                        "SaleReferenceId": "[##cms.form.SaleReferenceId##]",
                        "CardHolderInfo": "[##cms.form.CardHolderInfo##]",
                        "CardHolderPAN": "[##cms.form.CardHolderPAN##]"
                    };
                    break;

                case "208": // FanAva
                    params = {
                        "Token": "[##cms.form.Token##]"
                    };
                    break;

                case "207": // Azkivam
                    params = {
                        "ticketId": "[##cms.query.ticketId##]"
                    };
                    break;

                case "35": // Zarrinpal
                    params = {
                        "Authority": "[##cms.query.Authority##]",
                        "Status": "[##cms.query.Status##]"
                    };
                    break;

                case "77": // IranKish
                    params = {
                        "retrievalReferenceNumber": "[##cms.form.retrievalReferenceNumber##]",
                        "systemTraceAuditNumber": "[##cms.form.systemTraceAuditNumber##]",
                        "token": "[##cms.form.token##]",
                        "maskedPan": "[##cms.form.maskedPan##]"
                    };
                    break;

                case "66": // Shahr
                    params = {
                        "merchantConfigurationId": "[##cms.query.merchantConfigurationId##]",
                        "localInvoiceId": "[##cms.query.localInvoiceId##]"
                    };
                    break;
                case "200": // Sadad
                    params = {
                        "token": "[##cms.form.token##]",
                        "rescode": "[##cms.form.ResCode##]",
                        "description": "[##cms.form.Messagevv##]",
                        "refno": "[##cms.form.RetrivalRefNo##]",
                        "traceno": "[##cms.form.SystemTraceNo##]",
                        "orderid": "[##cms.form.OrderId##]",
                        "CardHolderFullName": "[##cms.form.CardHolderFullName##]"
                    };
                    break;
                case "210": // SamanOPG
                    params = {
                        "RefNum": "[##cms.form.RefNum##]"
                    };
                    break;

                default:
                    console.warn('⚠️ Unknown bank identifier:', bankIdentifier);
            }

            // Set params
            $bc.setSource("cms.params", {
                params: JSON.stringify(params),
                run: true
            });

            console.log('✅ Bank setup completed successfully');
            console.log('🏦 Bank:', bankIdentifier);
            console.log('📦 Params:', params);

        } catch (err) {
            console.error('❌ Bank setup failed:', err.message);
            console.error('Stack:', err.stack);
            // در صورت خطا، flag رو reset کن برای retry
            window.__BANK_SETUP_INITIALIZED__ = false;
            throw err;
        }
    }

    // ✅ گام 4: اجرا بر اساس وضعیت DOM
    if (document.readyState === 'loading') {
        // DOM هنوز لود نشده - منتظر بمون
        document.addEventListener('DOMContentLoaded', setupBankParameters, { once: true });
    } else {
        // DOM آماده است - فوری اجرا کن
        setupBankParameters();
    }

})();