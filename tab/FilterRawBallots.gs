// Copyright (c) 2020 Faiz Surani. All rights reserved.

const TEAM_READY_INDEX = 8;
const ROWS_PER_TEAM_BALLOT = 2;
const INDIVIDUAL_READY_INDEX = 8;
const ROWS_PER_INDIVIDUAL_BALLOT = 8;

function filterBallots(ballotIngressRange, rowsPerBallot, readyIndex) {
    return ballotIngressRange.filter((ballot, index) => {
        if (index === 0)
            return false;
        const checkboxIndex = index - ((index - 1) % rowsPerBallot);
        return ballotIngressRange[checkboxIndex][readyIndex] === true;
    }).map(ballot => ballot.slice(0, -1)); // Remove ready for tab row
}

function FilterTeamBallots(ballotIngressRange) {
    return filterBallots(ballotIngressRange, ROWS_PER_TEAM_BALLOT, TEAM_READY_INDEX);
}

function FilterIndividualBallots(ballotIngressRange) {
    return filterBallots(ballotIngressRange, ROWS_PER_INDIVIDUAL_BALLOT, INDIVIDUAL_READY_INDEX);
}

const testArr = [
    [0, true],
    [1, false],
    [2, false],
    [3, true]
]
console.log(FilterTeamBallots(testArr))
