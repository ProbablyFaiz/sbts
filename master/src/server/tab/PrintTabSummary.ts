import { IContext, SSContext } from "../context/Context";
import { flattenRange } from "../context/Helpers";
import { getAllTeamResults } from "./TabulateTeamBallots";
import { TeamSummary } from "../../Types";

function getRoundSummaryRows(round: string, context: IContext) {
  const roundResults = getAllTeamResults([round], 2, false, context);
  const seenTeams = new Set();
  const outputCells = [];
  for (const teamNumber of Object.keys(roundResults)) {
    const teamResult = roundResults[teamNumber];
    if (seenTeams.has(teamNumber)) {
      continue;
    }
    const opponentNumber = teamResult.pastOpponents[0];
    const opponentResult = roundResults[opponentNumber];
    seenTeams.add(teamNumber);
    seenTeams.add(opponentNumber);
    const pTeam = teamResult.timesPlaintiff > 0 ? teamResult : opponentResult;
    const dTeam = teamResult.timesPlaintiff > 0 ? opponentResult : teamResult;
    outputCells.push([
      round,
      pTeam.teamNumber,
      dTeam.teamNumber,
      pTeam.ballotsWon,
      dTeam.ballotsWon,
    ]);
  }
  return outputCells;
}

function PrintMatchupSummary(roundRange: any) {
  let rounds: string[];
  const context = new SSContext();
  if (!roundRange) {
    rounds = Array.from(context.roundNames);
  } else {
    rounds = flattenRange(roundRange);
  }

  const output = rounds.reduce((outputCells, round) => {
    return outputCells.concat(getRoundSummaryRows(round, context));
  }, [] as any[][]);
  if (output.length === 0) {
    output.push(["No results found."]);
  }
  return output;
}

function PrintTeamSummary(roundRange: any) {
  let rounds: string[];
  const context = new SSContext();
  if (!roundRange) {
    rounds = Array.from(context.roundNames);
  } else {
    rounds = flattenRange(roundRange);
  }

  const getLastRound = (team: Required<TeamSummary>) =>
    team.roundsCompeted.reduce(
      (latest, curr) =>
        rounds.indexOf(curr) > rounds.indexOf(latest) ? curr : latest,
      undefined
    );

  const teamResults = Object.values(getAllTeamResults(rounds, 2, false, context));
  // Sort the team results by the latest round they competed in, and then
  // by ballots won
  teamResults.sort((a, b) => {
    const aLastRound = rounds.indexOf(getLastRound(a));
    const bLastRound = rounds.indexOf(getLastRound(b));
    if (aLastRound !== bLastRound) {
      return bLastRound - aLastRound;
    }
    if (a.ballotsWon !== b.ballotsWon) {
      return b.ballotsWon - a.ballotsWon;
    }
    return b.combinedStrength - a.combinedStrength;
  });

  const teamInfo = context.teamInfo;
  const output = teamResults.reduce((outputCells, teamResult, i) => {
    const team = teamInfo[teamResult.teamNumber];
    outputCells.push([
      i + 1,
      teamResult.teamNumber,
      team.schoolName,
      team.competitorNames.length >= 2 ? team.competitorNames[0] : "",
      team.competitorNames.length >= 2 ? team.competitorNames[1] : "",
      team.emails,
      getLastRound(teamResult),
      teamResult.ballotsWon,
      teamResult.combinedStrength,
    ]);
    return outputCells;
  }, [] as any[][]);
  if (output.length === 0) {
    output.push(["No results found."]);
  }
  return output;
}

export { PrintMatchupSummary, PrintTeamSummary };
