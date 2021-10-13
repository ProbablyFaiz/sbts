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

class AutocompleteContext implements IAutocompleteContext {
    constructor() {

    }

    get captainsFormData(): ICaptainsFormRecord[] {

    }

    @memoize
    get autocompleteSpreadsheet(): Spreadsheet {
        return SpreadsheetApp.getActiveSpreadsheet();
    }
}
