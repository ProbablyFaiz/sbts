export type Pairing = [team1: string, team2: string];
export type Swap = [team1: string, team2: string];

export type PairingMetadata = SwapMetadata[];

export enum ConflictType {
  None = 0,
  SameSchool = "same school",
  AlreadyFaced = "already faced",
}
export type SwapMetadata =
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

export const swapKey = (swap: Swap): string => {
  return JSON.stringify(Array.from(swap).sort()); // We copy the swap array to avoid modifying it with the sort.
};

export const deepCopyPairings = (pairings: Pairing[]): Pairing[] => {
  return pairings.map((pairing) => [...pairing]);
};

export const formatSwapMetadata = (
  swapMetadata: SwapMetadata,
): [string, string][] => {
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

export const numericalRange = (
  start: number,
  stop: number,
  step: number = 1,
): number[] =>
  Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);
