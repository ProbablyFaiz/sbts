// Copyright (c) 2020 Faiz Surani. All rights reserved.


function SetupTabulationFolder() {
    const setupContext = new SetupContext();

    if (!setupContext.isValid) {
        console.log("Tab folder is not empty. Aborting tabulation folder setup.");
        return;
    }
    const tabFolder = setupContext.tabFolder;
    createTemplatesFolder(setupContext);

    let masterSheetFile = getFileByName(tabFolder, MASTER_SPREADSHEET_NAME);
    if (masterSheetFile) {
        console.log("Existing master spreadsheet found, not creating a new one...")
    } else {
        masterSheetFile = setupContext.masterSheetTemplate.makeCopy(MASTER_SPREADSHEET_NAME, tabFolder);
    }
    let orchestratorFile = getFileByName(tabFolder, ORCHESTRATOR_SPREADSHEET_NAME);
    if (orchestratorFile) {
        console.log("Orchestrator file found, not creating a new one...");
    } else {
        orchestratorFile = setupContext.orchestratorTemplate.makeCopy(ORCHESTRATOR_SPREADSHEET_NAME, tabFolder);
        const orchestratorSheet = sheetForFile(orchestratorFile);
        orchestratorSheet.getRangeByName(OrchestratorRange.MasterLink).setValue(masterSheetFile.getUrl());
    }

    getOrCreateChildFolder(tabFolder, EXPORT_FOLDER_NAME);

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
    console.log(`Created ${setupContext.roundNames.length * setupContext.courtroomsInfo.length * setupContext.ballotsPerTrial} ballots for ${setupContext.roundNames.length} round(s).`);
}

function createTemplatesFolder(setupContext: ISetupContext) {
    const templateFolder = setupContext.tabFolder.createFolder("Templates");

    setupContext.ballotTemplate = setupContext.ballotBaseTemplate.makeCopy("Ballot Template", templateFolder);
    const ballotTemplateSheet = sheetForFile(setupContext.ballotTemplate);
    ballotTemplateSheet.getRangeByName(BallotRange.TournamentName).setValue(setupContext.tournamentName);
    ballotTemplateSheet.getRangeByName(BallotRange.FirstPartyName).setValue(setupContext.firstPartyName);

    setupContext.captainsFormTemplate = setupContext.captainsFormBaseTemplate.makeCopy("Captains' Form Template", templateFolder);
    const captainsFormTemplateSheet = sheetForFile(setupContext.captainsFormTemplate);
    captainsFormTemplateSheet.getRangeByName(CaptainsFormRange.TournamentName).setValue(setupContext.tournamentName);
    captainsFormTemplateSheet.getRangeByName(CaptainsFormRange.FirstPartyName).setValue(setupContext.firstPartyName);
}

function createTrialFolder(setupContext: ISetupContext, roundFolder: Folder, round: string, courtroomInfo: ICourtroomInfo) {
    const trialFolderName = `R${round} - ${courtroomInfo.name}`;
    const trialFolder = roundFolder.createFolder(trialFolderName);
    courtroomInfo.bailiffEmails.forEach(email => trialFolder.addEditor(email));
    const trialPrefix = `R${round} ${courtroomInfo.name}`
    const trialCaptainsForm = prepareCaptainsForm(setupContext, trialFolder, trialPrefix, round, courtroomInfo);
    const trialBallots = [];
    console.log(`Creating ${trialPrefix} ballots and captain's form...`);
    for (let i = 1; i <= setupContext.ballotsPerTrial; i++) {
        const createdBallot = setupContext.ballotBaseTemplate.makeCopy(`${trialPrefix} - Judge ${i} Ballot`, trialFolder);
        createdBallot.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
        trialBallots.push(createdBallot);
    }
    linkTrialSheets(trialCaptainsForm, trialBallots);
}

function prepareCaptainsForm(setupContext: ISetupContext, trialFolder: Folder, trialPrefix: string, round: string | number, courtroomInfo: ICourtroomInfo) {
    const captainsForm = setupContext.captainsFormBaseTemplate.makeCopy(`${trialPrefix} - Captains' Meeting Form`, trialFolder);
    const captainsFormSheet = sheetForFile(captainsForm);
    captainsFormSheet.getRangeByName(CaptainsFormRange.Round).setValue(round);
    captainsFormSheet.getRangeByName(CaptainsFormRange.Courtroom).setValue(courtroomInfo.name);

    return captainsForm;
}

function linkTrialSheets(captainsForm, ballots) {
    captainsForm.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
    const captainsFormUrl = captainsForm.getUrl();
    for (let ballot of ballots) {
        const ballotSheet = sheetForFile(ballot);
        const urlRange = ballotSheet.getRangeByName(BallotRange.CaptainsFormUrl);
        urlRange.setValue(captainsFormUrl);
    }
}

function logDuplicate() {
    console.log("Terminating tabulation folder setup because I found something I tried to create already existed. This probably means you accidentally ran the script again.")
    console.log("If you want to completely regenerate the folder, first delete all the existing stuff (being aware of the fact you'll lose any data you have in the existing files), then run this script again.")
}
