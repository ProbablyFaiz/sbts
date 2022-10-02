// Copyright (c) 2020 Faiz Surani. All rights reserved.

function PopulateTeamBallots() {
  populateBallots(MasterRange.TeamBallots, BallotRange.TeamResults, 2);
}

function PopulateIndividualBallots() {
  populateBallots(
    MasterRange.IndividualBallots,
    BallotRange.IndividualResults,
    4
  );
}

function populateBallots(
  outputRangeName: string,
  resultsRangeName: string,
  rowsPerBallot: number
) {
  const masterSheet = SpreadsheetApp.getActiveSpreadsheet();
  const ballotLinksRange = masterSheet.getRangeByName(MasterRange.BallotLinks)!;
  const outputRange = masterSheet.getRangeByName(outputRangeName)!;
  const ballotLinks = getValidatedBallotLinks(ballotLinksRange);
  const outputCells = [];
  const emptyRow = ["", "", "", "", "", "", "", "", ""];
  for (let link of ballotLinks) {
    outputCells.push([
      getResultImportFormula(link, resultsRangeName),
      "",
      "",
      "",
      "",
      "",
      "",
      link,
      getCaptainsFormUrlImportFormula(link),
    ]);
    for (let i = 0; i < rowsPerBallot - 1; i++) {
      outputCells.push(emptyRow);
    }
  }
  const outputRangeSize = outputRange.getNumRows();
  while (outputCells.length < outputRangeSize) {
    outputCells.push(emptyRow);
  }
  outputRange.setValues(outputCells);
}

function getResultImportFormula(link: string, resultsRange: string) {
  return `=IMPORTRANGE("${link}", "${resultsRange}")`;
}

function getCaptainsFormUrlImportFormula(link: string) {
  return `=IMPORTRANGE("${link}","${BallotRange.CaptainsFormUrl}")`;
}

function getValidatedBallotLinks(ballotLinksRange: Range) {
  const submittedIndex = 5;
  const validatedIndex = 6;
  const doNotCountIndex = 7;
  return ballotLinksRange
    .getValues()
    .filter(
      (linkInfo) =>
        linkInfo[submittedIndex] &&
        linkInfo[validatedIndex] &&
        !linkInfo[doNotCountIndex]
    )
    .map((linkInfo) => linkInfo[0]);
}
