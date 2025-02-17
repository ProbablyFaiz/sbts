enum GeneratorRange {
  TabFolder = "TabFolderRange",
  MasterSheetTemplate = "MasterSheetTemplateRange",
  OrchestratorTemplate = "OrchestratorTemplateRange",
  BallotTemplate = "BallotTemplateRange",
  CaptainsFormTemplate = "CaptainsFormTemplateRange",
  AutocompleteTemplate = "AutocompleteTemplateRange",
  FormBallotTemplate = "FormBallotTemplateRange",
  TournamentName = "TournamentNameRange",
  FirstPartyName = "FirstPartyNameRange",
  SecondPartyName = "SecondPartyNameRange",
  CourtroomNames = "CourtroomsInfoRange",
  RoundsInfo = "RoundsInfoRange",
  NumberOfCourtrooms = "NumberOfCourtroomsRange",
  NumberOfRounds = "NumberOfRoundsRange",
  TournamentContactEmail = "TournamentContactEmailRange",
  GenerationLog = "GenerationLogRange",
  GenerateVirtualBallots = "GenerateVirtualBallotsRange",
  GenerateCompetitorForms = "GenerateCompetitorFormsRange",
  SetUpGoogleFormBallot = "SetUpFormBallotRange",
}

interface ICourtroomInfo {
  name: string;
  bailiffEmails: string[];
}

interface IRoundInfo {
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
  formBallotTemplate: GoogleFile;

  tournamentName: string;
  tournamentContactEmail: string;
  generateVirtualBallots: boolean;
  generateCompetitorForms: boolean;
  setUpGoogleFormBallot: boolean;
  firstPartyName: string;
  secondPartyName: string;
  courtroomsInfo: ICourtroomInfo[];
  roundsInfo: IRoundInfo[];

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
    this.courtroomRecords = this.courtroomsInfo.map((info) => {
      return {
        name: info.name,
        bailiffEmails: info.bailiffEmails,
        roundFolderLinks: [],
      };
    });
  }

  saveCourtroomFolderLink(name: string, trialFolderLink: string) {
    // This is O(n) but I don't care because it's easy and n is ~12.
    const courtroomRecord = this.courtroomRecords.find(
      (courtroom) => courtroom.name === name,
    );
    courtroomRecord.roundFolderLinks.push(trialFolderLink);
  }

  writeCourtroomsToMaster() {
    const courtroomsRange = this.masterSpreadsheet.getRangeByName(
      MasterRange.CourtroomInfo,
    );
    const output = this.courtroomRecords.map((record) => [
      record.name,
      record.bailiffEmails.join(","),
      record.roundFolderLinks.join(","),
    ]);
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
    return DriveApp.getFileById(
      getIdFromUrl(
        this.getRangeValue(GeneratorRange.MasterSheetTemplate),
      ).toString(),
    );
  }

  @memoize
  get orchestratorTemplate(): GoogleFile {
    return DriveApp.getFileById(
      getIdFromUrl(
        this.getRangeValue(GeneratorRange.OrchestratorTemplate),
      ).toString(),
    );
  }

  @memoize
  get ballotBaseTemplate(): GoogleFile {
    return DriveApp.getFileById(
      getIdFromUrl(
        this.getRangeValue(GeneratorRange.BallotTemplate),
      ).toString(),
    );
  }

  @memoize
  get captainsFormBaseTemplate(): GoogleFile {
    return DriveApp.getFileById(
      getIdFromUrl(
        this.getRangeValue(GeneratorRange.CaptainsFormTemplate),
      ).toString(),
    );
  }

  @memoize
  get autocompleteEngineTemplate(): GoogleFile {
    return DriveApp.getFileById(
      getIdFromUrl(
        this.getRangeValue(GeneratorRange.AutocompleteTemplate),
      ).toString(),
    );
  }

  @memoize
  get formBallotTemplate(): GoogleFile {
    return DriveApp.getFileById(
      getIdFromUrl(
        this.getRangeValue(GeneratorRange.FormBallotTemplate),
      ).toString(),
    );
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
  get generateVirtualBallots(): boolean {
    return !!this.generatorSpreadsheet
      .getRangeByName(GeneratorRange.GenerateVirtualBallots)
      .getValue();
  }

  @memoize
  get generateCompetitorForms(): boolean {
    return !!this.generatorSpreadsheet
      .getRangeByName(GeneratorRange.GenerateCompetitorForms)
      .getValue();
  }

  @memoize
  get setUpGoogleFormBallot(): boolean {
    return !!this.generatorSpreadsheet
      .getRangeByName(GeneratorRange.SetUpGoogleFormBallot)
      .getValue();
  }

  @memoize
  get firstPartyName(): string {
    return this.getRangeValue(GeneratorRange.FirstPartyName);
  }

  get secondPartyName(): string {
    return this.getRangeValue(GeneratorRange.SecondPartyName);
  }

  @memoize
  get courtroomsInfo(): ICourtroomInfo[] {
    return compactRange(this.getRangeValues(GeneratorRange.CourtroomNames)).map(
      (courtroomCells) => {
        return {
          name: courtroomCells[0],
          bailiffEmails: courtroomCells[1].split(","),
        };
      },
    );
  }

  @memoize
  get roundsInfo(): IRoundInfo[] {
    return compactRange(this.getRangeValues(GeneratorRange.RoundsInfo)).map(
      (roundCells) => {
        return {
          name: roundCells[0],
          numCourtrooms: parseInt(roundCells[1]),
          numBallots: parseInt(roundCells[2]),
        };
      },
    );
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
    return this.generatorSpreadsheet
      .getRangeByName(rangeName)
      .getValue()
      .toString();
  }

  private getRangeValues(rangeName: GeneratorRange): string[][] {
    return this.generatorSpreadsheet
      .getRangeByName(rangeName)
      .getValues()
      .map((arr) => arr.map((cell) => cell.toString()));
  }
}

