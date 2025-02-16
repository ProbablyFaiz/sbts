// Copyright (c) 2020 Faiz Surani. All rights reserved.

import { Cell, NonSheetBallotResult } from "../../Types";

export const getIndividualBallots = (
  nonSheetBallotResults: NonSheetBallotResult[],
  firstPartyName: string,
  secondPartyName: string,
): Cell[][] => {
  // Round #	Judge Name	Team #	Competitor Name	Side	Type	Rank Value	Courtroom	Ballot Link
  const outputCells: Cell[][] = [];
  for (const res of nonSheetBallotResults) {
    outputCells.push([
      res.round,
      res.judgeName,
      res.pTeam,
      res.pIssue1Name,
      firstPartyName,
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
      firstPartyName,
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
      secondPartyName,
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
      secondPartyName,
      "Attorney",
      res.rIssue2Score,
      res.courtroom,
      res.ballotPdfUrl ?? "",
    ]);
  }
  return outputCells;
}


export const getTeamBallots = (
  nonSheetBallotResults: NonSheetBallotResult[],
  firstPartyName: string,
  secondPartyName: string,
): Cell[][] => {
  const outputCells: Cell[][] = [];
  for (const res of nonSheetBallotResults) {
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
        firstPartyName,
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
        secondPartyName,
        respondentPd,
        respondentWon,
        res.courtroom,
        res.ballotPdfUrl ?? "",
      ]);
  }
  return outputCells;
}
