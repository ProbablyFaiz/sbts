// Copyright (c) 2020 Faiz Surani. All rights reserved.

import { SSContext } from "../context/Context";

// NOTE: This should be run from the newly created master spreadsheet's script editor, not the template's.
// Be sure to also run SetupTriggers in the newly created orchestrator (and again, not the template's).

function SetupTriggers() {
  const context = new SSContext();
  const masterSheet = context.masterSpreadsheet;
  ScriptApp.newTrigger("PopulateTeamBallots")
    .forSpreadsheet(masterSheet)
    .onEdit()
    .create();
  ScriptApp.newTrigger("PopulateIndividualBallots")
    .forSpreadsheet(masterSheet)
    .onEdit()
    .create();
}

export { SetupTriggers };
