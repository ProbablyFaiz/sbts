function CreateTeamBallotFolders() {
  const context = new SSContext();
  let teamInfoMap = context.teamInfo;
  let foldersCreated = 0;
  Object.entries(teamInfoMap).forEach(([teamNumber, teamInfo]) => {
    if (teamInfo.ballotFolderLink?.length) {
      SheetLogger.log(
        `Folder for team ${teamNumber} already exists, skipping...`
      );
    } else {
      SheetLogger.log(
        `Creating ballot publish folder for team ${teamNumber}...`
      );
      const teamFolder = getChildFolder(
        context.exportFolder,
        `Team ${teamNumber}`
      );
      teamFolder.setSharing(
        DriveApp.Access.ANYONE_WITH_LINK,
        DriveApp.Permission.VIEW
      );
      // Can vectorize this method/call if we need better performance here.
      context.setTeamBallotFolderLink(teamNumber, teamFolder.getUrl());
      foldersCreated += 1;
    }
  });
  SheetLogger.log(
    `Created ${foldersCreated} team folders for ballot publishing. Run the email script to email these links to teams.`
  );
}
