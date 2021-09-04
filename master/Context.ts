import File = GoogleAppsScript.Drive.File;

interface IContext {
    tabFolder: Folder;
    masterSpreadsheet: MasterSpreadsheet;
    ballotFiles: File[];
    ballotSpreadsheets: BallotSpreadsheet[];
}

class Context implements IContext {
    @memoize
    get tabFolder(): Folder {
        return DriveApp.getFolderById(TAB_FOLDER_ID);
    }

    @memoize
    get masterSpreadsheet(): MasterSpreadsheet {
        let masterSpreadsheetFile = getFileByName(this.tabFolder, MASTER_SPREADSHEET_NAME);
        return sheetForFile(masterSpreadsheetFile);
    }

    @memoize
    get ballotFiles(): File[] {
        const ballots: File[] = [];
        // TODO: Make this use the list of ballots in the master spreadsheet instead of this search
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
        return ballots;
    }

    @memoize
    get ballotSpreadsheets(): BallotSpreadsheet[] {
        return this.ballotFiles.map(file => sheetForFile(file));
    }
}
