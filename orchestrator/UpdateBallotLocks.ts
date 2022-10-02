const BALLOT_STATUS_NOT_READY = "Ballot Status: Not ready to submit.";
const BALLOT_STATUS_READY = "Ballot Status: Ready to submit.";

function UpdateBallotLocks() {
  const context = new OrchestratorContext();
  const orchestratorSheet = SpreadsheetApp.getActiveSpreadsheet();
  const ballotInfo = compactRange(orchestratorSheet.getRangeByName("BallotInfoRange").getValues());
  let numUpdated = 0;
  for (let i = 0; i < ballotInfo.length; i++) {
    const currentBallot = ballotInfo[i];
    if (currentBallot[0] === "") {
      continue;
    }
    const ballotObject = { url: currentBallot[0], notReady: currentBallot[1] === BALLOT_STATUS_NOT_READY, submitCheckbox: currentBallot[2], submitted: currentBallot[3] };
    if (ballotObject.submitCheckbox !== ballotObject.submitted) {
      try {
        updateBallot(ballotObject, context);
        numUpdated++;
      }
      catch (error) {
        Logger.log(`Error on line ${i + 2}: ${error}`)
      }
    }
  }
  Logger.log(`Updated ${numUpdated} ballots.`);
}

function updateBallot(ballotObject, context: OrchestratorContext) {
  const ballotSheet = SpreadsheetApp.openByUrl(ballotObject.url);
  const submittedRange = ballotSheet.getRangeByName("SubmittedRange");
  const failedSubmissionRange = ballotSheet.getRangeByName("FailedSubmissionRange");
  const submitCheckboxRange = ballotSheet.getRangeByName("SubmitCheckboxRange");
  if (ballotObject.notReady && ballotObject.submitCheckbox) { // In which case, we need to reject.
    submitCheckboxRange.setValue(false);
    failedSubmissionRange.setValue(true);
  } else {
    fixCommentBoxHeights(ballotSheet);
    setBallotLock(ballotSheet, ballotObject.submitCheckbox, context);
    submittedRange.setValue(!!ballotObject.submitCheckbox);
    failedSubmissionRange.setValue(false);
  }
}
