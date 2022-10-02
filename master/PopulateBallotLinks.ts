// Copyright (c) 2020 Faiz Surani. All rights reserved.

// This script should only be run once the master spreadsheet and all the ballots have been generated; it will crash or do bad things otherwise.
// Do not run this script thereafter, as it may result in unexpected behavior including but not limited to overwriting existing data in the master sheet.

function PopulateBallotLinks() {
  const context = new Context();
  const ballots = context.ballotFiles;
  const masterSheet = context.masterSpreadsheet;
  if (ballots.length === 0) return;
  const startRow = 2;
  const endRow = startRow + ballots.length - 1;
  const outputCells = ballots.map((b) => [b.getUrl(), b.getName()]);
  const rangeStr = `Ballot Links!A${startRow}:B${endRow}`;

  const linksRange = masterSheet.getRange(rangeStr);
  linksRange.setValues(outputCells);
}
