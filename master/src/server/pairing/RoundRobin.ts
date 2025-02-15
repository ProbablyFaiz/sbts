import {
    Cell,
    SpreadsheetOutput,
    RoundRobinConfig,
    TeamInfo,
} from "../../Types";
import { SSContext } from "../context/Context";
import { SeededRandom } from "../context/Helpers";
import {
    ConflictType,
    deepCopyPairings,
    formatSwapMetadata,
    numericalRange,
    Pairing,
    PairingMetadata,
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

function RoundRobinPairTeamsWithMetadata(): SpreadsheetOutput {
    const pairingMetadata: PairingMetadata = [];
    RoundRobinPairTeams(pairingMetadata);
    const output: string[][] = pairingMetadata
        .map((swapMetadata) => formatSwapMetadata(swapMetadata))
        .reduce((acc, formattedSwapMetadata) => [...acc, ...formattedSwapMetadata]);
    return [...output, ["All conflicts resolved, above pairings are final.", ""]];
}

function RoundRobinPairTeams(pairingMetadata?: PairingMetadata): string | Cell[][] {
    const context = new SSContext();
    const pairingsByRound = computeAllPairings(context.roundRobinConfig, context.teamInfo);

    const output: Cell[][] = [];
    pairingsByRound.forEach((pairings, round) => {
        output.push(...formatPairings(round, pairings));
    });
    return output;
}

const formatPairings = (round: string, pairings: Pairing[]): Cell[][] => {
    const output = [[`${round}:`, ""], ["Petitioner", "Respondent"]];
    pairings.forEach((pairing) => {
        output.push([pairing[0], pairing[1]]);
    });
    output.push(["", ""]);
    return output;
}

const computeAllPairings = (roundRobinConfig: RoundRobinConfig, teamInfos: Record<string, TeamInfo>): Map<string, Pairing[]> => {
    const rng = new SeededRandom(`${roundRobinConfig.randomSeed}-pairings`);
    const roundPairer = getRoundPairer(roundRobinConfig, rng);
    let roundState = getInitialRoundState(teamInfos);
    const pairingsByRound = new Map<string, Pairing[]>();
    roundRobinConfig.prelimRounds.forEach((round) => {
        const roundPairings = roundPairer(roundState);
        pairingsByRound.set(round, roundPairings);
        updateRoundState(roundState, roundPairings);
    });
    return pairingsByRound;
}

const getInitialRoundState = (teamInfos: Record<string, TeamInfo>): RoundState => {
    const teamStates = new Map<string, TeamRoundState>();
    Object.entries(teamInfos).forEach(([teamNumber, teamInfo]) => {
        teamStates.set(teamNumber, { teamInfo, timesPlaintiff: 0, timesDefense: 0, pastOpponents: [] });
    });
    return { teamStates };
};

const getTeamGroupings = (
    teamStates: Map<string, TeamRoundState>
): TeamGrouping => {
    const needsPlaintiff: Set<string> = new Set();
    const needsDefense: Set<string> = new Set();
    const flexible: Set<string> = new Set();

    Object.entries(teamStates).forEach(([teamNumber, teamState]) => {
        if (teamState.timesPlaintiff === teamState.timesDefense) {
            flexible.add(teamNumber);
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
            let pairings = getInitialPairings(teamGroupings);
            pairings.sort(() => rng.nextFloat() - 0.5);
            const maxIterations = getMaxPairingIterations(roundState.teamStates.size);
            const conflictCheck = isMatchupConflict(roundState, roundRobinConfig);
            const pairingStepper = getNextPairings(
                teamGroupings,
                conflictCheck
            );
            for (let i = 0; i < maxIterations; i++) {
                if (!anyConflicts(pairings, conflictCheck)) {
                    break;
                }
                pairings = pairingStepper(pairings);
            }

            if (anyConflicts(pairings, conflictCheck)) {
                throw new Error(
                    `Failed to resolve conflicts after ${maxIterations} iterations`
                );
            }
            return pairings;
        };

const getMaxPairingIterations = (numTeams: number): number => {
    return numTeams * 2;
};

const anyConflicts = (
    pairings: Pairing[],
    conflictCheck: (pairing: Pairing) => ConflictType
): boolean => {
    return pairings.some((pairing) => {
        const conflict = conflictCheck(pairing);
        return conflict !== ConflictType.None;
    });
};

const getInitialPairings = (teamGroupings: TeamGrouping): Pairing[] => {
    const plaintiffs = Array.from(teamGroupings.needsPlaintiff);
    const defenses = Array.from(teamGroupings.needsDefense);
    const flexible = Array.from(teamGroupings.flexible);

    const gap = Math.abs(plaintiffs.length - defenses.length);
    if (gap > flexible.length) {
        throw new Error(`Not enough flexible teams to pair ${gap} more teams`);
    }
    if (gap % 2 !== flexible.length % 2) {
        throw new Error(
            `Gap is ${gap} and flexible is ${flexible.length}, which are not both even or both odd`
        );
    }

    while (flexible.length > 0) {
        const nextTeam = flexible.pop();
        if (plaintiffs.length > defenses.length) {
            defenses.push(nextTeam);
        } else {
            plaintiffs.push(nextTeam);
        }
    }

    const pairings = numericalRange(0, plaintiffs.length).map(
        (i) => [plaintiffs[i], defenses[i]] as Pairing
    );
    return pairings;
};

const getNextPairings =
    (
        teamGroupings: TeamGrouping,
        conflictCheck: (pairing: Pairing) => ConflictType
    ) =>
        (pairings: Pairing[]): Pairing[] => {
            const swapper = getSwappedPairings(
                teamGroupings,
                conflictCheck
            );

            const newPairings = deepCopyPairings(pairings);
            for (let i = 0; i < newPairings.length; i++) {
                const currPairing = newPairings[i];
                const conflict = conflictCheck(currPairing);
                if (conflict === ConflictType.None) {
                    continue;
                }
                for (let j = i + 1; j < newPairings.length; j++) {
                    const swappedPairings = swapper(currPairing, newPairings[j]);
                    if (swappedPairings) {
                        newPairings[i] = swappedPairings[0];
                        newPairings[j] = swappedPairings[1];
                        break;
                    }
                }
            }
            return newPairings;
        };

const getSwappedPairings =
    (
        teamGroupings: TeamGrouping,
        conflictCheck: (pairing: Pairing) => ConflictType
    ) =>
        (pairing1: Pairing, pairing2: Pairing): [Pairing, Pairing] | undefined => {
            const [team1, team2] = pairing1;
            const [team3, team4] = pairing2;

            const isFlexible = (team: string) => teamGroupings.flexible.has(team);

            if (
                conflictCheck([team1, team4]) === ConflictType.None &&
                conflictCheck([team2, team3]) === ConflictType.None
            ) {
                return [
                    [team1, team4],
                    [team2, team3],
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

const updateRoundState = (
    roundState: RoundState,
    newPairings: Pairing[]
): RoundState => {
    const newTeamStates = new Map<string, TeamRoundState>();
    roundState.teamStates.forEach((teamState) => {
        newTeamStates.set(
            teamState.teamInfo.teamNumber,
            JSON.parse(JSON.stringify(teamState))
        );
    });
    newPairings.forEach((pairing) => {
        const [team1, team2] = pairing;
        newTeamStates.get(team1)?.pastOpponents.push(team2);
        newTeamStates.get(team2)?.pastOpponents.push(team1);
    });
    return { teamStates: newTeamStates };
};

const isMatchupConflict =
    (roundState: RoundState, roundRobinConfig: RoundRobinConfig) =>
        (pairing: Pairing): ConflictType => {
            const [team1, team2] = pairing;
            const team1State = roundState.teamStates.get(team1);
            const team2State = roundState.teamStates.get(team2);
            if (team1State == undefined || team2State == undefined) {
                throw new Error(`Team ${team1} or ${team2} not found in round state`);
            }
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

export { RoundRobinPairTeamsWithMetadata, RoundRobinPairTeams };