// Copyright (c) 2020 Faiz Surani. All rights reserved.

// NOTE: This should be run from the master spreadsheet's script editor, not the template's.
// It is safe to run this after every round without making any manual change to the Team Ballots folder.
// The script is smart enough to see existing ballot PDFs and not recreate or overwrite them.

import { SSContext } from "../context/Context";
import {
  getFileByName,
  getIdFromUrl,
  getOrCreateChildFolder,
  sheetForFile,
} from "../context/Helpers";
import SheetLogger from "../context/SheetLogger";
import {
  BallotRange,
  BallotSpreadsheet,
  NonSheetBallotReadout,
} from "../../Types";
import { createDummyBallot } from "./CreateDummyBallot";

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
  return `${round} - ${pTeam} v. ${dTeam} (Judge ${judgeName}).pdf`;
}

function exportBallots(context: SSContext) {
  let filesWritten = 0;
  filesWritten += exportNonSheetBallots(context);
  SheetLogger.log(
    `Wrote ${filesWritten} new ballot PDF files to team folders.`
  );
}


const exportNonSheetBallots = (context: SSContext) => {
  let filesWritten = 0;
  const readouts = context.formBallotReadouts.concat(
    context.enteredBallotReadouts
  );
  for (let readout of readouts) {
    const ballotFile = readout.ballotPdfUrl
      ? DriveApp.getFileById(getIdFromUrl(readout.ballotPdfUrl))
      : createDummyBallot(readout, context);
    if (ballotFile.getMimeType() !== "application/pdf") {
      SheetLogger.log(
        `Ballot ${ballotFile.getUrl()} is not a PDF, skipping...`
      );
      continue;
    }
    for (let team of [readout.pTeam, readout.rTeam]) {
      const teamFolder = context.teamBallotFolder(team);
      if (teamFolder === undefined) {
        SheetLogger.log(
          `Team ${team} folder not found, skipping adding of ballot ${ballotFile.getName()}...`
        );
        continue;
      }
      const teamRoundFolder = getOrCreateChildFolder(teamFolder, readout.round);
      const pdfName = ballotFile.getName();
      const pdfBallot = getFileByName(teamRoundFolder, pdfName);
      if (!pdfBallot) {
        SheetLogger.log(`Adding ${pdfName} to ${teamFolder.getName()}...`);
        const newPdfBallot = ballotFile.makeCopy(pdfName, teamRoundFolder);
        newPdfBallot.setSharing(
          DriveApp.Access.ANYONE,
          DriveApp.Permission.VIEW
        );
        filesWritten += 1;
      } else {
        SheetLogger.log(
          `${pdfName} already present in ${teamFolder.getName()}, skipping...`
        );
      }
    }
  }
  return filesWritten;
};

export { PublishTeamBallots, getBallotPdfName };
