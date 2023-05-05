import {
  Cell,
  SpreadsheetOutput,
  SwissConfig,
  TeamInfo,
  TeamSummary,
} from "../../Types";
import { BYE_BUST_SCHOOL_NAME, SSContext } from "../context/Context";
import {
  compareTeamSummaries,
  getAllTeamResults,
} from "../tab/TabulateTeamBallots";

type Pairing = [team1: string, team2: string];
type Swap = [team1: string, team2: string];

type PairingMetadata = SwapMetadata[];

type SwapMetadata =
  | {
      pairingSnapshot: Pairing[];
      swapMade: Swap;
      conflictResolved: Pairing;
      swapReason: ConflictType;
    }
  | {
      pairingSnapshot: Pairing[];
      swapMade: undefined;
      conflictResolved: undefined;
      swapReason: undefined;
    };

enum ConflictType {
  None = 0,
  SameSchool = "same school",
  AlreadyFaced = "already faced",
}

function PairTeamsWithCourtrooms(): SpreadsheetOutput {
  const context = new SSContext();
  const pairings = PairTeams();
  if (typeof pairings === "string") return pairings;
  const courtrooms = context.courtroomRecords.map((rec) => rec.name);
  pairings.sort(() => Math.random() - 0.5);
  // If it's round 3, flip a coin to determine side
  if (context.roundsCompleted % 2 === 0 && Math.random() < 0.5)
    pairings.forEach((pair) => pair.reverse());
  if (courtrooms.length < pairings.length) {
    // Add fake courtrooms
    const numFakeCourtrooms = pairings.length - courtrooms.length;
    for (let i = 0; i < numFakeCourtrooms; i++) {
      courtrooms.push(`Courtroom ${courtrooms.length + 1}`);
    }
  }
  return pairings.map((pair, i) => [courtrooms[i], ...pair]);
}

function PairTeamsWithMetadata(): SpreadsheetOutput {
  const pairingMetadata: PairingMetadata = [];
  PairTeams(pairingMetadata);
  const output: string[][] = pairingMetadata
    .map((swapMetadata) => formatSwapMetadata(swapMetadata))
    .reduce((acc, formattedSwapMetadata) => [...acc, ...formattedSwapMetadata]);
  return [...output, ["All conflicts resolved, above pairings are final.", ""]];
}

function PairTeams(pairingMetadata?: PairingMetadata): string | Cell[][] {
  const context = new SSContext();
  if (Object.entries(context.teamResults).length % 2) {
    return "Error: Pairing is not supported with an odd number of teams.";
  }
  const pairingFunction =
    context.swissConfig.previousRounds.length % 2
      ? pairTeamsEvenRound
      : pairTeamsOddRound;
  let teamResults: Record<string, TeamSummary> = getAllTeamResults(
    context.swissConfig.previousRounds,
    1,
    context.byeStrategy,
    context
  );
  const teamInfo = context.teamInfo;
  // If there are no teams in the results, this is the first round.
  // We need to initialize the team results with the team info.
  if (Object.keys(teamResults).length === 0) {
    teamResults = createTeamResults(teamInfo);
  }
  // Inject a fake BYE team if there is an odd number of teams.
  //  This is a dumb and hacky thing to do, but is probably better
  //  than futzing with all this intricate pairing logic.
  if (Object.keys(teamResults).length % 2) {
    teamResults["BYE"] = createByeTeamSummary(teamResults);
    teamInfo["BYE"] = createByeTeamInfo();
  }
  return pairingFunction(
    context.teamInfo,
    teamResults,
    context.swissConfig,
    pairingMetadata
  );
}

