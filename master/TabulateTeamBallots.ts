// Copyright (c) 2020 Faiz Surani. All rights reserved.

enum TeamResultsIndex {
    Round = 0,
    JudgeName = 1,
    TeamNumber = 2,
    OpponentNumber = 3,
    Side = 4,
    PD = 5,
    Won = 6,
}

enum TeamResultsOutputIndex {
    BallotsWon = 2,
    PD = 4,
    CS = 3,
}

const normalizeTotal = (total, factor) => {
    return Math.round(((total * factor) + Number.EPSILON) * 100) / 100
}

const tabulateBallot = (ballot, resultsContainer) => {
    const teamNumber = ballot[TeamResultsIndex.TeamNumber];
    if (!(teamNumber in resultsContainer)) {
        resultsContainer[teamNumber] = {};
    }
    const roundNumber = ballot[TeamResultsIndex.Round];
    if (!(roundNumber in resultsContainer[teamNumber])) {
        resultsContainer[teamNumber][roundNumber] = {
            opponent: ballot[TeamResultsIndex.OpponentNumber],
            side: ballot[TeamResultsIndex.Side],
            ballots: []
        }
    }
    resultsContainer[teamNumber][roundNumber].ballots.push({
        judgeName: ballot[TeamResultsIndex.JudgeName],
        pointDifferential: ballot[TeamResultsIndex.PD],
        ballotResult: ballot[TeamResultsIndex.Won]
    });
}

const tabulateRound = (roundResults) => {
    const normalizingFactor = NUM_BALLOTS / roundResults.ballots.length;
    let ballotsWon = 0;
    let pointDifferential = 0;
    roundResults.ballots.forEach(b => {
        ballotsWon += b.ballotResult;
        pointDifferential += b.pointDifferential;
    });
    ballotsWon = normalizeTotal(ballotsWon, normalizingFactor);
    pointDifferential = normalizeTotal(pointDifferential, normalizingFactor);
    const wasPlaintiff = roundResults.side !== 'Defense';
    return {
        ballotsWon,
        pointDifferential,
        wasPlaintiff
    };
}

const TEAM_SORT_ORDER = [
    TeamResultsOutputIndex.BallotsWon,
    TeamResultsOutputIndex.CS,
    TeamResultsOutputIndex.PD,
];
const compareTeamResults = (first, second) => {
    for (let currentSortIndex of TEAM_SORT_ORDER) {
        let difference = second[currentSortIndex] - first[currentSortIndex];
        if (difference !== 0) {
            return difference;
        }
    }
    return 0;
}

const createTeamResultsOutput = (context: Context, teamSummaryResults: Record<string, any>, fullTeamResults) => {
    const outputCells = [];
    Object.entries(teamSummaryResults).forEach(([teamNumber, teamSummary]) => {
        let combinedStrength = 0;
        let teamRounds = Object.values(fullTeamResults[teamNumber]) as any[];
        const opponents = teamRounds.map(roundResult => roundResult.opponent);
        opponents.forEach(oppTeamNumber => combinedStrength += teamSummaryResults[oppTeamNumber].ballotsWon);
        teamSummary.combinedStrength = combinedStrength;

        // Order is team #, ballots won, PD, CS, times plaintiff, times defense
        outputCells.push([
            teamNumber,
            context.teamNameMap[teamNumber],
            teamSummary.ballotsWon,
            teamSummary.combinedStrength,
            teamSummary.pointDifferential,
            teamSummary.timesPlaintiff,
            teamSummary.timesDefense
        ]);
    });
    outputCells.sort(compareTeamResults)
    return outputCells;
}

function TABULATETEAMBALLOTS(ballotsRange, startRound, endRound) {
    const context = new Context();
    let fullTeamResults = {};
    const firstRound = startRound ?? Number.NEGATIVE_INFINITY;
    const lastRound = endRound ?? Number.POSITIVE_INFINITY;
    ballotsRange.forEach((ballot, i) => {
        if (ballot[TeamResultsIndex.Round] === '' ||
            ballot[TeamResultsIndex.Round] < firstRound ||
            ballot[TeamResultsIndex.Round] > lastRound) {  // Skip first row, blank rows, and rounds past limit
            return;
        }
        tabulateBallot(ballot, fullTeamResults)
    });

    const teamSummaryResults = {};
    Object.entries(fullTeamResults).forEach(([teamNumber, teamResults]) => {
        let totalBallotsWon = 0;
        let totalPointDifferential = 0;
        let timesPlaintiff = 0;
        let timesDefense = 0;
        Object.values(teamResults).forEach((roundResults) => {
            const {ballotsWon, pointDifferential, wasPlaintiff} = tabulateRound(roundResults);
            totalBallotsWon += ballotsWon;
            totalPointDifferential += pointDifferential;
            if (wasPlaintiff) {
                timesPlaintiff += 1;
            } else {
                timesDefense += 1;
            }
        });
        teamSummaryResults[teamNumber] = {
            ballotsWon: totalBallotsWon,
            pointDifferential: totalPointDifferential,
            timesPlaintiff,
            timesDefense
        }
    });
    return createTeamResultsOutput(context, teamSummaryResults, fullTeamResults);
}
