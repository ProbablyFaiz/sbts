function OnCreateSystemClick() {
    const ui = SpreadsheetApp.getUi();
    const result = ui.alert(
        'Please confirm',
        "Are you sure you want to generate the tab system?",
        ui.ButtonSet.YES_NO);

    // Process the user's response.
    if (result == ui.Button.YES) {
        const tabFolderLinkResponse = ui.prompt("Enter the link to the folder you want to generate the tab system in (must be empty):")
        if (tabFolderLinkResponse.getSelectedButton() != ui.Button.OK) {
            return;
        }
        SheetLogger.log('Generating files...');
        SetupTabulationFolder(tabFolderLinkResponse.getResponseText());
        const htmlOutput = HtmlService
            .createHtmlOutput(
                '<p>Successfully generated tab system. Godspeed.</p>')
            .setWidth(250)
            .setHeight(100);
        ui.showModelessDialog(htmlOutput, 'Success!');
    }
}
