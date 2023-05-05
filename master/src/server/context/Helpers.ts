// Copyright (c) 2020 Faiz Surani. All rights reserved.

import Spreadsheet = GoogleAppsScript.Spreadsheet.Spreadsheet;
import GoogleFile = GoogleAppsScript.Drive.File;
import { ByeStrategy } from "../../Types";

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

// This is not a good idea, broadly speaking. But it is
// a way to keep surprising behavior from getting injected
// into the system when a column accidentally gets changed
// to text format and other such things.
function spreadsheetTruthy(val: any): boolean {
  if (typeof val === "string") {
    if (val.toLowerCase() === "true" || val.toLowerCase() === "yes") {
      return true;
    }
    if (
      val.length === 0 ||
      val.toLowerCase() === "false" ||
      val.toLowerCase() === "no"
    ) {
      return false;
    }
  }
  return !!val;
}

const getByeStrategy = (byeStrategyInput: string): ByeStrategy => {
  if (!byeStrategyInput) {
    return ByeStrategy.NO_ADJUSTMENT;
  } else if (typeof byeStrategyInput === "string") {
    if (byeStrategyInput === "NO_ADJUSTMENT") {
      return ByeStrategy.NO_ADJUSTMENT;
    }
    if (byeStrategyInput === "AUTO_WIN") {
      return ByeStrategy.AUTO_WIN;
    }
    if (byeStrategyInput === "PROPORTIONAL") {
      return ByeStrategy.PROPORTIONAL;
    }
  }
  throw new Error(
    `Invalid bye strategy: ${byeStrategyInput}. Permitted values are "AUTO_WIN", "PROPORTIONAL", and "NO_ADJUSTMENT"`
  );
};

class SeededRandom {
  private seed: number;

  constructor(seed: string) {
    this.seed = this.stringToSeed(seed);
  }

  private stringToSeed(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const charCode = seed.charCodeAt(i);
      hash = (hash << 5) - hash + charCode;
      hash = hash & hash; // Convert to a 32-bit integer
    }
    return Math.abs(hash);
  }

  private random(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  public nextFloat(): number {
    return this.random();
  }

  public nextInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  public nextBoolean(): boolean {
    return this.random() >= 0.5;
  }
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
  spreadsheetTruthy,
  getByeStrategy,
  SeededRandom,
  Spreadsheet,
  GoogleFile,
};
