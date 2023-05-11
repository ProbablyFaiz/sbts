import { IContext, SSContext } from "../context/Context";
import { compactRange, flattenRange, formatPd } from "../context/Helpers";
import { getAllTeamResults } from "./TabulateTeamBallots";

const displayRoundMatchResults = (round: string, context: IContext) => {
  const roundResults = getAllTeamResults(
    [round],
    undefined,
    undefined,
    context
  );
  const seenTeams = new Set();
  const outputCells = [`${round} Round Summary`];
  for (const teamNumber of Object.keys(roundResults)) {
    const teamResult = roundResults[teamNumber];
    if (seenTeams.has(teamNumber)) {
      continue;
    }
    const opponentNumber = teamResult.pastOpponents[0];
    const opponentResult = roundResults[opponentNumber];
    seenTeams.add(teamNumber);
    seenTeams.add(opponentNumber);

    // Add a string of the form Team X (2-1) defeats Team Y (1-2)
    if (teamResult.ballotsWon > opponentResult.ballotsWon) {
      outputCells.push(
        `Team ${teamNumber} (${teamResult.ballotsWon}–${opponentResult.ballotsWon}) defeats Team ${opponentNumber} (${opponentResult.ballotsWon}–${teamResult.ballotsWon})`
      );
    } else if (teamResult.ballotsWon < opponentResult.ballotsWon) {
      outputCells.push(
        `Team ${opponentNumber} (${opponentResult.ballotsWon}–${teamResult.ballotsWon}) defeats Team ${teamNumber} (${teamResult.ballotsWon}–${opponentResult.ballotsWon})`
      );
    } else {
      const teamMargin = teamResult.pointDifferential;
      if (teamMargin > 0) {
        outputCells.push(
          `Team ${teamNumber} (${teamResult.ballotsWon}–${
            opponentResult.ballotsWon
          }, PD ${formatPd(
            teamResult.pointDifferential
          )}) ties Team ${opponentNumber} (${opponentResult.ballotsWon}–${
            teamResult.ballotsWon
          }, PD ${formatPd(opponentResult.pointDifferential)})`
        );
      } else if (teamMargin < 0) {
        outputCells.push(
          `Team ${opponentNumber} (${opponentResult.ballotsWon}–${
            teamResult.ballotsWon
          }, PD ${formatPd(
            opponentResult.pointDifferential
          )}) ties Team ${teamNumber} (${teamResult.ballotsWon}–${
            opponentResult.ballotsWon
          }, PD ${formatPd(teamResult.pointDifferential)})`
        );
      } else {
        outputCells.push(
          `Team ${teamNumber} (${teamResult.ballotsWon}–${
            opponentResult.ballotsWon
          }, PD ${formatPd(
            teamResult.pointDifferential
          )}) ties Team ${opponentNumber} (${opponentResult.ballotsWon}–${
            teamResult.ballotsWon
          }, PD ${formatPd(opponentResult.pointDifferential)})`
        );
      }
    }
  }
  return outputCells;
};

function DisplayMatchResults(roundRange: any) {
  // Displays the results of each match in each round in a table.
  const rounds = flattenRange(compactRange(roundRange));
  const context = new SSContext();

  // Get the results for each round
  return rounds.reduce((outputCells, round) => {
    return outputCells.concat(displayRoundMatchResults(round, context), [""]);
  }, [] as string[]);
}

export default DisplayMatchResults;
