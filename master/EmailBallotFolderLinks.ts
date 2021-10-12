type Email = GoogleAppsScript.Mail.MailAdvancedParameters;

function EmailBallotFolderLinks() {
    const context = new Context();
    const teamInfoMap = context.teamInfo;
    Object.entries(teamInfoMap).forEach(
        ([teamNumber, teamInfo]) => {
            if (!teamInfo.emails.length) {
                SheetLogger.log(`No emails listed for team ${teamNumber}, skipping...`);
                return;
            }
            SheetLogger.log(`Emailing ballot folder link for team ${teamNumber}...`);
            MailApp.sendEmail(ballotFolderEmail(context, teamNumber, teamInfo));
        })
}

const ballotFolderEmail = (context: Context, teamNumber: string, teamInfo: TeamInfo): Email => {
    return {
        name: context.tournamentName,
        subject: `Team ${teamNumber} Ballot Folder`,
        to: teamInfo.emails,
        replyTo: context.tournamentEmail,
        body: `Hi,

Thank you for attending ${context.tournamentName}. At the conclusion of each round of the tournament, your team's ballots will be accessible in the following folder:
${teamInfo.ballotFolderLink}

Please contact the tournament directors if you have any questions or concerns.

Best regards,
${context.tournamentName}`
    };
}
