type Pairing = [team1: string, team2: string];
type Swap = [team1: string, team2: string];

type PairingMetadata = SwapMetadata[];

type SwapMetadata = {
    pairingSnapshot: Pairing[];
    swapMade: Swap;
    conflictResolved: Pairing;
    swapReason: ConflictType;
} | {
    pairingSnapshot: Pairing[];
    swapMade: undefined;
    conflictResolved: undefined;
    swapReason: undefined;
}

enum ConflictType {
    None = 0,
    SameSchool = "same school",
    AlreadyFaced = "already faced",
}

// TODO: Implement the courtroom stuff that'll let this work
/*
function PairTeamsWithCourtrooms(): SpreadsheetOutput {
    const context = new Context();
    if (Object.entries(context.teamResults).length % 2) {
        return "Error: Pairing is not supported with an odd number of teams.";
    }
    let pairings = (roundsCompleted(context) % 2 ? pairTeamsEvenRound : pairTeamsOddRound)(context)
    if (typeof pairings === "string") return pairings;
    pairings.sort(_ => Math.random() - 0.5); // Shuffle the pairings to avoid leaking standings information
    // pairings.map(pairing => [...pairing, cont])
}
*/

function PairTeamsWithMetadata(): SpreadsheetOutput {
    const pairingMetadata: PairingMetadata = [];
    PairTeams(pairingMetadata);
    const output: string[][] = pairingMetadata
        .map((swapMetadata) => formatSwapMetadata(swapMetadata))
        .reduce((acc, formattedSwapMetadata) => [...acc, ...formattedSwapMetadata]);
    output.push(["All conflicts resolved, above pairings are final.", ""]);
    return output;
}

function PairTeams(pairingMetadata?: PairingMetadata): SpreadsheetOutput {
    const context = new Context();
    if (Object.entries(context.teamResults).length % 2) {
        return "Error: Pairing is not supported with an odd number of teams.";
    }
    const pairingFunction = context.roundsCompleted % 2 ? pairTeamsEvenRound : pairTeamsOddRound;
    return pairingFunction(context, pairingMetadata)
}

const pairTeamsOddRound = (context: IContext, pairingMetadata?: PairingMetadata): Cell[][] | string => {
    // Snake: 1 vs. 2, 4 vs. 3, 5 vs. 6 etc. Randomly decide whether 1,4,5 are P or D.
    const sortedTeams = sortedTeamResults(context);
    const side1Teams = sortedTeams
        .filter((_, i) => [0, 3].includes(i % 4))
        .map(([teamNumber, _]) => teamNumber);
    const side2Teams = sortedTeams
        .filter((_, i) => [1, 2].includes(i % 4))
        .map(([teamNumber, _]) => teamNumber);
    const pairings: Pairing[] = side1Teams.map((side1Team, i) => [side1Team, side2Teams[i]]);
    if (pairingMetadata) {
        pairingMetadata.push({
            pairingSnapshot: deepCopyPairings(pairings),
            swapMade: undefined,
            conflictResolved: undefined,
            swapReason: undefined,
        })
    }

    const swaps: Set<string> = new Set();
    let iterations = 0;
    // Keep resolving conflicts until there are none left or we're just in an irreconcilable situation.
    // Typically this should only take 1 or 2 iterations though to deal with all conflicts.
    const pairingConflicts = teamsConflict(context);
    while (pairings.some(pairingConflicts) && iterations < pairings.length) {
        pairings.forEach(([team1, team2], i) => {
            const conflictType = pairingConflicts(pairings[i]);
            if (!conflictType) return;
            let possibleSwapIndexPairs: [number, number][];
            if (i % 2 === 0) { // Then the closest ranked neighbor will be above and below, respectively
                possibleSwapIndexPairs = [[i - 1, 0], [i + 1, 1]];
            } else { // Closest ranked neighbor is below and above, respectively
                possibleSwapIndexPairs = [[i + 1, 0], [i - 1, 1]];
            }
            const swapToMake: Swap | undefined = possibleSwapIndexPairs
                .filter(([x, y]) => x >= 0 && x < pairings.length) // Filter indices outside of pairing bounds
                .map(([x, y]) => [pairings[i][y], pairings[x][y]] as Swap)
                .filter(swap => !swaps.has(serializedSwap(swap))) // Exclude previously made swaps
                .filter(swap => !pairingConflicts(postSwapPairing(pairings[i])(swap)))
                .sort(compareSwaps(context)) // Sort possible swaps by "least difference" metric
                [0]; // Select best possible swap, undefined if no swaps are possible.
            if (swapToMake) {
                const [indexToSwap, positionToSwap] = possibleSwapIndexPairs.find(([x, y]) => pairings[x][y] === swapToMake[1])!;
                pairings[i][positionToSwap] = swapToMake[1];
                pairings[indexToSwap][positionToSwap] = swapToMake[0];
                swaps.add(serializedSwap(swapToMake));
                if (pairingMetadata) {
                    pairingMetadata.push({
                        swapMade: swapToMake,
                        conflictResolved: [team1, team2],
                        pairingSnapshot: deepCopyPairings(pairings),
                        swapReason: conflictType,
                    })
                }
            }
        });
        iterations += 1;
    }
    if (pairings.some(pairingConflicts)) {
        return "Failed to iteratively resolve conflicts. Either the system has a bug or the conflicts are irreconcilable.";
    }
    return pairings;
}

