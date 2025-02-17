// Copyright (c) 2020 Faiz Surani. All rights reserved.

import Spreadsheet = GoogleAppsScript.Spreadsheet.Spreadsheet;
import GoogleFile = GoogleAppsScript.Drive.File;
import Folder = GoogleAppsScript.Drive.Folder;
import Range = GoogleAppsScript.Spreadsheet.Range;

type Cell = string | number | undefined;
type SpreadsheetOutput = Cell | Cell[] | Cell[][];

function compactRange(rangeArr: string[][]): string[][] {
  return rangeArr.filter((row) =>
    row.some((cell) => !["", null, undefined].includes(cell)),
  );
}

function sheetForFile(file: GoogleFile): Spreadsheet {
  return SpreadsheetApp.openById(file.getId());
}

function getChildFolder(parentFolder: Folder, childName: string): Folder {
  const childFolderIterator = parentFolder.searchFolders(
    `title contains "${childName}"`,
  );
  if (childFolderIterator.hasNext()) {
    return childFolderIterator.next();
  }
  return parentFolder.createFolder(childName);
}

function getFileByName(
  parentFolder: Folder,
  name: string,
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

const cacheKeys = ["1", "2", "3"];

function rateLimit(functionName: string) {
  const possibleKeys = cacheKeys.map((k) => `${functionName}-${k}`);
  const cache = CacheService.getScriptCache();
  const currKeys = Object.keys(cache.getAll(possibleKeys));
  const freeExecSlot = availableKey(possibleKeys, currKeys);
  if (!freeExecSlot) {
    Logger.log(
      "Detected more than 4 executions in the past 10 seconds, aborting...",
    );
    return true;
  }
  Logger.log(`Adding ${freeExecSlot} to cache...`);
  cache.put(freeExecSlot, "", 10);
  return false;
}

function availableKey(possibleCacheKeys: string[], cacheKeys: string[]) {
  return possibleCacheKeys.find((key) => !cacheKeys.includes(key));
}
