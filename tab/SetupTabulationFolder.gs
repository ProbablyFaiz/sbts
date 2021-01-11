// Copyright (c) 2020 Faiz Surani. All rights reserved.

const ballotsPerTrial = 2;
const roundNames = ["4"];
const courtroomNames = ["Girvetz", "Buchanan", "Campbell", "Phelps", "Ellison", "Harold Frank", "Kerr", "North", "Cheadle", "Kohn", "Broida", "Elings", "South"]
// const roundNames = ["1","2","3","4"];
// const courtroomNames = ["Girvetz", "Buchanan"]

// const courtroomNames = ["Girvetz", "Campbell"];

// DO NOT RUN THIS DURING THE TOURNAMENT UNDER ANY CIRCUMSTANCES. THIS IS ONLY FOR GENERATING FOLDERS BEFOREHAND.
function SetupTabulationFolder() {
    const tabFolder = getTabFolder();
    const masterSheetTemplate = DriveApp.getFileById(MASTER_SHEET_TEMPLATE_ID);
    const orchestratorTemplate = DriveApp.getFileById(ORCHESTRATOR_TEMPLATE_ID);
    const ballotTemplate = DriveApp.getFileById(BALLOT_TEMPLATE_ID);
    const captainsFormTemplate = DriveApp.getFileById(CAPTAINS_FORM_TEMPLATE_ID);

    let masterSheetFile = getFileByName(tabFolder, MASTER_SPREADSHEET_NAME);
    if (masterSheetFile) {
        console.log("Existing master spreadsheet found, not creating a new one...")
    } else {
        masterSheetFile = masterSheetTemplate.makeCopy(MASTER_SPREADSHEET_NAME, tabFolder);
    }
    let orchestratorFile = getFileByName(tabFolder, ORCHESTRATOR_SPREADSHEET_NAME);
    if (orchestratorFile) {
        console.log("Orchestrator file found, not creating a new one...");
    } else {
        orchestratorFile = orchestratorTemplate.makeCopy(ORCHESTRATOR_SPREADSHEET_NAME, tabFolder);
        const orchestratorSheet = sheetForFile(orchestratorFile);
        orchestratorSheet.getRangeByName(OrchestratorRanges.MASTER_LINK).setValue(masterSheetFile.getUrl());
    }

    getChildFolder(tabFolder, EXPORT_FOLDER_NAME);

    for (let round of roundNames) {
        const roundFolderName = `Round ${round}`;
        if (tabFolder.getFoldersByName(roundFolderName).hasNext()) {
            logDuplicate();
            return;
        }
        const roundFolder = tabFolder.createFolder(roundFolderName);
        courtroomNames.forEach(ctrm => createTrialFolder(roundFolder, round, ctrm, ballotTemplate, captainsFormTemplate));
    }
    console.log(`Created ${roundNames.length * courtroomNames.length * ballotsPerTrial} ballots for ${roundNames.length} round(s).`);
}

function createTrialFolder(roundFolder, round, courtroom, ballotTemplate, captainsFormTemplate) {
    const trialFolderName = `R${round} - ${courtroom}`;
    const trialFolder = roundFolder.createFolder(trialFolderName);
    const trialPrefix = `R${round} ${courtroom}`
    const trialCaptainsForm = prepareCaptainsForm(trialFolder, trialPrefix, round, courtroom, captainsFormTemplate);
    const trialBallots = [];
    console.log(`Creating ${trialPrefix} ballots and captain's form...`);
    for (let i = 1; i <= ballotsPerTrial; i++) {
        const createdBallot = ballotTemplate.makeCopy(`${trialPrefix} - Judge ${i} Ballot`, trialFolder);
        createdBallot.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT); // TODO: Revisit this, might be a security hazard.
        trialBallots.push(createdBallot);
    }
    linkTrialSheets(trialCaptainsForm, trialBallots);
}

function prepareCaptainsForm(trialFolder, trialPrefix, round, courtroom, captainsFormTemplate) {
    const captainsForm = captainsFormTemplate.makeCopy(`${trialPrefix} - Captains' Meeting Form`, trialFolder);

    const captainsFormSheet = sheetForFile(captainsForm);
    captainsFormSheet.getRangeByName(CaptainsFormRanges.ROUND).setValue(round);
    captainsFormSheet.getRangeByName(CaptainsFormRanges.COURTROOM).setValue(`${courtroom} Hall`); // Kind of hacky, could cause issues later

    return captainsForm;
}

function linkTrialSheets(captainsForm, ballots) {
    captainsForm.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
    const captainsFormUrl = captainsForm.getUrl();
    for (let ballot of ballots) {
        const ballotSheet = sheetForFile(ballot);
        const urlRange = ballotSheet.getRangeByName(BallotRanges.CAPTAINS_FORM_URL);
        urlRange.setValue(captainsFormUrl);
    }
}

function logDuplicate() {
    console.log("Terminating tabulation folder setup because I found something I tried to create already existed. This probably means you accidentally ran the script again.")
    console.log("If you want to completely regenerate the folder, first delete all the existing stuff (being aware of the fact you'll lose any data you have in the existing files), then run this script again.")
}
