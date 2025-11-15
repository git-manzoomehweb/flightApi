document.addEventListener("DOMContentLoaded", async function () {
    try {
        await loadRequestMapping();
        window.cmsData = {
            selectedMode: "[##db.selectedMode.value##]",
            safarmarketURL: "[##db.safarmarketURL.value##]",
            bookId: "[##db.id.value##]"
        };
        if (typeof runApiLogic === 'function') {
            await runApiLogic();
        };
        const bankIdentifier = '[##db.bankIdentifier.value##]';
        let params = {};
        // Check bank type
        if (bankIdentifier === "31") {
            // Saman Bank
            params = {
                "RefNum": "[##cms.form.RefNum##]",
                "ResNum": "[##cms.form.ResNum##]",
                "ResNSecurePanum": "[##cms.form.SecurePan##]",
                "CID": "[##cms.form.CID##]",
                "RRN": "[##cms.form.RRN##]",
                "TRACENO": "[##cms.form.TRACENO##]",
                "session": "[##db.session.value##]"
            };
        } else if (bankIdentifier === "206") {
            // SafarMarket Bank
            params = {
                "paymentId": "[##cms.query.paymentId##]"
            };
        } else if (bankIdentifier === "54") {
            // Sepah Bank
            params = {
                "Token": "[##cms.form.Token##]"
            };
        } else if (bankIdentifier === "32") {
            // Mellat Bank
            params = {
                "RefId": "[##cms.form.RefId##]",
                "ResCode": "[##cms.form.ResCode##]",
                "SaleOrderId": "[##cms.form.SaleOrderId##]",
                "SaleReferenceId": "[##cms.form.SaleReferenceId##]",
                "CardHolderInfo": "[##cms.form.CardHolderInfo##]",
                "CardHolderPAN": "[##cms.form.CardHolderPAN##]"
            };
        } else if (bankIdentifier === "208") {
            // FanAva Bank
            params = {
                "Token": "[##cms.form.Token##]"
            };
        } else if (bankIdentifier === "207") {
            // Azkivam Bank
            params = {
                "ticketId": "[##cms.query.ticketId##]"
            };
        } else if (bankIdentifier === "35") {
            // Zarrinpal Bank
            params = {
                "Authority": "[##cms.query.Authority##]",
            };
        } else if (bankIdentifier === "77") {
            // IranKish Bank
            params = {
                "retrievalReferenceNumber": "[##cms.form.retrievalReferenceNumber##]",
                "systemTraceAuditNumber": "[##cms.form.systemTraceAuditNumber##]",
                "tokenIdentity": "[##cms.form.tokenIdentity##]"
            };
        }else if (bankIdentifier === "66") {
            // Shahr Bank
            params = {
                "merchantConfigurationId": "[##cms.query.merchantConfigurationId##]",
                "localInvoiceId": "[##cms.query.localInvoiceId##]"
            };
        }

        // Set cms.params
        $bc.setSource("cms.params", {
            params: JSON.stringify(params),
            run: true
        });
        console.log('Bank Identifier:', bankIdentifier);
        console.log('Params set:', params);
    } catch (err) {
        console.error(`DOMContentLoaded: ${err.message}, Line: ${err.lineNumber || 'unknown'}`);
    }
});