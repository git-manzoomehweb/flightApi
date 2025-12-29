//  Best and safest approach - guaranteed single execution
(function () {
    'use strict';

    //  Step 1: Check for previous execution
    if (window.__BANK_SETUP_INITIALIZED__) {
        console.warn('Bank setup already running, skipping duplicate execution');
        return;
    }

    //  Step 2: Set flag immediately (before async)
    window.__BANK_SETUP_INITIALIZED__ = true;

    // Step 3: Main function
    async function setupBankParameters() {
        try {
            console.log('Bank setup started at:', new Date().toISOString());

            // Set CMS data
            window.cmsData = {
                selectedMode: "[##db.selectedMode.value|()##]",
                safarmarketURL: "[##db.safarmarketURL.value|()##]",
                bookId: "[##db.id.value|()##]"
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
                case "69": // Fadax
                    params = {
                        "RefId": "[##cms.form.RefId##]",
                        "refId": "[##cms.form.refId##]",
                        "fadax_tracking_number": "[##cms.form.fadax_tracking_number##]",
                        "fadaxTrackingNumber": "[##cms.form.fadaxTrackingNumber##]",
                        "supplierInvoice": "[##cms.form.supplierInvoice##]",
                        "transactionId": "[##cms.form.transactionId##]"
                    };
                    break;
                case "199": // FadaxMellat
                    params = {
                        "RefId": "[##cms.form.RefId##]",
                        "refId": "[##cms.form.refId##]",
                        "fadax_tracking_number": "[##cms.form.fadax_tracking_number##]",
                        "fadaxTrackingNumber": "[##cms.form.fadaxTrackingNumber##]",
                        "supplierInvoice": "[##cms.form.supplierInvoice##]",
                        "transactionId": "[##cms.form.transactionId##]"
                    };
                    break;
                case "202": // Thawani
                    params = {
                        "session": "[##db.session.value##]",
                    };
                    break;
                case "209": // Muscat
                    params = {
                        "order_id": "[##cms.form.order_id##]",
                        "enc_response": "[##cms.form.enc_response##]"
                    };
                    break;
                case "203": // Omidpay
                    params = {
                        "RefNum": "[##cms.form.RefNum##]",
                        "session": "[##db.session.value##]"
                    };
                    break;
                case "205": // MyFatoorn
                    params = {
                        "paymentId": "[##cms.query.paymentId##]"
                    };
                    break;
                case "59": // ArcaPayment
                    params = {
                        "orderId": "[##cms.query.orderId##]"
                    };
                    break;
                case "51": // kipaaPayment
                    params = {
                        "reciept_number": "[##cms.form.reciept_number##]",
                        "payment_token": "[##cms.form.payment_token##]"
                    };
                    break;
                case "214": // eliGasht
                    params = {
                        "status": "[##cms.form.status##]",
                        "RefId": "[##cms.form.RefId##]",
                        "SaleReferenceId": "[##cms.form.SaleReferenceId##]",
                        "SaleOrderId": "[##cms.form.SaleOrderId##]",
                        "Amount": "[##cms.form.Amount##]",
                        "CardPan": "[##cms.form.CardPan##]",
                        "OrderId": "[##cms.form.OrderId##]",
                        "AdditionalData": "[##cms.form.AdditionalData##]"
                    };
                    break;
                case "201": // pod
                    params = {
                        "billNumber": "[##cms.query.billNumber##]",
                        "rrn": "[##cms.query.rrn##]"
                    };
                    break;
                case "95": // pasargad2
                    params = {
                        "billNumber": "",
                        "rrn": ""
                    };
                    break;
                default:
                    console.warn('Unknown bank identifier:', bankIdentifier);
            }

            // Set params
            $bc.setSource("cms.params", {
                params: JSON.stringify(params),
                run: true
            });

            console.log('Bank setup completed successfully');
            console.log('Bank:', bankIdentifier);
            console.log('Params:', params);

        } catch (err) {
            console.error(' Bank setup failed:', err.message);
            console.error('Stack:', err.stack);
            // Reset flag on error for retry
            window.__BANK_SETUP_INITIALIZED__ = false;
            throw err;
        }
    }

    // Step 4: Execute based on DOM state
    if (document.readyState === 'loading') {
        // DOM not yet loaded - wait for it
        document.addEventListener('DOMContentLoaded', setupBankParameters, { once: true });
    } else {
        // DOM is ready - execute immediately
        setupBankParameters();
    }

})();