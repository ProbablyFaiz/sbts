function setBallotLock(ballotSheet, enableBallotLock, context: OrchestratorContext) {
  const currentSheet = ballotSheet.getSheetByName("Scores");
  if (enableBallotLock === true) {
    const protection = currentSheet.protect();
    protection.setDescription("Ballot Completion Lock")
    removeNonWhitelistedEditors(protection, context.bailiffEmails);
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

function removeNonWhitelistedEditors(protection, bailiffEmails: Set<string>) {
  const usersWhitelist = ["tab@ucsbmootcourt.org", ...bailiffEmails];
  protection.getEditors().forEach(e => {
    const userEmail = e.getEmail()
    if (!usersWhitelist.includes(userEmail)) {
      protection.removeEditor(userEmail);
    }
  });
}
