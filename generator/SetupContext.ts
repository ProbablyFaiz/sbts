import File = GoogleAppsScript.Drive.File;
import Spreadsheet = GoogleAppsScript.Spreadsheet.Spreadsheet;

enum GeneratorRange {
    MasterSheetTemplate = 'MasterSheetTemplateRange',
    OrchestratorTemplate = 'OrchestratorTemplateRange',
    BallotTemplate = 'BallotTemplateRange',
    CaptainsFormTemplate = 'CaptainsFormTemplateRange',
    TournamentName = 'TournamentNameRange',
    CourtroomNames = 'CourtroomNamesRange',
    RoundNames = 'RoundNamesRange',
    BallotsPerTrial = 'BallotsPerTrialRange',
}

interface ISetupContext {
    masterSheetTemplate: File;
    orchestratorTemplate: File;
    ballotTemplate: File;
    captainsFormTemplate: File;

    tournamentName: string;
    courtroomNames: string[];
    roundNames: string[];
    ballotsPerTrial: number;
}

class SetupContext implements ISetupContext {
    private generatorSpreadsheet: Spreadsheet;

    constructor() {
        this.generatorSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    }

    @memoize
    get masterSheetTemplate(): File {
        return DriveApp.getFileById(this.getRangeValue(GeneratorRange.MasterSheetTemplate));
    }

    @memoize
    get orchestratorTemplate(): File {
        return DriveApp.getFileById(this.getRangeValue(GeneratorRange.OrchestratorTemplate));
    }

    @memoize
    get ballotTemplate(): File {
        return DriveApp.getFileById(this.getRangeValue(GeneratorRange.BallotTemplate));
    }

    @memoize
    get captainsFormTemplate(): File {
        return DriveApp.getFileById(this.getRangeValue(GeneratorRange.CaptainsFormTemplate));
    }

    @memoize
    get tournamentName(): string {
        return this.getRangeValue(GeneratorRange.TournamentName);
    }

    @memoize
    get courtroomNames(): string[] {
        return this.getRangeValues(GeneratorRange.CourtroomNames)[0];
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
