// Copyright (c) 2020 Faiz Surani. All rights reserved.

// NOTE: This should be run from the master spreadsheet's script editor, not the template's.
// It is safe to run this after every round without making any manual change to the Team Ballots folder.
// The script is smart enough to see existing ballot PDFs and not recreate or overwrite them.

import Folder = GoogleAppsScript.Drive.Folder;
import File = GoogleAppsScript.Drive.File;
import Blob = GoogleAppsScript.Base.Blob;

function PublishTeamBallots() {
  const context = new Context();
  exportBallots(context);
}

function exportBallots(context: IContext) {
  for (let ballot of context.ballotRecords) {
    if (!ballot.locked || !ballot.validated) {
      SheetLogger.log(`${ballot.info} (${ballot.judgeName}) not submitted or not validated, skipping...`)
      continue;
    }
    const ballotFile = DriveApp.getFileById(getIdFromUrl(ballot.link));
    const ballotSheet = sheetForFile(ballotFile) as BallotSpreadsheet;
    const plaintiffTeam = ballotSheet.getRangeByName(BallotRange.PlaintiffTeam)!.getValue();
    const defenseTeam = ballotSheet.getRangeByName(BallotRange.DefenseTeam)!.getValue();
    const round = ballotSheet.getRangeByName(BallotRange.Round)!.getValue();
    const judgeName = ballotSheet.getRangeByName(BallotRange.JudgeName)!.getValue();
    const pdfName = `R${round} - ${plaintiffTeam} v. ${defenseTeam} (Judge ${judgeName}).pdf`;

    let existingBallot;
    for (let team of [plaintiffTeam, defenseTeam]) {
      if (team === "") continue;
      const teamFolder = context.teamBallotFolder(team)!
      const teamRoundFolder = getChildFolder(teamFolder, `Round ${round} `); // The trailing space is important so we don't get a snafu where one round number is a prefix/suffix of another.
      let pdfBallot: File | Blob | undefined = getFileByName(teamRoundFolder, pdfName);
      if (!pdfBallot) {
        pdfBallot = existingBallot || ballotFile.getAs("application/pdf");
        pdfBallot.setName(pdfName);
        existingBallot = pdfBallot; // We can save half of the exports by saving the ballot blob for the second go-round.
        teamRoundFolder.createFile(pdfBallot);
        SheetLogger.log(`Adding ${pdfName} to ${teamFolder.getName()}...`)
      } else {
        SheetLogger.log(`${pdfName} already present in ${teamFolder.getName()}, skipping...`);
      }
    }
  }
  SheetLogger.log(context.ballotFiles.length.toString());
}
