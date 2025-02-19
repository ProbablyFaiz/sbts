enum ConsolidatedRange {
  MatchupResults = "MatchupResultsRange",
  TeamInfo = "TeamInfoRange",
}

function PopulateFromSummaries() {
  const context = new RankerContext();
  const rankerSpreadsheet = context.rankerSpreadsheet;

  const matchupValues: any[][] = [
    [
      "Tournament Name",
      "Round",
      "P Team Number",
      "D Team Number",
      "P Ballots Won",
      "D Ballots Won",
      "Notes",
      "Tournament Start Date",
      "Tournament Type",
    ],
  ];

  const teamValues: any[][] = [
    [
      "Tournament Name",
      "Rank",
      "Team Number",
      "School",
      "Competitor 1",
      "Competitor 2",
      "Email",
      "Tournament Start Date",
      "Tournament Type",
    ],
  ];

  context.tabSummaries.forEach((summary) => {
    const tournamentDate = new Date(summary.tournamentStartTimestamp);

    summary.matchupResults.forEach((matchup) => {
      matchupValues.push([
        summary.tournamentName,
        matchup.round,
        matchup.pTeamNumber,
        matchup.dTeamNumber,
        matchup.pBallotsWon,
        matchup.dBallotsWon,
        matchup.notes,
        tournamentDate,
        summary.tournamentType,
      ]);
    });

    summary.teams.forEach((team) => {
      teamValues.push([
        summary.tournamentName,
        team.rank,
        team.teamNumber,
        team.teamSchool,
        team.competitor1Name,
        team.competitor2Name,
        team.teamEmail,
        tournamentDate,
        summary.tournamentType,
      ]);
    });
  });

  setAndBackfillRange(
    rankerSpreadsheet.getRangeByName(ConsolidatedRange.MatchupResults),
    matchupValues,
  );

  setAndBackfillRange(
    rankerSpreadsheet.getRangeByName(ConsolidatedRange.TeamInfo),
    teamValues,
  );
}
