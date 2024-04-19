// Copyright (c) 2020 Faiz Surani. All rights reserved.

function SetupTabulationFolder(tabFolderLink: string) {
  const setupContext = new SetupContext(tabFolderLink);

  // if (!setupContext.isValid) {
  //     SheetLogger.log("Tab folder is not empty. Aborting tabulation folder setup.");
  //     return;
  // }
  const tabFolder = setupContext.tabFolder;

  let masterSheetFile = getFileByName(tabFolder, MASTER_SPREADSHEET_NAME);
  let createdMasterSheet = false;
  if (masterSheetFile) {
    SheetLogger.log(
      "Existing master spreadsheet found, not creating a new one..."
    );
  } else {
    createdMasterSheet = true;
    masterSheetFile = setupContext.masterSheetTemplate.makeCopy(
      MASTER_SPREADSHEET_NAME,
      tabFolder
    );
  }
  let autocompleteEngineFile = getFileByName(
    tabFolder,
    AUTOCOMPLETE_SPREADSHEET_NAME
  );
  if (autocompleteEngineFile || !setupContext.generateCompetitorForms) {
    SheetLogger.log(
      "Not creating an autocomplete engine spreadsheet, one already exists or it is disabled."
    );
  } else {
    autocompleteEngineFile = setupContext.autocompleteEngineTemplate.makeCopy(
      AUTOCOMPLETE_SPREADSHEET_NAME,
      tabFolder
    );
    autocompleteEngineFile.setSharing(
      DriveApp.Access.ANYONE_WITH_LINK,
      DriveApp.Permission.VIEW
    );
  }
  setupContext.autocompleteEngine = autocompleteEngineFile;
  let orchestratorFile = getFileByName(
    tabFolder,
    ORCHESTRATOR_SPREADSHEET_NAME
  );
  if (
    orchestratorFile ||
    (!setupContext.generateVirtualBallots &&
      !setupContext.generateCompetitorForms)
  ) {
    SheetLogger.log("Orchestrator file found, not creating a new one...");
  } else {
    orchestratorFile = setupContext.orchestratorTemplate.makeCopy(
      ORCHESTRATOR_SPREADSHEET_NAME,
      tabFolder
    );
    const orchestratorSheet = sheetForFile(orchestratorFile);
    orchestratorSheet
      .getRangeByName(OrchestratorRange.MasterLink)
      .setValue(masterSheetFile.getUrl());
    if (autocompleteEngineFile) {
      orchestratorSheet
        .getRangeByName(OrchestratorRange.AutocompleteEngineLink)
        .setValue(autocompleteEngineFile.getUrl());
    }
  }
  const exportFolder = getOrCreateChildFolder(tabFolder, EXPORT_FOLDER_NAME);

  setupContext.masterSpreadsheet = sheetForFile(masterSheetFile);
  createTemplatesFolder(setupContext);

  if (createdMasterSheet) {
    populateMasterSpreadsheet(
      setupContext,
      orchestratorFile,
      tabFolder,
      exportFolder
    );
  }

  SpreadsheetApp.flush();

  if (setupContext.setUpGoogleFormBallot) {
    setUpGoogleFormBallot(
      tabFolder,
      setupContext.formBallotTemplate,
      setupContext.masterSpreadsheet,
      setupContext.roundsInfo.map((round) => round.name),
      setupContext.courtroomsInfo.map((courtroom) => courtroom.name),
      setupContext.tournamentName
    );
  }
  createTrialFolders(setupContext, tabFolder);
  setupContext.writeCourtroomsToMaster();
  SheetLogger.log(
    `Created ballots for ${setupContext.roundsInfo.length} round(s).`
  );
}

const setUpGoogleFormBallot = (
  tabFolder: GoogleAppsScript.Drive.Folder,
  formBallotTemplate: GoogleAppsScript.Drive.File,
  masterSpreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet,
  rounds: string[],
  courtrooms: string[],
  tournamentName: string
) => {
  Logger.log("Setting up Google Form ballot...");
  // Copy into tab folder
  const formFile = formBallotTemplate.makeCopy(
    `${tournamentName} Ballot`,
    tabFolder
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
    masterSpreadsheet.getId()
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
      sheet.getMaxColumns()
    );
    // Add alternating-color formatting
    range.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false);
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
          cell.toString().replace("Petitioner", "P").replace("Respondent", "R")
        ),
    ]);
    firstRow.setFontWeight("bold");
  });
};

