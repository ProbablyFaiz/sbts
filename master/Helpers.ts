// Copyright (c) 2020 Faiz Surani. All rights reserved.

const EXPORT_FOLDER_NAME = "Team Ballots";

const NUM_BALLOTS = 2;

function compactRange(rangeArr: string[][]): string[][] {
  return rangeArr.filter(row => row.some(cell => !['', null, undefined].includes(cell)));
}

function sheetForFile(file: GoogleFile): Spreadsheet {
  return SpreadsheetApp.openById(file.getId())
}

function getChildFolder(parentFolder: Folder, childName: string): Folder {
  const childFolderIterator = parentFolder.searchFolders(`title contains "${childName}"`);
  if (childFolderIterator.hasNext()) {
    return childFolderIterator.next();
  }
  return parentFolder.createFolder(childName);
}

function getFileByName(parentFolder: Folder, name: string): GoogleFile | undefined {
  const fileIterator = parentFolder.getFilesByName(name);
  if (fileIterator.hasNext()) {
    return fileIterator.next();
  }
  return undefined;
}

function getIdFromUrl(url) {
  return url.match(/[-\w]{25,}/);
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
