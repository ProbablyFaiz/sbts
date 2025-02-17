function OnCreateSystemClick() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.alert(
    "Please confirm",
    "Are you sure you want to generate the tab system?",
    ui.ButtonSet.YES_NO,
  );

  // Process the user's response.
  if (result == ui.Button.YES) {
    const tabFolderLinkResponse = ui.prompt(
      "Enter the link to the folder you want to generate the tab system in (must be empty):",
    );
    if (tabFolderLinkResponse.getSelectedButton() != ui.Button.OK) {
      return;
    }
    const simpleMode =
      SpreadsheetApp.getActiveSpreadsheet()
        .getRangeByName("GeneratorType")
        .getValue() === "SIMPLE";
    if (simpleMode) {
      SimpleSetup(tabFolderLinkResponse.getResponseText());
    } else {
      SetupTabulationFolder(tabFolderLinkResponse.getResponseText());
    }

    const htmlOutput = HtmlService.createHtmlOutput(
      "<p>Successfully generated tab system!</p>",
    )
      .setWidth(250)
      .setHeight(100);
    ui.showModelessDialog(htmlOutput, "Success!");
  }
}
