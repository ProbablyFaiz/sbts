class SheetLogger {
  static log(data: any) {
    Logger.log(data);
    const logs = Logger.getLog();
    const logOutputRange = SpreadsheetApp.getActiveSpreadsheet().getRangeByName(
      GeneratorRange.GenerationLog,
    );
    logOutputRange.setValue(logs);
  }
}
