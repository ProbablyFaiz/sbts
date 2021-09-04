import File = GoogleAppsScript.Drive.File;

interface IContext {
    tabFolder: Folder;
    masterSpreadsheet: MasterSpreadsheet;
    ballotFiles: File[];
    ballotSpreadsheets: BallotSpreadsheet[];
}

class Context implements IContext {
    private _tabFolder: Folder;
    private _masterSpreadsheet: MasterSpreadsheet;
    private _ballotFiles: File[];
    private _ballotSpreadsheets: BallotSpreadsheet[];

    get tabFolder(): Folder {
        if (!this._tabFolder) this._tabFolder = DriveApp.getFolderById(TAB_FOLDER_ID);
        return this._tabFolder;
    }

    get masterSpreadsheet(): MasterSpreadsheet {
        if (!this._masterSpreadsheet) {
            let masterSpreadsheetFile = getFileByName(this.tabFolder, MASTER_SPREADSHEET_NAME);
            this._masterSpreadsheet = sheetForFile(masterSpreadsheetFile);
        }
        return this._masterSpreadsheet;
    }

    get ballotFiles(): File[] {
        if (!this._ballotFiles) {
            const ballots: File[] = [];
            const roundFolders = this.tabFolder.searchFolders('title contains "Round"');
            while (roundFolders.hasNext()) {
                const roundFolder = roundFolders.next();
                const trialFolders = roundFolder.getFolders();
                while (trialFolders.hasNext()) {
                    const ballotFiles = trialFolders.next().searchFiles('title contains "Ballot"');
                    while (ballotFiles.hasNext()) {
                        const file = ballotFiles.next();
                        ballots.push(file);
                    }
                }
            }
            this._ballotFiles = ballots;
        }
        return this._ballotFiles;
    }

    get ballotSpreadsheets(): BallotSpreadsheet[] {

    }
}
