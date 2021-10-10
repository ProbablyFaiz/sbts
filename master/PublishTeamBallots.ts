// Copyright (c) 2020 Faiz Surani. All rights reserved.

// NOTE: This should be run from the master spreadsheet's script editor, not the template's.
// It is safe to run this after every round without making any manual change to the Team Ballots folder.
// The script is smart enough to see existing ballot PDFs and not recreate or overwrite them.

import Folder = GoogleAppsScript.Drive.Folder;

function PublishTeamBallots() {
  const context = new Context();
  const tabFolder = context.tabFolder;
  const ballots = context.ballotFiles;
  const exportFolder = getChildFolder(tabFolder, EXPORT_FOLDER_NAME)
  exportBallots(ballots, exportFolder);
  Logger.log(ballots.length.toString());
}

function exportBallots(ballots, exportFolder) {
  for (let ballot of ballots) {
    const ballotSheet = sheetForFile(ballot) as BallotSpreadsheet;
    const submittedRange = ballotSheet.getRangeByName(BallotRange.Submitted);
    if (!submittedRange || !submittedRange.getValue()) {
      Logger.log(`${ballotSheet.getName()} not submitted, skipping...`)
      continue;
    }
    const plaintiffTeam = ballotSheet.getRangeByName(BallotRange.PlaintiffTeam).getValue();
    const defenseTeam = ballotSheet.getRangeByName(BallotRange.DefenseTeam).getValue();
    const round = ballotSheet.getRangeByName(BallotRange.Round).getValue();
    const judgeName = ballotSheet.getRangeByName(BallotRange.JudgeName).getValue();
    const pdfName = `R${round} - ${plaintiffTeam} v. ${defenseTeam} (Judge ${judgeName}).pdf`;

    let existingBallot;
    for (let team of [plaintiffTeam, defenseTeam]) {
      if (team === "") continue;
      const teamFolder = getChildFolder(exportFolder, "Team " + team + " ") // The "Team" and space are important so we don't get a snafu where one team number is a prefix/suffix of another.
      const teamRoundFolder = getChildFolder(teamFolder, `Round ${round} `);
      let pdfBallot = getFileByName(teamRoundFolder, pdfName);
      if (!pdfBallot) {
        pdfBallot = existingBallot || ballot.getAs("application/pdf");
        pdfBallot.setName(pdfName);
        existingBallot = pdfBallot; // We can save half of the exports by saving the ballot blob for the second go-round.
        teamRoundFolder.createFile(pdfBallot);
        Logger.log(`Adding ${pdfName} to ${teamFolder.getName()}...`)
      } else {
        Logger.log(`${pdfName} already present in ${teamFolder.getName()}, skipping...`);
      }
    }
  }
}
