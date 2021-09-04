// Copyright (c) 2020 Faiz Surani. All rights reserved.

const TAB_FOLDER_ID = "1Am7h0hqFeMOxKW1crHFu6k6EaNljD8Bg";

const MASTER_SPREADSHEET_NAME = "Mocktopia Master Spreadsheet";
const ORCHESTRATOR_SPREADSHEET_NAME = "Mocktopia Orchestrator";
const EXPORT_FOLDER_NAME = "Team Ballots";
const MASTER_SHEET_TEMPLATE_ID =  "1SkxzCtONNUIV8WEav5y2oKKF1TR-93OzemhUwo7q7Eo";
const ORCHESTRATOR_TEMPLATE_ID =  "1tPQSQjBkgwucYhdkk2eMR4tqtgJ7eY_dC9aX5Kbqh8w";
const BALLOT_TEMPLATE_ID =        "1YY32L5JPNet4AIyh97ZBXVlgboWmgIEAAjDWMrbihuU";
const CAPTAINS_FORM_TEMPLATE_ID = "1gujJVuGmNORqUx4MnSZg0nHPJmm_ikAHHcoIyCKtCnw";

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

const teamNameMap = {
  "1007": "Macalester A",
  "1008": "Macalester B ",
  "1023": "UC Davis B",
  "1024": "UC Davis C ",
  "1087": "Cal State Fresno B",
  "1088": "Cal State Fresno C",
  "1109": "UCLA E",
  "1124": "UC Berkeley ",
  "1129": "Washington & Lee A",
  "1134": "Cal Poly SLO C",
  "1135": "Cal Poly SLO D",
  "1277": "Redlands A",
  "1281": "ASU A",
  "1282": "ASU B",
  "1303": "Alabama A",
  "1304": "Alabama B",
  "1322": "Irvine A",
  "1323": "Irvine B",
  "1337": "George Washington C",
  "1386": "Oregon B",
  "1387": "Oregon C",
  "1388": "Oregon D",
  "1391": "Cal Poly Pomona A",
  "1393": "Scripps A",
  "1395": "Michigan A",
  "1632": "MIT B",
}