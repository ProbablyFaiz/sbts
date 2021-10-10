// Copyright (c) 2020 Faiz Surani. All rights reserved.

function PopulateTeamBallots() {
  populateBallots(MasterRange.TeamBallots, BallotRange.TeamResults, 2);
}

function PopulateIndividualBallots() {
 populateBallots(MasterRange.IndividualBallots, BallotRange.IndividualResults, 8);
}

function populateBallots(outputRangeName, resultsRangeName, rowsPerBallot) {
  const masterSheet = SpreadsheetApp.getActiveSpreadsheet();
  const ballotLinksRange = masterSheet.getRangeByName(MasterRange.BallotLinks);
  const outputRange = masterSheet.getRangeByName(outputRangeName);
  const ballotLinks = getValidatedBallotLinks(ballotLinksRange);
  const outputCells = [];
  const emptyRow = ["", "", "", "", "", "", "", "", ""];
  SheetLogger.log(ballotLinks.length);
  for (let link of ballotLinks) {
    outputCells.push([getResultImportFormula(link, resultsRangeName), "", "", "", "", "", "", link, getCaptainsFormUrlImportFormula(link)]);
    for (let i = 0; i < rowsPerBallot - 1; i++) { outputCells.push(emptyRow); }
  }
  const outputRangeSize = outputRange.getNumRows();
  while (outputCells.length < outputRangeSize) { outputCells.push(emptyRow); }
  outputRange.setValues(outputCells);
}

function getResultImportFormula(link, resultsRange) {
  return `=IMPORTRANGE("${link}", "${resultsRange}")`
}

function getCaptainsFormUrlImportFormula(link) {
  return `=IMPORTRANGE("${link}","${BallotRange.CaptainsFormUrl}")`
}

function getValidatedBallotLinks(ballotLinksRange) {
  const submittedIndex = 5; const validatedIndex = 6;
  return ballotLinksRange.getValues().filter(linkInfo => linkInfo[submittedIndex] && linkInfo[validatedIndex]).map(linkInfo => linkInfo[0]);
}
