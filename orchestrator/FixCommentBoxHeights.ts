const COMMENT_ROW_NUMBERS = [6, 7, 11, 12, 13, 15, 16, 17, 19, 20, 21, 25, 26, 27, 29, 30, 31, 33, 34, 35, 38, 39];
const COMMENT_TEXT_COLUMN_INDEX = 3;
const CHARACTERS_PER_HEIGHT_PIXEL = 4.3; // Computed based on a column width of 556 and Times New Roman 12 pt. font.

function fixCommentBoxHeights(ballotSpreadsheet: Spreadsheet) {
    const commentsSheet = ballotSpreadsheet.getSheetByName("Comments");
    COMMENT_ROW_NUMBERS.forEach(rowNumber => {
        const commentText = commentsSheet.getRange(rowNumber, COMMENT_TEXT_COLUMN_INDEX).getValue().toString();
        const minRowHeight = getMinRowHeight(commentText.length);
        if (commentsSheet.getRowHeight(rowNumber) < minRowHeight) {
            commentsSheet.setRowHeight(rowNumber, minRowHeight);
        }
    });
}

function getMinRowHeight(textLength: number): number {
    return Math.ceil(textLength / CHARACTERS_PER_HEIGHT_PIXEL);
}
