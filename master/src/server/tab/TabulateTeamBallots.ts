import {
  IContext,
  PAST_OPPONENTS_SEPARATOR,
  SSContext,
} from "../context/Context";
import { flattenRange } from "../context/Helpers";
import {
  ByeStrategy,
  RoundResult,
  TeamBallotResult,
  TeamSummary,
} from "../../Types";

function getRoundResult(
  ballotResults: TeamBallotResult[],
  ballotsPerMatch: number | undefined
): RoundResult {
  // If ballotsPerMatch is undefined, we don't do any normalization
  const normFactor =
    ballotsPerMatch != undefined ? ballotsPerMatch / ballotResults.length : 1;
  // We're guaranteed to have at least one ballot result, so the below line is safe
  const side = ballotResults[0].side;
  const opponentTeamNumber = ballotResults[0].opponentTeamNumber;

  // Sum up the ballots won and point differential, adjusting for the number of ballots per match
  return ballotResults.reduce(
    (acc, ballotResult) => {
      acc.ballotsWon += ballotResult.won * normFactor;
      acc.pointDifferential += ballotResult.pd * normFactor;
      return acc;
    },
    {
      ballotsWon: 0,
      pointDifferential: 0,
      side,
      opponentTeamNumber,
    } as RoundResult
  );
}

function getTeamResult(
  teamBallots: Record<string, TeamBallotResult[]>,
  ballotsPerMatch: number | undefined,
  firstPartyName: string
): TeamSummary {
  const teamResult = Object.values(teamBallots).reduce(
    (acc, roundBallots) => {
      const roundResult = getRoundResult(roundBallots, ballotsPerMatch);
      acc.ballotsWon += roundResult.ballotsWon;
      acc.pointDifferential += roundResult.pointDifferential;

      // We intentionally allow duplicate opponents here in case a team faces the same opponent multiple times
      acc.pastOpponents.push(roundResult.opponentTeamNumber);
      acc.roundsCompeted.push(roundBallots[0].round);

      if (roundResult.side === firstPartyName) {
        acc.timesPlaintiff++;
      } else {
        acc.timesDefense++;
      }

      return acc;
    },
    {
      ballotsWon: 0,
      pointDifferential: 0,
      timesPlaintiff: 0,
      timesDefense: 0,
      pastOpponents: [],
      roundsCompeted: [],
    } as TeamSummary
  );
  return teamResult;
}

function getGroupedResults(ballotResults: TeamBallotResult[]) {
  return ballotResults.reduce((acc, br) => {
    if (!(br.teamNumber in acc)) {
      acc[br.teamNumber] = {};
    }
    if (!(br.round in acc[br.teamNumber])) {
      acc[br.teamNumber][br.round] = [];
    }
    acc[br.teamNumber][br.round].push(br);
    return acc;
  }, {} as Record<string, Record<string, TeamBallotResult[]>>);
}

function getCombinedStrength(
  teamNumber: string,
  teamResults: Record<string, TeamSummary>
) {
  // Combined strength is the sum of the ballots won of the team's opponents
  return teamResults[teamNumber].pastOpponents!.reduce(
    (acc, opponentTeamNumber) => {
      return acc + teamResults[opponentTeamNumber].ballotsWon;
    },
    0
  );
}

function getMaxNumBallots(
  groupedResults: Record<string, Record<string, TeamBallotResult[]>>
) {
  return Object.values(groupedResults).reduce((max, teamBallots) => {
    return Math.max(
      max,
      Object.values(teamBallots).reduce((max, roundBallots) => {
        return Math.max(max, roundBallots.length);
      }, 1)
    );
  }, 1);
}

function getAllTeamResults(
  rounds: string[],
  ballotsPerMatch: number | undefined,
  byeStrategy: ByeStrategy | undefined,
  context: IContext
): Record<string, Required<TeamSummary>> {
  const roundSet = new Set(rounds);
  // Filter out ballots that are not in the allowed rounds
  const ballotResults = context.teamBallotResults.filter((br) =>
    roundSet.has(br.round)
  );
  // Group ballotResults by teamNumber, and within that by round
  const groupedResults = getGroupedResults(ballotResults);
  // Disabling the below line for now because we want to instead just not normalize when
  // ballotsPerMatch is undefined
  // If ballotsPerMatch is undefined, set it to the maximum number of ballots per match we find
  // ballotsPerMatch = ballotsPerMatch ?? getMaxNumBallots(groupedResults);

  const teamResults = Object.entries(groupedResults).reduce(
    (acc, [teamNumber, teamBallots]) => {
      const teamResult = getTeamResult(
        teamBallots,
        ballotsPerMatch,
        context.firstPartyName
      );
      teamResult.teamNumber = teamNumber;
      teamResult.teamName = context.teamInfo[teamNumber]?.teamName ?? "Unknown";
      teamResult.byeBust = context.teamInfo[teamNumber]?.byeBust ?? false;
      acc[teamNumber] = teamResult;
      return acc;
    },
    {} as Record<string, TeamSummary>
  );
  // Add combined strength to teamResults
  Object.values(teamResults).forEach((teamResult) => {
    teamResult.combinedStrength = getCombinedStrength(
      teamResult.teamNumber!,
      teamResults
    );
  });
  if (byeStrategy != undefined) {
    if (ballotsPerMatch == undefined) {
      throw new Error(
        "Cannot adjust for bye round without knowing the number of ballots per match"
      );
    }
    return adjustForByeRound(
      teamResults as Record<string, Required<TeamSummary>>,
      byeStrategy,
      ballotsPerMatch!
    );
  }
  return teamResults as Record<string, Required<TeamSummary>>;
}

