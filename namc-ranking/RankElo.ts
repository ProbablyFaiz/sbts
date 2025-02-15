const START_ELO = 1200;
const K_FACTOR = 32;
const HALVE_ELOS_AFTER_DAYS = 180;

interface SchoolElo {
  schoolName: string;
  elo: number;
}

interface EloProgressionEntry {
  date: Date;
  tournamentName: string;
  roundName: string;
  school1Name: string;
  school2Name: string;
  initialElo1: number;
  initialElo2: number;
  adjustment1: number;
  adjustment2: number;
}

interface EloData {
  eloResults: SchoolElo[];
  eloProgression: EloProgressionEntry[];
}

function ComputeEloRankings() {
  const context = new RankerContext();
  const { eloProgression, eloResults } = calculateEloData(
    context.tabSummaries,
    context.rankingConfig
  );
  writeEloResults(
    eloResults.slice(0, context.rankingConfig.topN),
    context.rankerSpreadsheet
  );
  writeEloProgression(eloProgression, context.rankerSpreadsheet);
  addEloHistoryRow(
    eloResults,
    eloProgression,
    context.tabSummaries,
    context.rankerSpreadsheet
  );
}

function EloRankingDryRun() {
  // In the dry run, we ignore the topN setting and show all schools.
  const context = new RankerContext();
  const { eloProgression, eloResults } = calculateEloData(
    context.tabSummaries,
    context.rankingConfig
  );
  const ui = SpreadsheetApp.getUi();
  // Create an html dialog that shows the ranked schools as a table with their elo (rounded to the nearest integer).
  const html = HtmlService.createHtmlOutput(
    `<h2>Elo Rankings</h2>
    <table>
      <tr>
        <th>Rank</th>
        <th>School</th>
        <th>Elo</th>
      </tr>
      ${eloResults
        .map(
          (schoolElo, index) =>
            `<tr>
              <td>${index + 1}</td>
              <td>${schoolElo.schoolName}</td>
              <td>${Math.round(schoolElo.elo)}</td>
            </tr>`
        )
        .join("")}
    </table>
    <h2>Elo Progression</h2>
    <table>
      <tr>
        <th>Date</th>
        <th>Tournament</th>
        <th>Round</th>
        <th>Team 1</th>
        <th>Team 2</th>
        <th>In. Elo 1</th>
        <th>In. Elo 2</th>
        <th>Adj. 1</th>
        <th>Adj. 2</th>
      </tr>
      ${eloProgression
        .map(
          (entry) =>
            `<tr>
              <td>${entry.date.toLocaleDateString()}</td>
              <td>${entry.tournamentName}</td>
              <td>${entry.roundName}</td>
              <td>${entry.school1Name}</td>
              <td>${entry.school2Name}</td>
              <td>${Math.round(entry.initialElo1 * 10) / 10}</td>
              <td>${Math.round(entry.initialElo2 * 10) / 10}</td>
              <td>${Math.round(entry.adjustment1 * 10) / 10}</td>
              <td>${Math.round(entry.adjustment2 * 10) / 10}</td>
            </tr>`
        )
        .join("")}
    </table>
    <style>
      table {
        border-collapse: collapse;
      }
      th, td {
        border: 1px solid black;
        padding: 5px;
      }
      tr:nth-child(even) {
        background-color: #eee;
      }
      tr:nth-child(odd) {
        background-color:#fff;
      }
    </style>`
  )
    .setWidth(800)
    .setHeight(600);
  ui.showModelessDialog(html, "Elo Ranking Dry Run");
}

const EXCLUDED_PROGRAM_NAMES = ["Dummy", "Hybrid"];

