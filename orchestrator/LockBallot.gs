function modifyBallotLock(ballotSheet, submitCheckboxValue) {
    const currentSheet = ballotSheet.getSheetByName("Scores");
    if (submitCheckboxValue === true) {
        const protection = currentSheet.protect();
        protection.setDescription("Ballot Completion Lock")
        removeNonWhitelistedEditors(protection);
        return "Locked";
    }
    else {
        const existingProtection = currentSheet.getProtections(SpreadsheetApp.ProtectionType.SHEET)[0];
        if (existingProtection) {
            existingProtection.remove();
        }
        return "Unlocked";
    }
}

function removeNonWhitelistedEditors(protection) {
    const usersWhitelist = ["mocktopiaucsb@gmail.com", "mt.ucsb@gmail.com", "mocktopia@ucsbmocktrial.org"]
    protection.getEditors().forEach(e => {
        const userEmail = e.getEmail()
        if (!usersWhitelist.includes(userEmail)) {
            protection.removeEditor(userEmail);
        }
    });
}