const pairTeamsOddRound = (
  teamInfo: Record<string, TeamInfo>,
  teamResults: Record<string, TeamSummary>,
  swissConfig: SwissConfig,
  pairingMetadata?: PairingMetadata
): Cell[][] | string => {
  // Snake: 1 vs. 2, 4 vs. 3, 5 vs. 6 etc. Randomly decide whether 1,4,5 are P or D.
  const sortedTeams = sortedTeamResults(teamResults);
  const side1Teams = sortedTeams
    .filter((_, i) => [0, 3].includes(i % 4))
    .map(([teamNumber, _]) => teamNumber);
  const side2Teams = sortedTeams
    .filter((_, i) => [1, 2].includes(i % 4))
    .map(([teamNumber, _]) => teamNumber);
  const pairings: Pairing[] = side1Teams.map((side1Team, i) => [
    side1Team,
    side2Teams[i],
  ]);
  if (pairingMetadata) {
    pairingMetadata.push({
      pairingSnapshot: deepCopyPairings(pairings),
      swapMade: undefined,
      conflictResolved: undefined,
      swapReason: undefined,
    });
  }

  const swaps: Set<string> = new Set();
  let iterations = 0;
  // Keep resolving conflicts until there are none left or we're just in an irreconcilable situation.
  // Typically this should only take 1 or 2 iterations though to deal with all conflicts.
  const pairingConflicts = teamsConflict(teamInfo, teamResults);
  while (pairings.some(pairingConflicts) && iterations < pairings.length) {
    pairings.forEach(([team1, team2], i) => {
      const conflictType = pairingConflicts(pairings[i]);
      if (!conflictType) return;
      let possibleSwapIndexPairs: [number, number][];
      if (i % 2 === 0) {
        // Then the closest ranked neighbor will be above and below, respectively
        possibleSwapIndexPairs = [
          [i - 1, 0],
          [i + 1, 1],
        ];
      } else {
        // Closest ranked neighbor is below and above, respectively
        possibleSwapIndexPairs = [
          [i + 1, 0],
          [i - 1, 1],
        ];
      }
      // Filter indices outside of pairing bounds
      possibleSwapIndexPairs = possibleSwapIndexPairs.filter(
        ([x, _]) => x >= 0 && x < pairings.length
      );
      const swapToMake: Swap | undefined = possibleSwapIndexPairs
        .map(([x, y]) => [pairings[i][y], pairings[x][y]] as Swap)
        .filter((swap) => !swaps.has(swapKey(swap))) // Exclude previously made swaps
        .filter((swap) => !pairingConflicts(postSwapPairing(pairings[i])(swap)))
        .sort(compareSwaps(teamResults))[0]; // Sort possible swaps by "least difference" metric // Select best possible swap, undefined if no swaps are possible.
      if (swapToMake) {
        const [indexToSwap, positionToSwap] = possibleSwapIndexPairs.find(
          ([x, y]) => pairings[x][y] === swapToMake[1]
        )!;
        pairings[i][positionToSwap] = swapToMake[1];
        pairings[indexToSwap][positionToSwap] = swapToMake[0];
        swaps.add(swapKey(swapToMake));
        if (pairingMetadata) {
          pairingMetadata.push({
            swapMade: swapToMake,
            conflictResolved: [team1, team2],
            pairingSnapshot: deepCopyPairings(pairings),
            swapReason: conflictType,
          });
        }
      }
    });
    iterations += 1;
  }
  if (pairings.some(pairingConflicts)) {
    return "Failed to iteratively resolve conflicts. Either the system has a bug or the conflicts are irreconcilable.";
  }
  return pairings;
};