const calculateEloData = (
  tournaments: TabSummary[],
  config: RankingConfig
): EloData => {
  const schools = tournaments
    .flatMap((tournament) => tournament.teams.map((team) => team.teamSchool))
    .filter((school, index, self) => self.indexOf(school) === index);

  const startElo = config.startingElo || START_ELO;
  const kFactor = config.kFactor || K_FACTOR;
  const halveElosAfterDays = config.halveElosAfter || HALVE_ELOS_AFTER_DAYS;
  const eloMap = schools.reduce((acc, school) => {
    acc.set(school, startElo);
    return acc;
  }, new Map<string, number>());

  const eloProgression: EloProgressionEntry[] = [];

  tournaments.forEach((t, idx) => {
    if (idx > 0) {
      const dayGap =
        (new Date(t.tournamentStartTimestamp).getTime() -
          new Date(tournaments[idx - 1].tournamentStartTimestamp).getTime()) /
        (1000 * 60 * 60 * 24);
      if (dayGap > halveElosAfterDays) {
        Logger.log(
          `Regressing elos halfway to baseline before ${t.tournamentName}...`
        );
        eloMap.forEach((elo, school) => {
          const adjustment = (startElo - elo) / 2;
          eloMap.set(school, elo + adjustment);
          eloProgression.push({
            date: new Date(t.tournamentStartTimestamp),
            tournamentName: "Seasonal Adjustment",
            roundName: "Regressing Elos",
            school1Name: school,
            school2Name: "-",
            initialElo1: elo,
            initialElo2: 0,
            adjustment1: adjustment,
            adjustment2: 0,
          });
        });
      }
    }
    processTournament(t, eloMap, eloProgression, kFactor);
  });

  const eloResults: SchoolElo[] = Array.from(eloMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([school, elo]) => {
      return { schoolName: school, elo };
    })
    .filter(({ schoolName }) => {
      return !EXCLUDED_PROGRAM_NAMES.includes(schoolName);
    });
  return { eloProgression, eloResults };
};

function processTournament(
  tournament: TabSummary,
  eloMap: Map<string, number>,
  eloProgression: EloProgressionEntry[],
  kFactor: number
) {
  const teamNumberSchoolMap = tournament.teams.reduce((acc, team) => {
    acc.set(team.teamNumber, team.teamSchool);
    return acc;
  }, new Map<string, string>());
  const roundMatchups = matchupsByRound(tournament);

  roundMatchups.forEach(([round, matchups]) => {
    // We wait to adjust the elos until all matchups in a round have been
    // processed. This is because we don't want the arbitrary ordering of
    // matchups in a round to affect the elo adjustments.
    const schoolAdjustments = new Map<string, number>();
    matchups.forEach((matchup) => {
      const school1 = teamNumberSchoolMap.get(matchup.pTeamNumber);
      const school2 = teamNumberSchoolMap.get(matchup.dTeamNumber);
      if (school1 == null || school2 == null) {
        const missingSide = school1 == null ? "Petitioner" : "Respondent";
        throw new Error(
          `${missingSide}'s school not found for matchup: ${JSON.stringify(
            matchup
          )}. Please check the team list in the tab summary.`
        );
      }

      // Don't adjust elos for intra-school matchups or matchups with a dummy/hybrid team.
      if (
        school1 === school2 ||
        [school1, school2].some((s) => EXCLUDED_PROGRAM_NAMES.includes(s))
      ) {
        return;
      }

      const elo1 = eloMap.get(school1);
      const elo2 = eloMap.get(school2);
      const expectedOutcome1 = expectedOutcome(elo1, elo2);
      const actualOutcome1 = getOutcome(matchup);
      const eloChange1 = eloChange(expectedOutcome1, actualOutcome1, kFactor);

      eloProgression.push({
        date: new Date(tournament.tournamentStartTimestamp),
        tournamentName: tournament.tournamentName,
        roundName: round,
        school1Name: school1,
        school2Name: school2,
        initialElo1: elo1,
        initialElo2: elo2,
        adjustment1: eloChange1,
        adjustment2: -eloChange1,
      });
      if (!schoolAdjustments.has(school1)) {
        schoolAdjustments.set(school1, 0);
      }
      schoolAdjustments.set(
        school1,
        schoolAdjustments.get(school1) + eloChange1
      );
      if (!schoolAdjustments.has(school2)) {
        schoolAdjustments.set(school2, 0);
      }
      schoolAdjustments.set(
        school2,
        schoolAdjustments.get(school2) - eloChange1
      );
    });

    schoolAdjustments.forEach((eloChange, school) => {
      eloMap.set(school, eloMap.get(school) + eloChange);
    });
  });
}

