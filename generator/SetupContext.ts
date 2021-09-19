enum GeneratorRange {
    TabFolder = 'TabFolderRange',
    MasterSheetTemplate = 'MasterSheetTemplateRange',
    OrchestratorTemplate = 'OrchestratorTemplateRange',
    BallotTemplate = 'BallotTemplateRange',
    CaptainsFormTemplate = 'CaptainsFormTemplateRange',
    TournamentName = 'TournamentNameRange',
    FirstPartyName = 'FirstPartyNameRange',
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
    firstPartyName: string;
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

    get tabFolder(): Folder {
        return DriveApp.getFolderById(getIdFromUrl(this.getRangeValue(GeneratorRange.TabFolder)));
    }

    get masterSheetTemplate(): GoogleFile {
        return DriveApp.getFileById(getIdFromUrl(this.getRangeValue(GeneratorRange.MasterSheetTemplate)));
    }

    get orchestratorTemplate(): GoogleFile {
        return DriveApp.getFileById(getIdFromUrl(this.getRangeValue(GeneratorRange.OrchestratorTemplate)));
    }

    get ballotBaseTemplate(): GoogleFile {
        return DriveApp.getFileById(getIdFromUrl(this.getRangeValue(GeneratorRange.BallotTemplate)));
    }

    get captainsFormBaseTemplate(): GoogleFile {
        return DriveApp.getFileById(getIdFromUrl(this.getRangeValue(GeneratorRange.CaptainsFormTemplate)));
    }

    get tournamentName(): string {
        return this.getRangeValue(GeneratorRange.TournamentName);
    }

    get firstPartyName(): string {
        return this.getRangeValue(GeneratorRange.FirstPartyName);
    }

    get courtroomsInfo(): ICourtroomInfo[] {
        return this.getRangeValues(GeneratorRange.CourtroomNames).map(courtroomCells => {
            return {
                name: courtroomCells[0],
                bailiffEmails: courtroomCells[1].split(','),
            };
        });
    }

    get roundNames(): string[] {
        return this.getRangeValues(GeneratorRange.RoundNames)[0];
    }

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
