// Copyright (c) 2020 Faiz Surani. All rights reserved.

// DO NOT RUN THIS DURING THE TOURNAMENT UNDER ANY CIRCUMSTANCES. THIS IS ONLY FOR GENERATING FOLDERS BEFOREHAND.

// TODO: My rough math shows that the full generation will take around 18 minutes, but the App Script limit is 6 minutes.
// It will take some clever refactoring to generate everything in chunks, particularly because I'll have to either create the master
// spreadsheet or find it if it already exists.
function CreateTrialFolders() {
    const ballotsPerTrial = 2;
    // const roundNames = ["1", "2", "3", "4"];
    // const courtroomNames = ["Girvetz", "Buchanan", "Campbell", "Phelps", "Ellison", "Harold Frank", "Kerr", "North", "Cheadle", "Kohn", "Broida", "Elings", "South"]
    // To avoid killing my file creation quota, going to use smaller numbers of rounds/courtrooms while testing.
    const roundNames = ["1", "2"];
    const courtroomNames = ["Girvetz", "Campbell"];

    const tabFolderId = "1rXR0MBLuOh2W0mbQKyugg3yVCWJc2SPI";
    const masterSheetTemplateId = "1Uu_YIZxbtr4hq47-32TxidlzCxRUWTpFKXJMkutmcbw";
    const ballotTemplateId = "1e0sJmxbfpyJSwqlquOWTN1YkaMyENuF5m472bRL0VHQ";
    const captainsFormTemplateId = "19YGAGewlDcIkTPiLl15l9FspVt0LHOnWNsYitY4Bu_4";

    const tabFolder = DriveApp.getFolderById(tabFolderId);
    const masterSheetTemplate = DriveApp.getFileById(masterSheetTemplateId);
    const ballotTemplate = DriveApp.getFileById(ballotTemplateId);
    const captainsFormTemplate = DriveApp.getFileById(captainsFormTemplateId);

    const masterSheetName = masterSheetTemplate.getName();
    if (tabFolder.getFilesByName(masterSheetName).hasNext()) {
        logDuplicate();
        return;
    }
    const masterSheetFile = masterSheetTemplate.makeCopy("Mocktopia Master Spreadsheet", tabFolder);
    tabFolder.createFolder("Team Ballots");

    const ballotFiles = [];
    for (let round of roundNames) {
        const roundFolderName = `Round ${round}`;
        if (tabFolder.getFoldersByName(roundFolderName).hasNext()) {
            logDuplicate();
            return;
        }
        const roundFolder = tabFolder.createFolder(roundFolderName);
        for (let courtroom of courtroomNames) {
            const trialFolderName = `R${round} - ${courtroom}`;
            const trialFolder = roundFolder.createFolder(trialFolderName);
            const trialPrefix = `R${round} ${courtroom}`
            // TODO: I can populate the round and courtroom fields from here automatically.
            const trialCaptainsForm = captainsFormTemplate.makeCopy(`${trialPrefix} - Captain's Form`, trialFolder);
            const trialBallots = [];
            console.log(`Creating ${trialPrefix} ballots and captain's form...`);
            for (let i = 1; i <= ballotsPerTrial; i++) {
                const createdBallot = ballotTemplate.makeCopy(`${trialPrefix} - Judge ${i} Ballot`, trialFolder);
                trialBallots.push(createdBallot);
                ballotFiles.push(createdBallot);
            }
            linkTrialSheets(trialCaptainsForm, trialBallots);
        }
    }
    populateBallotLinks(masterSheetFile, ballotFiles)
    console.log(`Created ${ballotFiles.length} ballots in total.`);
}

function populateBallotLinks(masterSheetFile, ballots) {
    if (ballots.length === 0) return;
    const outputCells = ballots.map(b => [b.getUrl(), b.getName()]);
    const startRow = 2; const endRow = startRow + ballots.length - 1;
    const rangeStr = `Ballot Links!A${startRow}:B${endRow}`;

    const masterSheet = sheetForFile(masterSheetFile);
    const linksRange = masterSheet.getRange(rangeStr);
    linksRange.setValues(outputCells);
}

function linkTrialSheets(captainsForm, ballots) {
    captainsForm.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const captainsFormUrl = captainsForm.getUrl();
    for (let ballot of ballots) {
        const ballotSheet = sheetForFile(ballot);
        const urlRange = ballotSheet.getRangeByName("CaptainsFormUrlRange");
        urlRange.setValue(captainsFormUrl);
    }
}

function logDuplicate() {
    console.log("Terminating tabulation folder setup because I found something I tried to create already existed. This probably means you accidentally ran the script again.")
    console.log("If you want to completely regenerate the folder, first delete all the existing stuff (being aware of the fact you'll lose any data you have in the existing files), then run this script again.")
}