const matchupsByRound = (tournament: TabSummary) => {
  const roundMatchups = Array.from(
    tournament.matchupResults
      .reduce((acc, matchup) => {
        if (!acc.has(matchup.round)) {
          acc.set(matchup.round, []);
        }
        acc.get(matchup.round).push(matchup);
        return acc;
      }, new Map<string, MatchupResult[]>())
      .entries()
  ).sort(
    (a, b) =>
      tournament.orderedRoundList.indexOf(a[0]) -
      tournament.orderedRoundList.indexOf(b[0])
  );
  return roundMatchups;
};

const getOutcome = (matchup: MatchupResult) => {
  // if (matchup.pBallotsWon === matchup.dBallotsWon) {
  //   return 0.5;
  // }
  // return matchup.pBallotsWon > matchup.dBallotsWon ? 1 : 0;
  return matchup.pBallotsWon / (matchup.pBallotsWon + matchup.dBallotsWon);
};

const expectedOutcome = (elo1: number, elo2: number) => {
  return 1 / (1 + 10 ** ((elo2 - elo1) / 400));
};

const eloChange = (
  expectedOutcome: number,
  actualOutcome: number,
  kFactor: number
) => {
  return K_FACTOR * (actualOutcome - expectedOutcome);
};

const writeEloResults = (
  eloResults: SchoolElo[],
  rankerSpreadsheet: Spreadsheet
) => {
  const sheet = rankerSpreadsheet.getSheetByName("Elo Ranking");
  sheet.clear({ contentsOnly: true });
  sheet.appendRow(["Top Programs"]);
  // Date format: February 10, 2023 at 9:30 PM PST
  sheet.appendRow([
    `Updated: ${new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      timeZoneName: "short",
      timeZone: "America/Los_Angeles",
    })}`,
  ]);
  sheet.appendRow(["School", "Elo"]);
  eloResults.forEach((result) => {
    sheet.appendRow([result.schoolName, result.elo]);
  });
  const lastRow = sheet.getLastRow();
  if (lastRow < sheet.getMaxRows()) {
    sheet.deleteRows(lastRow + 1, sheet.getMaxRows() - lastRow);
  }
};

const writeEloProgression = (
  eloProgression: EloProgressionEntry[],
  rankerSpreadsheet: Spreadsheet
) => {
  const sheet = rankerSpreadsheet.getSheetByName("Elo Progression");
  sheet.clear({ contentsOnly: true });
  const rows: any[][] = [];
  rows.push([
    "Date",
    "Tournament",
    "Round",
    "Petitioner School",
    "Respondent School",
    "P Initial Elo",
    "R Initial Elo",
    "P Adjustment",
    "R Adjustment",
  ]);
  eloProgression.forEach((entry) => {
    rows.push([
      entry.date,
      entry.tournamentName,
      entry.roundName,
      entry.school1Name,
      entry.school2Name,
      entry.initialElo1,
      entry.initialElo2,
      entry.adjustment1,
      entry.adjustment2,
    ]);
  });

  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
};

const addEloHistoryRow = (
  eloResults: SchoolElo[],
  eloProgression: EloProgressionEntry[],
  tournaments: TabSummary[],
  rankerSpreadsheet: Spreadsheet
) => {
  const sheet = rankerSpreadsheet.getSheetByName("Ranking History");
  // Date Generated |	Tournaments Included Dump |	Ranking Dump |	Progression Dump
  sheet.appendRow([
    new Date(),
    JSON.stringify(
      tournaments.map((t) => {
        return {
          name: t.tournamentName,
          startTimestamp: t.tournamentStartTimestamp,
          url: t.url,
        };
      })
    ),
    JSON.stringify(eloResults),
    JSON.stringify(eloProgression),
  ]);
};
