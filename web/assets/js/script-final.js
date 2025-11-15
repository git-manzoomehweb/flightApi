let selectedModeFinal = null;
document.addEventListener("DOMContentLoaded", async function () {
    try {
        await loadRequestMapping();

        const sessionSearchDataRaw = JSON.parse(sessionStorage.getItem("sessionSearch") || "null");
        const sessionBookDataRaw = JSON.parse(sessionStorage.getItem("sessionBook") || "null");

        const selectedModeFinal = sessionSearchDataRaw?.Type || "";
        $bc.setSource(`cms.${selectedModeFinal}`, {
            run: true
        });
        const flightGroupRaw = '[##cms.form.Group##]';
        let productGroup;
        try {
            productGroup = typeof flightGroupRaw === "string" && flightGroupRaw.trim() !== ""
                ? JSON.parse(flightGroupRaw)
                : {};
        } catch { productGroup = {}; }
        window.cmsData = {
            accounttype: "[##cms.form.accounttype##]",
            share: "[##cms.form.share##]",
            payType: "[##cms.form.payType##]",
            bankIdentifier: "[##cms.form.bankIdentifier##]",
            schemaId: "[##cms.form.SchemaId##]",
            sessionId: "[##cms.form.SessionId##]",
            productGroup,
            PriceInfo: sessionBookDataRaw?.PriceInfo || {},
            account: JSON.parse(`[##cms.form.account##]`),
            Travelers: JSON.parse(`[##cms.form.Travelers##]`),
            selectedMode: selectedModeFinal
        };

        window.cmsData.email = window.cmsData.account.agencyemail || window.cmsData.account.email || "";
        window.cmsData.mobile = window.cmsData.account.agencymobile || window.cmsData.account.mobile || "";
        window.cmsData.fullname = `${window.cmsData.Travelers?.[0]?.FirstName || ""} ${window.cmsData.Travelers?.[0]?.LastName || ""}`.trim();

        if (typeof runApiLogic === 'function') {
            await runApiLogic();
        }


        sessionStorage.removeItem('sessionSearch');
        sessionStorage.removeItem('sessionBook');
        sessionStorage.removeItem('sessionAmenities');

    } catch (error) {
        console.error("DOMContentLoaded:", error?.message || error);
    }
});
