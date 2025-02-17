// [{'schoolName': 'Girls Academic Leadership Academy', 'elo': 1322.853010934047}, {'schoolName': 'San Marino High School', 'elo': 1262.2610363558697}, {'schoolName': 'North Hollywood High School', 'elo': 1247.1627229893036}, {'schoolName': 'Clark Magnet High School', 'elo': 1239.5497372820864}, {'schoolName': 'Conlin/Mowry Homeschool', 'elo': 1221.6332309277918}, {'schoolName': 'Polytechnic School', 'elo': 1190.6644471152226}, {'schoolName': 'Ideas Matter', 'elo': 1182.7435068360098}, {'schoolName': 'Hoover High School', 'elo': 1158.5405358698374}, {'schoolName': 'Stuart Hall', 'elo': 1092.2509634662824}, {'schoolName': 'Creekview High School', 'elo': 1082.34080822355}]

// interface SchoolElo {
//   schoolName: string;
//   elo: number;
// }

interface RankingHistoryEntry {
  date: Date;
  ranking: SchoolElo[];
}

function OutputRankingMatrix(rankingHistoryRange: string[][]) {
  let rankingHistory = rankingHistoryRange.map((row) => {
    return {
      date: new Date(row[0]),
      ranking: JSON.parse(row[2]),
    };
  });
  // Add a dummy entry with the date the day prior to the first entry
  rankingHistory = [
    {
      date: new Date(rankingHistory[0].date.getTime() - 24 * 60 * 60 * 1000),
      ranking: [],
    },
    ...rankingHistory,
  ];

  // We want to turn this list of rankings into a matrix of rankings
  // where school names are columns, dates are rows, and the values
  // is the elo of the school on that date.
  const schoolNames = new Set<string>();
  rankingHistory.forEach((entry) => {
    entry.ranking.forEach((schoolElo) => {
      schoolNames.add(schoolElo.schoolName);
    });
  });
  const schoolNamesArray = Array.from(schoolNames);
  // Sort the school names by their most recent elo
  schoolNamesArray.sort((a, b) => {
    const aElo = rankingHistory[rankingHistory.length - 1].ranking.find(
      (schoolElo) => schoolElo.schoolName === a,
    ).elo;
    const bElo = rankingHistory[rankingHistory.length - 1].ranking.find(
      (schoolElo) => schoolElo.schoolName === b,
    ).elo;
    return bElo - aElo;
  });
  const rankingMatrix: any[][] = rankingHistory.map((entry) => {
    const schoolEloMap = new Map<string, number>();
    entry.ranking.forEach((schoolElo) => {
      schoolEloMap.set(schoolElo.schoolName, schoolElo.elo);
    });
    return schoolNamesArray.map((schoolName) => {
      return schoolEloMap.get(schoolName);
    });
  });
  // Add the column and row headers
  rankingMatrix.unshift(schoolNamesArray);
  rankingMatrix.forEach((row, i) => {
    if (i === 0) {
      row.unshift("Date");
    } else {
      row.unshift(rankingHistory[i - 1].date);
    }
  });
  const context = new RankerContext();
  const baseElo = context.rankingConfig.startingElo;

  return rankingMatrix;
}