const pairTeamsEvenRound = (
  teamInfo: Record<string, TeamInfo>,
  teamResults: Record<string, TeamSummary>,
  swissConfig: SwissConfig,
  pairingMetadata?: PairingMetadata
): Cell[][] | string => {
  const sortedTeams = sortedTeamResults(teamResults);
  const plaintiffTeams = sortedTeams
    .filter(
      ([_, teamSummary]) =>
        teamSummary.timesDefense > teamSummary.timesPlaintiff
    )
    .map(([teamNumber, _]) => teamNumber);
  const defenseTeams = sortedTeams
    .filter(
      ([_, teamSummary]) =>
        teamSummary.timesDefense < teamSummary.timesPlaintiff
    )
    .map(([teamNumber, _]) => teamNumber);
  if (plaintiffTeams.length !== defenseTeams.length) {
    return "Unequal number of plaintiff and defense teams found. This should be impossible and the tab system can't handle this case";
  }
  const pairings: Pairing[] = plaintiffTeams.map((plaintiffTeam, i) => [
    plaintiffTeam,
    defenseTeams[i],
  ]);
  if (pairingMetadata) {
    pairingMetadata.push({
      pairingSnapshot: deepCopyPairings(pairings),
      swapMade: undefined,
      conflictResolved: undefined,
      swapReason: undefined,
    });
  }

  const swaps: Set<string> = new Set();
  let iterations = 0;
  // Keep resolving conflicts until there are none left or we're just in an irreconcilable situation.
  // Typically this should only take 1 or 2 iterations though to deal with all conflicts.
  const conflictFunction = teamsConflict(teamInfo, teamResults);
  while (pairings.some(conflictFunction) && iterations < pairings.length) {
    pairings.forEach(([team1, team2], i) => {
      const conflictType = conflictFunction(pairings[i]);
      if (!conflictType) return;
      let swapDistance = 1;
      while (conflictFunction(pairings[i]) && swapDistance < pairings.length) {
        let possibleSwapIndices = [i - swapDistance, i + swapDistance];
        // Filter indices outside of pairings bounds
        possibleSwapIndices = possibleSwapIndices.filter(
          (swapIndex) => swapIndex >= 0 && swapIndex < pairings.length
        );
        const swapToMake: Swap | undefined = possibleSwapIndices
          .map((swapIndex) => [team1, pairings[swapIndex][0]] as Swap) // Create possible swaps (always swap plaintiff, for consistency)
          .filter((swap) => !swaps.has(swapKey(swap))) // Exclude previously made swaps
          .filter(
            (swap) => !conflictFunction(postSwapPairing(pairings[i])(swap))
          )
          .sort(compareSwaps(teamResults))[0]; // Sort possible swaps by "least difference" metric // Select best possible swap, undefined if no swaps are possible
        if (swapToMake) {
          // If there is a swap that we can make, do it.
          const indexToSwap = possibleSwapIndices.find(
            (swapIndex) => pairings[swapIndex][0] === swapToMake[1]
          )!;
          pairings[i][0] = swapToMake[1];
          pairings[indexToSwap][0] = swapToMake[0];
          swaps.add(swapKey(swapToMake));
          if (pairingMetadata) {
            pairingMetadata.push({
              swapMade: swapToMake,
              conflictResolved: [team1, team2],
              pairingSnapshot: deepCopyPairings(pairings),
              swapReason: conflictType,
            });
          }
        } else {
          // If there are no swaps we can make, look further out
          swapDistance += 1;
        }
      }
    });
    iterations += 1;
  }
  if (pairings.some(conflictFunction)) {
    return "Failed to iteratively resolve conflicts. Either the system has a bug or the conflicts are irreconcilable.";
  }
  return pairings;
};

const sortedTeamResults = (
  teamResults: Record<string, TeamSummary>
): [string, TeamSummary][] => {
  return Object.entries(teamResults).sort(([_, aSummary], [__, bSummary]) =>
    compareTeamSummaries(aSummary, bSummary)
  );
};

const compareSwaps =
  (teamResults: Record<string, TeamSummary>) =>
  (swap1: Swap, swap2: Swap): number => {
    const swap1OldTeamResults = teamResults[swap1[0]];
    const swap2OldTeamResults = teamResults[swap2[0]];
    const swap1TeamResults = teamResults[swap1[1]];
    const swap2TeamResults = teamResults[swap2[1]];

    const sortKeys: (keyof TeamSummary)[] = [
      "ballotsWon",
      "combinedStrength",
      "pointDifferential",
    ];
    for (let key of sortKeys) {
      const diff =
        Math.abs(
          <number>swap1TeamResults[key] - <number>swap1OldTeamResults[key]
        ) -
        Math.abs(
          <number>swap2TeamResults[key] - <number>swap2OldTeamResults[key]
        );
      if (diff) return diff;
    }
    return 0;
  };

