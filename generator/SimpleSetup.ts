const TEMPLATE_FOLDER_NAME = "Templates";
const BALLOT_TEMPLATE_NAME = "Ballot Template";

function SimpleSetup(tabFolderLink: string) {
  const context = new SimpleSetupContext(tabFolderLink);
  if (context.tabFolder.getFiles().hasNext()) {
    throw new Error(
      "Provided tab folder is not empty. Aborting tabulation folder setup.",
    );
  }

  const masterSheetName = `${MASTER_SPREADSHEET_BASE_NAME} - ${context.tournamentName}`;
  const masterSheetFile = context.masterSpreadsheetTemplate.makeCopy(
    masterSheetName,
    context.tabFolder,
  );
  const rounds = context.prelimRounds.concat(context.elimRounds);
  const masterSpreadsheet = sheetForFile(masterSheetFile);
  setUpGoogleFormBallot(
    context.tabFolder,
    context.formBallotTemplate,
    masterSpreadsheet,
    rounds,
    context.courtrooms,
    context.tournamentName,
  );
  const exportFolder = getOrCreateChildFolder(
    context.tabFolder,
    EXPORT_FOLDER_NAME,
  );

  const templateFolder = context.tabFolder.createFolder(TEMPLATE_FOLDER_NAME);
  const ballotTemplate = context.sheetBallotTemplate.makeCopy(
    BALLOT_TEMPLATE_NAME,
    templateFolder,
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
    context.courtrooms.map((c) => [c]),
  );
  setAndBackfillRange(
    masterSpreadsheet.getRangeByName(MasterRange.KnockoutIncludeRounds),
    context.elimRounds.map((r) => [r]),
  );
  setAndBackfillRange(
    masterSpreadsheet.getRangeByName(MasterRange.TeamIncludeRounds),
    context.prelimRounds.map((r) => [r]),
  );
  setAndBackfillRange(
    masterSpreadsheet.getRangeByName(MasterRange.IndividualIncludeRounds),
    context.prelimRounds.map((r) => [r]),
  );
  setAndBackfillRange(
    masterSpreadsheet.getRangeByName(MasterRange.RoundRobinPrelimRounds),
    context.prelimRounds.map((r) => [r]),
  );
}

const setUpGoogleFormBallot = (
  tabFolder: GoogleAppsScript.Drive.Folder,
  formBallotTemplate: GoogleAppsScript.Drive.File,
  masterSpreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet,
  rounds: string[],
  courtrooms: string[],
  tournamentName: string,
) => {
  Logger.log("Setting up Google Form ballot...");
  // Copy into tab folder
  const formFile = formBallotTemplate.makeCopy(
    `${tournamentName} Ballot`,
    tabFolder,
  );
  const form = FormApp.openById(formFile.getId());
  form.setTitle(`${tournamentName} Ballot`);

  const roundItem = form
    .getItems()
    .find((item) => item.getTitle() === "Round #");
  if (roundItem) {
    const roundDropdown = roundItem.asListItem();
    roundDropdown.setChoiceValues(rounds);
  }
  const courtroomItem = form
    .getItems()
    .find((item) => item.getTitle() === "Courtroom");
  if (courtroomItem) {
    const courtroomDropdown = courtroomItem.asListItem();
    courtroomDropdown.setChoiceValues(courtrooms);
  }

  form.setDestination(
    FormApp.DestinationType.SPREADSHEET,
    masterSpreadsheet.getId(),
  );
  masterSpreadsheet
    .getRangeByName(MasterRange.GoogleFormBallotLink)
    .setValue(form.getPublishedUrl());
  SpreadsheetApp.flush();

  const responseSheets = masterSpreadsheet
    .getSheets()
    .filter((sheet) => sheet.getFormUrl());
  Logger.log(`Found ${responseSheets.length} response sheet(s).`);
  responseSheets.forEach((sheet) => {
    const range = sheet.getRange(
      1,
      1,
      sheet.getMaxRows(),
      sheet.getMaxColumns(),
    );
    // Add alternating-color formatting
    // range.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false);
    sheet.setFrozenRows(1);
    // Set a constant row height so it doesn't expand when multi-line responses are added
    sheet.setRowHeightsForced(1, sheet.getLastRow(), 25);
    // Set the font to 12pt Times New Roman
    range.setFontFamily("Times New Roman");
    range.setFontSize(12);
    // Add Ballot PDF Link column
    sheet.insertColumnsAfter(sheet.getLastColumn(), 1);
    sheet.getRange(1, sheet.getLastColumn()).setValue("Ballot PDF Link");
    // Replace "Petitioner" with "P" and "Respondent" with "R" in the header row
    const firstRow = sheet.getRange(1, 1, 1, sheet.getLastColumn());
    firstRow.setValues([
      firstRow
        .getValues()[0]
        .map((cell) =>
          cell.toString().replace("Petitioner", "P").replace("Respondent", "R"),
        ),
    ]);
    firstRow.setFontWeight("bold");
  });
};
