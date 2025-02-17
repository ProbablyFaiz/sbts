import { ByeStrategy, TeamSummary } from "../../Types";
import { IContext, SSContext } from "../context/Context";
import { compactRange, flattenRange } from "../context/Helpers";
import { compareTeamSummaries, getAllTeamResults } from "./TabulateTeamBallots";

function getRoundSummaryRows(round: string, context: IContext) {
  const roundResults = getAllTeamResults([round], 2, undefined, context);
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

function PrintTeamSummary(prelimRoundRange: any, knockoutRoundRange: any) {
  const context = new SSContext();

  let prelimRounds: string[] = flattenRange(
    compactRange(prelimRoundRange || []),
  );
  let knockoutRounds: string[] = flattenRange(
    compactRange(knockoutRoundRange || []),
  );

  if (!prelimRounds.length) {
    prelimRounds = context.prelimRounds;
  }
  if (!knockoutRounds.length) {
    knockoutRounds = context.knockoutRounds;
  }

  const allRounds = prelimRounds.concat(knockoutRounds);
  const getLatestRound = (teamResult: TeamSummary) => {
    // Iterate over the rounds in reverse order to find the latest round
    for (let i = allRounds.length - 1; i >= 0; i--) {
      if (teamResult.roundsCompeted.includes(allRounds[i])) {
        return allRounds[i];
      }
    }
  };

  const fullResults = Object.values(
    getAllTeamResults(prelimRounds, 2, context.byeStrategy, context),
  );
  const competedInKnockout = new Set();
  const knockoutResults = getAllTeamResults(
    knockoutRounds,
    2,
    ByeStrategy.NO_ADJUSTMENT,
    context,
  );
  // add all the knockout results to the prelim results for the respective teams
  Object.values(fullResults).forEach((teamResult) => {
    const knockoutResult = knockoutResults[teamResult.teamNumber];
    if (knockoutResult) {
      // We intentionally don't add the combined strength here, as CS isn't
      //  super well-defined once you start mixing prelim and knockout rounds
      teamResult.roundsCompeted.push(...knockoutResult.roundsCompeted);
      teamResult.pastOpponents.push(...knockoutResult.pastOpponents);
      teamResult.ballotsWon += knockoutResult.ballotsWon;
      teamResult.pointDifferential += knockoutResult.pointDifferential;
      teamResult.timesPlaintiff += knockoutResult.timesPlaintiff;
      teamResult.timesDefense += knockoutResult.timesDefense;
      competedInKnockout.add(teamResult.teamNumber);
    }
  });

  // Sort the team results by the latest round they competed in, and then
  // by ballots won
  fullResults.sort((a, b) => {
    // First, if the team competed in knockout, they should be at the top
    const aInKnockout = competedInKnockout.has(a.teamNumber);
    const bInKnockout = competedInKnockout.has(b.teamNumber);
    if (aInKnockout !== bInKnockout) {
      return aInKnockout ? -1 : 1;
    } else if (!aInKnockout && !bInKnockout) {
      // if neither team is in knockout, use the classic sorting
      return compareTeamSummaries(a, b);
    } else {
      // If both teams are in knockout, sort by the latest round they competed in,
      //  and then the classic sorting
      const aLatestRound = getLatestRound(a);
      const bLatestRound = getLatestRound(b);

      if (aLatestRound !== bLatestRound) {
        return allRounds.indexOf(aLatestRound) > allRounds.indexOf(bLatestRound)
          ? -1
          : 1;
      } else {
        // If they competed in the same round, check if they competed against each other
        //  If they did, tiebreak on H2H result. If not, use classic sorting
        const latestRoundResults = getAllTeamResults(
          [aLatestRound],
          2,
          undefined,
          context,
        );
        if (
          latestRoundResults[a.teamNumber].pastOpponents.includes(b.teamNumber)
        ) {
          // a and b did compete, use the winner as the better team
          return compareTeamSummaries(
            latestRoundResults[a.teamNumber],
            latestRoundResults[b.teamNumber],
          );
        } else {
          // They did not compete against each other in the latest round
          return compareTeamSummaries(a, b);
        }
      }
    }
  });

  const teamInfo = context.teamInfo;
  const output = fullResults.reduce((outputCells, teamResult, i) => {
    const team = teamInfo[teamResult.teamNumber];
    outputCells.push([
      i + 1,
      teamResult.teamNumber,
      team.schoolName,
      team.competitorNames.length >= 2 ? team.competitorNames[0] : "",
      team.competitorNames.length >= 2 ? team.competitorNames[1] : "",
      team.emails,
      competedInKnockout.has(teamResult.teamNumber)
        ? getLatestRound(teamResult)
        : "Prelim",
      teamResult.ballotsWon,
      teamResult.combinedStrength,
    ]);
    return outputCells;
  }, [] as any[][]);
  if (output.length === 0) {
    output.push(["No results found."]);
  }
  if (
    Array.from(allRounds).sort().join(", ") !==
    context.roundNames.sort().join(", ")
  ) {
    output.push(
      ["WARNING: Not all rounds with results are being displayed."],
      [
        "Make sure all rounds are specified on either the Prelim Results or Knockout Results sheets.",
      ],
      ["Included rounds: " + allRounds.join(", ")],
      ["All rounds found: " + context.roundNames.join(", ")],
    );
  }
  return output;
}

export { PrintMatchupSummary, PrintTeamSummary };
