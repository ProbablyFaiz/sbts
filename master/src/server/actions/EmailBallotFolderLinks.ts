import { TeamInfo } from "../../Types";
import { IContext, SSContext } from "../context/Context";
import SheetLogger from "../context/SheetLogger";

function EmailBallotFolderLinks() {
  const context = new SSContext();
  const teamInfoMap = context.teamInfo;
  Object.values(teamInfoMap).forEach((teamInfo) => {
    if (!teamInfo.emails.length) {
      SheetLogger.log(
        `No emails listed for team ${teamInfo.teamNumber}, skipping...`,
      );
      return;
    }
    SheetLogger.log(
      `Emailing ballot folder link for team ${teamInfo.teamNumber}...`,
    );
    const fullEmail = ballotFolderEmail(context, teamInfo);
    GmailApp.sendEmail(fullEmail.to!, fullEmail.subject!, fullEmail.body!, {
      name: fullEmail.name,
    });
  });
}

const ballotFolderEmail = (context: IContext, teamInfo: TeamInfo) => {
  return {
    name: `${context.tournamentName} Tournament`,
    subject: `Team ${teamInfo.teamNumber} Ballot Folder`,
    to: teamInfo.emails,
    replyTo: context.tournamentEmail,
    body: `Hello,

Thank you for participating in the ${context.tournamentName}. At the conclusion of each round of the tournament, your team's ballots will be accessible in the following folder:
${teamInfo.ballotFolderLink}

During the tournament, no formal ballot verification will take place. However, you will have access to your team's ballots after each round and are welcome to contact the tabulation director (via ${context.tournamentEmail}) with any questions or concerns you may have.

Best regards,
${context.tournamentName}`,
  };
};

export { EmailBallotFolderLinks };
