const BALLOTS_PER_ROUND = 2;

interface TeamRank {
  rank: number;
  teamNumber: string;
  teamSchool: string;
  competitor1Name: string;
  competitor2Name: string;
  teamEmail: string;
}

interface MatchupResult {
  round: string;
  pTeamNumber: string;
  dTeamNumber: string;
  pBallotsWon: number;
  dBallotsWon: number;
  notes: string;
}

interface TabSummary {
  url: string;
  tournamentName: string;
  tournamentType: string;
  tournamentStartTimestamp: number;
  orderedRoundList: string[];
  teams: TeamRank[];
  matchupResults: MatchupResult[];
}

interface RankingConfig {
  startingElo: number;
  kFactor: number;
  topN: number;
  halveElosAfter: number;
}

enum RankerRange {
  TabSummaryLinks = "TabSummaryLinks",
  StartingElo = "StartingElo",
  KFactor = "KFactor",
  TopN = "TopN",
  HalveElosAfter = "HalveElosAfter",
}

enum TabSummaryRange {
  OrderedRoundList = "OrderedRoundList",
  MatchupResults = "MatchupResults",
  TeamRanking = "TeamRanking",
  TournamentName = "TournamentName",
  TournamentStartDate = "TournamentStartDate",
  TournamentType = "TournamentType",
}

interface IRankerContext {
  tabSummaries: TabSummary[];
  rankingConfig: RankingConfig;
}

class RankerContext implements IRankerContext {
  rankerSpreadsheet: Spreadsheet;

  constructor() {
    this.rankerSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  }

  @memoize
  get rankingConfig(): RankingConfig {
    const startingElo = this.rankerSpreadsheet
      .getRangeByName(RankerRange.StartingElo)
      .getValue();
    const kFactor = this.rankerSpreadsheet
      .getRangeByName(RankerRange.KFactor)
      .getValue();
    const topN = this.rankerSpreadsheet
      .getRangeByName(RankerRange.TopN)
      .getValue();
    const halveElosAfter = this.rankerSpreadsheet
      .getRangeByName(RankerRange.HalveElosAfter)
      .getValue();
    return {
      startingElo,
      kFactor,
      topN,
      halveElosAfter,
    };
  }

  @memoize
  get tabSummaries(): TabSummary[] {
    const tabSummaryLinks = compactRange(
      this.rankerSpreadsheet
        .getRangeByName(RankerRange.TabSummaryLinks)
        .getValues(),
    );
    return tabSummaryLinks
      .map((row) => {
        if (!row[3] || row[3].toString().toUpperCase() === "FALSE") {
          return null;
        }
        const tabSummaryUrl = row[0];
        const tabSummarySpreadsheet = SpreadsheetApp.openByUrl(tabSummaryUrl);
        if (!tabSummarySpreadsheet) {
          console.log(
            `Could not open tab summary spreadsheet at ${tabSummaryUrl}, skipping...`,
          );
          return null;
        }
        return this.getTabSummaryFromSS(tabSummarySpreadsheet);
      })
      .filter((tabSummary) => tabSummary !== null)
      .sort((a, b) => a.tournamentStartTimestamp - b.tournamentStartTimestamp);
  }

  private getTabSummaryFromSS(tabSummarySpreadsheet: Spreadsheet) {
    const teams = this.getTeamsForSummary(tabSummarySpreadsheet);
    const orderedRoundList = compactRange(
      this.getSummaryRangeValues(
        tabSummarySpreadsheet,
        TabSummaryRange.OrderedRoundList,
      ),
    ).map((row) => row[0].trim());
    const matchupResults = this.getMatchupResultsForSummary(
      tabSummarySpreadsheet,
    ).sort(
      (a, b) =>
        orderedRoundList.indexOf(a.round) - orderedRoundList.indexOf(b.round),
    );
    return {
      url: tabSummarySpreadsheet.getUrl(),
      tournamentName: this.getSummaryRangeValue(
        tabSummarySpreadsheet,
        TabSummaryRange.TournamentName,
      ),
      tournamentType: this.getSummaryRangeValue(
        tabSummarySpreadsheet,
        TabSummaryRange.TournamentType,
      ),
      tournamentStartTimestamp: tabSummarySpreadsheet
        .getRangeByName(TabSummaryRange.TournamentStartDate)
        .getValue()
        .getTime(),
      orderedRoundList: orderedRoundList,
      teams: teams,
      matchupResults: matchupResults,
    };
  }

  private getTeamsForSummary(tabSummarySpreadsheet: Spreadsheet) {
    return compactRange(
      this.getSummaryRangeValues(
        tabSummarySpreadsheet,
        TabSummaryRange.TeamRanking,
      ),
    )
      .map((teamCells) => {
        return {
          rank: parseInt(teamCells[0]),
          teamNumber: teamCells[1].trim(),
          teamSchool: teamCells[2].trim(),
          competitor1Name: teamCells[3].trim(),
          competitor2Name: teamCells[4].trim(),
          teamEmail: teamCells[5].trim(),
        };
      })
      .filter((team) => !!team.teamNumber)
      .sort((a, b) => a.rank - b.rank);
  }

  private getMatchupResultsForSummary(tabSummarySpreadsheet: Spreadsheet) {
    return compactRange(
      this.getSummaryRangeValues(
        tabSummarySpreadsheet,
        TabSummaryRange.MatchupResults,
      ),
    )
      .map((matchupCells) => {
        let pBallotsWon = parseFloat(matchupCells[3]);
        let dBallotsWon = parseFloat(matchupCells[4]);
        if (isNaN(pBallotsWon) || isNaN(dBallotsWon)) {
          return null;
        }
        pBallotsWon =
          (pBallotsWon * BALLOTS_PER_ROUND) / (pBallotsWon + dBallotsWon);
        dBallotsWon =
          (dBallotsWon * BALLOTS_PER_ROUND) / (pBallotsWon + dBallotsWon);
        return {
          round: matchupCells[0].trim(),
          pTeamNumber: matchupCells[1].trim(),
          dTeamNumber: matchupCells[2].trim(),
          pBallotsWon: pBallotsWon,
          dBallotsWon: dBallotsWon,
          notes: matchupCells[5],
        };
      })
      .filter((matchup) => !!matchup);
  }

  private getRangeValues(range: RankerRange): string[][] {
    return this.rankerSpreadsheet
      .getRangeByName(range)
      .getValues()
      .map((arr) => arr.map((cell) => cell.toString()));
  }

  private getSummaryRangeValues(
    spreadsheet: Spreadsheet,
    range: TabSummaryRange,
  ): string[][] {
    return spreadsheet
      .getRangeByName(range)
      .getValues()
      .map((arr) => arr.map((cell) => cell.toString()));
  }

  private getSummaryRangeValue(
    spreadsheet: Spreadsheet,
    range: TabSummaryRange,
  ): string {
    return spreadsheet.getRangeByName(range).getValue().toString();
  }
}
