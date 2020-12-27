// Copyright (c) 2020 Faiz Surani. All rights reserved.

const NUM_BALLOTS = 2;
const ROUND_INDEX = 0;
const JUDGE_NAME_INDEX = 1;
const TEAM_NUMBER_INDEX = 2;
const OPPONENT_NUMBER_INDEX = 3;
const SIDE_INDEX = 4;
const PD_INDEX = 5;
const WON_INDEX = 6;

const OUTPUT_BALLOTS_WON_INDEX = 1;
const OUTPUT_PD_INDEX = 2;

const normalizeTotal = (total, factor) => {
    return Math.round(((total * factor) + Number.EPSILON) * 100) / 100
}

const tabulateBallot = (ballot, resultsContainer) => {
    const teamNumber = ballot[TEAM_NUMBER_INDEX];
    if (!(teamNumber in resultsContainer)) {
        resultsContainer[teamNumber] = {};
    }
    const roundNumber = ballot[ROUND_INDEX];
    if (!(roundNumber in resultsContainer[teamNumber])) {
        resultsContainer[teamNumber][roundNumber] = {
            opponent: ballot[OPPONENT_NUMBER_INDEX],
            side: ballot[SIDE_INDEX],
            ballots: []
        }
    }
    resultsContainer[teamNumber][roundNumber].ballots.push({
        judgeName: ballot[JUDGE_NAME_INDEX],
        pointDifferential: ballot[PD_INDEX],
        ballotResult: ballot[WON_INDEX]
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
    if (second[OUTPUT_BALLOTS_WON_INDEX] - first[OUTPUT_BALLOTS_WON_INDEX] !== 0) {
        return second[OUTPUT_BALLOTS_WON_INDEX] - first[OUTPUT_BALLOTS_WON_INDEX];
    }
    // Then, by PD
    else if (second[OUTPUT_PD_INDEX] - first[OUTPUT_PD_INDEX] !== 0) {
        return second[OUTPUT_PD_INDEX] - first[OUTPUT_PD_INDEX];
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

function TabulateTeamBallots(ballotsRange, startRound, endRound) {
    let fullTeamResults = {};
    const firstRound = startRound ? startRound : Number.MIN_SAFE_INTEGER;
    const lastRound = endRound ? endRound : Number.MAX_SAFE_INTEGER;
    ballotsRange.forEach((ballot, i) => {
        if (i === 0 ||
            ballot[ROUND_INDEX] === '' ||
            ballot[ROUND_INDEX] < firstRound ||
            ballot[ROUND_INDEX] > lastRound)  // Skip first row, blank rows, and rounds past limit
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

let ballots = [
    ['Round #', 'Judge Name', 'Team #', 'Opposing #', 'Side', 'PD', 'Won'],
    [1, 'Bob', 1234, 5678, 'Plaintiff', 7, 1],
    [1, 'Bob', 5678, 1234, 'Plaintiff', -7, 0]
]
console.log(TabulateTeamBallots(ballots));
