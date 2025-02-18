export const onOpen = () => {
  const menu = SpreadsheetApp.getUi()
    .createMenu("Tab System")
    .addItem("Ballot Entry", "openBallotEntry")
    .addItem("Publish Ballots to Teams", "OnPublishBallotsClick")
    .addItem(
      "Create Team Ballot Sheets (One-Time)",
      "OnCreateTeamBallotSheetsClick",
    )
    .addItem(
      "Email Team Ballot Sheet Links (One-Time)",
      "OnEmailBallotSheetLinksClick",
    );
  menu.addToUi();
};

export const openBallotEntry = () => {
  const html = HtmlService.createHtmlOutputFromFile("ballot-entry")
    .setWidth(600)
    .setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(html, "Ballot Entry");
};

export const openAboutSidebar = () => {
  const html = HtmlService.createHtmlOutputFromFile("sidebar-about-page");
  SpreadsheetApp.getUi().showSidebar(html);
};
