function OnCreateSystemClick() {
    const ui = SpreadsheetApp.getUi();
    const result = ui.alert(
        'Please confirm',
        "Are you sure you want to generate the tab system?",
        ui.ButtonSet.YES_NO);

    // Process the user's response.
    if (result == ui.Button.YES) {
        SheetLogger.log('Generating files...');
        SetupTabulationFolder();
        const htmlOutput = HtmlService
            .createHtmlOutput(
                '<p>Successfully generated tab system. Godspeed.</p>')
            .setWidth(250)
            .setHeight(100);
        ui.showModelessDialog(htmlOutput, 'Success!');
    }
}
