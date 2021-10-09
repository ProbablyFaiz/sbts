function onOpen() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const menuEntries = [];
  menuEntries.push({name: "Menu Entry 1", functionName: "function1"});
  menuEntries.push(null); // line separator
  menuEntries.push({name: "Menu Entry 2", functionName: "function2"});

  ss.addMenu("Tab System", menuEntries);
}

function function1() {

}

function function2() {
  SheetLogger.log('FUNCTION 2');
}

function DebugOutput() {
  const context = new SetupContext();
}
