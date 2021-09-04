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
  } else {
    // User clicked "No" or X in the title bar.
    ui.alert('Ballot publish cancelled.');
  }

}
