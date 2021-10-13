// Copyright (c) 2020 Faiz Surani. All rights reserved.

// NOTE: This should be run from the newly created master spreadsheet's script editor, not the template's.
// Be sure to also run SetupTriggers in the newly created orchestrator (and again, not the template's).

function SetupTriggers() {
    const context = new AutocompleteContext();
    const autocompleteSheet = context.autocompleteSpreadsheet;
    ScriptApp.newTrigger("GroupCompetitorNames").forSpreadsheet(autocompleteSheet).onEdit().create();
}

function OnSetupAutocompleteClick() {
    const ui = SpreadsheetApp.getUi();
    const result = ui.alert(
        'Please confirm',
        'Are you sure you want to set up the autocompletion engine?',
        ui.ButtonSet.YES_NO);
    // Process the user's response.
    if (result == ui.Button.YES) {
        Logger.log('Creating triggers...');
        SetupTriggers();
        const htmlOutput = HtmlService
            .createHtmlOutput('<p>Successfully set up autocomplete engine.</p>')
            .setWidth(250)
            .setHeight(100);
        ui.showModelessDialog(htmlOutput, 'Success!');
    } else {

    }
}
