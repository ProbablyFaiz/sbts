type Email = GoogleAppsScript.Mail.MailAdvancedParameters;

enum RosterInfoIndex {
    TeamName = 0,
    Email = 1,
    NumberOfTeams = 2,
    RosterFolder = 3,
    IndividualRosterStart = 4,
}

function EmailRosters() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    const rosterInfoRange = sheet.getRangeByName("RosterInfo");
    rosterInfoRange.getValues().forEach((row) => {
        console.log(`Emailing roster folder to ${row[RosterInfoIndex.TeamName]}`);
        const emailToSend = rosterFolderEmail(row[RosterInfoIndex.TeamName], row[RosterInfoIndex.RosterFolder], row[RosterInfoIndex.Email])
        MailApp.sendEmail(emailToSend);
    })
}

const rosterFolderEmail = (teamName: string, ballotFolderLink: string, email: string): Email => {
    return {
        name: "Mocktopia UCSB",
        subject: `Mocktopia VI Roster (Due November 5)`,
        to: email,
        replyTo: "mocktopiaucsb@gmail.com",
        htmlBody: `<p>Hello ${teamName} Mock Trial,</p>

<p>In preparation for Mocktopia VI (November 20-21), all individual teams must complete a roster.</p>

<p>Below, you'll find the link to a folder containing your personal, school specific Google Sheets rosters where you can provide the required information for your team. Only your team and the UC Santa Barbara Tournament Staff will have access to thesee rosters.</p>

<p>Using these rosters, your program must provide the names, emails, and phone numbers of all team competitors and coaches attending Mocktopia VI.</p>

<p>All rosters must be complete by November 5th.</p>

<p>Your Personal Link: <a href="${ballotFolderLink}">${ballotFolderLink}</a></p>

<p>Shortly before the Tournament begins, we will change the access settings to "View-Only." After that, you will still be able to view your submitted roster via the provided link, but you will not be able to make any more edits. Therefore, please be sure your responses are accurate and complete.</p>

<p><b>Note regarding coaches:</b> On your roster, you must list ALL COACHES who will possibly be watching your rounds. We may need to contact them with information about judging needs.</p>

<p>Additionally, we would like to make 2 announcements ahead of sending out our tournament packet:</p>
<ol>
<li>We will be using the trial timing limits consistent with rule 4.31 and 4.33 of the AMTA rulebook at Mocktopia VI. All trials will be no more than 180 minutes with 14 minutes combined for statements and 25 minutes each for direct and cross examinations.</li>
<li>We will be hosting our Opening Ceremony on Friday, November 19th from 5:00pm - 5:30pm (Pacific Time). The Opening Ceremony is open to all, but only <b>one representative from each team is required to attend.</b> Pairings for Round 1 will be determined at the Opening Ceremony via a challenge system.</li>
</ol>

<p>Please reach out with any questions.</p>

<p>All the best,<br>
Natalie Swetlin</p>`
    };
}
