function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("Elo Ranking")
    .addItem("Compute Ranking", "ComputeEloRankings")
    .addItem("Ranking Dry Run", "EloRankingDryRun")
    .addItem("Populate Consolidated Data", "PopulateFromSummaries")
    .addToUi();
}
