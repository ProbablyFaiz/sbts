import { IContext, SSContext } from "../context/Context";
import { flattenRange } from "../context/Helpers";
import { getAllTeamResults } from "./TabulateTeamBallots";

function getRoundSummaryRows(round: string, context: IContext) {
  const roundResults = getAllTeamResults([round], 2, context);
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
    outputCells.push(
      [
        round,
        pTeam.teamNumber,
        dTeam.teamNumber,
        pTeam.ballotsWon,
        dTeam.ballotsWon,
      ]
    )
  }
  return outputCells;
}

function PrintTabSummary(roundRange: any) {
  let rounds: string[];
  const context = new SSContext();
  if (!roundRange) {
    rounds = Array.from(context.roundNames);
  } else {
    rounds = flattenRange(roundRange);
  }

  return rounds.reduce((outputCells, round) => {
    return outputCells.concat(getRoundSummaryRows(round, context));
  }, [] as string[]);
}

export default PrintTabSummary;
