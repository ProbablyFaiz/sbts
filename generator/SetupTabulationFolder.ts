// Copyright (c) 2020 Faiz Surani. All rights reserved.

function SetupTabulationFolder(tabFolderLink: string) {
  const setupContext = new SetupContext(tabFolderLink);

  // if (!setupContext.isValid) {
  //     SheetLogger.log("Tab folder is not empty. Aborting tabulation folder setup.");
  //     return;
  // }
  const tabFolder = setupContext.tabFolder;

  let masterSheetFile = getFileByName(tabFolder, MASTER_SPREADSHEET_NAME);
  if (masterSheetFile) {
    SheetLogger.log(
      "Existing master spreadsheet found, not creating a new one..."
    );
  } else {
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

  createTemplatesFolder(setupContext);
  SpreadsheetApp.flush();

  for (let round of setupContext.roundsInfo) {
    const roundFolderName = `Round ${round.name}`;
    if (tabFolder.getFoldersByName(roundFolderName).hasNext()) {
      logDuplicate();
      return;
    }
    const roundFolder = tabFolder.createFolder(roundFolderName);
    // DO NOT REMOVE THE BELOW LINE! IT BREAKS BALLOT PROTECTION COMPLETELY. ALSO DO NOT USE THIS EMAIL AS A BAILIFF!!!
    roundFolder.addEditor("damiansheehy.mc@gmail.com"); // Because if all editors of a spreadsheet are whitelisted, protection doesn't work at all.
    setupContext.courtroomsInfo
      .slice(0, round.numCourtrooms)
      .forEach((info) =>
        createTrialFolder(setupContext, roundFolder, round, info)
      );
  }
  setupContext.writeCourtroomsToMaster();
  // TODO: Fix this log message to show the correct number of ballots.
  SheetLogger.log(
    `Created ballots for ${setupContext.roundsInfo.length} round(s).`
  );
}

function createTemplatesFolder(setupContext: ISetupContext) {
  SheetLogger.log("Creating templates folder in tab directory...");
  const templateFolder = setupContext.tabFolder.createFolder("Templates");

  SheetLogger.log("Creating ballot template...");
  setupContext.ballotTemplate = setupContext.ballotBaseTemplate.makeCopy(
    "Ballot Template",
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
      "Captains' Form Template",
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
  const trialFolder = roundFolder.createFolder(trialFolderName);
  // Disabled because we're moving sharing with bailiffs to a separate stage.
  // trialFolder.addEditors(courtroomInfo.bailiffEmails);
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

function logDuplicate() {
  SheetLogger.log(
    "Terminating tabulation folder setup because I found something I tried to create already existed. This probably means you accidentally ran the script again."
  );
  SheetLogger.log(
    "If you want to completely regenerate the folder, first delete all the existing stuff (being aware of the fact you'll lose any data you have in the existing files), then run this script again."
  );
}