const pairTeamsEvenRound = (context: IContext, pairingMetadata?: PairingMetadata): Cell[][] | string => {
    const sortedTeams = sortedTeamResults(context);
    const plaintiffTeams = sortedTeams
        .filter(([_, teamSummary]) => teamSummary.timesDefense > teamSummary.timesPlaintiff)
        .map(([teamNumber, _]) => teamNumber);
    const defenseTeams = sortedTeams
        .filter(([_, teamSummary]) => teamSummary.timesDefense < teamSummary.timesPlaintiff)
        .map(([teamNumber, _]) => teamNumber);
    if (plaintiffTeams.length !== defenseTeams.length) {
        return "Unequal number of plaintiff and defense teams found. This should be impossible and the tab system can't handle this case";
    }
    const pairings: Pairing[] = plaintiffTeams.map((plaintiffTeam, i) => [plaintiffTeam, defenseTeams[i]]);
    if (pairingMetadata) {
        pairingMetadata.push({
            pairingSnapshot: deepCopyPairings(pairings),
            swapMade: undefined,
            conflictResolved: undefined,
            swapReason: undefined,
        })
    }

    const swaps: Set<string> = new Set();
    let iterations = 0;
    // Keep resolving conflicts until there are none left or we're just in an irreconcilable situation.
    // Typically this should only take 1 or 2 iterations though to deal with all conflicts.
    const conflictFunction = teamsConflict(context); // Curried function
    while (pairings.some(conflictFunction) && iterations < pairings.length) {
        pairings.forEach(([team1, team2], i) => {
            const conflictType = conflictFunction(pairings[i]);
            if (!conflictType) return;
            let swapDistance = 1;
            while (conflictFunction(pairings[i]) && swapDistance < pairings.length) {
                const possibleSwapIndices = [i - swapDistance, i + swapDistance];
                const swapToMake: Swap | undefined = possibleSwapIndices
                    .filter(swapIndex => swapIndex >= 0 && swapIndex < pairings.length) // Filter indices outside of pairings bounds
                    .map(swapIndex => [team1, pairings[swapIndex][0]] as Swap) // Create possible swaps (always swap plaintiff, for consistency)
                    .filter(swap => !swaps.has(serializedSwap(swap))) // Exclude previously made swaps
                    .filter(swap => !conflictFunction(postSwapPairing(pairings[i])(swap)))
                    .sort(compareSwaps(context)) // Sort possible swaps by "least difference" metric
                    [0] // Select best possible swap, undefined if no swaps are possible
                if (swapToMake) { // If there is a swap that we can make, do it.
                    const indexToSwap = possibleSwapIndices.find(swapIndex => pairings[swapIndex][0] === swapToMake[1])!;
                    pairings[i][0] = swapToMake[1];
                    pairings[indexToSwap][0] = swapToMake[0];
                    swaps.add(serializedSwap(swapToMake));
                    if (pairingMetadata) {
                        pairingMetadata.push({
                            swapMade: swapToMake,
                            conflictResolved: [team1, team2],
                            pairingSnapshot: deepCopyPairings(pairings),
                            swapReason: conflictType,
                        })
                    }
                } else { // If there are no swaps we can make, look further out
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
}

const sortedTeamResults = (context: IContext): [string, TeamSummary][] => {
    return Object.entries(context.teamResults)
        .sort(([_, aSummary], [__, bSummary]) =>
            compareTeamResults(aSummary, bSummary))
}

const compareSwaps = (context: IContext) => (swap1: Swap, swap2: Swap): number => {
    const swap1OldTeamResults = context.teamResults[swap1[0]];
    const swap2OldTeamResults = context.teamResults[swap2[0]];
    const swap1TeamResults = context.teamResults[swap1[1]];
    const swap2TeamResults = context.teamResults[swap2[1]];


    for (let key of teamSortOrder(context.roundsCompleted)) {
        const diff = Math.abs(<number>swap1TeamResults[key] - <number>swap1OldTeamResults[key])
            - Math.abs(<number>swap2TeamResults[key] - <number>swap2OldTeamResults[key]);
        if (diff) return diff;
    }
    return 0;
}

const postSwapPairing = (pairing: Pairing) => (swap: Swap): Pairing => {
    if (pairing[0] === swap[0]) return [swap[1], pairing[1]];
    return [pairing[0], swap[1]];
}

const teamsConflict = (context: IContext) => (pairing: Pairing): ConflictType => {
    if (context.teamInfo[pairing[0]].schoolName === context.teamInfo[pairing[1]].schoolName) return ConflictType.SameSchool;
    if (context.teamResults[pairing[0]].pastOpponents?.includes(pairing[1]) ?? false) return ConflictType.AlreadyFaced;
    return ConflictType.None;
}

const serializedSwap = (swap: Swap): string => {
    return JSON.stringify(Array.from(swap).sort()); // We copy the swap array to avoid modifying it with the sort.
}

const deepCopyPairings = (pairings: Pairing[]): Pairing[] => {
    return pairings.map(pairing => [...pairing]);
}

const formatSwapMetadata = (swapMetadata: SwapMetadata): [string, string][] => {
    const {swapMade, conflictResolved, swapReason, pairingSnapshot} = swapMetadata;
    const headerText = conflictResolved == undefined ?
        "Initial pairings, before conflict resolution:" :
        `Swapping teams ${swapMade![0]} and ${swapMade![1]} to resolve impermissible matchup ${conflictResolved[0]} v. ${conflictResolved[1]} (${swapReason}):`;
    return [
        [headerText, ""],
        ...pairingSnapshot.map((pairing) => {
            return [
                swapMade?.includes(pairing[0]) ? `>> ${pairing[0]}` : pairing[0],
                swapMade?.includes(pairing[1]) ? `>> ${pairing[1]}` : pairing[1],
            ] as Pairing;
        }),
        ["", ""]
    ];
}
