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

// Potential footgun to keep in mind: this output range starts on column B because column A is just a rank incrementer.
// TODO: Refactor this slightly such that the rank value is generated by this function instead, which will also allow
//  ties to be displayed correctly.
enum TeamResultsOutputIndex {
    TeamNumber = 0,
    BallotsWon = 2,
    CS = 3,
    PD = 4,
    TimesPlaintiff = 5,
    TimesDefense = 6,
    PastOpponents = 7,
}

const PAST_OPPONENTS_SEPARATOR = ", ";

interface BallotResult {
    judgeName: string;
    ballotResult: number;
    pointDifferential: number;
}

interface RoundResult {
    ballots: BallotResult[];
    opponent: string;
    side: string;
}

interface TeamResultsContainer {
    [teamNumber: string]: { [round: string]: RoundResult }
}

interface TeamSummary {
    [key: string]: number | boolean | string[] | undefined; // So we can index it by []

    ballotsWon: number;
    pointDifferential: number;
    combinedStrength?: number;
    pastOpponents?: string[];
    timesPlaintiff: number;
    timesDefense: number;
    rankOverride?: number;
    byeBust: boolean;
}

const normalizeTotal = (total: number, factor: number): number => {
    return Math.round(((total * factor) + Number.EPSILON) * 100) / 100
}

const tabulateBallot = (ballot: Cell[], resultsContainer: TeamResultsContainer) => {
    const teamNumber = ballot[TeamResultsIndex.TeamNumber] as string;
    if (!(teamNumber in resultsContainer)) {
        resultsContainer[teamNumber] = {};
    }
    const roundNumber = ballot[TeamResultsIndex.Round] as string;
    if (!(roundNumber in resultsContainer[teamNumber])) {
        resultsContainer[teamNumber][roundNumber] = {
            opponent: ballot[TeamResultsIndex.OpponentNumber] as string,
            side: ballot[TeamResultsIndex.Side] as string,
            ballots: []
        }
    }
    resultsContainer[teamNumber][roundNumber].ballots.push({
        judgeName: ballot[TeamResultsIndex.JudgeName] as string,
        pointDifferential: ballot[TeamResultsIndex.PD] as number,
        ballotResult: ballot[TeamResultsIndex.Won] as number,
    });
}

const tabulateRound = (roundResult: RoundResult) => {
    const normalizingFactor = NUM_BALLOTS / roundResult.ballots.length;
    let ballotsWon = 0;
    let pointDifferential = 0;
    roundResult.ballots.forEach(b => {
        ballotsWon += b.ballotResult;
        pointDifferential += b.pointDifferential;
    });
    ballotsWon = normalizeTotal(ballotsWon, normalizingFactor);
    pointDifferential = normalizeTotal(pointDifferential, normalizingFactor);
    const wasPlaintiff = roundResult.side !== 'Defense';
    return {
        ballotsWon,
        pointDifferential,
        wasPlaintiff
    };
}

const TEAM_SORT_ORDER = [
    "ballotsWon",
    "combinedStrength",
    "pointDifferential",
];
const teamSortOrder = (roundsCompleted: number) => {
    if (roundsCompleted >= 2) return TEAM_SORT_ORDER; // Use CS after round 2
    return TEAM_SORT_ORDER.filter(key => key !== "combinedStrength"); // Otherwise, exclude it.
}
const compareTeamResults = (first: TeamSummary, second: TeamSummary): number => {
    const byeBustOverride = Number(first.byeBust) - Number(second.byeBust); // First - second so bye bust teams are further down
    if (byeBustOverride !== 0) return byeBustOverride;

    for (let currentSortIndex of teamSortOrder(first.timesPlaintiff + first.timesPlaintiff)) {
        if (first[currentSortIndex] == undefined || second[currentSortIndex] == undefined) continue;
        let difference = <number> second[currentSortIndex] - <number> first[currentSortIndex]; // Descending order by doing second - first
        if (difference !== 0) {
            return difference;
        }
    }
    return 0;
}

const createTeamResultsOutput = (context: IContext, teamSummaryResults: Record<string, TeamSummary>, fullTeamResults: TeamResultsContainer) => {
    return Object.entries(teamSummaryResults)
        .sort(([_, aSummary], [__, bSummary]) => compareTeamResults(aSummary, bSummary))
        .map(([teamNumber, teamSummary]) => [
            teamNumber,
            context.teamInfo[teamNumber].teamName,
            teamSummary.ballotsWon,
            teamSummary.combinedStrength,
            teamSummary.pointDifferential,
            teamSummary.timesPlaintiff,
            teamSummary.timesDefense,
            teamSummary.pastOpponents?.join(PAST_OPPONENTS_SEPARATOR)
        ]);
}

const normalizeByeRounds = (teamSummaryResults: Record<string, TeamSummary>) => {
    const maxRoundsCompeted = Object.values(teamSummaryResults)
        .reduce(
            (max, teamSummary) =>
                Math.max(max, teamSummary.timesPlaintiff + teamSummary.timesDefense),
            0
        );
    Object.values(teamSummaryResults).forEach((teamSummary) => {
        const normalizingFactor = maxRoundsCompeted / (teamSummary.timesPlaintiff + teamSummary.timesDefense);
        teamSummary.ballotsWon = normalizeTotal(teamSummary.ballotsWon, normalizingFactor);
        teamSummary.pointDifferential = normalizeTotal(teamSummary.pointDifferential, normalizingFactor);
        teamSummary.combinedStrength = normalizeTotal(teamSummary.combinedStrength!, normalizingFactor);
    });
}

function TABULATETEAMBALLOTS(ballotsRange: Cell[][], rounds: (string | number)[][]) {
    let flattenedRounds = rounds[0];
    const context = new Context();
    let fullTeamResults: TeamResultsContainer = {};
    ballotsRange.forEach((ballot) => {
        const ballotRound = ballot[TeamResultsIndex.Round];
        if (ballotRound === undefined ||
            ballotRound === '' ||
            !(flattenedRounds.includes(ballotRound))) {  // Skip first row, blank rows, and rounds past limit
            return;
        }
        tabulateBallot(ballot, fullTeamResults)
    });

    const teamSummaryResults: Record<string, TeamSummary> = {};
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
            timesDefense,
            byeBust: context.teamInfo[teamNumber].byeBust,
        }
    });
    Object.entries(teamSummaryResults).forEach(([teamNumber, teamSummary]) => {
        let teamRounds = Object.values(fullTeamResults[teamNumber]);
        teamSummary.pastOpponents = teamRounds.map(roundResult => roundResult.opponent);
        teamSummary.combinedStrength = teamSummary.pastOpponents
            .map(opponent => teamSummaryResults[opponent].ballotsWon)
            .reduce((cs, ballotsWon) => cs + ballotsWon);
    });
    normalizeByeRounds(teamSummaryResults);
    return createTeamResultsOutput(context, teamSummaryResults, fullTeamResults);
}
