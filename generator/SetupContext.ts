enum GeneratorRange {
    TabFolder = 'TabFolderRange',
    MasterSheetTemplate = 'MasterSheetTemplateRange',
    OrchestratorTemplate = 'OrchestratorTemplateRange',
    BallotTemplate = 'BallotTemplateRange',
    CaptainsFormTemplate = 'CaptainsFormTemplateRange',
    AutocompleteTemplate = 'AutocompleteTemplateRange',
    TournamentName = 'TournamentNameRange',
    FirstPartyName = 'FirstPartyNameRange',
    CourtroomNames = 'CourtroomsInfoRange',
    RoundsInfo = 'RoundsInfoRange',
    NumberOfCourtrooms = 'NumberOfCourtroomsRange',
    NumberOfRounds = 'NumberOfRoundsRange',
    TournamentContactEmail = "TournamentContactEmailRange",
    GenerationLog = 'GenerationLogRange',
}

interface ICourtroomInfo {
    name: string;
    bailiffEmails: string[];
}

interface RoundInfo {
    name: string;
    numBallots: number;
    numCourtrooms: number;
}

interface GeneratedCourtroomRecord {
    name: string;
    bailiffEmails: string[];
    roundFolderLinks: string[];
}

interface ISetupContext {
    isValid: boolean;

    masterSpreadsheet: Spreadsheet;
    autocompleteEngine: GoogleFile;
    ballotTemplate: GoogleFile;
    captainsFormTemplate: GoogleFile;

    tabFolder: Folder;
    masterSheetTemplate: GoogleFile;
    orchestratorTemplate: GoogleFile;
    ballotBaseTemplate: GoogleFile;
    captainsFormBaseTemplate: GoogleFile;
    autocompleteEngineTemplate: GoogleFile;

    tournamentName: string;
    tournamentContactEmail: string;
    firstPartyName: string;
    courtroomsInfo: ICourtroomInfo[];

    saveCourtroomFolderLink(name: string, trialFolderLink: string): void;
    writeCourtroomsToMaster(): void;
}

class SetupContext implements ISetupContext {
    masterSpreadsheet: Spreadsheet;
    autocompleteEngine: GoogleFile;
    ballotTemplate: GoogleFile;
    captainsFormTemplate: GoogleFile;

    private generatorSpreadsheet: Spreadsheet;
    private tabFolderLink: string;
    private courtroomRecords: GeneratedCourtroomRecord[];

    constructor(tabFolderLink: string) {
        this.tabFolderLink = tabFolderLink;
        this.generatorSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        this.courtroomRecords = this.courtroomsInfo.map(info => {
            return {
                name: info.name,
                bailiffEmails: info.bailiffEmails,
                roundFolderLinks: [],
            }
        });
    }

    saveCourtroomFolderLink(name: string, trialFolderLink: string) {
        // This is O(n) but I don't care because it's easy and n is ~12.
        const courtroomRecord = this.courtroomRecords.find(courtroom => courtroom.name === name);
        courtroomRecord.roundFolderLinks.push(trialFolderLink);
    }

    writeCourtroomsToMaster() {
        const courtroomsRange = this.masterSpreadsheet.getRangeByName(MasterRange.CourtroomInfo);
        const output = this.courtroomRecords.map(record =>
            [record.name, record.bailiffEmails.join(","), record.roundFolderLinks.join(",")]
        )
        // TODO: Refactor padding code into separate helper
        const paddingLength = courtroomsRange.getNumRows() - output.length;
        for (let i = 0; i < paddingLength; i++) {
            output.push(["", "", ""]);
        }
        courtroomsRange.setValues(output);
    }

    get isValid(): boolean {
        const tabFolderIsEmpty = !this.tabFolder.getFiles().hasNext();
        return tabFolderIsEmpty;
    }

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
    get autocompleteEngineTemplate(): GoogleFile {
        return DriveApp.getFileById(getIdFromUrl(this.getRangeValue(GeneratorRange.AutocompleteTemplate)).toString());
    }

    @memoize
    get tournamentName(): string {
        return this.getRangeValue(GeneratorRange.TournamentName);
    }

    @memoize
    get tournamentContactEmail(): string {
        return this.getRangeValue(GeneratorRange.TournamentContactEmail);
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
    get roundsInfo(): RoundInfo[] {
        return compactRange(this.getRangeValues(GeneratorRange.RoundsInfo)).map(roundCells => {
            return {
                name: roundCells[0],
                numCourtrooms: parseInt(roundCells[1]),
                numBallots: parseInt(roundCells[2]),
            };
        }).slice(0, this.numRounds);
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
