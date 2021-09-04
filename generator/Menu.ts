function onOpen() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const menuEntries = [];
  // When the user clicks on "addMenuExample" then "Menu Entry 1", the function function1 is
  // executed.
  menuEntries.push({name: "Menu Entry 1", functionName: "function1"});
  menuEntries.push(null); // line separator
  menuEntries.push({name: "Menu Entry 2", functionName: "function2"});

  ss.addMenu("Tab System", menuEntries); 
}

function function1() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ScriptApp.newTrigger("function2").forSpreadsheet(ss).onEdit().create();
}

function function2() {
  console.log('FUNCTION 2');
}