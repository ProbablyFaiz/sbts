enum GeneratorRange {
    TabFolder = 'TabFolderRange',
    MasterSheetTemplate = 'MasterSheetTemplateRange',
    OrchestratorTemplate = 'OrchestratorTemplateRange',
    BallotTemplate = 'BallotTemplateRange',
    CaptainsFormTemplate = 'CaptainsFormTemplateRange',
    TournamentName = 'TournamentNameRange',
    FirstPartyName = 'FirstPartyNameRange',
    CourtroomNames = 'CourtroomsInfoRange',
    BallotsPerTrial = 'BallotsPerTrialRange',
    NumberOfCourtrooms = 'NumberOfCourtroomsRange',
    NumberOfRounds = 'NumberOfRoundsRange',
    GenerationLog = 'GenerationLogRange',
}

interface ICourtroomInfo {
    name: string;
    bailiffEmails: string[];
}

interface ISetupContext {
    isValid: boolean;

    masterSpreadsheet: Spreadsheet;
    ballotTemplate: GoogleFile;
    captainsFormTemplate: GoogleFile;

    tabFolder: Folder;
    masterSheetTemplate: GoogleFile;
    orchestratorTemplate: GoogleFile;
    ballotBaseTemplate: GoogleFile;
    captainsFormBaseTemplate: GoogleFile;

    tournamentName: string;
    firstPartyName: string;
    courtroomsInfo: ICourtroomInfo[];
    roundNames: string[];
    ballotsPerTrial: number;
}

class SetupContext implements ISetupContext {
    masterSpreadsheet: Spreadsheet;
    ballotTemplate: GoogleFile;
    captainsFormTemplate: GoogleFile;

    private generatorSpreadsheet: Spreadsheet;
    private tabFolderLink: string;

    constructor(tabFolderLink: string) {
        this.tabFolderLink = tabFolderLink;
        this.generatorSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    }

    get isValid(): boolean {
        // noinspection UnnecessaryLocalVariableJS
        const tabFolderIsEmpty = !this.tabFolder.getFiles().hasNext();
        return tabFolderIsEmpty;
    }

    // @memoize
    // get masterSpreadsheet(): Spreadsheet {
    //
    // }
    //
    // set masterSpreadsheet(spreadsheet: Spreadsheet) {
    //
    // }

    @memoize
    get tabFolder(): Folder {
        return DriveApp.getFolderById(getIdFromUrl(this.tabFolderLink).toString());
    }

    @memoize
    get masterSheetTemplate(): GoogleFile {
        return DriveApp.getFileById(getIdFromUrl(this.getRangeValue(GeneratorRange.MasterSheetTemplate)).toString());
    }

    @memoize
    get orchestratorTemplate(): GoogleFile {
        return DriveApp.getFileById(getIdFromUrl(this.getRangeValue(GeneratorRange.OrchestratorTemplate)).toString());
    }

    @memoize
    get ballotBaseTemplate(): GoogleFile {
        return DriveApp.getFileById(getIdFromUrl(this.getRangeValue(GeneratorRange.BallotTemplate)).toString());
    }

    @memoize
    get captainsFormBaseTemplate(): GoogleFile {
        return DriveApp.getFileById(getIdFromUrl(this.getRangeValue(GeneratorRange.CaptainsFormTemplate)).toString());
    }

    @memoize
    get tournamentName(): string {
        return this.getRangeValue(GeneratorRange.TournamentName);
    }

    @memoize
    get firstPartyName(): string {
        return this.getRangeValue(GeneratorRange.FirstPartyName);
    }

    @memoize
    get courtroomsInfo(): ICourtroomInfo[] {
        return compactRange(this.getRangeValues(GeneratorRange.CourtroomNames)).map(courtroomCells => {
            return {
                name: courtroomCells[0],
                bailiffEmails: courtroomCells[1].split(','),
            };
        }).slice(0, this.numCourtrooms);
    }

    @memoize
    get roundNames(): string[] {
        return range(1, this.numRounds, 1);
    }

    @memoize
    get ballotsPerTrial(): number {
        return parseInt(this.getRangeValue(GeneratorRange.BallotsPerTrial));
    }

    @memoize
    get numCourtrooms(): number {
        return parseInt(this.getRangeValue(GeneratorRange.NumberOfCourtrooms));
    }

    @memoize
    get numRounds(): number {
        return parseInt(this.getRangeValue(GeneratorRange.NumberOfRounds));
    }

    private getRangeValue(rangeName: GeneratorRange): string {
        return this.generatorSpreadsheet.getRangeByName(rangeName).getValue().toString();
    }

    private getRangeValues(rangeName: GeneratorRange): string[][] {
        return this.generatorSpreadsheet.getRangeByName(rangeName).getValues().map(arr => arr.map(cell => cell.toString()));
    }
}
