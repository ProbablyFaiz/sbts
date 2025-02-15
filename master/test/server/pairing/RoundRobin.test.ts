import { TeamInfo, RoundRobinConfig } from "../../../src/Types";
import { ConflictType, Pairing } from "../../../src/server/pairing/Helpers";
import { 
    getInitialRoundState,
    getTeamGroupings,
    getInitialPairings,
    updateRoundState,
    isMatchupConflict,
    RoundState,
    TeamRoundState,
    TeamGrouping
} from "../../../src/server/pairing/RoundRobin";

const mockTeamInfos: Record<string, TeamInfo> = {
    "1234": {
        teamNumber: "1234",
        teamName: "Team 1",
        schoolName: "School A",
        competitorNames: [],
        byeBust: false,
        ballotFolderLink: "",
        emails: "",
    },
    "2345": {
        teamNumber: "2345",
        teamName: "Team 2",
        schoolName: "School A",
        competitorNames: [],
        byeBust: false,
        ballotFolderLink: "",
        emails: "",
    },
    "3456": {
        teamNumber: "3456",
        teamName: "Team 3",
        schoolName: "School B",
        competitorNames: [],
        byeBust: false,
        ballotFolderLink: "",
        emails: "",
    },
    "4567": {
        teamNumber: "4567",
        teamName: "Team 4",
        schoolName: "School B",
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
        const team1State = state.teamStates.get("1234");
        expect(team1State).toBeDefined();
        expect(team1State?.timesPlaintiff).toBe(0);
        expect(team1State?.timesDefense).toBe(0);
        expect(team1State?.pastOpponents).toEqual([]);
    });
});

describe("getTeamGroupings", () => {
    it("correctly groups teams by side needs", () => {
        const state = getInitialRoundState(mockTeamInfos);
        state.teamStates.get("1234")!.timesPlaintiff = 1;
        state.teamStates.get("2345")!.timesDefense = 1;

        const groupings = getTeamGroupings(state.teamStates);
        expect(groupings.needsDefense.has("1234")).toBe(true);
        expect(groupings.needsPlaintiff.has("2345")).toBe(true);
        expect(groupings.flexible.has("3456")).toBe(true);
        expect(groupings.flexible.has("4567")).toBe(true);
    });
});

describe("isMatchupConflict", () => {
    it("detects same school conflicts", () => {
        const state = getInitialRoundState(mockTeamInfos);
        const conflictCheck = isMatchupConflict(state, mockConfig);
        
        const pairing: Pairing = ["1234", "2345"];
        expect(conflictCheck(pairing)).toBe(ConflictType.SameSchool);
    });

    it("detects repeat matchup conflicts", () => {
        const state = getInitialRoundState(mockTeamInfos);
        state.teamStates.get("1234")!.pastOpponents.push("3456");
        const conflictCheck = isMatchupConflict(state, mockConfig);
        
        const pairing: Pairing = ["1234", "3456"];
        expect(conflictCheck(pairing)).toBe(ConflictType.AlreadyFaced);
    });

    it("allows valid matchups", () => {
        const state = getInitialRoundState(mockTeamInfos);
        const conflictCheck = isMatchupConflict(state, mockConfig);
        
        const pairing: Pairing = ["1234", "3456"];
        expect(conflictCheck(pairing)).toBe(ConflictType.None);
    });
});

describe("getInitialPairings", () => {
    it("creates valid initial pairings with even teams", () => {
        const state = getInitialRoundState(mockTeamInfos);
        const groupings = getTeamGroupings(state.teamStates);
        
        const pairings = getInitialPairings(groupings);
        expect(pairings.length).toBe(2);
        expect(pairings.every(p => p.length === 2)).toBe(true);
    });

    it("throws error when not enough flexible teams", () => {
        const groupings = {
            needsPlaintiff: new Set(["1234", "2345"]),
            needsDefense: new Set(["3456"]),
            flexible: new Set([]),
        };
        
        expect(() => getInitialPairings(groupings)).toThrow("Not enough flexible teams");
    });
});

describe("updateRoundState", () => {
    it("correctly updates past opponents", () => {
        const state = getInitialRoundState(mockTeamInfos);
        const pairings: Pairing[] = [["1234", "3456"], ["2345", "4567"]];
        
        const newState = updateRoundState(state, pairings);
        expect(newState.teamStates.get("1234")?.pastOpponents).toContain("3456");
        expect(newState.teamStates.get("3456")?.pastOpponents).toContain("1234");
    });
});