enum SimpleGeneratorRange {
  MasterSpreadsheetTemplate = "MasterSpreadsheetTemplate",
  SheetBallotTemplate = "SheetBallotTemplate",
  FormBallotTemplate = "FormBallotTemplate",
  TournamentName = "TournamentName",
  TournamentContactEmail = "TournamentContactEmail",
  ShowSwissPairings = "ShowSwissPairings",
  ShowRoundRobinPairings = "ShowRoundRobinPairings",
  ShowKnockoutBracket = "ShowKnockoutBracket",
  ByeStrategy = "ByeStrategy",
  PrelimRounds = "PrelimRounds",
  ElimRounds = "ElimRounds",
  Courtrooms = "Courtrooms",
}

class SimpleSetupContext {
  tabFolder: Folder;

  private generatorSpreadsheet: Spreadsheet;

  constructor(tabFolderLink: string) {
    this.tabFolder = DriveApp.getFolderById(
      getIdFromUrl(tabFolderLink).toString(),
    );
    this.generatorSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  }

  @memoize
  get masterSpreadsheetTemplate(): GoogleFile {
    return DriveApp.getFileById(
      getIdFromUrl(
        this.getRangeValue(SimpleGeneratorRange.MasterSpreadsheetTemplate),
      ),
    );
  }

  @memoize
  get sheetBallotTemplate(): GoogleFile {
    return DriveApp.getFileById(
      getIdFromUrl(
        this.getRangeValue(SimpleGeneratorRange.SheetBallotTemplate),
      ),
    );
  }

  @memoize
  get formBallotTemplate(): GoogleFile {
    return DriveApp.getFileById(
      getIdFromUrl(this.getRangeValue(SimpleGeneratorRange.FormBallotTemplate)),
    );
  }

  @memoize
  get tournamentName(): string {
    return this.getRangeValue(SimpleGeneratorRange.TournamentName);
  }

  @memoize
  get tournamentContactEmail(): string {
    return this.getRangeValue(SimpleGeneratorRange.TournamentContactEmail);
  }

  @memoize
  get showSwissPairings(): boolean {
    return this.getRangeValue(SimpleGeneratorRange.ShowSwissPairings) == "Yes";
  }

  @memoize
  get showRoundRobinPairings(): boolean {
    return (
      this.getRangeValue(SimpleGeneratorRange.ShowRoundRobinPairings) == "Yes"
    );
  }

  @memoize
  get showKnockoutBracket(): boolean {
    return (
      this.getRangeValue(SimpleGeneratorRange.ShowKnockoutBracket) == "Yes"
    );
  }

  @memoize
  get byeStrategy(): string {
    return this.getRangeValue(SimpleGeneratorRange.ByeStrategy);
  }

  @memoize
  get prelimRounds(): string[] {
    return flattenRange(
      compactRange(this.getRangeValues(SimpleGeneratorRange.PrelimRounds)),
    );
  }

  @memoize
  get elimRounds(): string[] {
    return flattenRange(
      compactRange(this.getRangeValues(SimpleGeneratorRange.ElimRounds)),
    );
  }

  @memoize
  get courtrooms(): string[] {
    // courtrooms is two columns so we have to handle it column by column
    const courtroomCells = flattenByColumns(
      this.getRangeValues(SimpleGeneratorRange.Courtrooms),
    );
    return courtroomCells.filter((c) => !!c);
  }

  private getRangeValue(rangeName: SimpleGeneratorRange): string {
    return this.generatorSpreadsheet
      .getRangeByName(rangeName)
      .getValue()
      .toString();
  }

  private getRangeValues(rangeName: SimpleGeneratorRange): string[][] {
    return this.generatorSpreadsheet
      .getRangeByName(rangeName)
      .getValues()
      .map((arr) => arr.map((cell) => cell.toString()));
  }
}