const createTrialFolders = (
  setupContext: SetupContext,
  tabFolder: GoogleAppsScript.Drive.Folder
) => {
  for (let round of setupContext.roundsInfo.slice(0, setupContext.numRounds)) {
    const roundFolderName = round.name;
    let roundFolder = getChildFolder(tabFolder, roundFolderName);
    if (roundFolder == undefined) {
      roundFolder = tabFolder.createFolder(roundFolderName);
      // DO NOT REMOVE THE BELOW LINE!
      // Because if all editors of a spreadsheet are whitelisted, protection doesn't work at all.
      roundFolder.addEditor("damiansheehy.mc@gmail.com");
    } else {
      SheetLogger.log(
        `${round.name} round folder already exists, not creating a new one...`
      );
    }
    setupContext.courtroomsInfo
      // Global limiter
      .slice(0, setupContext.numCourtrooms)
      // Per-round limiter
      .slice(0, round.numCourtrooms)
      .forEach((info) =>
        createTrialFolder(setupContext, roundFolder, round, info)
      );
  }
};

const populateMasterSpreadsheet = (
  setupContext: SetupContext,
  orchestratorFile: GoogleAppsScript.Drive.File,
  tabFolder: GoogleAppsScript.Drive.Folder,
  exportFolder: GoogleAppsScript.Drive.Folder
) => {
  if (orchestratorFile) {
    setupContext.masterSpreadsheet
      .getRangeByName(MasterRange.OrchestratorLink)
      .setValue(orchestratorFile.getUrl());
  }
  setupContext.masterSpreadsheet
    .getRangeByName(MasterRange.ParentFolderLink)
    .setValue(tabFolder.getUrl());
  setupContext.masterSpreadsheet
    .getRangeByName(MasterRange.ExportFolderLink)
    .setValue(exportFolder.getUrl());
  setupContext.masterSpreadsheet
    .getRangeByName(MasterRange.TournamentName)
    .setValue(setupContext.tournamentName);
  setupContext.masterSpreadsheet
    .getRangeByName(MasterRange.TournamentEmail)
    .setValue(setupContext.tournamentContactEmail);
  setupContext.masterSpreadsheet
    .getRangeByName(MasterRange.FirstPartyName)
    .setValue(setupContext.firstPartyName);
  setupContext.masterSpreadsheet
    .getRangeByName(MasterRange.SecondPartyName)
    .setValue(setupContext.secondPartyName);
  setupContext.masterSpreadsheet
    .getRangeByName(MasterRange.BallotTemplateLink)
    .setValue(setupContext.ballotTemplate.getUrl());
};

const createTemplatesFolder = (setupContext: SetupContext) => {
  // Check if "Templates" folder exists in setupContext.tabFolder
  const templateFolderName = "Templates";
  const ballotTemplateName = "Ballot Template";
  const captainsFormTemplateName = "Captains' Form Template";
  let templateFolder = getChildFolder(
    setupContext.tabFolder,
    templateFolderName
  );
  if (templateFolder) {
    SheetLogger.log(
      "Templates folder already exists, not creating a new one..."
    );
    setupContext.ballotTemplate = getFileByName(
      templateFolder,
      ballotTemplateName
    );
    setupContext.captainsFormTemplate = getFileByName(
      templateFolder,
      captainsFormTemplateName
    );
    return;
  }
  SheetLogger.log("Creating templates folder in tab directory...");
  templateFolder = setupContext.tabFolder.createFolder(templateFolderName);

  SheetLogger.log("Creating ballot template...");
  setupContext.ballotTemplate = setupContext.ballotBaseTemplate.makeCopy(
    ballotTemplateName,
    templateFolder
  );
  const ballotTemplateSheet = sheetForFile(setupContext.ballotTemplate);
  ballotTemplateSheet
    .getRangeByName(BallotRange.TournamentName)
    .setValue(setupContext.tournamentName);
  ballotTemplateSheet
    .getRangeByName(BallotRange.FirstPartyName)
    .setValue(setupContext.firstPartyName);
  ballotTemplateSheet
    .getRangeByName(BallotRange.SecondPartyName)
    .setValue(setupContext.secondPartyName);

  if (setupContext.generateCompetitorForms) {
    SheetLogger.log("Creating Captains' Form template...");
    setupContext.captainsFormTemplate =
      setupContext.captainsFormBaseTemplate.makeCopy(
        captainsFormTemplateName,
        templateFolder
      );
    const captainsFormTemplateSheet = sheetForFile(
      setupContext.captainsFormTemplate
    );
    captainsFormTemplateSheet
      .getRangeByName(CaptainsFormRange.TournamentName)
      .setValue(setupContext.tournamentName);
    captainsFormTemplateSheet
      .getRangeByName(CaptainsFormRange.FirstPartyName)
      .setValue(setupContext.firstPartyName);
    captainsFormTemplateSheet
      .getRangeByName(CaptainsFormRange.SecondPartyName)
      .setValue(setupContext.secondPartyName);
    captainsFormTemplateSheet
      .getRangeByName(CaptainsFormRange.AutocompleteEngineLink)
      .setValue(setupContext.autocompleteEngine.getUrl());
    captainsFormTemplateSheet
      .getRangeByName(CaptainsFormRange.CourtroomsCommaSep)
      .setValue(setupContext.courtroomsInfo.map((info) => info.name).join(","));
    captainsFormTemplateSheet
      .getRangeByName(CaptainsFormRange.RoundsCommaSep)
      .setValue(setupContext.roundsInfo.map((info) => info.name).join(","));
  }
};

