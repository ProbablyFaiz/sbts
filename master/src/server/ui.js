export const onOpen = () => {
  const tabSetUp = SpreadsheetApp.getActiveSpreadsheet().getRangeByName(
    "TabSystemSetUpRange"
  );
  const menuName = tabSetUp?.getValue()
    ? "Tab System"
    : "Tab System (Setup Needed!)";
  const menu = SpreadsheetApp.getUi()
    .createMenu(menuName)
    .addItem("Ballot Entry", "openBallotEntry")
    .addItem("Publish Ballots to Teams", "OnPublishBallotsClick")
    .addItem("Set Up Tab System (One-Time)", "OnSetupMasterSpreadsheetClick")
    .addItem(
      "Create Team Ballot Folders (One-Time)",
      "OnCreateTeamBallotFolderClick"
    )
    .addItem(
      "Email Team Ballot Folder Links (One-Time)",
      "OnEmailBallotFolderLinksClick"
    );
  // .addItem("About me", "openAboutSidebar");
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
