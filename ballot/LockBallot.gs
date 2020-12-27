function LockBallot() {
    const currentSheet = SpreadsheetApp.getActive().getSheetByName("Scores");
    const lockCheckbox = currentSheet.getRange("LockedRange").getCell(1, 1).getValue();
    console.log(lockCheckbox);
    if (lockCheckbox === true) {
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
    const usersWhitelist = ["mocktopiaucsb@gmail.com", "mt.ucsb@gmail.com"]
    protection.getEditors().forEach(e => {
        const userEmail = e.getEmail()
        if (!usersWhitelist.includes(userEmail)) {
            protection.removeEditor(userEmail);
        }
    });
}
