// Copyright (c) 2020 Faiz Surani. All rights reserved.

import { BallotRange, CaptainsFormRange, MasterRange } from "../../Types";
import { compactRange } from "../context/Helpers";
import { SSContext } from "../context/Context";

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
  outputRangeName: MasterRange,
  resultsRangeName: string,
  rowsPerBallot: number
) {
  const context = new SSContext();
  const ballotLinksRange = context.masterSpreadsheet.getRangeByName(
    MasterRange.BallotLinks
  )!;
  const outputRange =
    context.masterSpreadsheet.getRangeByName(outputRangeName)!;
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
      getCourtroomImportFormula(link),
      link,
    ]);
    for (let i = 0; i < rowsPerBallot - 1; i++) {
      outputCells.push(emptyRow);
    }
  }

  const formResults = context.formBallotResults;
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
          "",
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
          "",
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
          "",
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
          "",
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
          "",
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
          "",
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
