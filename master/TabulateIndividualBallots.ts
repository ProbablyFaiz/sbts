// Copyright (c) 2020 Faiz Surani. All rights reserved.
// This and TabulateTeamBallots were written when I was a very bad programmer.
// I still can't touch this code because it makes no sense.
// There are so many side effects. It is perhaps the greatest advertisement for
// functional programming ever created

type TeamRoundJudgesMap = Map<string, Set<string>>

const IndividualResultsIndices = {
    ROUND: 0,
    JUDGE_NAME: 1,
    TEAM_NUMBER: 2,
    COMPETITOR_NAME: 3,
    SIDE: 4,
    TYPE: 5,
    RANK_VALUE: 6,
    COURTROOM: 9,
    OUTPUT_RANK_VALUE: 4,
}

const normalizeValue = (total: number, factor: number): number => {
    return Math.round(((total * factor) + Number.EPSILON) * 100) / 100
}

const compareIndividualResults = (first: number[], second: number[]): number => {
    return second[IndividualResultsIndices.OUTPUT_RANK_VALUE] - first[IndividualResultsIndices.OUTPUT_RANK_VALUE];
}

const createIndividualResultsOutput = (context: IContext, competitorMap, teamRoundJudgesMap: TeamRoundJudgesMap) => {
    const resultsArr: Cell[][] = [];
    competitorMap.forEach((competitorObject, competitorKey) => {
        const competitorInfo = JSON.parse(competitorKey);
        let totalRankValue = 0;
        Object.entries(competitorObject).forEach(([roundNum, roundRanks]: [string, any[]]) => {
            const teamRoundKey = { team: competitorInfo["team"].toString(), round: roundNum.toString() };
            const numJudges = teamRoundJudgesMap.get(JSON.stringify(teamRoundKey))!.size;
            const normalizingFactor = NUM_BALLOTS / numJudges;
            const roundRankValue = roundRanks.reduce((accumulator, rankInfo) => accumulator + rankInfo.rankValue, 0);
            totalRankValue += normalizeValue(roundRankValue, normalizingFactor);
        });
        const individualResult = [
            competitorInfo["team"],
            context.teamInfo[competitorInfo["team"]].teamName,
            competitorInfo["name"],
            competitorInfo["side"],
            totalRankValue,
        ];
        resultsArr.push(individualResult);
    });
    resultsArr.sort(compareIndividualResults);
    return resultsArr;
}

const tabulateIndividualBallot = (context: IContext, ballot, index, rankingType, firstRound, lastRound, competitorMap, teamRoundJudgesMap: TeamRoundJudgesMap) => {
    const roundNumber = ballot[IndividualResultsIndices.ROUND];
    if (ballot[IndividualResultsIndices.TYPE] !== rankingType ||
        ballot[IndividualResultsIndices.TEAM_NUMBER] === "" ||
        ballot[IndividualResultsIndices.COMPETITOR_NAME].trim() === "" ||
        roundNumber < firstRound ||
        roundNumber > lastRound
    ) {
        return;
    }
    const competitorKey = {
        team: ballot[IndividualResultsIndices.TEAM_NUMBER],
        name: ballot[IndividualResultsIndices.COMPETITOR_NAME].trim(),
        side: ballot[IndividualResultsIndices.SIDE]
    };
    let competitorObject;
    if (competitorMap.has(JSON.stringify(competitorKey))) {
        competitorObject = competitorMap.get(JSON.stringify(competitorKey));
    } else {
        competitorObject = {};
        competitorMap.set(JSON.stringify(competitorKey), competitorObject);
    }
    if (!(roundNumber in competitorObject)) {
        competitorObject[roundNumber] = [];
    }
    competitorObject[roundNumber].push({
        rankValue: ballot[IndividualResultsIndices.RANK_VALUE],
        judgeName: ballot[IndividualResultsIndices.JUDGE_NAME]
    });

    const teamRoundKey = {
        team: ballot[IndividualResultsIndices.TEAM_NUMBER].toString(),
        round: roundNumber.toString(),
    }
    if (!teamRoundJudgesMap.has(JSON.stringify(teamRoundKey))) {
        teamRoundJudgesMap.set(JSON.stringify(teamRoundKey), new Set<string>());
    }
    const currJudgeSet = teamRoundJudgesMap.get(JSON.stringify(teamRoundKey));
    currJudgeSet!.add(ballot[IndividualResultsIndices.JUDGE_NAME])
}

function TABULATEINDIVIDUALBALLOTS(ballotsRange, rankingType, startRound: number, endRound: number) {
    const context = new Context();
    const firstRound = startRound ? startRound : Number.MIN_SAFE_INTEGER;
    const lastRound = endRound ? endRound : Number.MAX_SAFE_INTEGER;
    const competitorMap = new Map();
    const teamRoundJudgesMap: TeamRoundJudgesMap = new Map();
    ballotsRange.forEach((ballot: Cell[], index: number) => tabulateIndividualBallot(context, ballot, index, rankingType, firstRound, lastRound, competitorMap, teamRoundJudgesMap));
    return createIndividualResultsOutput(context, competitorMap, teamRoundJudgesMap);
}
