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
  get ballotListTemplate(): GoogleFile {
    return DriveApp.getFileById(
      getIdFromUrl(
        this.getRangeValue(SimpleGeneratorRange.BallotListTemplateLink),
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