const postSwapPairing =
  (pairing: Pairing) =>
  (swap: Swap): Pairing => {
    if (pairing[0] === swap[0]) return [swap[1], pairing[1]];
    return [pairing[0], swap[1]];
  };

const teamsConflict =
  (
    teamInfo: Record<string, TeamInfo>,
    teamResults: Record<string, TeamSummary>,
    swissConfig: SwissConfig | undefined = undefined
  ) =>
  (pairing: Pairing): ConflictType => {
    if (
      teamInfo[pairing[0]].schoolName === teamInfo[pairing[1]].schoolName &&
      !swissConfig?.allowSameSchool
    )
      return ConflictType.SameSchool;
    if (
      (teamResults[pairing[0]].pastOpponents?.includes(pairing[1]) ?? false) &&
      !swissConfig?.allowRepeatMatchup
    )
      return ConflictType.AlreadyFaced;
    return ConflictType.None;
  };

const swapKey = (swap: Swap): string => {
  return JSON.stringify(Array.from(swap).sort()); // We copy the swap array to avoid modifying it with the sort.
};

const deepCopyPairings = (pairings: Pairing[]): Pairing[] => {
  return pairings.map((pairing) => [...pairing]);
};

const formatSwapMetadata = (swapMetadata: SwapMetadata): [string, string][] => {
  const { swapMade, conflictResolved, swapReason, pairingSnapshot } =
    swapMetadata;
  const headerText =
    conflictResolved == undefined
      ? "Initial pairings, before conflict resolution:"
      : `Swapping teams ${swapMade![0]} and ${
          swapMade![1]
        } to resolve impermissible matchup ${conflictResolved[0]} v. ${
          conflictResolved[1]
        } (${swapReason}):`;
  return [
    [headerText, ""],
    ...pairingSnapshot.map((pairing) => {
      return [
        swapMade?.includes(pairing[0]) ? `>> ${pairing[0]}` : pairing[0],
        swapMade?.includes(pairing[1]) ? `>> ${pairing[1]}` : pairing[1],
      ] as Pairing;
    }),
    ["", ""],
  ];
};

const createTeamResults = (
  teamInfo: Record<string, TeamInfo>
): Record<string, TeamSummary> => {
  return Object.fromEntries(
    Object.entries(teamInfo).map(([teamId, teamInfo]) => {
      return [
        teamId,
        {
          teamNumber: teamInfo.teamNumber,
          ballotsWon: 0,
          combinedStrength: 0,
          pointDifferential: 0,
          timesPlaintiff: 0,
          timesDefense: 0,
          pastOpponents: [],
        },
      ];
    })
  );
};

const createByeTeamSummary = (
  teamResults: Record<string, TeamSummary>
): TeamSummary => {
  const pastOpponents = Object.keys(teamResults).filter((teamId) =>
    teamResults[teamId].pastOpponents.includes("BYE")
  );
  return {
    teamNumber: "BYE",
    byeBust: true,
    ballotsWon: 0,
    combinedStrength: 0,
    pointDifferential: 0,
    timesPlaintiff: 0,
    timesDefense: 0,
    pastOpponents,
  };
};

const createByeTeamInfo = (): TeamInfo => {
  return {
    schoolName: "BYE",
    teamNumber: "BYE",
    teamName: BYE_BUST_SCHOOL_NAME,
    byeBust: true,
    competitorNames: [],
    ballotFolderLink: "",
    emails: "",
  };
};

export { PairTeams, PairTeamsWithCourtrooms, PairTeamsWithMetadata };
