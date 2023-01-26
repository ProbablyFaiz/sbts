const getCompetitorKey = (teamNumber: string, competitor: string) =>
  JSON.stringify([teamNumber, competitor]);
const parseCompetitorKey = (competitorKey: string) => {
  const [teamNumber, competitorName] = JSON.parse(competitorKey);
  return { teamNumber, competitorName };
};

const getGroupedIndividualResults = (
  individualBallots: IndividualBallotResult[]
) => {
  // Group by competitor key and within that group, group by round
  const groupedIndividualBallots = individualBallots.reduce((acc, ballot) => {
    const competitorKey = getCompetitorKey(
      ballot.teamNumber,
      ballot.competitorName
    );
    if (!(competitorKey in acc)) {
      acc[competitorKey] = {};
    }
    if (!(ballot.round in acc[competitorKey])) {
      acc[competitorKey][ballot.round] = [];
    }
    acc[competitorKey][ballot.round].push(ballot);
    return acc;
  }, {} as Record<string, Record<string, IndividualBallotResult[]>>);
  return groupedIndividualBallots;
};

const getCompetitorResult = (
  roundBallots: Record<string, IndividualBallotResult[]>
) => {
  // Get the average score for each round
  const competitorResult = Object.values(roundBallots)
    .map((singleRoundBallots) => {
      const roundScoreSum = singleRoundBallots.reduce(
        (acc, ballot) => acc + ballot.score,
        0
      );
      return roundScoreSum / singleRoundBallots.length;
    })
    .reduce(
      (acc, score) => {
        acc.totalScore += score;
        acc.numRounds++;
        return acc;
      },
      { totalScore: 0, numRounds: 0 } as {
        totalScore: number;
        numRounds: number;
      }
    );
  return competitorResult;
};

const getAllIndividualResults = (
  rounds: string[],
  context: IContext
): Record<string, IndividualSummary> => {
  const roundSet = new Set(rounds);
  const individualBallots = context.individualBallotResults.filter((ballot) =>
    roundSet.has(ballot.round)
  );

  const groupedIndividualBallots =
    getGroupedIndividualResults(individualBallots);

  const individualResults = Object.entries(groupedIndividualBallots).reduce(
    (acc, [competitorKey, roundBallots]) => {
      const competitorResult = getCompetitorResult(roundBallots);
      const { teamNumber, competitorName } = parseCompetitorKey(competitorKey);
      const individualSummary = {
        teamNumber,
        teamName: context.teamInfo[teamNumber]?.teamName,
        competitorName,
        score: competitorResult.totalScore / competitorResult.numRounds,
      };
      acc[competitorKey] = individualSummary;
      return acc;
    },
    {} as Record<string, IndividualSummary>
  );
  return individualResults;
};

const getIndividualResultsOutput = (
  individualResults: Record<string, IndividualSummary>
) => {
  const individualSummaries = Object.values(individualResults).sort(
    (a, b) => b.score - a.score
  );
  return individualSummaries.reduce(
    (acc, result, i) => [
      ...acc,
      [
        // Rank is i + 1 if individual is not tied with previous individual, otherwise rank is the same as previous individual
        i === 0 || result.score !== individualSummaries[i - 1].score
          ? i + 1
          : acc[i - 1][0],
        result.teamNumber,
        result.teamName,
        result.competitorName,
        // Round to 2 decimal places
        Math.round(result.score * 100) / 100,
      ],
    ],
    []
  );
};

function TabulateIndividualBallots(roundRange: any) {
  const rounds = flattenRange(roundRange);
  const individualResults = getAllIndividualResults(rounds, new SSContext());
  const output = getIndividualResultsOutput(individualResults);
  return output.length > 0 ? output : [["No results to display"]];
}
