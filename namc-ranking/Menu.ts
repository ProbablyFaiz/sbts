function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("Elo Ranking")
    .addItem("Compute Ranking", "ComputeEloRankings")
    .addToUi();
}
