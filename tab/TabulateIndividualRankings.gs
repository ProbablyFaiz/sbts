// Copyright (c) 2020 Faiz Surani. All rights reserved.

// Google App Script seems to share declarations between the different scripts,
// so I've prefixed these constants to avoid a crash. Revisit this.
const I_NUM_BALLOTS = 2;
const I_ROUND_INDEX = 0;
const I_JUDGE_NAME_INDEX = 1;
const I_TEAM_NUMBER_INDEX = 2;
const I_COMPETITOR_NAME_INDEX = 3;
const I_TYPE_INDEX = 5;
const I_RANK_VALUE_INDEX = 6;

const I_OUTPUT_RANK_VALUE_INDEX = 2;

// This is a really stupid hack to allow me to use tuple keys with ES6 maps.
// It is very brittle, and should be fired into the sun at earliest convenience.
// When iterating over keys, remember to deserialize the JSON back into an object.
// I would do it in the class but it's a pain in the ass to reimplement the iterator.
class TupleMap extends Map {
    get(key) {
        return super.get(JSON.stringify(key));
    }

    set(key, value) {
        return super.set(JSON.stringify(key), value);
    }

    has(key) {
        return super.has(JSON.stringify(key))
    }
}

const normalizeValue = (total, factor) => {
    return Math.round(((total * factor) + Number.EPSILON) * 100) / 100
}

const compareIndividualResults = (first, second) => {
    return second[I_OUTPUT_RANK_VALUE_INDEX] - first[I_OUTPUT_RANK_VALUE_INDEX];
}

const createIndividualResultsOutput = (competitorMap) => {
    const resultsArr = [];
    competitorMap.forEach((competitorObject, competitorKey) => {
        const competitorInfo = JSON.parse(competitorKey);
        let totalRankValue = 0;
        Object.values(competitorObject).forEach(roundRanks => {
            const normalizingFactor = I_NUM_BALLOTS / roundRanks.length;
            const roundRankValue = roundRanks.reduce((accumulator, rankValue) => accumulator + rankValue, 0);
            totalRankValue += normalizeValue(roundRankValue, normalizingFactor);
        });
        const individualResult = [competitorInfo["team"], competitorInfo["name"], totalRankValue];
        resultsArr.push(individualResult);
    });
    resultsArr.sort(compareIndividualResults);
    return resultsArr;
}

const tabulateIndividualBallot = (ballot, index, rankingType, firstRound, lastRound, competitorMap) => {
    const roundNumber = ballot[I_ROUND_INDEX];
    if (index === 0 ||
        ballot[I_TYPE_INDEX] !== rankingType ||
        ballot[I_TEAM_NUMBER_INDEX] === "" ||
        ballot[I_COMPETITOR_NAME_INDEX] === "" ||
        roundNumber < firstRound ||
        roundNumber > lastRound
    )
        return;
    const competitorKey = {
        team: ballot[I_TEAM_NUMBER_INDEX],
        name: ballot[I_COMPETITOR_NAME_INDEX]
    };
    let competitorObject;
    if (competitorMap.has(competitorKey)) {
        competitorObject = competitorMap.get(competitorKey);
    } else {
        competitorObject = {};
        competitorMap.set(competitorKey, competitorObject);
    }
    if (!(roundNumber in competitorObject)) {
        competitorObject[roundNumber] = [];
    }
    competitorObject[roundNumber].push(ballot[I_RANK_VALUE_INDEX]);
}

function TabulateIndividualBallots(ballotsRange, rankingType, startRound, endRound) {
    const firstRound = startRound ? startRound : Number.MIN_SAFE_INTEGER;
    const lastRound = endRound ? endRound : Number.MAX_SAFE_INTEGER;
    const competitorMap = new TupleMap();
    ballotsRange.forEach((ballot, index) => tabulateIndividualBallot(ballot, index, rankingType, firstRound, lastRound, competitorMap));
    return createIndividualResultsOutput(competitorMap);
}

const testArr = [
    ['round', 'judge', 'team', 'name', 'side', 'type', 'value'],
    [1, 'Faiz', 1234, 'Bob', 'Plaintiff', 'Attorney', 5],
    [1, 'Faiz', 1234, 'Dan', 'Plaintiff', 'Attorney', 4]
]
console.log(TabulateIndividualBallots(testArr, 'Attorney'))
