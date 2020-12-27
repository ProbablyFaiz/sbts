function sheetForFile(file) {
    return SpreadsheetApp.openById(file.getId())
}
