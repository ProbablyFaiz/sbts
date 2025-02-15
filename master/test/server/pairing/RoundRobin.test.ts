import { TeamInfo, RoundRobinConfig } from "../../../src/Types";
import { ConflictType, Pairing } from "../../../src/server/pairing/Helpers";
import {
  getInitialRoundState,
  getTeamGroupings,
  getInitialPairings,
  getNextRoundState,
  isMatchupConflict,
  computeAllPairings,
  getRoundPairer,
} from "../../../src/server/pairing/RoundRobin";
import { SeededRandom } from "../../../src/server/context/Helpers";

const mockTeamInfos: Record<string, TeamInfo> = {
  A1: {
    teamNumber: "A1",
    teamName: "Team 1",
    schoolName: "School A",
    competitorNames: [],
    byeBust: false,
    ballotFolderLink: "",
    emails: "",
  },
  A2: {
    teamNumber: "A2",
    teamName: "Team 2",
    schoolName: "School A",
    competitorNames: [],
    byeBust: false,
    ballotFolderLink: "",
    emails: "",
  },
  B3: {
    teamNumber: "B3",
    teamName: "Team 3",
    schoolName: "School B",
    competitorNames: [],
    byeBust: false,
    ballotFolderLink: "",
    emails: "",
  },
  B4: {
    teamNumber: "B4",
    teamName: "Team 4",
    schoolName: "School B",
    competitorNames: [],
    byeBust: false,
    ballotFolderLink: "",
    emails: "",
  },
};

const largerMockTeamInfos: Record<string, TeamInfo> = {
  ...mockTeamInfos,
  C5: {
    teamNumber: "C5",
    teamName: "Team 5",
    schoolName: "School C",
    competitorNames: [],
    byeBust: false,
    ballotFolderLink: "",
    emails: "",
  },
  C6: {
    teamNumber: "C6",
    teamName: "Team 6",
    schoolName: "School C",
    competitorNames: [],
    byeBust: false,
    ballotFolderLink: "",
    emails: "",
  },
};

const mockConfig: RoundRobinConfig = {
  prelimRounds: ["Round 1", "Round 2"],
  allowSameSchool: false,
  randomSeed: "test-seed",
};

describe("getInitialRoundState", () => {
  it("creates initial state with correct team counts", () => {
    const state = getInitialRoundState(mockTeamInfos);
    expect(state.teamStates.size).toBe(4);
    const team1State = state.teamStates.get("A1");
    expect(team1State).toBeDefined();
    expect(team1State?.timesPlaintiff).toBe(0);
    expect(team1State?.timesDefense).toBe(0);
    expect(team1State?.pastOpponents).toEqual([]);
  });
});

describe("getTeamGroupings", () => {
  it("correctly groups teams by side needs", () => {
    const state = getInitialRoundState(mockTeamInfos);
    state.teamStates.get("A1")!.timesPlaintiff = 1;
    state.teamStates.get("A2")!.timesDefense = 1;

    const groupings = getTeamGroupings(state.teamStates);
    expect(groupings.needsDefense.has("A1")).toBe(true);
    expect(groupings.needsPlaintiff.has("A2")).toBe(true);
    expect(groupings.flexible.has("B3")).toBe(true);
    expect(groupings.flexible.has("B4")).toBe(true);
  });
});

describe("isMatchupConflict", () => {
  it("detects same school conflicts", () => {
    const state = getInitialRoundState(mockTeamInfos);
    const conflictCheck = isMatchupConflict(state, mockConfig);

    const pairing: Pairing = ["A1", "A2"];
    expect(conflictCheck(pairing)).toBe(ConflictType.SameSchool);
  });

  it("detects repeat matchup conflicts", () => {
    const state = getInitialRoundState(mockTeamInfos);
    state.teamStates.get("A1")!.pastOpponents.push("B3");
    const conflictCheck = isMatchupConflict(state, mockConfig);

    const pairing: Pairing = ["A1", "B3"];
    expect(conflictCheck(pairing)).toBe(ConflictType.AlreadyFaced);
  });

  it("allows valid matchups", () => {
    const state = getInitialRoundState(mockTeamInfos);
    const conflictCheck = isMatchupConflict(state, mockConfig);

    const pairing: Pairing = ["A1", "B3"];
    expect(conflictCheck(pairing)).toBe(ConflictType.None);
  });
});

