// Copyright (c) 2020 Faiz Surani. All rights reserved.

import Spreadsheet = GoogleAppsScript.Spreadsheet.Spreadsheet;
import GoogleFile = GoogleAppsScript.Drive.File;
import Folder = GoogleAppsScript.Drive.Folder;
import Range = GoogleAppsScript.Spreadsheet.Range;

function compactRange(rangeArr: string[][]): string[][] {
  return rangeArr.filter((row) =>
    row.some((cell) => !["", null, undefined].includes(cell)),
  );
}

function sheetForFile(file: GoogleFile): Spreadsheet {
  return SpreadsheetApp.openById(file.getId());
}

function getIdFromUrl(url: string): string {
  return url.match(/[-\w]{25,}/)?.toString() ?? "";
}

const setAndBackfillRange = (
  range: GoogleAppsScript.Spreadsheet.Range,
  values: any[][],
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
