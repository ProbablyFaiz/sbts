type Pairing = [team1: string, team2: string];
type Swap = [team1: string, team2: string];

function PairTeams(): SpreadsheetOutput {
    const context = new Context();
    if (Object.entries(context.teamResults).length % 2) {
        return "Pairing is not supported with an odd number of teams.";
    }
    if (roundsCompleted(context) % 2) return pairTeamsEvenRound(context);
    return pairTeamsOddRound(context);
}

const pairTeamsOddRound = (context: IContext): SpreadsheetOutput => {
    // Snake: 1 vs. 2, 4 vs. 3, 5 vs. 6 etc. Randomly decide whether 1,4,5 are P or D.
    const sortedTeams = sortedTeamResults(context);
    const side1Teams = sortedTeams
        .filter((_, i) => [0, 3].includes(i % 4))
        .map(([teamNumber, _]) => teamNumber);
    const side2Teams = sortedTeams
        .filter((_, i) => [1, 2].includes(i % 4))
        .map(([teamNumber, _]) => teamNumber);
    const pairings: Pairing[] = side1Teams.map((side1Team, i) => [side1Team, side2Teams[i]]);
    const swaps: Set<string> = new Set();
    let iterations = 0;
    // Keep resolving conflicts until there are none left or we're just in an irreconcilable situation.
    // Typically this should only take 1 or 2 iterations though to deal with all conflicts.
    const pairingConflicts = teamsConflict(context);
    while (pairings.some(pairingConflicts) && iterations < pairings.length) {
        pairings.forEach((currentPairing, i) => {
            if (!pairingConflicts(currentPairing)) return;
            let possibleSwapIndices: [number, number][];
            if (i % 2 === 0) { // Then the closest ranked neighbor will be above and below, respectively
                possibleSwapIndices = [[i - 1, 0], [i + 1, 1]];
            } else { // Closest ranked neighbor is below and above, respectively
                possibleSwapIndices = [[i + 1, 0], [i - 1, 0]];
            }
            const swapToMake: Swap | undefined = possibleSwapIndices
                .filter(([x, y]) => x >= 0 && x < pairings.length) // Filter indices outside of pairing bounds
                .map(([x, y]) => [currentPairing[y], pairings[x][y]] as Swap)
                .filter(swap => !swaps.has(serializedSwap(swap))) // Exclude previously made swaps
                .filter(swap => !pairingConflicts(postSwapPairing(currentPairing)(swap)))
                .sort(compareSwaps(context)) // Sort possible swaps by "least difference" metric
                [0]; // Select best possible swap, undefined if no swaps are possible.
            if (swapToMake) {
                const [indexToSwap, positionToSwap] = possibleSwapIndices.find(([x, y]) => pairings[x][y] === swapToMake[1])!;
                currentPairing[positionToSwap] = swapToMake[1];
                pairings[indexToSwap][positionToSwap] = swapToMake[0];
                swaps.add(serializedSwap(swapToMake));
            }
        });
        iterations += 1;
    }
    if (pairings.some(pairingConflicts)) {
        return "Failed to iteratively resolve conflicts. Either the system has a bug or the conflicts are irreconcilable.";
    }
    return pairings;
}

const pairTeamsEvenRound = (context: IContext): SpreadsheetOutput => {
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
    const swaps: Set<string> = new Set();
    let iterations = 0;
    // Keep resolving conflicts until there are none left or we're just in an irreconcilable situation.
    // Typically this should only take 1 or 2 iterations though to deal with all conflicts.
    const conflictFunction = teamsConflict(context); // Curried function
    while (pairings.some(conflictFunction) && iterations < pairings.length) {
        pairings.forEach(([team1, team2], i) => {
            if (!conflictFunction(pairings[i])) return;
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


    for (let key of teamSortOrder(roundsCompleted(context))) {
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

const roundsCompleted = (context: IContext): number => {
    const topTeam = Object.values(context.teamResults)[0];
    return topTeam.timesDefense + topTeam.timesPlaintiff;
}

const teamsConflict = (context: IContext) => (pairing: Pairing): boolean => {
    const sameSchool = context.teamInfo[pairing[0]].schoolName === context.teamInfo[pairing[1]].schoolName;
    const alreadyFaced = context.teamResults[pairing[0]].pastOpponents?.includes(pairing[1]) ?? false;
    return sameSchool || alreadyFaced;
}


const serializedSwap = (swap: Swap): string => {
    return JSON.stringify(Array.from(swap).sort()); // We copy the swap array to avoid modifying it with the sort.
}

const positionForRank = (rank: number): [x: number, y: number] => {
    const x = Math.floor(rank / 2);
    let y: number;
    if (x % 2 === 0) {
        y = rank % 2;
    } else {
        y = 2 - rank % 2;
    }
    return [x, y];
}

const rankForPosition = (x: number, y: number): number => {
    if (x % 2 === 0) {
        return x * 2 + y;
    } else {
        return x * 2 + 1 - y;
    }
}
