// Copyright (c) 2020 Faiz Surani. All rights reserved.

const MASTER_SPREADSHEET_NAME = "Tab Master Spreadsheet";
const ORCHESTRATOR_SPREADSHEET_NAME = "Tab Orchestrator";
const AUTOCOMPLETE_SPREADSHEET_NAME = "Tab Autocomplete Engine";
const EXPORT_FOLDER_NAME = "Team Ballots";

function compactRange(rangeArr: string[][]): string[][] {
  return rangeArr.filter((row) =>
    row.some((cell) => !["", null, undefined].includes(cell))
  );
}

function sheetForFile(file: GoogleFile): Spreadsheet {
  return SpreadsheetApp.openById(file.getId());
}

function getOrCreateChildFolder(
  parentFolder: Folder,
  childName: string
): Folder {
  const childFolderIterator = parentFolder.searchFolders(
    `title contains "${childName}"`
  );
  if (childFolderIterator.hasNext()) {
    return childFolderIterator.next();
  }
  return parentFolder.createFolder(childName);
}

function getChildFolder(parentFolder: Folder, childName: string): Folder | undefined {
  const childFolderIterator = parentFolder.searchFolders(
    `title contains "${childName}"`
  );
  if (childFolderIterator.hasNext()) {
    return childFolderIterator.next();
  }
  return undefined;
}

function getFileByName(
  parentFolder: Folder,
  name: string
): GoogleFile | undefined {
  const fileIterator = parentFolder.getFilesByName(name);
  if (fileIterator.hasNext()) {
    return fileIterator.next();
  }
  return undefined;
}

function getIdFromUrl(url: string) {
  return url.match(/[-\w]{25,}/);
}

const range = (start, stop, step): number[] =>
  Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + i * step);
