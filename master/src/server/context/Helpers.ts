// Copyright (c) 2020 Faiz Surani. All rights reserved.

import Spreadsheet = GoogleAppsScript.Spreadsheet.Spreadsheet;
import GoogleFile = GoogleAppsScript.Drive.File;

const NUM_BALLOTS = 2;

function compactRange(rangeArr: string[][]): string[][] {
  return rangeArr.filter((row) =>
    row.some((cell) => !["", null, undefined].includes(cell))
  );
}

function flattenRange(roundRange: string | string[] | string[][]): string[] {
  // Flatten a round range into a list of rounds
  if (typeof roundRange === "string") {
    return [roundRange];
  }
  if (Array.isArray(roundRange[0])) {
    return (roundRange as string[][]).reduce((acc, row) => {
      return acc.concat(row);
    }, [] as string[]);
  }
  return roundRange as string[];
}

function formatPd(pd: number): string {
  return pd > 0 ? `+${pd}` : `${pd}`;
}

function sheetForFile(file: GoogleFile): Spreadsheet {
  return SpreadsheetApp.openById(file.getId());
}

function getOrCreateChildFolder(
  parentFolder: GoogleAppsScript.Drive.Folder,
  childName: string
): GoogleAppsScript.Drive.Folder {
  const childFolderIterator = parentFolder.searchFolders(
    `title = "${childName}"`
  );
  if (childFolderIterator.hasNext()) {
    return childFolderIterator.next();
  }
  return parentFolder.createFolder(childName);
}

function getFileByName(
  parentFolder: GoogleAppsScript.Drive.Folder,
  name: string
): GoogleFile | undefined {
  const fileIterator = parentFolder.getFilesByName(name);
  if (fileIterator.hasNext()) {
    return fileIterator.next();
  }
  return undefined;
}

function getIdFromUrl(url: string): string {
  return url.match(/[-\w]{25,}/)?.toString() ?? "";
}

export {
  NUM_BALLOTS,
  compactRange,
  flattenRange,
  formatPd,
  sheetForFile,
  getOrCreateChildFolder,
  getFileByName,
  getIdFromUrl,
  Spreadsheet,
  GoogleFile,
};