import {
  Cell,
  CourtroomInfo,
  RoundRobinConfig,
  SpreadsheetOutput,
  TeamInfo,
} from "../../Types";
import { SSContext } from "../context/Context";
import { SeededRandom } from "../context/Helpers";
import {
  ConflictType,
  Pairing,
  PairingMetadata,
  deepCopyPairings,
  formatSwapMetadata,
  numericalRange,
} from "./Helpers";

const BYE_TEAM_NUM = "BYE";

interface TeamRoundState {
  teamInfo: TeamInfo;
  timesPlaintiff: number;
  timesDefense: number;
  pastOpponents: string[];
}

interface TeamGrouping {
  needsPlaintiff: Set<string>;
  needsDefense: Set<string>;
  flexible: Set<string>;
}

interface RoundState {
  teamStates: Map<string, TeamRoundState>;
}

function RoundRobinPairTeamsWithCourtrooms(): SpreadsheetOutput {
  const context = new SSContext();
  const pairingsByRound = computeAllPairings(
    context.roundRobinConfig,
    context.teamInfo,
  );
  const output: Cell[][] = [];
  pairingsByRound.forEach((pairings, round) => {
    output.push(
      ...formatPairings(
        round,
        pairings,
        getCourtroomNames(context.courtroomRecords, pairings),
      ),
    );
    output.push(["", "", ""]);
  });
  return output;
}

const getCourtroomNames = (
  courtroomRecords: CourtroomInfo[],
  pairings: Pairing[],
): string[] => {
  const pairingCount = pairings.length;
  const courtroomNames = courtroomRecords.map((rec) => rec.name);
  if (courtroomNames.length < pairingCount) {
    for (let i = courtroomNames.length; i < pairingCount; i++) {
      courtroomNames.push(`Courtroom ${courtroomNames.length + 1}`);
    }
  }
  return courtroomNames;
};

function RoundRobinPairTeamsWithMetadata(): SpreadsheetOutput {
  const pairingMetadata: PairingMetadata = [];
  RoundRobinPairTeams(pairingMetadata);
  const output: string[][] = pairingMetadata
    .map((swapMetadata) => formatSwapMetadata(swapMetadata))
    .reduce((acc, formattedSwapMetadata) => [...acc, ...formattedSwapMetadata]);
  return [...output, ["All conflicts resolved, above pairings are final.", ""]];
}

function RoundRobinPairTeams(
  pairingMetadata?: PairingMetadata,
): string | Cell[][] {
  const context = new SSContext();
  const pairingsByRound = computeAllPairings(
    context.roundRobinConfig,
    context.teamInfo,
  );

  const output: Cell[][] = [];
  pairingsByRound.forEach((pairings, round) => {
    output.push(...formatPairings(round, pairings));
  });
  return output;
}

const formatPairings = (
  round: string,
  pairings: Pairing[],
  courtrooms?: string[],
): Cell[][] => {
  const output: Cell[][] = [];
  if (courtrooms === undefined) {
    output.push([`${round}:`, ""], ["Petitioner", "Respondent"]);
  } else {
    output.push(
      [`${round}:`, "", ""],
      ["Courtroom", "Petitioner", "Respondent"],
    );
  }
  pairings.forEach((pairing, i) => {
    if (courtrooms === undefined) {
      output.push([pairing[0], pairing[1]]);
    } else {
      output.push([courtrooms[i], pairing[0], pairing[1]]);
    }
  });
  return output;
};

const computeAllPairings = (
  roundRobinConfig: RoundRobinConfig,
  teamInfos: Record<string, TeamInfo>,
): Map<string, Pairing[]> => {
  const rng = new SeededRandom(`${roundRobinConfig.randomSeed}-pairings`);
  const roundPairer = getRoundPairer(roundRobinConfig, rng);
  // It is possible to have, e.g., two valid sets of round pairings that
  //  make it impossible to create a valid round 3 pairing. To be able to
  //  recover from this, we try 25 times, perturbing the initial state with
  //  randomness each time so we hopefully end up with a valid state.
  for (let i = 0; i < 25; i++) {
    try {
      let roundState = getInitialRoundState(teamInfos);
      const pairingsByRound = new Map<string, Pairing[]>();
      roundRobinConfig.prelimRounds.forEach((round) => {
        const roundPairings = roundPairer(roundState);
        pairingsByRound.set(round, roundPairings);
        roundState = getNextRoundState(roundState, roundPairings);
      });
      return pairingsByRound;
    } catch (e) {}
  }
  throw new Error("Failed to pair teams");
};

const getInitialRoundState = (
  teamInfos: Record<string, TeamInfo>,
): RoundState => {
  const teamStates = new Map<string, TeamRoundState>();
  Object.entries(teamInfos).forEach(([teamNumber, teamInfo]) => {
    teamStates.set(teamNumber, {
      teamInfo,
      timesPlaintiff: 0,
      timesDefense: 0,
      pastOpponents: [],
    });
  });
  if (teamStates.size % 2 !== 0) {
    teamStates.set(BYE_TEAM_NUM, {
      teamInfo: {
        teamNumber: BYE_TEAM_NUM,
        schoolName: "BYE",
        teamName: "BYE",
        competitorNames: [],
        byeBust: true,
        ballotListLink: "",
        emails: "",
      },
      timesPlaintiff: 0,
      timesDefense: 0,
      pastOpponents: [],
    });
  }
  return { teamStates };
};

