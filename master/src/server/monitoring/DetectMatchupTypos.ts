import { IContext, SSContext } from "../context/Context";
import { TeamBallotResult } from "../../Types";

const getMultipleMatchupTypos = (context: IContext) => {
  const matchupsByRoundCourtroom = {};
  const matchupTypoCandidates = [];
  context.teamBallotResults.forEach((teamBallotResult) => {
    const { round, courtroom, teamNumber, opponentTeamNumber } =
      teamBallotResult;
    if (!(round in matchupsByRoundCourtroom)) {
      matchupsByRoundCourtroom[round] = {};
    }
    const matchupKey = getMatchupKey(teamBallotResult);
    if (!(courtroom in matchupsByRoundCourtroom[round])) {
      matchupsByRoundCourtroom[round][courtroom] = teamBallotResult;
    } else {
      const otherMatchup = matchupsByRoundCourtroom[round][courtroom];
      const otherMatchupKey = getMatchupKey(otherMatchup);
      if (matchupKey !== otherMatchupKey) {
        matchupTypoCandidates.push(
          `Found two different matchups for round ${round}, courtroom ${courtroom}: ${matchupKey} (Judge ${teamBallotResult.judgeName}) and ${otherMatchupKey} (Judge ${otherMatchup.judgeName})`
        );
      }
    }
  });
  return removeDuplicates(matchupTypoCandidates);
};

const getTeamHasMultipleMatchups = (context: IContext) => {
  // Checks whether a team has multiple matchups in the same round.
  const teamMatchupsByRound = {};
  const teamHasMultipleMatchups = [];
  context.teamBallotResults.forEach((teamBallotResult) => {
    const { round, teamNumber } = teamBallotResult;
    if (!(round in teamMatchupsByRound)) {
      teamMatchupsByRound[round] = {};
    }
    if (!(teamNumber in teamMatchupsByRound[round])) {
      teamMatchupsByRound[round][teamNumber] = teamBallotResult;
    } else {
      const otherMatchup = teamMatchupsByRound[round][teamNumber];
      // if opponents are different, then we have a problem
      if (
        teamBallotResult.opponentTeamNumber !== otherMatchup.opponentTeamNumber
      ) {
        teamHasMultipleMatchups.push(
          `Team ${teamNumber} has multiple matchups in round ${round}: ${getMatchupKey(
            teamBallotResult
          )} (Judge ${teamBallotResult.judgeName}) and ${getMatchupKey(
            otherMatchup
          )} (Judge ${otherMatchup.judgeName})`
        );
      }
    }
  });
  return removeDuplicates(teamHasMultipleMatchups);
};

const getTeamFacingItself = (context: IContext) => {
  const teamFacingItself = [];
  context.teamBallotResults.forEach((teamBallotResult) => {
    const { teamNumber, opponentTeamNumber } = teamBallotResult;
    if (teamNumber === opponentTeamNumber) {
      teamFacingItself.push(
        `Team ${teamNumber} is facing itself in round ${teamBallotResult.round}, courtroom ${teamBallotResult.courtroom} (Judge ${teamBallotResult.judgeName})`
      );
    }
  });
  return removeDuplicates(teamFacingItself);
};

function DetectMatchupTypos() {
  const context = new SSContext();
  const output = [
    "Multiple matchups in the same round/courtroom:",
    ...getMultipleMatchupTypos(context),
    "",
    "Teams with multiple matchups in the same round:",
    ...getTeamHasMultipleMatchups(context),
    "",
    "Teams facing themselves:",
    ...getTeamFacingItself(context),
  ];
  return output;
}

const getMatchupKey = (teamBallotResult: TeamBallotResult) => {
  const orderedTeamNumbers = [
    teamBallotResult.teamNumber,
    teamBallotResult.opponentTeamNumber,
  ].sort();
  return `${orderedTeamNumbers[0]} vs. ${orderedTeamNumbers[1]}`;
};

const removeDuplicates = (arr: string[]) => Array.from(new Set(arr));

export { DetectMatchupTypos };
