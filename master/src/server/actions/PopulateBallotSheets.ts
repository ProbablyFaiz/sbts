// Copyright (c) 2020 Faiz Surani. All rights reserved.

import { BallotRange, CaptainsFormRange, MasterRange } from "../../Types";
import { SSContext } from "../context/Context";

function PopulateTeamBallots() {
  populateBallots(MasterRange.TeamBallots);
}

function PopulateIndividualBallots() {
  populateBallots(MasterRange.IndividualBallots);
}

function populateBallots(outputRangeName: MasterRange) {
  const context = new SSContext();
  const outputCells = [];
  const outputRange = context.masterSpreadsheet.getRangeByName(
    outputRangeName
  )!;
  const emptyRow = ["", "", "", "", "", "", "", "", ""];

  const formResults = [
    ...context.formBallotResults,
    ...context.enteredBallotResults,
  ];
  if (formResults.length > 0) {
    for (let i = 0; i < formResults.length; i += 1) {
      const res = formResults[i];
      if (outputRangeName == MasterRange.TeamBallots) {
        const petitionerPd =
          res.pIssue1Score +
          res.pIssue2Score -
          res.rIssue1Score -
          res.rIssue2Score;
        const petitionerWon =
          petitionerPd === 0 ? 0.5 : petitionerPd > 0 ? 1 : 0;
        const respondentPd = -petitionerPd;
        const respondentWon = 1 - petitionerWon;
        outputCells.push([
          res.round,
          res.judgeName,
          res.pTeam,
          res.rTeam,
          context.firstPartyName,
          petitionerPd,
          petitionerWon,
          res.courtroom,
          res.ballotPdfUrl ?? "",
        ]);
        outputCells.push([
          res.round,
          res.judgeName,
          res.rTeam,
          res.pTeam,
          context.secondPartyName,
          respondentPd,
          respondentWon,
          res.courtroom,
          res.ballotPdfUrl ?? "",
        ]);
      } else if (outputRangeName == MasterRange.IndividualBallots) {
        // Round #	Judge Name	Team #	Competitor Name	Side	Type	Rank Value	Courtroom	Ballot Link
        outputCells.push([
          res.round,
          res.judgeName,
          res.pTeam,
          res.pIssue1Name,
          context.firstPartyName,
          "Attorney",
          res.pIssue1Score,
          res.courtroom,
          res.ballotPdfUrl ?? "",
        ]);
        outputCells.push([
          res.round,
          res.judgeName,
          res.pTeam,
          res.pIssue2Name,
          context.firstPartyName,
          "Attorney",
          res.pIssue2Score,
          res.courtroom,
          res.ballotPdfUrl ?? "",
        ]);
        outputCells.push([
          res.round,
          res.judgeName,
          res.rTeam,
          res.rIssue1Name,
          context.secondPartyName,
          "Attorney",
          res.rIssue1Score,
          res.courtroom,
          res.ballotPdfUrl ?? "",
        ]);
        outputCells.push([
          res.round,
          res.judgeName,
          res.rTeam,
          res.rIssue2Name,
          context.secondPartyName,
          "Attorney",
          res.rIssue2Score,
          res.courtroom,
          res.ballotPdfUrl ?? "",
        ]);
      }
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

function getCourtroomImportFormula(link: string) {
  return `=IMPORTRANGE(IMPORTRANGE("${link}","${BallotRange.CaptainsFormUrl}"), "${CaptainsFormRange.Courtroom}")`;
}

function getValidatedBallotLinks(
  ballotLinksRange: GoogleAppsScript.Spreadsheet.Range
) {
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

export { PopulateTeamBallots, PopulateIndividualBallots };
