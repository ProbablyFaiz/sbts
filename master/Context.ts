import File = GoogleAppsScript.Drive.File;

interface IContext {
    tabFolder: Folder;
    masterSpreadsheet: MasterSpreadsheet;
    ballotFiles: File[];
    ballotSpreadsheets: BallotSpreadsheet[];
    teamNameMap: Record<string, string>;
}

class Context implements IContext {
    @memoize
    get teamNameMap(): Record<string, string> {
        const teamNumberNameMapping: Record<string, string> = {};
        compactRange(this.getRangeValues(MasterRange.TeamNameMap)).forEach(row => {
            teamNumberNameMapping[row[0]] = row[1];
        });
        return teamNumberNameMapping;
    }

    private getRangeValue(rangeName: MasterRange): string {
        return this.masterSpreadsheet.getRangeByName(rangeName).getValue().toString();
    }

    private getRangeValues(rangeName: MasterRange): string[][] {
        return this.masterSpreadsheet.getRangeByName(rangeName).getValues().map(arr => arr.map(cell => cell.toString()));
    }

    @memoize
    get tabFolder(): Folder {
        return DriveApp.getFolderById(getIdFromUrl(this.masterSpreadsheet.getRangeByName(MasterRange.ParentFolderLink)));
    }

    @memoize
    get masterSpreadsheet(): MasterSpreadsheet {
        return SpreadsheetApp.getActiveSpreadsheet();
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
