interface IAutocompleteContext {
    captainsFormData: ICaptainsFormRecord[];
}

interface ICaptainsFormRecord {
    captainsFormLink: string;
    pTeamNum: string;
    dTeamNum: string;
    pNames: string[];
    dNames: string[];
}

enum OrchestratorRange {
    AutocompleteEngineLink = "AutocompleteLinkRange",
    CaptainsFormData = "CaptainsFormData"
}

enum CaptainsFormRowIndex {
    Link = 0,
    PTeamNum = 1,
    DTeamNum = 2,
    PNamesStart = 3,
    PNamesEnd = 13,
    DNamesStart = 14,
    DNamesEnd = 24,
}

class OrchestratorContext implements IAutocompleteContext {
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
    get orchestratorSpreadsheet(): Spreadsheet {
        return SpreadsheetApp.getActiveSpreadsheet();
    }

    @memoize
    get autocompleteSpreadsheet(): Spreadsheet {
        return sheetForFile(DriveApp.getFileById(getIdFromUrl(this.getRangeValue(OrchestratorRange.AutocompleteEngineLink))));
    }

    private getRangeValue(rangeName: OrchestratorRange): string | undefined {
        return this.orchestratorSpreadsheet.getRangeByName(rangeName)?.getValue().toString();
    }

    private getRangeValues(rangeName: OrchestratorRange): string[][] | undefined {
        return this.orchestratorSpreadsheet.getRangeByName(rangeName)?.getValues().map((arr: Cell[][]) => arr.map(cell => cell.toString()));
    }
}
