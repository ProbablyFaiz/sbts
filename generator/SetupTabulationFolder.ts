// Copyright (c) 2020 Faiz Surani. All rights reserved.


function SetupTabulationFolder(tabFolderLink: string) {
    const setupContext = new SetupContext(tabFolderLink);

    if (!setupContext.isValid) {
        SheetLogger.log("Tab folder is not empty. Aborting tabulation folder setup.");
        return;
    }
    const tabFolder = setupContext.tabFolder;

    let masterSheetFile = getFileByName(tabFolder, MASTER_SPREADSHEET_NAME);
    if (masterSheetFile) {
        SheetLogger.log("Existing master spreadsheet found, not creating a new one...")
    } else {
        masterSheetFile = setupContext.masterSheetTemplate.makeCopy(MASTER_SPREADSHEET_NAME, tabFolder);
    }
    let autocompleteEngineFile = getFileByName(tabFolder, AUTOCOMPLETE_SPREADSHEET_NAME);
    if (autocompleteEngineFile) {
        SheetLogger.log("Existing autocomplete engine spreadsheet found, not creating a new one...")
    } else {
        autocompleteEngineFile = setupContext.autocompleteEngineTemplate.makeCopy(AUTOCOMPLETE_SPREADSHEET_NAME, tabFolder);
        autocompleteEngineFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        setupContext.autocompleteEngine = autocompleteEngineFile;
    }
    let orchestratorFile = getFileByName(tabFolder, ORCHESTRATOR_SPREADSHEET_NAME);
    if (orchestratorFile) {
        SheetLogger.log("Orchestrator file found, not creating a new one...");
    } else {
        orchestratorFile = setupContext.orchestratorTemplate.makeCopy(ORCHESTRATOR_SPREADSHEET_NAME, tabFolder);
        const orchestratorSheet = sheetForFile(orchestratorFile);
        orchestratorSheet.getRangeByName(OrchestratorRange.MasterLink).setValue(masterSheetFile.getUrl());
        orchestratorSheet.getRangeByName(OrchestratorRange.AutocompleteEngineLink).setValue(autocompleteEngineFile.getUrl());
    }
    const exportFolder = getOrCreateChildFolder(tabFolder, EXPORT_FOLDER_NAME);

    const masterSheet: MasterSpreadsheet = sheetForFile(masterSheetFile);
    masterSheet.getRangeByName(MasterRange.OrchestratorLink).setValue(orchestratorFile.getUrl());
    masterSheet.getRangeByName(MasterRange.ParentFolderLink).setValue(tabFolder.getUrl());
    masterSheet.getRangeByName(MasterRange.ExportFolderLink).setValue(exportFolder.getUrl());
    masterSheet.getRangeByName(MasterRange.TournamentName).setValue(setupContext.tournamentName);
    masterSheet.getRangeByName(MasterRange.TournamentEmail).setValue(setupContext.tournamentContactEmail);

    createTemplatesFolder(setupContext);
    SpreadsheetApp.flush();

    for (let round of setupContext.roundNames) {
        const roundFolderName = `Round ${round}`;
        if (tabFolder.getFoldersByName(roundFolderName).hasNext()) {
            logDuplicate();
            return;
        }
        const roundFolder = tabFolder.createFolder(roundFolderName);
        roundFolder.addEditor("faiz.surani@gmail.com"); // Because if all editors of a spreadsheet are whitelisted, protection doesn't work at all.
        setupContext.courtroomsInfo.forEach(info => createTrialFolder(setupContext, roundFolder, round, info));
    }
    SheetLogger.log(`Created ${setupContext.roundNames.length * setupContext.courtroomsInfo.length * setupContext.ballotsPerTrial} ballots for ${setupContext.roundNames.length} round(s).`);
}