const getTeamGroupings = (
  teamStates: Map<string, TeamRoundState>,
): TeamGrouping => {
  const needsPlaintiff: Set<string> = new Set();
  const needsDefense: Set<string> = new Set();
  const flexible: Set<string> = new Set();

  teamStates.forEach((teamState, teamNumber) => {
    if (teamState.timesPlaintiff === teamState.timesDefense) {
      flexible.add(teamState.teamInfo.teamNumber);
    } else if (teamState.timesPlaintiff > teamState.timesDefense) {
      needsDefense.add(teamNumber);
    } else {
      needsPlaintiff.add(teamNumber);
    }
  });
  return { needsPlaintiff, needsDefense, flexible };
};

const getRoundPairer =
  (roundRobinConfig: RoundRobinConfig, rng: SeededRandom) =>
  (roundState: RoundState): Pairing[] => {
    const teamGroupings = getTeamGroupings(roundState.teamStates);
    let pairings = getInitialPairings(teamGroupings, rng);
    const maxIterations = getMaxPairingIterations(roundState.teamStates.size);
    const conflictCheck = isMatchupConflict(roundState, roundRobinConfig);
    const pairingStepper = getPairingStepper(teamGroupings, conflictCheck);
    for (let i = 0; i < maxIterations; i++) {
      if (!anyConflicts(pairings, conflictCheck)) {
        break;
      }
      pairings = pairingStepper(pairings);
    }

    if (anyConflicts(pairings, conflictCheck)) {
      throw new Error(
        `Failed to resolve conflicts after ${maxIterations} iterations`,
      );
    }
    return pairings;
  };

const getMaxPairingIterations = (numTeams: number): number => {
  return numTeams * 2;
};

const anyConflicts = (
  pairings: Pairing[],
  conflictCheck: (pairing: Pairing) => ConflictType,
): boolean => {
  return pairings.some((pairing) => {
    const conflict = conflictCheck(pairing);
    return conflict !== ConflictType.None;
  });
};

const getInitialPairings = (
  teamGroupings: TeamGrouping,
  rng: SeededRandom,
): Pairing[] => {
  const plaintiffs = Array.from(teamGroupings.needsPlaintiff);
  const defenses = Array.from(teamGroupings.needsDefense);
  const flexible = Array.from(teamGroupings.flexible);

  const gap = Math.abs(plaintiffs.length - defenses.length);
  if (gap > flexible.length) {
    throw new Error(`Not enough flexible teams to pair ${gap} more teams`);
  }
  if (gap % 2 !== flexible.length % 2) {
    throw new Error(
      `Gap is ${gap} and flexible is ${flexible.length}, which are not both even or both odd`,
    );
  }

  flexible.sort(() => rng.nextFloat() - 0.5);

  while (flexible.length > 0) {
    const nextTeam = flexible.pop();
    if (plaintiffs.length > defenses.length) {
      defenses.push(nextTeam);
    } else {
      plaintiffs.push(nextTeam);
    }
  }
  plaintiffs.sort(() => rng.nextFloat() - 0.5);
  defenses.sort(() => rng.nextFloat() - 0.5);
  const pairings = numericalRange(0, plaintiffs.length).map(
    (i) => [plaintiffs[i], defenses[i]] as Pairing,
  );
  return pairings;
};

const getPairingStepper =
  (
    teamGroupings: TeamGrouping,
    conflictCheck: (pairing: Pairing) => ConflictType,
  ) =>
  (pairings: Pairing[]): Pairing[] => {
    const swapper = getPairingSwapper(teamGroupings, conflictCheck);
    const threeWaySwapper = getThreeWaySwapper(teamGroupings, conflictCheck);

    const newPairings = deepCopyPairings(pairings);
    let anyUnresolvedConflicts = false;
    for (let i = 0; i < newPairings.length; i++) {
      const currPairing = newPairings[i];
      const conflict = conflictCheck(currPairing);
      if (conflict === ConflictType.None) {
        continue;
      }
      let resolvedConflict = false;
      for (let j = 0; j < newPairings.length; j++) {
        if (i === j) {
          continue;
        }
        const swappedPairings = swapper(currPairing, newPairings[j]);
        if (swappedPairings) {
          newPairings[i] = swappedPairings[0];
          newPairings[j] = swappedPairings[1];
          resolvedConflict = true;
          break;
        }
      }
      if (!resolvedConflict) {
        anyUnresolvedConflicts = true;
      }
    }

    if (!anyUnresolvedConflicts) {
      return newPairings;
    }

    for (let i = 0; i < newPairings.length; i++) {
      const currPairing = newPairings[i];
      const conflict = conflictCheck(currPairing);
      if (conflict === ConflictType.None) {
        continue;
      }
      let resolvedConflict = false;
      for (let j = 0; j < newPairings.length; j++) {
        for (let k = 0; k < newPairings.length; k++) {
          if (i === j || i === k || j === k) {
            continue;
          }
          const threeWaySwap = threeWaySwapper(
            newPairings[i],
            newPairings[j],
            newPairings[k],
          );
          if (threeWaySwap) {
            newPairings[i] = threeWaySwap[0];
            newPairings[j] = threeWaySwap[1];
            newPairings[k] = threeWaySwap[2];
            resolvedConflict = true;
            break;
          }
        }
        if (resolvedConflict) {
          break;
        }
      }
    }

    return newPairings;
  };

