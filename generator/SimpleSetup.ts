const TEMPLATE_FOLDER_NAME = "Templates";
const BALLOT_TEMPLATE_NAME = "Ballot Template";

function SimpleSetup(tabFolderLink: string) {
  const context = new SimpleSetupContext(tabFolderLink);
  if (context.tabFolder.getFiles().hasNext()) {
    throw new Error(
      "Provided tab folder is not empty. Aborting tabulation folder setup."
    );
  }

  const masterSheetName = `${MASTER_SPREADSHEET_BASE_NAME} - ${context.tournamentName}`;
  const masterSheetFile = context.masterSpreadsheetTemplate.makeCopy(
    masterSheetName,
    context.tabFolder
  );
  const rounds = context.prelimRounds.concat(context.elimRounds);
  const masterSpreadsheet = sheetForFile(masterSheetFile);
  setUpGoogleFormBallot(
    context.tabFolder,
    context.formBallotTemplate,
    masterSpreadsheet,
    rounds,
    context.courtrooms,
    context.tournamentName
  );
  const exportFolder = getOrCreateChildFolder(
    context.tabFolder,
    EXPORT_FOLDER_NAME
  );

  const templateFolder = context.tabFolder.createFolder(TEMPLATE_FOLDER_NAME);
  const ballotTemplate = context.sheetBallotTemplate.makeCopy(
    BALLOT_TEMPLATE_NAME,
    templateFolder
  );
  const ballotTemplateSheet = sheetForFile(ballotTemplate);
  ballotTemplateSheet
    .getRangeByName(BallotRange.TournamentName)
    .setValue(context.tournamentName);

  masterSpreadsheet
    .getRangeByName(MasterRange.ParentFolderLink)
    .setValue(context.tabFolder.getUrl());
  masterSpreadsheet
    .getRangeByName(MasterRange.ExportFolderLink)
    .setValue(exportFolder.getUrl());
  masterSpreadsheet
    .getRangeByName(MasterRange.TournamentName)
    .setValue(context.tournamentName);
  masterSpreadsheet
    .getRangeByName(MasterRange.TournamentEmail)
    .setValue(context.tournamentContactEmail);
  masterSpreadsheet
    .getRangeByName(MasterRange.BallotTemplateLink)
    .setValue(ballotTemplate.getUrl());
  masterSpreadsheet
    .getRangeByName(MasterRange.ByeStrategy)
    .setValue(context.byeStrategy);
  masterSpreadsheet
    .getRangeByName(MasterRange.FirstPartyName)
    .setValue("Petitioner");
  masterSpreadsheet
    .getRangeByName(MasterRange.SecondPartyName)
    .setValue("Respondent");

  if (context.showKnockoutBracket) {
    masterSpreadsheet.getSheetByName("Knockout Bracket").showSheet();
  } else {
    masterSpreadsheet.getSheetByName("Knockout Bracket").hideSheet();
  }

  if (context.showSwissPairings) {
    masterSpreadsheet.getSheetByName("Swiss Pairings").showSheet();
    // masterSpreadsheet.getSheetByName("Swiss Pairing Process").showSheet();
  } else {
    masterSpreadsheet.getSheetByName("Swiss Pairings").hideSheet();
    masterSpreadsheet.getSheetByName("Swiss Pairing Process").hideSheet();
  }

  if (context.showRoundRobinPairings) {
    masterSpreadsheet.getSheetByName("Round-Robin Pairings").showSheet();
  } else {
    masterSpreadsheet.getSheetByName("Round-Robin Pairings").hideSheet();
  }

  setAndBackfillRange(
    masterSpreadsheet.getRangeByName(MasterRange.CourtroomInfo),
    context.courtrooms.map((c) => [c])
  );
  setAndBackfillRange(
    masterSpreadsheet.getRangeByName(MasterRange.KnockoutIncludeRounds),
    context.elimRounds.map((r) => [r])
  );
  setAndBackfillRange(
    masterSpreadsheet.getRangeByName(MasterRange.TeamIncludeRounds),
    context.prelimRounds.map((r) => [r])
  );
  setAndBackfillRange(
    masterSpreadsheet.getRangeByName(MasterRange.IndividualIncludeRounds),
    context.prelimRounds.map((r) => [r])
  );
  setAndBackfillRange(
    masterSpreadsheet.getRangeByName(MasterRange.RoundRobinPrelimRounds),
    context.prelimRounds.map((r) => [r])
  );
}
