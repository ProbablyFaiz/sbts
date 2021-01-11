function SetupTriggers() {
    const orchestratorSheet = SpreadsheetApp.getActiveSpreadsheet();
    ScriptApp.newTrigger("UpdateBallotLocks").forSpreadsheet(orchestratorSheet).onChange().create();
    // Disabling the time trigger for now because it seems like the system can handle submissions in quick succession well enough.
    // ScriptApp.newTrigger("UpdateBallotLocks").timeBased().everyMinutes(1).create();
}
