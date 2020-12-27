// Copyright (c) 2020 Faiz Surani. All rights reserved.

// It is safe to run this after every round without making any manual change to the Team Ballots folder.
// The script is smart enough to see existing ballot PDFs and not recreate or overwrite them.

function CreateTeamBallotFolders() {
    const tabFolderId = "1rXR0MBLuOh2W0mbQKyugg3yVCWJc2SPI";
    const tabFolder = DriveApp.getFolderById(tabFolderId);
    // const test = DriveApp.getFileById("d");
    // const test1 = test.getAs('');
    // test1.setName()
    const ballots = getAllBallots(tabFolder);
    const exportFolder = getExportFolder(tabFolder)
    exportBallots(ballots, exportFolder);
    console.log(ballots.length);
}

function exportBallots(ballots, exportFolder) {
    for (let ballot of ballots) {
        const ballotSheet = SpreadsheetApp.openById(ballot.getId());
        const submittedRange = ballotSheet.getRangeByName("SubmitCheckboxRange");
        if (!submittedRange || !submittedRange.getValue()) {
            continue;
        }
        const plaintiffTeam = ballotSheet.getRangeByName("PlaintiffTeamRange").getValue();
        const defenseTeam = ballotSheet.getRangeByName("DefenseTeamRange").getValue();
        const round = ballotSheet.getRangeByName("RoundRange").getValue();
        const judgeName = ballotSheet.getRangeByName("JudgeNameRange").getValue();
        const pdfName = `R${round} - ${plaintiffTeam} v. ${defenseTeam} (Judge ${judgeName}).pdf`;

        let existingBallot;
        for (let team of [plaintiffTeam, defenseTeam]) {
            if (team === "") continue;
            const teamFolder = getChildFolder(exportFolder, "Team " + team + " ") // The "Team" and space are important so we don't get a snafu where one team number is a prefix/suffix of another.
            const teamRoundFolder = getChildFolder(teamFolder, `Round ${round} `);
            if (!teamRoundFolder.getFilesByName(pdfName).hasNext()) {
                const pdfBallot = existingBallot || ballot.getAs("application/pdf");
                pdfBallot.setName(pdfName);
                existingBallot = pdfBallot; // We can save half of the exports by saving the ballot blob for the second go-round.
                teamRoundFolder.createFile(pdfBallot);
            }
        }
    }
}

function getChildFolder(parentFolder, childName) {
    const childFolderIterator = parentFolder.searchFolders(`title contains "${childName}"`);
    let childFolder;
    if (childFolderIterator.hasNext()) {
        childFolder = childFolderIterator.next();
    }
    else {
        childFolder = parentFolder.createFolder(childName);
    }
    return childFolder;
}

function getExportFolder(tabFolder) {
    const exportFolderName = "Team Ballots";
    const exportFolderIterator = tabFolder.getFoldersByName(exportFolderName);
    if (exportFolderIterator.hasNext()) {
        return exportFolderIterator.next();
    }
    return tabFolder.createFolder(exportFolderName);
}

function getAllBallots(tabFolder) {
    const ballots = [];
    const roundFolders = tabFolder.searchFolders('title contains "Round"');
    while (roundFolders.hasNext()) {
        const roundFolder = roundFolders.next();
        const trialFolders = roundFolder.getFolders();
        while (trialFolders.hasNext()) {
            const ballotFiles = trialFolders.next().searchFiles('title contains "Ballot"');
            while (ballotFiles.hasNext()) {
                const file = ballotFiles.next();
                ballots.push(file);
            }
        }
    }
    return ballots;
}
