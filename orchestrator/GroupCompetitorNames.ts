const OUTPUT_SHEET = "Competitor Names By Team";

function GroupCompetitorNames() {
  const context = new OrchestratorContext();
  const competitorNamesByTeam: Record<string, Set<string>> = {};
  context.captainsFormData.forEach((record) => {
    if (record.pTeamNum?.length) {
      if (!competitorNamesByTeam[record.pTeamNum])
        competitorNamesByTeam[record.pTeamNum] = new Set();
      record.pNames.forEach(
        (name) =>
          name?.length > 0 && competitorNamesByTeam[record.pTeamNum].add(name)
      );
    }
    if (record.dTeamNum?.length) {
      if (!competitorNamesByTeam[record.dTeamNum])
        competitorNamesByTeam[record.dTeamNum] = new Set();
      record.dNames.forEach(
        (name) =>
          name?.length > 0 && competitorNamesByTeam[record.dTeamNum].add(name)
      );
    }
  });
  const outputSheet =
    context.autocompleteSpreadsheet.getSheetByName(OUTPUT_SHEET)!;
  Object.entries(competitorNamesByTeam)
    .filter(([_, nameSet]) => nameSet.size > 0)
    .forEach(([teamNum, nameSet], i) => {
      const headerRange = outputSheet.getRange(1, i + 1);
      headerRange.setValue(teamNum);
      const namesRange = outputSheet.getRange(2, i + 1, nameSet.size, 1);
      namesRange.setValues(Array.from(nameSet.values()).map((name) => [name]));
      // Just the numerical team name is considered an invalid name for a range, so we prefix it.
      context.autocompleteSpreadsheet.setNamedRange(
        `TEAM${teamNum}`,
        namesRange
      );
    });
}
