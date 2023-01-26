import { IContext, SSContext } from "../context/Context";
import SheetLogger from "../context/SheetLogger";
import { TeamInfo } from "../Types";


function EmailBallotFolderLinks() {
  const context = new SSContext();
  const teamInfoMap = context.teamInfo;
  Object.entries(teamInfoMap).forEach(([teamNumber, teamInfo]) => {
    if (!teamInfo.emails.length) {
      SheetLogger.log(`No emails listed for team ${teamNumber}, skipping...`);
      return;
    }
    SheetLogger.log(`Emailing ballot folder link for team ${teamNumber}...`);
    const fullEmail = ballotFolderEmail(context, teamNumber, teamInfo);
    GmailApp.sendEmail(fullEmail.to!, fullEmail.subject!, fullEmail.body!, {
      name: fullEmail.name,
    });
  });
}

const ballotFolderEmail = (
  context: IContext,
  teamNumber: string,
  teamInfo: TeamInfo
) => {
  return {
    name: `${context.tournamentName} Tournament`,
    subject: `Team ${teamNumber} Ballot Folder`,
    to: teamInfo.emails,
    replyTo: context.tournamentEmail,
    body: `Hi,

Thank you for attending ${context.tournamentName}. At the conclusion of each round of the tournament, your team's ballots will be accessible in the following folder:
${teamInfo.ballotFolderLink}

During the tournament, no formal ballot verification will take place. However, you will have access to your team's ballots immediately after each round and are welcome to contact the tabulation director (via ${context.tournamentEmail}) with any questions or concerns you may have.

Best regards,
${context.tournamentName}`,
  };
};

export { EmailBallotFolderLinks };
