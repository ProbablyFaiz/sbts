interface TeamSummary {
    teamNumber?: string;
    teamName?: string;
    byeBust?: boolean;
    
    ballotsWon: number;
    pointDifferential: number;
    combinedStrength?: number;
    pastOpponents?: string[];
    timesPlaintiff: number;
    timesDefense: number;
}

interface RoundResult {
    ballotsWon: number;
    pointDifferential: number;
    side: string;
    opponentTeamNumber: string;
}

const PAST_OPPONENTS_SEPARATOR = ", ";

function getRoundResult(ballotResults: BallotResult[], ballotsPerMatch: number): RoundResult {
    const normFactor = ballotsPerMatch / ballotResults.length;
    // We're guaranteed to have at least one ballot result, so the below line is safe
    const side = ballotResults[0].side;
    const opponentTeamNumber = ballotResults[0].opponentTeamNumber;
    
    // Sum up the ballots won and point differential, adjusting for the number of ballots per match
    return ballotResults.reduce((acc, ballotResult) => {
        acc.ballotsWon += ballotResult.won * normFactor;
        acc.pointDifferential += ballotResult.pd * normFactor;
        return acc;
    }, {ballotsWon: 0, pointDifferential: 0, side, opponentTeamNumber} as RoundResult);
}

function getTeamResult(teamBallots: Record<string, BallotResult[]>, ballotsPerMatch: number, context: IContext): TeamSummary {
    const teamResult = Object.values(teamBallots).reduce((acc, roundBallots) => {
        const roundResult = getRoundResult(roundBallots, ballotsPerMatch);
        acc.ballotsWon += roundResult.ballotsWon;
        acc.pointDifferential += roundResult.pointDifferential;

        if (acc.pastOpponents === undefined) {
            acc.pastOpponents = [];
        }
        // We intentionally allow duplicate opponents here in case a team faces the same opponent multiple times
        acc.pastOpponents.push(roundResult.opponentTeamNumber);

        if (roundResult.side === context.firstPartyName) {
            acc.timesPlaintiff++;
        } else {
            acc.timesDefense++;
        }

        return acc;
    }, {ballotsWon: 0, pointDifferential: 0, timesPlaintiff: 0, timesDefense: 0} as TeamSummary);
    return teamResult;
}

function getGroupedResults(ballotResults: BallotResult[]) {
    return ballotResults.reduce((acc, br) => {
        if (!(br.teamNumber in acc)) {
            acc[br.teamNumber] = {};
        }
        if (!(br.round in acc[br.teamNumber])) {
            acc[br.teamNumber][br.round] = []
        }
        acc[br.teamNumber][br.round].push(br);
        return acc;
    }, {} as Record<string, Record<string, BallotResult[]>>);
}

function getCombinedStrength(teamNumber: string, teamResults: Record<string, TeamSummary>) {
    // Combined strength is the sum of the ballots won of the team's opponents
    return teamResults[teamNumber].pastOpponents!.reduce((acc, opponentTeamNumber) => {
        return acc + teamResults[opponentTeamNumber].ballotsWon;
    }, 0);
}

function getAllTeamResults(rounds: string[], ballotsPerMatch: number): Record<string, Required<TeamSummary>> {
    const roundSet = new Set(rounds);
    const context = new Context();
    // Filter out ballots that are not in the allowed rounds
    const ballotResults = context.ballotResults.filter((br) => roundSet.has(br.round));
    // Group ballotResults by teamNumber, and within that by round
    const groupedResults = getGroupedResults(ballotResults);

    const teamResults = Object.entries(groupedResults).reduce((acc, [teamNumber, teamBallots]) => {
        const teamResult = getTeamResult(teamBallots, ballotsPerMatch, context);
        teamResult.teamNumber = teamNumber;
        teamResult.teamName = context.teamInfo[teamNumber]?.teamName ?? "Unknown";
        teamResult.byeBust = context.teamInfo[teamNumber]?.byeBust ?? false;
        acc[teamNumber] = teamResult;
        return acc;
    }, {} as Record<string, TeamSummary>);
    // Add combined strength to teamResults
    Object.values(teamResults).forEach((teamResult) => {
        teamResult.combinedStrength = getCombinedStrength(teamResult.teamNumber!, teamResults);
    });
    return teamResults as Record<string, Required<TeamSummary>>;
}

function getTeamResultsOutput(teamResults: Record<string, Required<TeamSummary>>) {
    const results = Object.values(teamResults);
    results.sort((a, b) => {
        // Sort order: byeBust, ballotsWon, combinedStrength, pointDifferential
        if (a.byeBust !== b.byeBust) {
            // A byeBust team is always last
            return a.byeBust ? 1 : -1;
        }
        if (a.ballotsWon !== b.ballotsWon) {
            return b.ballotsWon - a.ballotsWon;
        }
        if (a.combinedStrength !== b.combinedStrength) {
            return b.combinedStrength - a.combinedStrength;
        }
        return b.pointDifferential - a.pointDifferential;
    });
    return results.map((teamResult, i) => [
        i + 1,
        teamResult.teamNumber,
        teamResult.teamName,
        teamResult.ballotsWon,
        teamResult.combinedStrength,
        teamResult.pointDifferential,
        teamResult.timesPlaintiff,
        teamResult.timesDefense,
        teamResult.pastOpponents.join(PAST_OPPONENTS_SEPARATOR)
    ]);
}

function flattenRoundRange(roundRange: (string | string[] | string[][])): string[] {
    // Flatten a round range into a list of rounds
    if (typeof roundRange === "string") {
        return [roundRange];
    }
    if (Array.isArray(roundRange[0])) {
        return (roundRange as string[][]).reduce((acc, row) => {
            return acc.concat(row);
        }, [] as string[]);
    }
    return roundRange as string[];
}

function TabulateTeamBallots(roundRange: any, ballotsPerMatch: number) {
    const rounds = flattenRoundRange(roundRange);
    const teamResults = getAllTeamResults(rounds, ballotsPerMatch);
    return getTeamResultsOutput(teamResults);
}