const createTrialFolder = (
  setupContext: ISetupContext,
  roundFolder: Folder,
  round: IRoundInfo,
  courtroomInfo: ICourtroomInfo
) => {
  const trialFolderName = `${round.name} - ${courtroomInfo.name}`;
  const trialPrefix = `${round.name} ${courtroomInfo.name}`;
  SheetLogger.log(`Creating ${trialPrefix} ballots and captain's form...`);
  let trialFolder = getChildFolder(roundFolder, trialFolderName);
  if (trialFolder) {
    SheetLogger.log(
      `${trialPrefix} folder already exists, not creating a new one...`
    );
    setupContext.saveCourtroomFolderLink(
      courtroomInfo.name,
      trialFolder.getUrl()
    );
    // Enforce idempotency only at the trial level, not the ballot/captains form level.
    return;
  }
  trialFolder = roundFolder.createFolder(trialFolderName);
  setupContext.saveCourtroomFolderLink(
    courtroomInfo.name,
    trialFolder.getUrl()
  );

  let trialCaptainsForm;
  if (setupContext.generateCompetitorForms) {
    trialCaptainsForm = prepareCaptainsForm(
      setupContext,
      trialFolder,
      trialPrefix,
      round,
      courtroomInfo
    );
    trialCaptainsForm.setSharing(
      DriveApp.Access.ANYONE_WITH_LINK,
      DriveApp.Permission.EDIT
    );
  }
  const trialBallots = [];
  if (setupContext.generateVirtualBallots) {
    for (let i = 1; i <= round.numBallots; i++) {
      const createdBallot = setupContext.ballotTemplate.makeCopy(
        `${trialPrefix} - Judge ${i} Ballot`,
        trialFolder
      );
      createdBallot.setSharing(
        DriveApp.Access.ANYONE_WITH_LINK,
        DriveApp.Permission.EDIT
      );
      trialBallots.push(createdBallot);
    }
  }
  if (
    setupContext.generateCompetitorForms &&
    setupContext.generateVirtualBallots
  ) {
    linkTrialSheets(trialCaptainsForm, trialBallots);
  }
  SpreadsheetApp.flush();
};

const prepareCaptainsForm = (
  setupContext: ISetupContext,
  trialFolder: Folder,
  trialPrefix: string,
  round: IRoundInfo,
  courtroomInfo: ICourtroomInfo
) => {
  const captainsForm = setupContext.captainsFormTemplate.makeCopy(
    `${trialPrefix} - Competitor Info Form`,
    trialFolder
  );
  const captainsFormSheet = sheetForFile(captainsForm);
  captainsFormSheet
    .getRangeByName(CaptainsFormRange.Round)
    .setValue(round.name);
  captainsFormSheet
    .getRangeByName(CaptainsFormRange.Courtroom)
    .setValue(courtroomInfo.name);
  captainsFormSheet
    .getRangeByName(CaptainsFormRange.AutocompleteEngineLink)
    .setValue(setupContext.autocompleteEngine.getUrl());
  return captainsForm;
};

const linkTrialSheets = (captainsForm: GoogleFile, ballots: GoogleFile[]) => {
  const captainsFormUrl = captainsForm.getUrl();
  for (let ballot of ballots) {
    const ballotSheet = sheetForFile(ballot);
    const urlRange = ballotSheet.getRangeByName(BallotRange.CaptainsFormUrl);
    urlRange.setValue(captainsFormUrl);
  }
};
