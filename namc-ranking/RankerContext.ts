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

enum RankerRange {
  TabSummaryLinks = "TabSummaryLinks",
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
}

class RankerContext implements IRankerContext {
  rankerSpreadsheet: Spreadsheet;

  constructor() {
    this.rankerSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  }

  @memoize
  get tabSummaries(): TabSummary[] {
    const tabSummaryLinks = compactRange(
      this.getRangeValues(RankerRange.TabSummaryLinks)
    );
    const tabSummaries = tabSummaryLinks.map((row) => {
      const tabSummaryUrl = row[0];
      const tabSummarySpreadsheet = SpreadsheetApp.openByUrl(tabSummaryUrl);
      if (!tabSummarySpreadsheet) {
        console.log(
          `Could not open tab summary spreadsheet at ${tabSummaryUrl}`
        );
      }
      const teams = this.getTeamsForSummary(tabSummarySpreadsheet);
      const orderedRoundList = compactRange(
        this.getSummaryRangeValues(
          tabSummarySpreadsheet,
          TabSummaryRange.OrderedRoundList
        )
      ).map((row) => row[0]);
      const matchupResults = this.getMatchupResultsForSummary(
        tabSummarySpreadsheet
      ).sort(
        (a, b) =>
          orderedRoundList.indexOf(a.round) - orderedRoundList.indexOf(b.round)
      );
      return {
        url: tabSummaryUrl,
        tournamentName: this.getSummaryRangeValue(
          tabSummarySpreadsheet,
          TabSummaryRange.TournamentName
        ),
        tournamentType: this.getSummaryRangeValue(
          tabSummarySpreadsheet,
          TabSummaryRange.TournamentType
        ),
        tournamentStartTimestamp: tabSummarySpreadsheet
          .getRangeByName(TabSummaryRange.TournamentStartDate)
          .getValue()
          .getTime(),
        orderedRoundList: orderedRoundList,
        teams: teams,
        matchupResults: matchupResults,
      };
    });
    return tabSummaries.sort(
      (a, b) => a.tournamentStartTimestamp - b.tournamentStartTimestamp
    );
  }

  private getTeamsForSummary(tabSummarySpreadsheet: Spreadsheet) {
    return compactRange(
      this.getSummaryRangeValues(
        tabSummarySpreadsheet,
        TabSummaryRange.TeamRanking
      )
    )
      .map((teamCells) => {
        return {
          rank: parseInt(teamCells[0]),
          teamNumber: teamCells[1],
          teamSchool: teamCells[2],
          competitor1Name: teamCells[3],
          competitor2Name: teamCells[4],
          teamEmail: teamCells[5],
        };
      })
      .filter((team) => !!team.teamNumber);
  }

  private getMatchupResultsForSummary(tabSummarySpreadsheet: Spreadsheet) {
    return compactRange(
      this.getSummaryRangeValues(
        tabSummarySpreadsheet,
        TabSummaryRange.MatchupResults
      )
    ).map((matchupCells) => {
      return {
        round: matchupCells[0],
        pTeamNumber: matchupCells[1],
        dTeamNumber: matchupCells[2],
        pBallotsWon: parseFloat(matchupCells[3]),
        dBallotsWon: parseFloat(matchupCells[4]),
        notes: matchupCells[5],
      };
    });
  }

  private getRangeValues(range: RankerRange): string[][] {
    return this.rankerSpreadsheet
      .getRangeByName(range)
      .getValues()
      .map((arr) => arr.map((cell) => cell.toString()));
  }

  private getSummaryRangeValues(
    spreadsheet: Spreadsheet,
    range: TabSummaryRange
  ): string[][] {
    return spreadsheet
      .getRangeByName(range)
      .getValues()
      .map((arr) => arr.map((cell) => cell.toString()));
  }

  private getSummaryRangeValue(
    spreadsheet: Spreadsheet,
    range: TabSummaryRange
  ): string {
    return spreadsheet.getRangeByName(range).getValue().toString();
  }
}
