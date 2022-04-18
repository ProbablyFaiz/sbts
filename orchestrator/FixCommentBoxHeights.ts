const COMMENT_ROW_NUMBERS = [7, 9, 13, 15];
const COMMENT_TEXT_COLUMN_INDEX = 2;
const CHARACTERS_PER_HEIGHT_PIXEL = 5.4; // Computed based on a column width of 700 and Times New Roman 12 pt. font.

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