function compareTeamSummaries(
  a: TeamSummary,
  b: TeamSummary,
  considerByeBust: boolean = false
) {
  // A positive return value means a is better than b, and vice versa for a negative return value
  // Sort order: byeBust, ballotsWon, combinedStrength, pointDifferential
  if (considerByeBust && a.byeBust !== b.byeBust) {
    // A byeBust team is always last
    return a.byeBust ? 1 : -1;
  }
  if (a.ballotsWon !== b.ballotsWon) {
    return b.ballotsWon - a.ballotsWon;
  }
  if (a.combinedStrength !== b.combinedStrength) {
    return b.combinedStrength! - a.combinedStrength!;
  }
  return b.pointDifferential - a.pointDifferential;
}

function getTeamResultsOutput(
  teamResults: Record<string, Required<TeamSummary>>
) {
  const results = Object.values(teamResults).sort((a, b) =>
    compareTeamSummaries(a, b, true)
  );
  return results.reduce(
    (acc, teamResult, i) => [
      ...acc,
      [
        // Rank is i + 1 if the team is not tied with the previous team, and the previous rank otherwise
        i === 0 || compareTeamSummaries(teamResult, results[i - 1]) !== 0
          ? i + 1
          : acc[i - 1][0],
        teamResult.teamNumber,
        teamResult.teamName,
        teamResult.ballotsWon,
        teamResult.combinedStrength,
        Math.round(teamResult.pointDifferential * 100) / 100,
        teamResult.timesPlaintiff,
        teamResult.timesDefense,
        teamResult.pastOpponents.join(PAST_OPPONENTS_SEPARATOR),
      ],
    ],
    []
  );
}

function adjustForByeRound(
  teamResults: Record<string, Required<TeamSummary>>,
  strategy: ByeStrategy,
  ballotsPerMatch: number
): Record<string, Required<TeamSummary>> {
  // Adjust for bye rounds by adjusting totals of teams with fewer than the maximum number of opponents
  const maxOpponents = Math.max(
    ...Object.values(teamResults).map(
      (teamResult) => teamResult.pastOpponents.length
    )
  );
  return Object.entries(teamResults).reduce((acc, [teamNumber, teamResult]) => {
    const newResult = { ...teamResult };
    if (teamResult.pastOpponents.length < maxOpponents) {
      const adjustmentFactor = maxOpponents / teamResult.pastOpponents.length;
      if (strategy === ByeStrategy.PROPORTIONAL) {
        // Multiply the totals by the factor of the number of opponents
        newResult.ballotsWon *= adjustmentFactor;
        newResult.combinedStrength *= adjustmentFactor;
        newResult.pointDifferential *= adjustmentFactor;
        newResult.pastOpponents = [...newResult.pastOpponents, "BYE"];
      } else if (strategy === ByeStrategy.AUTO_WIN) {
        // Give a free win to the team, and adjust CS and PD proportionally
        newResult.ballotsWon += ballotsPerMatch;
        newResult.combinedStrength *= adjustmentFactor;
        newResult.pointDifferential *= adjustmentFactor;
        newResult.pastOpponents = [...newResult.pastOpponents, "BYE"];
      }
    }
    acc[teamNumber] = newResult;
    return acc;
  }, {} as Record<string, Required<TeamSummary>>);
}

function TabulateTeamBallots(roundRange: any, ballotsPerMatch: number) {
  const context = new SSContext();
  const rounds = flattenRange(roundRange);
  let teamResults = getAllTeamResults(
    rounds,
    ballotsPerMatch,
    context.byeStrategy,
    context
  );
  const output = getTeamResultsOutput(teamResults);
  return output.length > 0 ? output : [["No results to display"]];
}

export { TabulateTeamBallots, getAllTeamResults, compareTeamSummaries };
