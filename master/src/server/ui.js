export const onOpen = () => {
  const menu = SpreadsheetApp.getUi()
    .createMenu("Tab System")
    .addItem("Ballot Entry", "openDialogBootstrap")
    .addItem("About me", "openAboutSidebar");

  menu.addToUi();
};

export const openDialogBootstrap = () => {
  const html = HtmlService.createHtmlOutputFromFile("ballot-entry")
    .setWidth(600)
    .setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(html, "Ballot Entry");
};

export const openAboutSidebar = () => {
  const html = HtmlService.createHtmlOutputFromFile("sidebar-about-page");
  SpreadsheetApp.getUi().showSidebar(html);
};
