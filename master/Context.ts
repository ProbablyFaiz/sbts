import File = GoogleAppsScript.Drive.File;

interface IContext {
    tabFolder: Folder;
    masterSpreadsheet: MasterSpreadsheet;
    ballotFiles: File[];
    ballotSpreadsheets: BallotSpreadsheet[];
    teamInfoMap: Record<string, TeamInfo>;
}

class Context implements IContext {
    @memoize
    get teamInfoMap(): Record<string, TeamInfo> {
        const teamInfoMapping: Record<string, TeamInfo> = {};
        compactRange(this.getRangeValues(MasterRange.TeamInfo)).forEach(row => {
            teamInfoMapping[row[0]] = {
                teamName: row[1],
                ballotFolderLink: row[2],
                emails: row[3].split(','),
            };
        });
        return teamInfoMapping;
    }

    private getRangeValue(rangeName: MasterRange): string {
        return this.masterSpreadsheet.getRangeByName(rangeName).getValue().toString();
    }

    private getRangeValues(rangeName: MasterRange): string[][] {
        return this.masterSpreadsheet.getRangeByName(rangeName).getValues().map(arr => arr.map(cell => cell.toString()));
    }

    @memoize
    get tabFolder(): Folder {
        return DriveApp.getFolderById(getIdFromUrl(this.masterSpreadsheet.getRangeByName(MasterRange.ParentFolderLink).getValue()).toString());
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
