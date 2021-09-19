function OnPublishBallotsClick() {
  var ui = SpreadsheetApp.getUi(); // Same variations.

  var result = ui.alert(
     'Please confirm',
     'Are you sure you want to publish PDF ballots to the team ballot folders?',
      ui.ButtonSet.YES_NO);

  // Process the user's response.
  if (result == ui.Button.YES) {
    // User clicked "Yes".
    ui.alert('Publishing ballots...');
    CreateTeamBallotFolders();
    const htmlOutput = HtmlService
    .createHtmlOutput('<p>Ballots were successfully published to team folders.</p>')
    .setWidth(250)
    .setHeight(100);
    ui.showModelessDialog(htmlOutput, 'Success!');
  } else {
    // User clicked "No" or X in the title bar.
  }

}
