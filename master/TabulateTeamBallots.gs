// Copyright (c) 2020 Faiz Surani. All rights reserved.

const TeamResultsIndices = {
    ROUND: 0,
    JUDGE_NAME: 1,
    TEAM_NUMBER: 2,
    OPPONENT_NUMBER: 3,
    SIDE: 4,
    PD: 5,
    WON: 6,
    OUTPUT_BALLOTS_WON: 1,
    OUTPUT_PD: 2,
}

const normalizeTotal = (total, factor) => {
    return Math.round(((total * factor) + Number.EPSILON) * 100) / 100
}

const tabulateBallot = (ballot, resultsContainer) => {
    const teamNumber = ballot[TeamResultsIndices.TEAM_NUMBER];
    if (!(teamNumber in resultsContainer)) {
        resultsContainer[teamNumber] = {};
    }
    const roundNumber = ballot[TeamResultsIndices.ROUND];
    if (!(roundNumber in resultsContainer[teamNumber])) {
        resultsContainer[teamNumber][roundNumber] = {
            opponent: ballot[TeamResultsIndices.OPPONENT_NUMBER],
            side: ballot[TeamResultsIndices.SIDE],
            ballots: []
        }
    }
    resultsContainer[teamNumber][roundNumber].ballots.push({
        judgeName: ballot[TeamResultsIndices.JUDGE_NAME],
        pointDifferential: ballot[TeamResultsIndices.PD],
        ballotResult: ballot[TeamResultsIndices.WON]
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
    const wasPlaintiff = roundResults.side === 'Plaintiff'
    return {
        ballotsWon,
        pointDifferential,
        wasPlaintiff
    };
}

const compareTeamResults = (first, second) => {
    // First, compare by ballots won
    if (second[TeamResultsIndices.OUTPUT_BALLOTS_WON] - first[TeamResultsIndices.OUTPUT_BALLOTS_WON] !== 0) {
        return second[TeamResultsIndices.OUTPUT_BALLOTS_WON] - first[TeamResultsIndices.OUTPUT_BALLOTS_WON];
    }
    // Then, by PD
    else if (second[TeamResultsIndices.OUTPUT_PD] - first[TeamResultsIndices.OUTPUT_PD] !== 0) {
        return second[TeamResultsIndices.OUTPUT_PD] - first[TeamResultsIndices.OUTPUT_PD];
    }
    // If both are the same, it's a tie
    return 0;
}

const createTeamResultsOutput = (teamSummaryResults, fullTeamResults) => {
    const outputCells = [];
    Object.entries(teamSummaryResults).forEach(([teamNumber, teamSummary]) => {
        let combinedStrength = 0;
        let teamRounds = Object.values(fullTeamResults[teamNumber]);
        const opponents = teamRounds.map(roundResult => roundResult.opponent);
        opponents.forEach(oppTeamNumber => combinedStrength += teamSummaryResults[oppTeamNumber].ballotsWon);
        teamSummary.combinedStrength = combinedStrength;

        // Order is team #, ballots won, PD, CS, times plaintiff, times defense
        outputCells.push([
            teamNumber,
            teamSummary.ballotsWon,
            teamSummary.pointDifferential,
            teamSummary.combinedStrength,
            teamSummary.timesPlaintiff,
            teamSummary.timesDefense
        ]);
    });
    outputCells.sort(compareTeamResults)
    return outputCells;
}

function TABULATETEAMBALLOTS(ballotsRange, startRound, endRound) {
    let fullTeamResults = {};
    const firstRound = startRound ? startRound : Number.MIN_SAFE_INTEGER;
    const lastRound = endRound ? endRound : Number.MAX_SAFE_INTEGER;
    ballotsRange.forEach((ballot, i) => {
        if (ballot[TeamResultsIndices.ROUND] === '' ||
            ballot[TeamResultsIndices.ROUND] < firstRound ||
            ballot[TeamResultsIndices.ROUND] > lastRound)  // Skip first row, blank rows, and rounds past limit
            return;
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
    return createTeamResultsOutput(teamSummaryResults, fullTeamResults);
}