function createTemplatesFolder(setupContext: ISetupContext) {
    SheetLogger.log("Creating templates folder in tab directory...");
    const templateFolder = setupContext.tabFolder.createFolder("Templates");

    SheetLogger.log("Creating ballot template...");
    setupContext.ballotTemplate = setupContext.ballotBaseTemplate.makeCopy("Ballot Template", templateFolder);
    const ballotTemplateSheet = sheetForFile(setupContext.ballotTemplate);
    ballotTemplateSheet.getRangeByName(BallotRange.TournamentName).setValue(setupContext.tournamentName);
    ballotTemplateSheet.getRangeByName(BallotRange.FirstPartyName).setValue(setupContext.firstPartyName);

    SheetLogger.log("Creating Captains' Form template...");
    setupContext.captainsFormTemplate = setupContext.captainsFormBaseTemplate.makeCopy("Captains' Form Template", templateFolder);
    const captainsFormTemplateSheet = sheetForFile(setupContext.captainsFormTemplate);
    captainsFormTemplateSheet.getRangeByName(CaptainsFormRange.TournamentName).setValue(setupContext.tournamentName);
    captainsFormTemplateSheet.getRangeByName(CaptainsFormRange.FirstPartyName).setValue(setupContext.firstPartyName);
    captainsFormTemplateSheet.getRangeByName(CaptainsFormRange.AutocompleteEngineLink).setValue(setupContext.autocompleteEngine.getUrl());
}

function createTrialFolder(setupContext: ISetupContext, roundFolder: Folder, round: string, courtroomInfo: ICourtroomInfo) {
    const trialFolderName = `R${round} - ${courtroomInfo.name}`;
    const trialPrefix = `R${round} ${courtroomInfo.name}`
    SheetLogger.log(`Creating ${trialPrefix} ballots and captain's form...`);
    const trialFolder = roundFolder.createFolder(trialFolderName);
    trialFolder.addEditors(courtroomInfo.bailiffEmails);

    const trialCaptainsForm = prepareCaptainsForm(setupContext, trialFolder, trialPrefix, round, courtroomInfo);
    const trialBallots = [];
    for (let i = 1; i <= setupContext.ballotsPerTrial; i++) {
        const createdBallot = setupContext.ballotTemplate.makeCopy(`${trialPrefix} - Judge ${i} Ballot`, trialFolder);
        createdBallot.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
        trialBallots.push(createdBallot);
    }
    linkTrialSheets(trialCaptainsForm, trialBallots);
}

function prepareCaptainsForm(setupContext: ISetupContext, trialFolder: Folder, trialPrefix: string, round: string | number, courtroomInfo: ICourtroomInfo) {
    const captainsForm = setupContext.captainsFormTemplate.makeCopy(`${trialPrefix} - Captains' Meeting Form`, trialFolder);
    const captainsFormSheet = sheetForFile(captainsForm);
    captainsFormSheet.getRangeByName(CaptainsFormRange.Round).setValue(round);
    captainsFormSheet.getRangeByName(CaptainsFormRange.Courtroom).setValue(courtroomInfo.name);
    captainsFormSheet.getRangeByName(CaptainsFormRange.AutocompleteEngineLink).setValue(setupContext.autocompleteEngine.getUrl());

    return captainsForm;
}

function linkTrialSheets(captainsForm: GoogleFile, ballots: GoogleFile[]) {
    captainsForm.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
    const captainsFormUrl = captainsForm.getUrl();
    for (let ballot of ballots) {
        const ballotSheet = sheetForFile(ballot);
        const urlRange = ballotSheet.getRangeByName(BallotRange.CaptainsFormUrl);
        urlRange.setValue(captainsFormUrl);
    }
}

function logDuplicate() {
    SheetLogger.log("Terminating tabulation folder setup because I found something I tried to create already existed. This probably means you accidentally ran the script again.")
    SheetLogger.log("If you want to completely regenerate the folder, first delete all the existing stuff (being aware of the fact you'll lose any data you have in the existing files), then run this script again.")
}
