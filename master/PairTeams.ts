type Pairing = [string, string];
type Swap = [string, string];

function PairTeams(): SpreadsheetOutput {
    const context = new Context();
    if (Object.entries(context.teamResults).length % 2) {
        return "Pairing is not supported with an odd number of teams.";
    }
    if (roundsCompleted(context) % 2) return pairTeamsEvenRound(context);
    return pairTeamsOddRound(context);
}

const pairTeamsOddRound = (context: IContext): SpreadsheetOutput => {
    // 1 vs. 2, 3 vs. 4, 5 vs. 6 etc. Randomly decide whether 1,3,5 are P or D.
    const side1Teams = Object.entries(context.teamResults)
        .sort(([_, aSummary], [__, bSummary]) =>
            compareTeamResults(aSummary, bSummary))
        .filter((_, i) => i % 2 === 0)
        .map(([teamNumber, _]) => teamNumber);
    const side2Teams = Object.entries(context.teamResults)
        .sort(([_, aSummary], [__, bSummary]) =>
            compareTeamResults(aSummary, bSummary))
        .filter((_, i) => i % 2 === 1)
        .map(([teamNumber, _]) => teamNumber);
    const pairings = side1Teams.map((side1Team, i) => [side1Team, side2Teams[i]]);
    // TODO: Resolve conflicts.
    return pairings;
}

const pairTeamsEvenRound = (context: IContext): SpreadsheetOutput => {
    const plaintiffTeams = Object.entries(context.teamResults)
        .sort(([_, aSummary], [__, bSummary]) =>
            compareTeamResults(aSummary, bSummary))
        .filter(([_, teamSummary]) => teamSummary.timesDefense > teamSummary.timesPlaintiff)
        .map(([teamNumber, _]) => teamNumber);
    const defenseTeams = Object.entries(context.teamResults)
        .sort(([_, aSummary], [__, bSummary]) =>
            compareTeamResults(aSummary, bSummary))
        .filter(([_, teamSummary]) => teamSummary.timesDefense < teamSummary.timesPlaintiff)
        .map(([teamNumber, _]) => teamNumber);
    if (plaintiffTeams.length !== defenseTeams.length) {
        return "Unequal number of plaintiff and defense teams found. This should be impossible and the tab system can't handle this case";
    }
    const pairings = plaintiffTeams.map((plaintiffTeam, i) => [plaintiffTeam, defenseTeams[i]] as Pairing);
    const swaps: Set<string> = new Set();
    pairings.forEach(([team1, team2], i) => {
        if (!teamsConflict(context)(pairings[i])) return;
        let swapDistance = 1;
        while (teamsConflict(context)(pairings[i]) && swapDistance < pairings.length) {
            const possibleSwapIndices = [i - swapDistance, i + swapDistance];
            const swapToMake = possibleSwapIndices
                .filter(swapIndex => swapIndex >= 0 && swapIndex < pairings.length) // Filter indices outside of pairings bounds
                .map(swapIndex => [team1, pairings[swapIndex][0]] as Swap) // Create possible swaps (always swap plaintiff, for consistency)
                .filter(swap => !swaps.has(serializedSwap(swap))) // Exclude previously made swaps
                .filter(swap => !teamsConflict(context)([swap[1], team2])) // Exclude swaps that would make another conflict here
                .sort(compareSwaps(context)) // Sort possible swaps by "least difference" metric
            [0] // Select best possible swap, undefined if no swaps are possible
            if (swapToMake) { // If there is a swap that we can make, do it.
                const indexToSwap = possibleSwapIndices.find(swapIndex => pairings[swapIndex][0] === swapToMake[1]);
                pairings[i][0] = swapToMake[1];
                pairings[indexToSwap!][0] = swapToMake[0];
                swaps.add(serializedSwap(swapToMake));
            }
            else { // If there are no swaps we can make, look further out
                swapDistance += 1;
            }
        }
    })
    return pairings;
}

const compareSwaps = (context: IContext) => (swap1: Swap, swap2: Swap): number => {
    const previousTeamResults = context.teamResults[swap1[0]]; // The P team we're swapping out
    const swap1TeamResults = context.teamResults[swap1[1]];
    const swap2TeamResults = context.teamResults[swap2[1]];


    for (let key of teamSortOrder(roundsCompleted(context))) {
        const diff = Math.abs(<number> swap1TeamResults[key] - <number> previousTeamResults[key])
            - Math.abs(<number> swap2TeamResults[key] - <number> previousTeamResults[key]);
        if (diff) return diff;
    }
    return 0;
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
    return JSON.stringify(swap.sort());
}
