// Copyright (c) 2020 Faiz Surani. All rights reserved.

// NOTE: This should be run from the master spreadsheet's script editor, not the template's.
// It is safe to run this after every round without making any manual change to the Team Ballots folder.
// The script is smart enough to see existing ballot PDFs and not recreate or overwrite them.

import { SSContext } from "../context/Context";
import {
  getOrCreateChildFolder,
  getFileByName,
  getIdFromUrl,
  sheetForFile,
} from "../context/Helpers";
import SheetLogger from "../context/SheetLogger";
import { BallotRange, BallotSpreadsheet } from "../../Types";

function PublishTeamBallots() {
  const context = new SSContext();
  exportBallots(context);
}

function getBallotPdfName(
  round: string,
  pTeam: string,
  dTeam: string,
  judgeName: string
) {
  return `R${round} - ${pTeam} v. ${dTeam} (Judge ${judgeName}).pdf`;
}

function exportBallots(context: SSContext) {
  let filesWritten = 0;
  for (let ballot of context.ballotRecords) {
    if (!ballot.locked || !ballot.validated) {
      SheetLogger.log(
        `${ballot.info} (${ballot.judgeName}) not submitted or not validated, skipping...`
      );
      continue;
    }
    const ballotFile = DriveApp.getFileById(getIdFromUrl(ballot.link));
    const ballotSheet = sheetForFile(ballotFile) as BallotSpreadsheet;
    const plaintiffTeam = ballotSheet
      .getRangeByName(BallotRange.PlaintiffTeam)!
      .getValue();
    const defenseTeam = ballotSheet
      .getRangeByName(BallotRange.DefenseTeam)!
      .getValue();
    const round = ballotSheet.getRangeByName(BallotRange.Round)!.getValue();
    const judgeName = ballotSheet
      .getRangeByName(BallotRange.JudgeName)!
      .getValue();
    const pdfName = getBallotPdfName(
      round,
      plaintiffTeam,
      defenseTeam,
      judgeName
    );

    let existingBallot;
    for (let team of [plaintiffTeam, defenseTeam]) {
      if (team === "") continue;
      const teamFolder = context.teamBallotFolder(team)!;
      const teamRoundFolder = getOrCreateChildFolder(
        teamFolder,
        `Round ${round}`
      );
      let pdfBallot:
        | GoogleAppsScript.Drive.File
        | GoogleAppsScript.Base.Blob
        | undefined = getFileByName(teamRoundFolder, pdfName);
      if (!pdfBallot) {
        pdfBallot = existingBallot || ballotFile.getAs("application/pdf");
        pdfBallot.setName(pdfName);
        existingBallot = pdfBallot; // We can save half of the exports by saving the ballot blob for the second go-round.
        teamRoundFolder.createFile(pdfBallot);
        filesWritten += 1;
        SheetLogger.log(`Adding ${pdfName} to ${teamFolder.getName()}...`);
      } else {
        SheetLogger.log(
          `${pdfName} already present in ${teamFolder.getName()}, skipping...`
        );
      }
    }
  }

  for (let result of context.enteredTeamBallotResults) {
    if (!result.ballotLink) {
      continue;
    }
    const ballotFile = DriveApp.getFileById(getIdFromUrl(result.ballotLink));
    if (ballotFile.getMimeType() !== "application/pdf") {
      continue;
    }
    const teamFolder = context.teamBallotFolder(result.teamNumber)!;
    const teamRoundFolder = getOrCreateChildFolder(
      teamFolder,
      `Round ${result.round}`
    );
    const pdfName = ballotFile.getName();
    const pdfBallot = getFileByName(teamRoundFolder, pdfName);
    if (!pdfBallot) {
      SheetLogger.log(`Adding ${pdfName} to ${teamFolder.getName()}...`);
      const newPdfBallot = ballotFile.makeCopy(pdfName, teamRoundFolder);
      newPdfBallot.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
      filesWritten += 1;
    } else {
      SheetLogger.log(
        `${pdfName} already present in ${teamFolder.getName()}, skipping...`
      );
    }
  }
  SheetLogger.log(
    `Wrote ${filesWritten} new ballot PDF files to team folders.`
  );
}

export { PublishTeamBallots, getBallotPdfName };