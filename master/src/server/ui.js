export const onOpen = () => {
  const menu = SpreadsheetApp.getUi()
    .createMenu("Tab System")
    .addItem("Ballot Entry", "openBallotEntry")
    .addItem("Publish Ballots to Teams", "OnPublishBallotsClick")
    .addItem(
      "Create Team Ballot Folders (One-Time)",
      "OnCreateTeamBallotFolderClick"
    )
    .addItem(
      "Email Team Ballot Folder Links (One-Time)",
      "OnEmailBallotFolderLinksClick"
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
