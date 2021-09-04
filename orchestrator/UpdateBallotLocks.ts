const BALLOT_STATUS_NOT_READY = "Ballot Status: Not ready to submit.";
const BALLOT_STATUS_READY = "Ballot Status: Ready to submit.";

function UpdateBallotLocks() {
  const scriptLock = LockService.getScriptLock();
  scriptLock.waitLock(30000);
  const orchestratorSheet = SpreadsheetApp.getActiveSpreadsheet();
  const ballotInfo = orchestratorSheet.getRangeByName("BallotInfoRange").getValues();
  let consecutiveBlanks = 0; let numUpdated = 0;
  for (let i = 0; i < ballotInfo.length && consecutiveBlanks < 5; i++) {
    const currentBallot = ballotInfo[i];
    if (currentBallot[0] === "") {
      consecutiveBlanks++;
      continue;
    }
    consecutiveBlanks = 0;
    const ballotObject = { url: currentBallot[0], notReady: currentBallot[1] === BALLOT_STATUS_NOT_READY, submitCheckbox: currentBallot[2], submitted: currentBallot[3] };
    if (ballotObject.submitCheckbox !== ballotObject.submitted) {
      try {
        updateBallot(ballotObject);
        numUpdated++;
      }
      catch (error) {
        console.log(`Error on line ${i + 2}.`)
      }
    }
  }
  console.log(`Updated ${numUpdated} ballots.`);
  scriptLock.releaseLock();
}

function updateBallot(ballotObject) {
  const ballotSheet = SpreadsheetApp.openByUrl(ballotObject.url);
  const submittedRange = ballotSheet.getRangeByName("SubmittedRange");
  const failedSubmissionRange = ballotSheet.getRangeByName("FailedSubmissionRange");
  const submitCheckboxRange = ballotSheet.getRangeByName("SubmitCheckboxRange");
  if (ballotObject.notReady && ballotObject.submitCheckbox) { // In which case, we need to reject.
    submitCheckboxRange.setValue(false);
    failedSubmissionRange.setValue(true);
  } else {
    modifyBallotLock(ballotSheet, ballotObject.submitCheckbox);
    submittedRange.setValue(ballotObject.submitCheckbox);
    failedSubmissionRange.setValue(false);
  }
}