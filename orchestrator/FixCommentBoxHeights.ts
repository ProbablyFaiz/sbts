const COMMENT_ROW_NUMBERS = [7, 9, 13, 15];
const COMMENT_TEXT_COLUMN_INDEX = 2;
const CHARACTERS_PER_HEIGHT_PIXEL = 5.4; // Computed based on a column width of 700 and Times New Roman 12 pt. font.
const HEIGHT_PIXELS_PER_LINE = 21.0;

function fixCommentBoxHeights(ballotSpreadsheet: Spreadsheet) {
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
}

function getMinRowHeight(text: string): number {
  let height = text.length / CHARACTERS_PER_HEIGHT_PIXEL;
  // Add extra height based on how many line breaks there are.
  const numLineBreaks = (text.match(/\r?\n/g) || []).length;
  height += numLineBreaks * HEIGHT_PIXELS_PER_LINE;
  return Math.ceil(height);
}
