import { BallotListRange } from "../../Types";
import { SSContext } from "../context/Context";
import { sheetForFile } from "../context/Helpers";
import SheetLogger from "../context/SheetLogger";

function CreateTeamBallotSheets() {
  const context = new SSContext();
  const ballotListTemplateFile = context.ballotListTemplateFile;
  let teamInfoMap = context.teamInfo;
  let foldersCreated = 0;
  Object.entries(teamInfoMap).forEach(([teamNumber, teamInfo]) => {
    if (teamInfo.ballotListLink?.length) {
      SheetLogger.log(
        `Folder for team ${teamNumber} already exists, skipping...`,
      );
    } else {
      SheetLogger.log(
        `Creating ballot publish sheet for team ${teamNumber}...`,
      );

      const teamBallotFile = ballotListTemplateFile.makeCopy(
        `Team ${teamNumber} Ballots - ${context.tournamentName}`,
        context.exportFolder,
      );
      teamBallotFile.setSharing(
        DriveApp.Access.ANYONE_WITH_LINK,
        DriveApp.Permission.VIEW,
      );
      const teamBallotSheet = sheetForFile(teamBallotFile);
      teamBallotSheet
        .getRangeByName(BallotListRange.TournamentName)
        .setValue(context.tournamentName);
      teamBallotSheet
        .getRangeByName(BallotListRange.TournamentEmail)
        .setValue(context.tournamentEmail);
      teamBallotSheet
        .getRangeByName(BallotListRange.TeamNumber)
        .setValue(teamNumber);
      teamBallotSheet
        .getRangeByName(BallotListRange.School)
        .setValue(teamInfo.schoolName);
      if (teamInfo.competitorNames.length === 2) {
        teamBallotSheet
          .getRangeByName(BallotListRange.Competitors)
          .setValues([
            [teamInfo.competitorNames[0]],
            [teamInfo.competitorNames[1]],
          ]);
      } else {
        SheetLogger.log(
          `Team ${teamNumber} has ${teamInfo.competitorNames.length} competitors, not two, skipping...`,
        );
      }

      // Can vectorize this method/call if we need better performance here.
      context.setTeamBallotSheetLink(teamNumber, teamBallotFile.getUrl());
      foldersCreated += 1;
    }
  });
  SheetLogger.log(
    `Created ${foldersCreated} team ballot sheets for ballot publishing. Run the email script to email these links to teams.`,
  );
}

export { CreateTeamBallotSheets };
