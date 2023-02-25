import { sheetForFile } from "../context/Helpers";
import { BallotRange, NonSheetBallotReadout } from "../../Types";
import { SSContext } from "../context/Context";
import { getBallotPdfName } from "./PublishTeamBallots";
import SheetLogger from "../context/SheetLogger";

const COMMENT_ROW_NUMBERS = [7, 9, 13, 15];
const COMMENT_TEXT_COLUMN_INDEX = 2;
const CHARACTERS_PER_HEIGHT_PIXEL = 5.4; // Computed based on a column width of 700 and Times New Roman 12 pt. font.
const HEIGHT_PIXELS_PER_LINE = 21.0;

function createDummyBallot(
  ballotReadout: NonSheetBallotReadout,
  context: SSContext
) {
  const trialFolder = context.getOrCreateTrialFolder(
    ballotReadout.round,
    ballotReadout.courtroom
  );
  const ballotPdfName = getBallotPdfName(
    ballotReadout.round,
    ballotReadout.pTeam,
    ballotReadout.rTeam,
    ballotReadout.judgeName
  );
  const ballotSpreadsheetName = "(DUMMY) " + ballotPdfName;
  SheetLogger.log(`Creating dummy ballot '${ballotPdfName}'...`);
  const ballotFile = context.ballotTemplateFile.makeCopy(
    ballotSpreadsheetName,
    trialFolder
  );
  const ballotSpreadsheet = sheetForFile(ballotFile);

  const setBallotField = (rangeName: BallotRange, value: any) => {
    const range = ballotSpreadsheet.getRangeByName(rangeName);
    range.setValue(value);
  };
  const setBallotScoreRange = (rangeName: BallotRange, scores: number[]) => {
    const range = ballotSpreadsheet.getRangeByName(rangeName);
    // Remove all data validation
    range.clearDataValidations();
    // If the number of scores is equal to the number of rows in the range,
    // then we can just set the values directly.
    if (scores.length === range.getNumRows()) {
      range.setValues(scores.map((score) => [score]));
      return;
    }
    // Otherwise, combine the scores into one score, merge the cells in the
    // range, and set the value.
    else {
      const combinedScore = scores.reduce((a, b) => a + b, 0);
      range.merge();
      range.setValue(combinedScore);
    }
  };

  setBallotField(BallotRange.JudgeName, ballotReadout.judgeName);
  setBallotField(BallotRange.PlaintiffTeam, ballotReadout.pTeam);
  setBallotField(BallotRange.DefenseTeam, ballotReadout.rTeam);
  setBallotField(BallotRange.Round, ballotReadout.round);
  setBallotField(BallotRange.PIssue1Name, ballotReadout.pIssue1Name);
  setBallotField(BallotRange.PIssue2Name, ballotReadout.pIssue2Name);
  setBallotField(BallotRange.RIssue1Name, ballotReadout.rIssue1Name);
  setBallotField(BallotRange.RIssue2Name, ballotReadout.rIssue2Name);

  setBallotScoreRange(BallotRange.PIssue1Scores, ballotReadout.pIssue1Scores);
  setBallotScoreRange(BallotRange.PIssue2Scores, ballotReadout.pIssue2Scores);
  setBallotScoreRange(BallotRange.RIssue1Scores, ballotReadout.rIssue1Scores);
  setBallotScoreRange(BallotRange.RIssue2Scores, ballotReadout.rIssue2Scores);

  setBallotField(
    BallotRange.PIssue1Comments,
    ballotReadout.pIssue1WrittenFeedback
  );
  setBallotField(
    BallotRange.PIssue2Comments,
    ballotReadout.pIssue2WrittenFeedback
  );
  setBallotField(
    BallotRange.RIssue1Comments,
    ballotReadout.rIssue1WrittenFeedback
  );
  setBallotField(
    BallotRange.RIssue2Comments,
    ballotReadout.rIssue2WrittenFeedback
  );
  fixCommentBoxHeights(ballotSpreadsheet);
  hideRowsBelowScores(ballotSpreadsheet);
  SpreadsheetApp.flush();

  const pdfBlob = ballotSpreadsheet.getAs("application/pdf");
  pdfBlob.setName(ballotPdfName);
  const ballotPdf = trialFolder.createFile(pdfBlob);
  context.setReadoutPdfUrl(ballotReadout, ballotPdf.getUrl());
  ballotFile.setTrashed(true);

  return ballotPdf;
}

const hideRowsBelowScores = (
  ballotSpreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet
) => {
  const endOfScoresRange = ballotSpreadsheet.getRangeByName(
    BallotRange.EndOfScores
  );
  // We want to hide all rows below the end of the scores range.
  const scoresSheet = endOfScoresRange.getSheet();
  const endOfScoresRow =
    endOfScoresRange.getRow() + endOfScoresRange.getNumRows() - 1;
  const numRowsToHide = scoresSheet.getMaxRows() - endOfScoresRow;
  scoresSheet.hideRows(endOfScoresRow + 1, numRowsToHide);
};

const fixCommentBoxHeights = (
  ballotSpreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet
) => {
  const commentsSheet = ballotSpreadsheet.getSheetByName("Comments");
  COMMENT_ROW_NUMBERS.forEach((rowNumber) => {
    const commentText: string = commentsSheet
      .getRange(rowNumber, COMMENT_TEXT_COLUMN_INDEX)
      .getValue()
      .toString();
    let minRowHeight = getMinRowHeight(commentText);
    if (commentsSheet.getRowHeight(rowNumber) < minRowHeight) {
      commentsSheet.setRowHeight(rowNumber, minRowHeight);
    }
  });
};

const getMinRowHeight = (text: string): number => {
  let height = text.length / CHARACTERS_PER_HEIGHT_PIXEL;
  // Add extra height based on how many line breaks there are.
  const numLineBreaks = (text.match(/\r?\n/g) || []).length;
  height += numLineBreaks * HEIGHT_PIXELS_PER_LINE;
  return Math.ceil(height);
};

export { createDummyBallot };
