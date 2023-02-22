const START_ELO = 1000;
const K_FACTOR = 32;

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

function calculateEloData(context: IRankerContext): EloData {
  const tournaments = context.tabSummaries;
  const schools = tournaments
    .flatMap((tournament) => tournament.teams.map((team) => team.teamSchool))
    .filter((school, index, self) => self.indexOf(school) === index);

  const eloMap = schools.reduce((acc, school) => {
    acc.set(school, START_ELO);
    return acc;
  }, new Map<string, number>());

  const eloProgression: EloProgressionEntry[] = [];

  tournaments.forEach((t) => {
    const teamNumberSchoolMap = t.teams.reduce((acc, team) => {
      acc.set(team.teamNumber, team.teamSchool);
      return acc;
    }, new Map<string, string>());
    const roundMatchups = matchupsByRound(t);

    roundMatchups.forEach(([round, matchups]) => {
      // We wait to adjust the elos until all matchups in a round have been
      // processed. This is because we don't want the arbitrary ordering of
      // matchups in a round to affect the elo adjustments.
      const schoolAdjustments = new Map<string, number>();
      matchups.forEach((matchup) => {
        const school1 = teamNumberSchoolMap.get(matchup.pTeamNumber);
        const school2 = teamNumberSchoolMap.get(matchup.dTeamNumber);
        if (school1 === school2) {
          // Don't adjust elos for intra-school matchups; it would
          // be zero anyway.
          return;
        }

        const elo1 = eloMap.get(school1);
        const elo2 = eloMap.get(school2);
        const expectedOutcome1 = expectedOutcome(elo1, elo2);
        const actualOutcome1 = getOutcome(matchup);
        const eloChange1 = eloChange(expectedOutcome1, actualOutcome1);

        eloProgression.push({
          date: new Date(t.tournamentStartTimestamp),
          tournamentName: t.tournamentName,
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
  });

  const eloResults: SchoolElo[] = Array.from(eloMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([school, elo]) => {
      return { schoolName: school, elo };
    });
  return { eloProgression, eloResults };
}

function ComputeEloRankings() {
  const context = new RankerContext();
  const { eloProgression, eloResults } = calculateEloData(context);
  writeEloResults(eloResults, context);
  writeEloProgression(eloProgression, context);
  addEloHistoryRow(eloResults, eloProgression, context.tabSummaries, context);
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

const eloChange = (expectedOutcome: number, actualOutcome: number) => {
  return K_FACTOR * (actualOutcome - expectedOutcome);
};

const writeEloResults = (eloResults: SchoolElo[], context: RankerContext) => {
  const sheet = context.rankerSpreadsheet.getSheetByName("Elo Ranking");
  sheet.clear({ contentsOnly: true });
  // Remove all but the top 5 rows
  sheet.deleteRows(6, sheet.getMaxRows() - 5);
  sheet.appendRow(["National Program Ranking"]);
  // Date format: February 10, 2023 at 9:30 PM
  sheet.appendRow([
    `Updated: ${new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
      timeZone: "America/Los_Angeles",
    })}`,
  ]);
  sheet.appendRow(["School", "Elo"]);
  eloResults.forEach((result) => {
    sheet.appendRow([result.schoolName, result.elo]);
  });
};

const writeEloProgression = (
  eloProgression: EloProgressionEntry[],
  context: RankerContext
) => {
  const sheet = context.rankerSpreadsheet.getSheetByName("Elo Progression");
  sheet.clear({ contentsOnly: true });
  sheet.appendRow([
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
    sheet.appendRow([
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
};

const addEloHistoryRow = (
  eloResults: SchoolElo[],
  eloProgression: EloProgressionEntry[],
  tournaments: TabSummary[],
  context: RankerContext
) => {
  const sheet = context.rankerSpreadsheet.getSheetByName("Ranking History");
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
