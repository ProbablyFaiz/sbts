enum RankingRangeIndex {
    TeamNumber = 0,
    CompetitorName = 2,
    Side = 3,
}

interface TeamSideKey {
    team: string;
    side: string;
}

function DetectNameTypos(rankingRange: string[][]): string[][] {
    const groupedNames = groupRankings(rankingRange);
    const potentialDuplicateResults: string[][] = [];
    groupedNames.forEach((nameSet, groupKey) => {
        const groupKeyObject: TeamSideKey = JSON.parse(groupKey);
        nameSet.values().forEach(name => {
            const nameSearchResults = nameSet.get(name);
            if (nameSearchResults.length > 1) {
                nameSearchResults.filter(result => result[1] !== name).forEach(potentialDuplicate => {
                    potentialDuplicateResults.push([
                        groupKeyObject.team,
                        groupKeyObject.side,
                        name,
                        potentialDuplicate[1],
                        potentialDuplicate[0].toFixed(3), // strength of match
                    ]);
                });
            }
        });
    });
    potentialDuplicateResults.sort((a, b) => parseFloat(a[4]) - parseFloat(b[4]));
    return potentialDuplicateResults;
}

const groupRankings = (rankingRange: string[][]): Map<any, FuzzySet> => {
    const teamSideGroups: Map<object, FuzzySet> = new TupleMap();
    rankingRange.forEach(rankRow => {
        const groupKey: TeamSideKey = {
            team: rankRow[RankingRangeIndex.TeamNumber],
            side: rankRow[RankingRangeIndex.Side],
        }
        if (!teamSideGroups.has(groupKey)) {
            teamSideGroups.set(groupKey, FuzzySet());
        }
        teamSideGroups.get(groupKey).add(rankRow[RankingRangeIndex.CompetitorName]);
    });
    return teamSideGroups;
}