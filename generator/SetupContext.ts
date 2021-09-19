enum GeneratorRange {
    TabFolder = 'TabFolderRange',
    MasterSheetTemplate = 'MasterSheetTemplateRange',
    OrchestratorTemplate = 'OrchestratorTemplateRange',
    BallotTemplate = 'BallotTemplateRange',
    CaptainsFormTemplate = 'CaptainsFormTemplateRange',
    TournamentName = 'TournamentNameRange',
    CourtroomNames = 'CourtroomNamesRange',
    RoundNames = 'RoundNamesRange',
    BallotsPerTrial = 'BallotsPerTrialRange',
}

interface ICourtroomInfo {
    name: string;
    bailiffEmails: string[];
}

interface ISetupContext {
    isValid: boolean;

    tabFolder: Folder;
    masterSheetTemplate: GoogleFile;
    orchestratorTemplate: GoogleFile;
    ballotTemplate: GoogleFile;
    captainsFormTemplate: GoogleFile;

    ballotBaseTemplate: GoogleFile;
    captainsFormBaseTemplate: GoogleFile;

    tournamentName: string;
    courtroomsInfo: ICourtroomInfo[];
    roundNames: string[];
    ballotsPerTrial: number;
}

class SetupContext implements ISetupContext {
    ballotTemplate: GoogleFile;
    captainsFormTemplate: GoogleFile;

    private generatorSpreadsheet: Spreadsheet;

    constructor() {
        this.generatorSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    }

    get isValid(): boolean {
        // noinspection UnnecessaryLocalVariableJS
        const tabFolderIsEmpty = !this.tabFolder.getFiles().hasNext();
        return tabFolderIsEmpty;
    }

    @memoize
    get tabFolder(): Folder {
        return DriveApp.getFolderById(getIdFromUrl(this.getRangeValue(GeneratorRange.TabFolder)));
    }

    @memoize
    get masterSheetTemplate(): GoogleFile {
        return DriveApp.getFileById(getIdFromUrl(this.getRangeValue(GeneratorRange.MasterSheetTemplate)));
    }

    @memoize
    get orchestratorTemplate(): GoogleFile {
        return DriveApp.getFileById(getIdFromUrl(this.getRangeValue(GeneratorRange.OrchestratorTemplate)));
    }

    @memoize
    get ballotBaseTemplate(): GoogleFile {
        return DriveApp.getFileById(getIdFromUrl(this.getRangeValue(GeneratorRange.BallotTemplate)));
    }

    @memoize
    get captainsFormBaseTemplate(): GoogleFile {
        return DriveApp.getFileById(getIdFromUrl(this.getRangeValue(GeneratorRange.CaptainsFormTemplate)));
    }

    @memoize
    get tournamentName(): string {
        return this.getRangeValue(GeneratorRange.TournamentName);
    }

    @memoize
    get courtroomsInfo(): ICourtroomInfo[] {
        return this.getRangeValues(GeneratorRange.CourtroomNames).map(courtroomCells => {
            return {
                name: courtroomCells[0],
                bailiffEmails: courtroomCells[1].split(','),
            };
        });
    }

    @memoize
    get roundNames(): string[] {
        return this.getRangeValues(GeneratorRange.RoundNames)[0];
    }

    @memoize
    get ballotsPerTrial(): number {
        return parseInt(this.getRangeValue(GeneratorRange.BallotsPerTrial));
    }

    private getRangeValue(rangeName: GeneratorRange): string {
        return this.generatorSpreadsheet.getRangeByName(rangeName).getValue().toString();
    }

    private getRangeValues(rangeName: GeneratorRange): string[][] {
        return this.generatorSpreadsheet.getRangeByName(rangeName).getValues().map(arr => arr.map(cell => cell.toString()));
    }
}