const getPairingSwapper =
  (
    teamGroupings: TeamGrouping,
    conflictCheck: (pairing: Pairing) => ConflictType,
  ) =>
  (pairing1: Pairing, pairing2: Pairing): [Pairing, Pairing] | undefined => {
    const [team1, team2] = pairing1;
    const [team3, team4] = pairing2;

    const isFlexible = (team: string) => teamGroupings.flexible.has(team);

    if (
      conflictCheck([team1, team4]) === ConflictType.None &&
      conflictCheck([team3, team2]) === ConflictType.None
    ) {
      return [
        [team1, team4],
        [team3, team2],
      ];
    }

    if (
      isFlexible(team1) &&
      isFlexible(team4) &&
      conflictCheck([team4, team2]) === ConflictType.None &&
      conflictCheck([team3, team1]) === ConflictType.None
    ) {
      return [
        [team4, team2],
        [team3, team1],
      ];
    }

    if (
      isFlexible(team2) &&
      isFlexible(team3) &&
      conflictCheck([team1, team3]) === ConflictType.None &&
      conflictCheck([team2, team4]) === ConflictType.None
    ) {
      return [
        [team1, team3],
        [team2, team4],
      ];
    }

    return undefined;
  };

const getThreeWaySwapper =
  (
    teamGroupings: TeamGrouping,
    conflictCheck: (pairing: Pairing) => ConflictType,
  ) =>
  (
    pairing1: Pairing,
    pairing2: Pairing,
    pairing3: Pairing,
  ): [Pairing, Pairing, Pairing] | undefined => {
    const [team1, team2] = pairing1;
    const [team3, team4] = pairing2;
    const [team5, team6] = pairing3;

    // Swap 1 for 3, 3 for 5, 5 for 1
    if (
      conflictCheck([team5, team2]) === ConflictType.None &&
      conflictCheck([team1, team4]) === ConflictType.None &&
      conflictCheck([team3, team6]) === ConflictType.None
    ) {
      return [
        [team5, team2],
        [team1, team4],
        [team3, team6],
      ];
    }

    if (
      conflictCheck([team3, team2]) === ConflictType.None &&
      conflictCheck([team5, team4]) === ConflictType.None &&
      conflictCheck([team1, team6]) === ConflictType.None
    ) {
      return [
        [team3, team2],
        [team5, team4],
        [team1, team6],
      ];
    }

    // For now, let's leave aside the prospect of 3-way flexible swaps,
    //  that just seems like a mess to implement.

    return undefined;
  };

const getNextRoundState = (
  roundState: RoundState,
  newPairings: Pairing[],
): RoundState => {
  const newTeamStates = new Map<string, TeamRoundState>();
  roundState.teamStates.forEach((teamState) => {
    newTeamStates.set(
      teamState.teamInfo.teamNumber,
      JSON.parse(JSON.stringify(teamState)),
    );
  });
  newPairings.forEach((pairing) => {
    const [team1, team2] = pairing;
    const team1State = newTeamStates.get(team1);
    const team2State = newTeamStates.get(team2);
    team1State.pastOpponents.push(team2);
    team2State.pastOpponents.push(team1);
    team1State.timesPlaintiff += 1;
    team2State.timesDefense += 1;
  });
  return { teamStates: newTeamStates };
};

const isMatchupConflict =
  (roundState: RoundState, roundRobinConfig: RoundRobinConfig) =>
  (pairing: Pairing): ConflictType => {
    const [team1, team2] = pairing;
    const team1State = roundState.teamStates.get(team1);
    const team2State = roundState.teamStates.get(team2);
    if (
      team1State.teamInfo.schoolName === team2State.teamInfo.schoolName &&
      !roundRobinConfig.allowSameSchool
    ) {
      return ConflictType.SameSchool;
    }
    if (team1State.pastOpponents.includes(team2)) {
      return ConflictType.AlreadyFaced;
    }
    return ConflictType.None;
  };

export {
  RoundRobinPairTeamsWithCourtrooms,
  RoundRobinPairTeamsWithMetadata,
  RoundRobinPairTeams,
  computeAllPairings,
  getInitialRoundState,
  getTeamGroupings,
  getRoundPairer,
  getInitialPairings,
  getPairingStepper as getNextPairings,
  getPairingSwapper,
  getNextRoundState,
  isMatchupConflict,
  RoundState,
  TeamRoundState,
  TeamGrouping,
};
