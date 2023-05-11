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

function getChildFolder(
  parentFolder: Folder,
  childName: string
): Folder | undefined {
  const childFolderIterator = parentFolder.searchFolders(
    `title = "${childName}"`
  );
  if (childFolderIterator.hasNext()) {
    return childFolderIterator.next();
  }
  return undefined;
}

function getOrCreateChildFolder(
  parentFolder: Folder,
  childName: string
): Folder {
  const childFolder = getChildFolder(parentFolder, childName);
  if (childFolder) {
    return childFolder;
  }
  return parentFolder.createFolder(childName);
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

function getIdFromUrl(url: string): string {
  return url.match(/[-\w]{25,}/)?.toString() ?? "";
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

function flattenByColumns(arr: string[][]): string[] {
  const numRows = arr.length;
  const numCols = arr[0].length;
  let flattenedArray: string[] = [];

  for (let col = 0; col < numCols; col++) {
    for (let row = 0; row < numRows; row++) {
      flattenedArray.push(arr[row][col]);
    }
  }

  return flattenedArray;
}

const setAndBackfillRange = (
  range: GoogleAppsScript.Spreadsheet.Range,
  values: any[][]
) => {
  // Set the given values into the top left corner of the given range, and backfill the rest of the range with empty strings

  // First, deep copy the values array
  const valuesCopy = values.map((row) => row.slice());
  // Then, backfill the rest of the range with empty strings
  const numRows = range.getNumRows();
  const numCols = range.getNumColumns();
  for (let i = 0; i < numRows; i++) {
    if (i >= values.length) {
      valuesCopy.push(Array(numCols).fill(""));
    } else {
      const row = valuesCopy[i];
      for (let j = row.length; j < numCols; j++) {
        row.push("");
      }
    }
  }
  range.setValues(valuesCopy);
};

const range = (start, stop, step): number[] =>
  Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + i * step);
