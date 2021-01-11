// Copyright (c) 2020 Faiz Surani. All rights reserved.

// This script should only be run once the master spreadsheet and all the ballots have been generated; it will crash or do bad things otherwise.
// Do not run this script thereafter, as it may result in unexpected behavior including but not limited to overwriting existing data in the master sheet.
function PopulateBallotLinks() {
    const tabFolder = getTabFolder();
    const ballots = getAllBallots(tabFolder);
    const masterSheet = getMasterSheet(tabFolder);
    if (ballots.length === 0) return;
    const startRow = 2; const endRow = startRow + ballots.length - 1;
    const outputCells = ballots.map((b, idx) => [
        b.getUrl(),
        `=IF(A${startRow + idx} <> "", HYPERLINK(IMPORTRANGE(A2,"${BallotRanges.CAPTAINS_FORM_URL}"), "Captain's Form"),"")`,
        b.getName(),
    ]).sort((b1, b2) => { // Sort by ballot name so they're in order
        if(b1[1] < b2[1]) { return -1; }
        if(b1[1] > b2[1]) { return 1; }
        return 0;
    });
    const rangeStr = `Ballot Links!A${startRow}:C${endRow}`;

    const linksRange = masterSheet.getRange(rangeStr);
    linksRange.setValues(outputCells);
}
