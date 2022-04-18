interface IAutocompleteContext {
    ballotData: IBallotRecord[];
    captainsFormData: ICaptainsFormRecord[];
}

interface IBallotRecord {
    ballotLink: string;
    status: string;
    submitted: boolean;
    locked: boolean;
}

interface ICaptainsFormRecord {
    captainsFormLink: string;
    pTeamNum: string;
    dTeamNum: string;
    pNames: string[];
    dNames: string[];
}

enum OrchestratorRange {
    BallotInfo = "BallotInfoRange",
    AutocompleteEngineLink = "AutocompleteLinkRange",
    MasterSpreadsheetLink = "MasterSpreadsheetLinkRange",
    CaptainsFormData = "CaptainsFormData"
}

enum BallotRowIndex {
    Link = 0,
    Status = 1,
    Submitted = 2,
    Locked = 3,
}

enum CaptainsFormRowIndex {
    Link = 0,
    PTeamNum = 1,
    DTeamNum = 2,
    PNamesStart = 3,
    PNamesEnd = 4,
    DNamesStart = 5,
    DNamesEnd = 6,
}

class OrchestratorContext implements IAutocompleteContext {
    get ballotData(): IBallotRecord[] {
        return compactRange(this.getRangeValues(OrchestratorRange.BallotInfo)!)
            .map(row => {
                return {
                    ballotLink: row[BallotRowIndex.Link],
                    status: row[BallotRowIndex.Status],
                    submitted: row[BallotRowIndex.Submitted] === "true",
                    locked: row[BallotRowIndex.Locked] === "true",
                }
            });
    }

    get captainsFormData(): ICaptainsFormRecord[] {
        return compactRange(this.getRangeValues(OrchestratorRange.CaptainsFormData)!)
            .map(row => {
                return {
                    captainsFormLink: row[CaptainsFormRowIndex.Link],
                    pTeamNum: row[CaptainsFormRowIndex.PTeamNum].toString(),
                    dTeamNum: row[CaptainsFormRowIndex.DTeamNum].toString(),
                    pNames: row.slice(CaptainsFormRowIndex.PNamesStart, CaptainsFormRowIndex.PNamesEnd + 1),
                    dNames: row.slice(CaptainsFormRowIndex.DNamesStart, CaptainsFormRowIndex.DNamesEnd + 1),
                }
            });
    }

    @memoize
    get bailiffEmails(): Set<string> {
        return new Set<string>(this.masterSpreadsheet.getRangeByName("AllBailiffEmailsRange").getValue().split(","));
    }

    @memoize
    get orchestratorSpreadsheet(): Spreadsheet {
        return SpreadsheetApp.getActiveSpreadsheet();
    }

    @memoize
    get autocompleteSpreadsheet(): Spreadsheet {
        return sheetForFile(DriveApp.getFileById(getIdFromUrl(this.getRangeValue(OrchestratorRange.AutocompleteEngineLink))));
    }

    @memoize
    get masterSpreadsheet(): Spreadsheet {
        return sheetForFile(DriveApp.getFileById(getIdFromUrl(this.getRangeValue(OrchestratorRange.MasterSpreadsheetLink))));
    }

    private getRangeValue(rangeName: OrchestratorRange): string | undefined {
        return this.orchestratorSpreadsheet.getRangeByName(rangeName)?.getValue().toString();
    }

    private getRangeValues(rangeName: OrchestratorRange): string[][] | undefined {
        return this.orchestratorSpreadsheet.getRangeByName(rangeName)?.getValues().map((arr: Cell[][]) => arr.map(cell => cell.toString()));
    }
}
