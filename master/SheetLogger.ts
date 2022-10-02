class SheetLogger {
  static log(data: any) {
    Logger.log(data);
    const logs = Logger.getLog();
    const logOutputRange = SpreadsheetApp.getActiveSpreadsheet().getRangeByName(
      MasterRange.ExecutionLog
    );
    logOutputRange.setValue(logs);
  }
}
