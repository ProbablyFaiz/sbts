// Copyright (c) 2020 Faiz Surani. All rights reserved.

// It is safe to run this after every round without making any manual change to the Team Ballots folder.
// The script is smart enough to see existing ballot PDFs and not recreate or overwrite them.

function CreateTeamBallotFolders() {
    const tabFolderId = "1rXR0MBLuOh2W0mbQKyugg3yVCWJc2SPI";
    const tabFolder = DriveApp.getFolderById(tabFolderId);
    const ballots = getAllBallots(tabFolder);
    const exportFolder = getChildFolder(tabFolder, "Team Ballots")
    exportBallots(ballots, exportFolder);
    console.log(ballots.length);
}

function exportBallots(ballots, exportFolder) {
    for (let ballot of ballots) {
        const ballotSheet = sheetForFile(ballot);
        const submittedRange = ballotSheet.getRangeByName("SubmitCheckboxRange");
        if (!submittedRange || !submittedRange.getValue()) {
            console.log(`${ballotSheet.getName()} not submitted, skipping...`)
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
                console.log(`Adding ${pdfName} to ${teamFolder.getName()}...`)
            } else {
                console.log(`${pdfName} already present in ${teamFolder.getName()}, skipping...`);
            }
        }
    }
}

function getChildFolder(parentFolder, childName) {
    const childFolderIterator = parentFolder.searchFolders(`title contains "${childName}"`);
    if (childFolderIterator.hasNext()) {
        return childFolderIterator.next();
    }
    return parentFolder.createFolder(childName);
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
