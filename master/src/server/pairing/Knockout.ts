// A module that handles the administration of a bracket-style tournament.

import { SSContext } from "../context/Context";

import { flattenRange } from "../context/Helpers";
import {
  compareTeamSummaries,
  getAllTeamResults,
} from "../tab/TabulateTeamBallots";

interface Matchup {
  team1: string;
  team2: string;
}

function PairKnockoutRounds(
  seedingRounds: any,
  knockoutRounds: any,
  numberOfTeams: number
) {
  seedingRounds = flattenRange(seedingRounds);
  knockoutRounds = flattenRange(knockoutRounds);
  // For now, only support power of 2 number of teams
  if (numberOfTeams & (numberOfTeams - 1)) {
    throw new Error("Number of teams must be a power of 2");
  }
  const numberOfKnockoutRounds = Math.log2(numberOfTeams);
  if (numberOfKnockoutRounds !== knockoutRounds.length) {
    throw new Error(
      `Number of knockout rounds (${knockoutRounds.length}) does not match rounds required to declare a winner for number of teams (${numberOfTeams})`
    );
  }

  const context = new SSContext();
  const seedingResults = Object.values(
    getAllTeamResults(seedingRounds, 2, true, context)
  ).sort((a, b) => compareTeamSummaries(a, b));
  const teamsBySeed = seedingResults.map((teamResult) => teamResult.teamNumber);
  
}
