// Copyright (c) 2020 Faiz Surani. All rights reserved.

const TAB_FOLDER_ID = "1Z8DlvHy5TXwH6zrsfDpx8QzbZ80noKGv";

const MASTER_SPREADSHEET_NAME = "Mocktopia Master Spreadsheet";
const ORCHESTRATOR_SPREADSHEET_NAME = "Mocktopia Orchestrator";
const EXPORT_FOLDER_NAME = "Team Ballots";
const MASTER_SHEET_TEMPLATE_ID = "1CVOXZ0gxyRKBnDLZkJzrO-lIYVNrGCc5HT1-hyyNSE0";
const ORCHESTRATOR_TEMPLATE_ID = "14OxqfyC4EdACX6aQjUCrfezMBCOS5f6_6qg42bAu5xk";
const BALLOT_TEMPLATE_ID = "18GdB6rswOT2Rl1x9hlxgYTuP4gCG_5bESOqJC0VqBzg";
const CAPTAINS_FORM_TEMPLATE_ID = "1_PCRADPEooz0_5OZyzixGldEAazKnA8BqoN2yblh7oU";

const NUM_BALLOTS = 2;

function sheetForFile(file) {
    return SpreadsheetApp.openById(file.getId())
}

function getTabFolder() {
    return DriveApp.getFolderById(TAB_FOLDER_ID);
}

function getMasterSheet(tabFolder) {
    return sheetForFile(getFileByName(tabFolder, MASTER_SPREADSHEET_NAME));
}

function getChildFolder(parentFolder, childName) {
    const childFolderIterator = parentFolder.searchFolders(`title contains "${childName}"`);
    if (childFolderIterator.hasNext()) {
        return childFolderIterator.next();
    }
    return parentFolder.createFolder(childName);
}

function getFileByName(parentFolder, name) {
    const fileIterator = parentFolder.getFilesByName(name);
    if (fileIterator.hasNext()) {
        return fileIterator.next();
    }
    return undefined;
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

// This is a really stupid hack to allow me to use tuple keys with ES6 maps.
// It is very brittle, and should be fired into the sun at earliest convenience.
// When iterating over keys, remember to deserialize the JSON back into an object.
// I would do it in the class but it's a pain in the ass to reimplement the iterator.
class TupleMap extends Map {
    get(key) {
        return super.get(JSON.stringify(key));
    }

    set(key, value) {
        return super.set(JSON.stringify(key), value);
    }

    has(key) {
        return super.has(JSON.stringify(key))
    }
}
