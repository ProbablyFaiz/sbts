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
  if (autocompleteEngineFile) {
    SheetLogger.log(
      "Existing autocomplete engine spreadsheet found, not creating a new one..."
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
  if (orchestratorFile) {
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
    orchestratorSheet
      .getRangeByName(OrchestratorRange.AutocompleteEngineLink)
      .setValue(autocompleteEngineFile.getUrl());
  }
  const exportFolder = getOrCreateChildFolder(tabFolder, EXPORT_FOLDER_NAME);

  setupContext.masterSpreadsheet = sheetForFile(masterSheetFile);
  if (createdMasterSheet) {
    populateMasterSpreadsheet(
      setupContext,
      orchestratorFile,
      tabFolder,
      exportFolder
    );
  }

  createTemplatesFolder(setupContext);
  SpreadsheetApp.flush();

  for (let round of setupContext.roundsInfo) {
    const roundFolderName = `Round ${round.name}`;
    let roundFolder = getChildFolder(tabFolder, roundFolderName);
    if (roundFolder == undefined) {
      roundFolder = tabFolder.createFolder(roundFolderName);
      // DO NOT REMOVE THE BELOW LINE!
      // Because if all editors of a spreadsheet are whitelisted, protection doesn't work at all.
      roundFolder.addEditor("damiansheehy.mc@gmail.com");
    } else {
      SheetLogger.log(
        `Round ${round.name} folder already exists, not creating a new one...`
      );
    }
    setupContext.courtroomsInfo
      // This is the per-round limiter, not the global one.
      .slice(0, round.numCourtrooms)
      .forEach((info) =>
        createTrialFolder(setupContext, roundFolder, round, info)
      );
  }
  setupContext.writeCourtroomsToMaster();
  SheetLogger.log(
    `Created ballots for ${setupContext.roundsInfo.length} round(s).`
  );
}

function populateMasterSpreadsheet(
  setupContext: SetupContext,
  orchestratorFile: GoogleAppsScript.Drive.File,
  tabFolder: GoogleAppsScript.Drive.Folder,
  exportFolder: GoogleAppsScript.Drive.Folder
) {
  setupContext.masterSpreadsheet
    .getRangeByName(MasterRange.OrchestratorLink)
    .setValue(orchestratorFile.getUrl());
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
}

function createTemplatesFolder(setupContext: ISetupContext) {
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

function createTrialFolder(
  setupContext: ISetupContext,
  roundFolder: Folder,
  round: IRoundInfo,
  courtroomInfo: ICourtroomInfo
) {
  const trialFolderName = `R${round.name} - ${courtroomInfo.name}`;
  const trialPrefix = `R${round.name} ${courtroomInfo.name}`;
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

  const trialCaptainsForm = prepareCaptainsForm(
    setupContext,
    trialFolder,
    trialPrefix,
    round,
    courtroomInfo
  );
  const trialBallots = [];
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
  linkTrialSheets(trialCaptainsForm, trialBallots);
}

function prepareCaptainsForm(
  setupContext: ISetupContext,
  trialFolder: Folder,
  trialPrefix: string,
  round: IRoundInfo,
  courtroomInfo: ICourtroomInfo
) {
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
}

function linkTrialSheets(captainsForm: GoogleFile, ballots: GoogleFile[]) {
  captainsForm.setSharing(
    DriveApp.Access.ANYONE_WITH_LINK,
    DriveApp.Permission.EDIT
  );
  const captainsFormUrl = captainsForm.getUrl();
  for (let ballot of ballots) {
    const ballotSheet = sheetForFile(ballot);
    const urlRange = ballotSheet.getRangeByName(BallotRange.CaptainsFormUrl);
    urlRange.setValue(captainsFormUrl);
  }
}