describe("getInitialPairings", () => {
  it("creates valid initial pairings with even teams", () => {
    const state = getInitialRoundState(mockTeamInfos);
    const groupings = getTeamGroupings(state.teamStates);
    const rng = new SeededRandom("test-seed");

    const pairings = getInitialPairings(groupings, rng);
    expect(pairings.length).toBe(2);
    expect(pairings.every((p) => p.length === 2)).toBe(true);
  });

  it("throws error when not enough flexible teams", () => {
    const groupings = {
      needsPlaintiff: new Set(["A1", "A2"]),
      needsDefense: new Set(["B3"]),
      flexible: new Set([]),
    };
    const rng = new SeededRandom("test-seed");

    expect(() => getInitialPairings(groupings, rng)).toThrow(
      "Not enough flexible teams"
    );
  });
});

describe("getNextRoundState", () => {
  it("correctly updates past opponents", () => {
    const state = getInitialRoundState(mockTeamInfos);
    const pairings: Pairing[] = [
      ["A1", "B3"],
      ["A2", "B4"],
    ];

    const newState = getNextRoundState(state, pairings);
    expect(newState.teamStates.get("A1")?.pastOpponents).toContain("B3");
    expect(newState.teamStates.get("B3")?.pastOpponents).toContain("A1");
    expect(newState.teamStates.get("A2")?.pastOpponents).toContain("B4");
    expect(newState.teamStates.get("B4")?.pastOpponents).toContain("A2");

    expect(newState.teamStates.get("A1")?.timesPlaintiff).toBe(1);
    expect(newState.teamStates.get("A2")?.timesPlaintiff).toBe(1);
    expect(newState.teamStates.get("B3")?.timesPlaintiff).toBe(0);
    expect(newState.teamStates.get("B4")?.timesPlaintiff).toBe(0);

    expect(newState.teamStates.get("A1")?.timesDefense).toBe(0);
    expect(newState.teamStates.get("A2")?.timesDefense).toBe(0);
    expect(newState.teamStates.get("B3")?.timesDefense).toBe(1);
    expect(newState.teamStates.get("B4")?.timesDefense).toBe(1);
  });
});

const getPairingKey = (pairing: Pairing): string => {
  return pairing.sort().join("-");
};

// Helper functions to verify pairing properties
const verifyNoRepeatMatchups = (
  pairingsByRound: Map<string, Pairing[]>
): boolean => {
  const allMatchups = new Set<string>();
  for (const pairings of pairingsByRound.values()) {
    for (const [team1, team2] of pairings) {
      const matchup = getPairingKey([team1, team2]);
      if (allMatchups.has(matchup)) return false;
      allMatchups.add(matchup);
    }
  }
  return true;
};

const verifyNoSameSchoolMatchups = (
  pairingsByRound: Map<string, Pairing[]>,
  teamInfos: Record<string, TeamInfo>
): boolean => {
  for (const pairings of pairingsByRound.values()) {
    for (const [team1, team2] of pairings) {
      if (teamInfos[team1].schoolName === teamInfos[team2].schoolName) {
        return false;
      }
    }
  }
  return true;
};

const verifyAllTeamsParticipate = (
  pairingsByRound: Map<string, Pairing[]>,
  teamInfos: Record<string, TeamInfo>
): boolean => {
  for (const pairings of pairingsByRound.values()) {
    const teamsThisRound = new Set<string>();
    for (const [team1, team2] of pairings) {
      teamsThisRound.add(team1);
      teamsThisRound.add(team2);
    }
    if (teamsThisRound.size !== Object.keys(teamInfos).length) {
      return false;
    }
  }
  return true;
};

