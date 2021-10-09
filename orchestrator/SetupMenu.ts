function OnSetupOrchestratorClick() {
    const ui = SpreadsheetApp.getUi();
    const result = ui.alert(
        'Please confirm',
        "Are you sure you want to set up the orchestrator?",
        ui.ButtonSet.YES_NO);

    // Process the user's response.
    if (result == ui.Button.YES) {
        SetupTriggers();
        const htmlOutput = HtmlService
            .createHtmlOutput(
                '<p>Successfully configured the orchestrator. Godspeed.</p>')
            .setWidth(250)
            .setHeight(100);
        ui.showModelessDialog(htmlOutput, 'Success!');
    }
}
