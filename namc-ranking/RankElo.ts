const START_ELO = 1000;
const K_FACTOR = 32;

function RankElo(startDate: string, endDate: string) {
  const start = startDate ? new Date(startDate).getTime() : 0;
  const end = endDate ? new Date(endDate).getTime() : 1e100;
  const context = new RankerContext();
  const tournaments = context.tabSummaries.filter(
    (tabSummary) =>
      tabSummary.tournamentStartTimestamp >= start &&
      tabSummary.tournamentStartTimestamp <= end
  );
  const schools = tournaments
    .flatMap((tournament) => tournament.teams.map((team) => team.teamSchool))
    .filter((school, index, self) => self.indexOf(school) === index);

  const eloMap = schools.reduce((acc, school) => {
    acc.set(school, START_ELO);
    return acc;
  }, new Map<string, number>());

  tournaments.forEach((t) => {
    const teamNumberSchoolMap = t.teams.reduce((acc, team) => {
      acc.set(team.teamNumber, team.teamSchool);
      return acc;
    }, new Map<string, string>());
    const roundMatchups = Array.from(
      t.matchupResults
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
        t.orderedRoundList.indexOf(a[0]) - t.orderedRoundList.indexOf(b[0])
    );

    roundMatchups.forEach(([round, matchups]) => {
      // We wait to adjust the elos until all matchups in a round have been
      // processed. This is because we don't want the arbitrary ordering of
      // matchups in a round to affect the elo adjustments.
      const schoolAdjustments = new Map<string, number>();
      matchups.forEach((matchup) => {
        const school1 = teamNumberSchoolMap.get(matchup.pTeamNumber);
        const school2 = teamNumberSchoolMap.get(matchup.dTeamNumber);
        if (school1 === school2) {
          return;
        }

        const elo1 = eloMap.get(school1);
        const elo2 = eloMap.get(school2);
        const expectedOutcome1 = expectedOutcome(elo1, elo2);
        const actualOutcome1 =
          matchup.pBallotsWon === matchup.dBallotsWon
            ? 0.5
            : matchup.pBallotsWon > matchup.dBallotsWon
            ? 1
            : 0;
        const eloChange1 = eloChange(expectedOutcome1, actualOutcome1);
        console.log(
          `${school1} (${elo1}) vs ${school2} (${elo2}): ${matchup.pBallotsWon} - ${matchup.dBallotsWon} (${eloChange1})`
        );
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
  console.log(Array.from(eloMap.entries()).sort((a, b) => b[1] - a[1]));
  return Array.from(eloMap.entries()).sort((a, b) => b[1] - a[1]);
}

const expectedOutcome = (elo1: number, elo2: number) => {
  return 1 / (1 + 10 ** ((elo2 - elo1) / 400));
};

const eloChange = (expectedOutcome: number, actualOutcome: number) => {
  return K_FACTOR * (actualOutcome - expectedOutcome);
};