describe("computeAllPairings", () => {
  const threeRoundConfig: RoundRobinConfig = {
    prelimRounds: ["Round 1", "Round 2", "Round 3"],
    allowSameSchool: false,
    randomSeed: "test-seed",
  };

  it("generates valid pairings across multiple rounds", () => {
    const pairingsByRound = computeAllPairings(
      threeRoundConfig,
      largerMockTeamInfos
    );

    expect(pairingsByRound.size).toBe(3);
    expect(verifyNoRepeatMatchups(pairingsByRound)).toBe(true);
    expect(
      verifyNoSameSchoolMatchups(pairingsByRound, largerMockTeamInfos)
    ).toBe(true);
    expect(
      verifyAllTeamsParticipate(pairingsByRound, largerMockTeamInfos)
    ).toBe(true);
  });

  it("allows same school matchups when configured", () => {
    const sameSchoolConfig = { ...threeRoundConfig, allowSameSchool: true };
    const pairingsByRound = computeAllPairings(
      sameSchoolConfig,
      largerMockTeamInfos
    );

    // We don't verify no same school matchups here since they're allowed
    expect(verifyNoRepeatMatchups(pairingsByRound)).toBe(true);
    expect(
      verifyAllTeamsParticipate(pairingsByRound, largerMockTeamInfos)
    ).toBe(true);
  });

  it("throws error if pairings are impossible", () => {
    // Create a config with too many rounds for the number of possible unique matchups
    const impossibleConfig: RoundRobinConfig = {
      prelimRounds: ["Round 1", "Round 2", "Round 3", "Round 4", "Round 5"],
      allowSameSchool: false,
      randomSeed: "test-seed",
    };

    expect(() => computeAllPairings(impossibleConfig, mockTeamInfos)).toThrow(
      "Failed to pair teams"
    );
  });
});

