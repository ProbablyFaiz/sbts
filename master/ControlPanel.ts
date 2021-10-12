function OnPublishBallotsClick() {
    const ui = SpreadsheetApp.getUi();

    const result = ui.alert(
        'Please confirm',
        'Are you sure you want to publish PDF ballots to the team ballot folders?',
        ui.ButtonSet.YES_NO);

    // Process the user's response.
    if (result == ui.Button.YES) {
        // User clicked "Yes".
        ui.alert('Publishing ballots...');
        PublishTeamBallots();
        const htmlOutput = HtmlService
            .createHtmlOutput('<p>Ballots were successfully published to team folders.</p>')
            .setWidth(250)
            .setHeight(100);
        ui.showModelessDialog(htmlOutput, 'Success!');
    } else {
        // User clicked "No" or X in the title bar.
    }
}

function OnSetupMasterSpreadsheetClick() {
    const ui = SpreadsheetApp.getUi();
    const result = ui.alert(
        'Please confirm',
        'Are you sure you want to setup the master spreadsheet? Only run this once, prior to the start of the tournament.',
        ui.ButtonSet.YES_NO);
    // Process the user's response.
    if (result == ui.Button.YES) {
        if (ScriptApp.getProjectTriggers().length > 0) {
            ui.alert('Detected existing setup configuration, aborting...');
        } else {
            SheetLogger.log('Adding ballot links...');
            PopulateBallotLinks();
            SheetLogger.log('Creating triggers...');
            SetupTriggers();
            SheetLogger.log('Creating team ballot folders...');
            const htmlOutput = HtmlService
                .createHtmlOutput(
                    '<p>Master spreadsheet was successfully configured for use. ' +
                    'Remember to set up the orchestrator as well.</p>')
                .setWidth(250)
                .setHeight(100);
            ui.showModelessDialog(htmlOutput, 'Success!');
        }
    } else {

    }
}

function OnCreateTeamBallotFolderClick() {
    const ui = SpreadsheetApp.getUi();
    const result = ui.alert(
        'Please confirm',
        'Are you sure you want to create team ballot folders? Only run this once, prior to the start of the tournament' +
        'and once you have added team numbers and names to the Teams sheet.',
        ui.ButtonSet.YES_NO);
    // Process the user's response.
    if (result == ui.Button.YES) {
        SheetLogger.log('Creating team ballot folders...');
        CreateTeamBallotFolders();
        const htmlOutput = HtmlService
            .createHtmlOutput('<p>Successfully created team ballot folders.</p>')
            .setWidth(250)
            .setHeight(100);
        ui.showModelessDialog(htmlOutput, 'Success!');
    } else {

    }
}

function OnEmailBallotFolderLinksClick() {
    const ui = SpreadsheetApp.getUi();
    const result = ui.alert(
        'Please confirm',
        'Are you sure you want to email links to ballot folders? Be careful about running this so as to not spam ' +
        'the competing teams.',
        ui.ButtonSet.YES_NO);
    // Process the user's response.
    if (result == ui.Button.YES) {
        SheetLogger.log('Creating team ballot folders...');
        EmailBallotFolderLinks();
        const htmlOutput = HtmlService
            .createHtmlOutput('<p>Successfully emailed ballot folder links.</p>')
            .setWidth(250)
            .setHeight(100);
        ui.showModelessDialog(htmlOutput, 'Success!');
    } else {

    }
}
