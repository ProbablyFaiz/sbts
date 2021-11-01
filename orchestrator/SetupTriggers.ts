function SetupTriggers() {
  const orchestratorSheet = SpreadsheetApp.getActiveSpreadsheet();
  ScriptApp.newTrigger("ParentTrigger").forSpreadsheet(orchestratorSheet).onChange().create();
  // Disabling the time trigger for now because it seems like the system can handle submissions in quick succession well enough.
  // ScriptApp.newTrigger("UpdateBallotLocks").timeBased().everyMinutes(1).create();
}

function ParentTrigger() {
  if (rateLimit("ParentTrigger")) {
    return;
  }
  const scriptLock = LockService.getScriptLock();
  scriptLock.waitLock(30000);
  UpdateBallotLocks();
  GroupCompetitorNames();
  scriptLock.releaseLock();
}