describe("getRoundPairer", () => {
  const singleRoundConfig: RoundRobinConfig = {
    prelimRounds: ["Round 1"],
    allowSameSchool: false,
    randomSeed: "test-seed",
  };

  // Helper to verify single round pairing properties
  const verifyPairingProperties = (
    pairings: Pairing[],
    teamInfos: Record<string, TeamInfo>,
    previousMatchups: Set<string> = new Set()
  ): void => {
    // Each team should appear exactly once
    const teamsInRound = new Set<string>();
    pairings.forEach(([team1, team2]) => {
      teamsInRound.add(team1);
      teamsInRound.add(team2);

      // No same school matchups
      expect(teamInfos[team1].schoolName).not.toBe(teamInfos[team2].schoolName);

      // No repeat matchups
      const matchup = [team1, team2].sort().join("-");
      expect(previousMatchups.has(matchup)).toBe(false);
    });

    expect(teamsInRound.size).toBe(Object.keys(teamInfos).length);
  };

  it("generates valid pairings for first round", () => {
    const rng = new SeededRandom(`${singleRoundConfig.randomSeed}-pairings`);
    const roundPairer = getRoundPairer(singleRoundConfig, rng);
    const state = getInitialRoundState(mockTeamInfos);

    const pairings = roundPairer(state);
    verifyPairingProperties(pairings, mockTeamInfos);
  });

  it("generates valid pairings after previous rounds", () => {
    const rng = new SeededRandom(`${singleRoundConfig.randomSeed}-pairings`);
    const roundPairer = getRoundPairer(singleRoundConfig, rng);
    // round 1: A1 vs. B3, A2 vs. C5, B4 vs. C6
    // round 2: B3 vs. A2, C5 vs. B4, C6 vs. A1
    const previousMatchups = new Set(
      [
        ["A1", "B3"],
        ["A2", "C5"],
        ["B4", "C6"],
        ["B3", "A2"],
        ["C5", "B4"],
        ["C6", "A1"],
      ].map(getPairingKey)
    );
    let state = {
      teamStates: new Map([
        [
          "A1",
          {
            teamInfo: largerMockTeamInfos["A1"],
            timesPlaintiff: 1,
            timesDefense: 1,
            pastOpponents: ["B3", "C6"],
          },
        ],
        [
          "A2",
          {
            teamInfo: largerMockTeamInfos["A2"],
            timesPlaintiff: 1,
            timesDefense: 1,
            pastOpponents: ["C5", "B3"],
          },
        ],
        [
          "B3",
          {
            teamInfo: largerMockTeamInfos["B3"],
            timesPlaintiff: 1,
            timesDefense: 1,
            pastOpponents: ["A1", "A2"],
          },
        ],
        [
          "B4",
          {
            teamInfo: largerMockTeamInfos["B4"],
            timesPlaintiff: 1,
            timesDefense: 1,
            pastOpponents: ["C6", "C5"],
          },
        ],
        [
          "C5",
          {
            teamInfo: largerMockTeamInfos["C5"],
            timesPlaintiff: 1,
            timesDefense: 1,
            pastOpponents: ["A2", "B4"],
          },
        ],
        [
          "C6",
          {
            teamInfo: largerMockTeamInfos["C6"],
            timesPlaintiff: 1,
            timesDefense: 1,
            pastOpponents: ["A1", "B4"],
          },
        ],
      ]),
    };

    const thirdRoundPairings = roundPairer(state);
    verifyPairingProperties(
      thirdRoundPairings,
      largerMockTeamInfos,
      previousMatchups
    );
  });

  it("respects side balance constraints", () => {
    const rng = new SeededRandom(`${singleRoundConfig.randomSeed}-pairings`);
    const roundPairer = getRoundPairer(singleRoundConfig, rng);
    const state = getInitialRoundState(mockTeamInfos);

    // Make team 1234 need defense (by setting it as having been plaintiff)
    state.teamStates.get("A1")!.timesPlaintiff = 1;

    const pairings = roundPairer(state);

    // Find the pairing with team 1234
    const team1234Pairing = pairings.find((p) => p.includes("A1"))!;
    // Verify team 1234 is on defense (second position)
    expect(team1234Pairing[1]).toBe("A1");
  });

  it("allows same school when configured", () => {
    const sameSchoolConfig = { ...singleRoundConfig, allowSameSchool: true };
    const rng = new SeededRandom(`${sameSchoolConfig.randomSeed}-pairings`);
    const roundPairer = getRoundPairer(sameSchoolConfig, rng);
    const state = getInitialRoundState(mockTeamInfos);

    // Run multiple times since the pairings are randomized
    for (let i = 0; i < 5; i++) {
      const pairings = roundPairer(state);
      // Only verify team count, not school restrictions
      const teamsInRound = new Set<string>();
      pairings.forEach(([team1, team2]) => {
        teamsInRound.add(team1);
        teamsInRound.add(team2);
      });
      expect(teamsInRound.size).toBe(Object.keys(mockTeamInfos).length);
    }
  });

  it("throws error when constraints cannot be satisfied", () => {
    const rng = new SeededRandom(`${singleRoundConfig.randomSeed}-pairings`);
    const roundPairer = getRoundPairer(singleRoundConfig, rng);
    const state = getInitialRoundState(mockTeamInfos);

    // Make all teams have faced each other except same-school opponents
    for (const team1 of Object.keys(mockTeamInfos)) {
      for (const team2 of Object.keys(mockTeamInfos)) {
        if (
          team1 !== team2 &&
          mockTeamInfos[team1].schoolName !== mockTeamInfos[team2].schoolName
        ) {
          state.teamStates.get(team1)!.pastOpponents.push(team2);
        }
      }
    }

    expect(() => roundPairer(state)).toThrow("Failed to resolve conflicts");
  });
});
