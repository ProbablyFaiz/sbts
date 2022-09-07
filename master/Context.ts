interface IContext {
    tabFolder: Folder;
    masterSpreadsheet: MasterSpreadsheet;
    ballotFiles: GoogleFile[];
    ballotSpreadsheets: BallotSpreadsheet[];
    teamInfo: Record<string, TeamInfo>;
    exportFolder: Folder;
    teamBallotFolder: (teamNumber: string) => Folder | undefined;
    setTeamBallotFolderLink: (teamNumber: string, ballotFolderLink: string) => boolean;
    tournamentEmail: string;
    courtroomRecords: CourtroomInfo[];
    ballotRecords: BallotInfo[];
    ballotResults: BallotResult[];
    roundsCompleted: number;
    firstPartyName: string;
    secondPartyName: string;

    teamResults: Record<string, TeamSummary>;
}

const BYE_BUST_SCHOOL_NAME = "Bye Bust";

class Context implements IContext {
    @memoize
    get teamInfo(): Record<string, TeamInfo> {
        const teamInfoMapping: Record<string, TeamInfo> = {};
        compactRange(this.getRangeValues(MasterRange.TeamInfo) ?? []).forEach(row => {
            teamInfoMapping[row[0]] = {
                teamName: row[1],
                schoolName: row[2],
                byeBust: row[2] === BYE_BUST_SCHOOL_NAME, // For now, we'll just use a special school name
                emails: row[3],
                ballotFolderLink: row[4],
            };
        });
        return teamInfoMapping;
    }

    @memoize
    get teamResults(): Record<string, TeamSummary> {
        const teamResultMapping: Record<string, TeamSummary> = {};
        compactRange(this.getRangeValues(MasterRange.TeamResults) ?? []).forEach(row => {
            teamResultMapping[row[1]] = {
                ballotsWon: parseFloat(row[3]),
                combinedStrength: parseFloat(row[4]),
                pointDifferential: parseFloat(row[5]),
                timesPlaintiff: parseInt(row[6]),
                timesDefense: parseInt(row[7]),
                pastOpponents: row[8].split(PAST_OPPONENTS_SEPARATOR),
                byeBust: this.teamInfo[row[1]].byeBust,
            };
        });
        return teamResultMapping;
    }

    @memoize
    get ballotResults(): BallotResult[] {
        return compactRange(this.getRangeValues(MasterRange.TeamBallots) ?? [])
            .map((row) => {
                return {
                    round: row[0],
                    judgeName: row[1],
                    teamNumber: row[2],
                    opponentTeamNumber: row[3],
                    side: row[4],
                    pd: parseFloat(row[5]),
                    won: parseFloat(row[6]),
                }
            })
    }

    @memoize
    get roundsCompleted(): number {
        const topTeam = Object.values(this.teamResults)[0];
        return topTeam.timesDefense + topTeam.timesPlaintiff;
    }

    @memoize
    get tournamentName(): string {
        return this.getRangeValue(MasterRange.TournamentName) ?? "";
    }

    @memoize
    get tournamentEmail(): string {
        return this.getRangeValue(MasterRange.TournamentEmail) ?? "";
    }

    // This is inefficient but hassle free. Shouldn't be that hard to optimize if it becomes a bottleneck.
    setTeamBallotFolderLink(teamNumber: string, ballotFolderLink: string): boolean {
        const teamInfoRange = this.masterSpreadsheet.getRangeByName(MasterRange.TeamInfo);
        if (!teamInfoRange) return false;
        const teamInfoValues = teamInfoRange.getValues();
        const teamRow = teamInfoValues.find((teamRow: Cell[]) => teamRow[0]?.toString() === teamNumber);
        if (!teamRow) return false;
        teamRow[4] = ballotFolderLink;
        teamInfoRange.setValues(teamInfoValues);
        return true;
    }

    teamBallotFolder(teamNumber: string): Folder | undefined {
        const folderLink = this.teamInfo[teamNumber]?.ballotFolderLink;
        if (!folderLink) return undefined;
        return DriveApp.getFolderById(getIdFromUrl(folderLink))
    }

    @memoize
    get exportFolder(): Folder {
        return DriveApp.getFolderById(getIdFromUrl(this.masterSpreadsheet.getRangeByName(MasterRange.ExportFolderLink)?.getValue()));
    }

    @memoize
    get tabFolder(): Folder {
        return DriveApp.getFolderById(getIdFromUrl(this.masterSpreadsheet.getRangeByName(MasterRange.ParentFolderLink)?.getValue()));
    }

    @memoize
    get courtroomRecords(): CourtroomInfo[] {
        return compactRange(this.getRangeValues(MasterRange.CourtroomInfo) ?? [])
            .map((row) => {
                return {
                    name: row[0],
                    bailiffEmails: row[1].split(","),
                    roundFolderLinks: row[2].split(","),
                }
            });
    }

    @memoize
    get ballotRecords(): BallotInfo[] {
        return (this.getRangeValues(MasterRange.BallotLinks) ?? [])
            .filter(row => row.some(cell => !['', null, undefined, 'false'].includes(cell)))
            .map((row) => {
                return {
                    link: row[0],
                    info: row[1],
                    captainsFormLink: row[2],
                    judgeName: row[4],
                    locked: row[5] === "true",
                    validated: row[6] === "true",
                }
            })
    }

    @memoize
    get masterSpreadsheet(): MasterSpreadsheet {
        return SpreadsheetApp.getActiveSpreadsheet();
    }

    @memoize
    get ballotFiles(): GoogleFile[] {
        const ballots: GoogleFile[] = [];
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
        // Sorting ballots by date created should be sufficient to ensure that they're in the correct order
        ballots.sort((a, b) => a.getDateCreated().getTime() - b.getDateCreated().getTime());
        return ballots;
    }

    @memoize
    get ballotSpreadsheets(): BallotSpreadsheet[] {
        return this.ballotFiles.map(file => sheetForFile(file));
    }

    @memoize
    get firstPartyName(): string {
        return this.getRangeValue(MasterRange.FirstPartyName) ?? "";
    }

    @memoize
    get secondPartyName(): string {
        return this.getRangeValue(MasterRange.SecondPartyName) ?? "";
    }

    private getRangeValue(rangeName: MasterRange): string | undefined {
        return this.masterSpreadsheet.getRangeByName(rangeName)?.getValue().toString();
    }

    private getRangeValues(rangeName: MasterRange): string[][] | undefined {
        return this.masterSpreadsheet.getRangeByName(rangeName)?.getValues().map((arr: Cell[][]) => arr.map(cell => cell.toString()));
    }
}
