const getCompetitorKey = (teamNumber: string, competitor: string) => JSON.stringify([teamNumber, competitor]);

const getAllIndividualResults = (rounds: string[]): Record<string, IndividualSummary> => {
    const context = new Context();
    const roundSet = new Set(rounds);
    const individualBallots = context.individualBallotResults
        .filter(ballot => roundSet.has(ballot.round));

    // TODO: This is extremely wrong!!!
    //  We need to group within each competitor by round, then average the average scores from each round
    const individualResults = individualBallots.reduce((acc, ballot) => {
        const key = getCompetitorKey(ballot.teamNumber, ballot.competitorName);
        if (!(key in acc)) {
            acc[key] = {
                teamNumber: ballot.teamNumber,
                competitorName: ballot.competitorName,
                score: 0,
                judgeScores: [],
            };
        }
        acc[key].judgeScores!.push(ballot.score);
        return acc;
    }, {} as Record<string, IndividualSummary>);

    // Calculate the average score
    Object.values(individualResults).forEach(result => {
        result.score = result.judgeScores!.reduce((acc, score) => acc + score, 0) / result.judgeScores!.length;
    });

    return individualResults;
}

const getIndividualResultsOutput = (individualResults: Record<string, IndividualSummary>) => {
    return Object.values(individualResults).map(result => [
        result.teamNumber,
        result.competitorName,
        result.score,
    ]);
}

function TabulateIndividualRedux(roundRange: any) {
    const rounds = flattenRange(roundRange);
    const individualResults = getAllIndividualResults(rounds);
    const output = getIndividualResultsOutput(individualResults);
    return output.length > 0 ? output : [["No results to display"]];
}
