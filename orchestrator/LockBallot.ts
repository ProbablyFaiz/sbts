function setBallotLock(ballotSheet, enableBallotLock) {
  const currentSheet = ballotSheet.getSheetByName("Scores");
  if (enableBallotLock === true) {
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
  const bailiffEmails = ["boaitey@umail.ucsb.edu", "alia@umail.ucsb.edu", "amrutabaradwaj@umail.ucsb.edu", "carissaalmazan@umail.ucsb.edu", "carolinebaldan@umail.ucsb.edu", "junhyungseo@umail.ucsb.edu", "hunterwright@umail.ucsb.edu", "kristenwu@umail.ucsb.edu", "mwhalen@umail.ucsb.edu", "nlswetlin@umail.ucsb.edu", "raananaghieh@umail.ucsb.edu", "seanignatuk@umail.ucsb.edu", "svakili@umail.ucsb.edu"];
  const usersWhitelist = ["mocktopiaucsb@gmail.com", "mocktopia@ucsbmocktrial.org", ...bailiffEmails];
  protection.getEditors().forEach(e => {
    const userEmail = e.getEmail()
    if (!usersWhitelist.includes(userEmail)) {
      protection.removeEditor(userEmail);
    }
  });
}
