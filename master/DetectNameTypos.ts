enum RankingRangeIndex {
  TeamNumber = 0,
  CompetitorName = 2,
}

interface TeamKey {
  team: string;
}

function DetectNameTypos(rankingRange: string[][]): string[][] {
  const groupedNames = groupRankings(compactRange(rankingRange));
  const potentialDuplicateResults: string[][] = [];
  groupedNames.forEach((nameSet, groupKey) => {
    const groupKeyObject: TeamKey = JSON.parse(groupKey);
    const existingMatchSet: Set<string> = new Set();
    nameSet.values().forEach((name) => {
      const nameSearchResults = nameSet.get(name);
      if (nameSearchResults && nameSearchResults.length > 1) {
        nameSearchResults
          .filter((result) => result[1] !== name)
          .filter(
            (result) => !existingMatchSet.has(serializedMatch(name, result[1]))
          )
          .forEach((potentialDuplicate) => {
            potentialDuplicateResults.push([
              groupKeyObject.team,
              name,
              potentialDuplicate[1],
              potentialDuplicate[0].toFixed(3), // strength of match
            ]);
            existingMatchSet.add(serializedMatch(name, potentialDuplicate[1]));
          });
      }
    });
  });
  potentialDuplicateResults.sort((a, b) => parseFloat(b[4]) - parseFloat(a[4]));
  if (potentialDuplicateResults.length === 0) {
    return [["No potential duplicate rankings found."]];
  }
  return potentialDuplicateResults;
}

const groupRankings = (rankingRange: string[][]): Map<string, FuzzySet> => {
  const teamSideGroups: Map<string, FuzzySet> = new Map();
  rankingRange.forEach((rankRow) => {
    const groupKey: TeamKey = {
      team: rankRow[RankingRangeIndex.TeamNumber],
    };
    if (!teamSideGroups.has(JSON.stringify(groupKey))) {
      teamSideGroups.set(JSON.stringify(groupKey), FuzzySet());
    }
    teamSideGroups
      .get(JSON.stringify(groupKey))!
      .add(rankRow[RankingRangeIndex.CompetitorName]);
  });
  return teamSideGroups;
};

const serializedMatch = (name1: string, name2: string) => {
  return JSON.stringify([name1, name2].sort());
};
