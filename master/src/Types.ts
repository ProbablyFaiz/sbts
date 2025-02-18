type Cell = string | number | undefined;
type SpreadsheetOutput = Cell | Cell[] | Cell[][];

enum MasterRange {
  TeamInfo = "TeamInfoRange",
  OrchestratorLink = "OrchestratorLinkRange",
  ParentFolderLink = "ParentFolderLinkRange",
  ExportFolderLink = "ExportFolderLinkRange",
  ExecutionLog = "ExecutionLogRange",
  TournamentName = "TournamentNameRange",
  TournamentEmail = "TournamentEmailRange",
  CourtroomInfo = "CourtroomInfoRange",
  FirstPartyName = "FirstPartyNameRange",
  SecondPartyName = "SecondPartyNameRange",
  BallotTemplateLink = "BallotTemplateLinkRange",
  BallotListTemplateLink = "BallotListTemplateLinkRange",
  SwissPreviousRounds = "SwissPreviousRoundsRange",
  SwissAllowSameSchool = "SwissAllowSameSchoolRange",
  SwissAllowRepeatMatchup = "SwissAllowRepeatMatchupRange",
  SwissRandomizeCourtrooms = "SwissRandomizeCourtroomsRange",
  SwissRandomSeed = "SwissRandomSeedRange",
  RoundRobinPrelimRounds = "RoundRobinPrelimRoundsRange",
  RoundRobinAllowSameSchool = "RoundRobinAllowSameSchoolRange",
  RoundRobinRandomizeCourtrooms = "RoundRobinRandomizeCourtroomsRange",
  RoundRobinRandomSeed = "RoundRobinRandomSeedRange",
  ByeStrategy = "ByeStrategyRange",
  PrelimRounds = "TeamIncludeRoundsRange",
  KnockoutRounds = "KnockoutIncludeRoundsRange",
  TabSystemSetup = "TabSystemSetUpRange",
}

enum BallotListRange {
  TournamentName = "TournamentName",
  TournamentEmail = "TournamentEmail",
  TeamNumber = "TeamNumber",
  School = "School",
  Competitors = "Competitors",
  BallotList = "BallotList",
}

enum OrchestratorRange {
  MasterLink = "MasterSpreadsheetLinkRange",
}

interface MasterSpreadsheet extends GoogleAppsScript.Spreadsheet.Spreadsheet {
  getRangeByName(name: MasterRange): GoogleAppsScript.Spreadsheet.Range | null;
}

interface TeamInfo {
  teamNumber: string;
  teamName: string;
  schoolName: string;
  competitorNames: string[];
  byeBust: boolean;
  ballotListLink: string;
  emails: string;
}

interface CourtroomInfo {
  name: string;
  bailiffEmails: string[];
  roundFolderLinks: string[];
}

interface CompetitorInfo {
  name: string;
  teamNumber: string;
}

interface TeamBallotResult {
  round: string;
  judgeName: string;
  teamNumber: string;
  opponentTeamNumber: string;
  side: string;
  pd: number;
  won: number;
  courtroom: string;
  ballotLink: string;
}

interface IndividualBallotResult {
  round: string;
  judgeName: string;
  teamNumber: string;
  competitorName: string;
  side: string;
  score: number;
  courtroom: string;
}

interface TeamSummary {
  teamNumber?: string;
  teamName?: string;
  byeBust?: boolean;

  ballotsWon: number;
  pointDifferential: number;
  combinedStrength?: number;
  pastOpponents?: string[];
  timesPlaintiff: number;
  timesDefense: number;
  roundsCompeted?: string[];
}

interface IndividualSummary {
  teamNumber: string;
  teamName?: string;
  competitorName: string;
  score: number;
  judgeScores?: number[];
}

interface RoundResult {
  ballotsWon: number;
  pointDifferential: number;
  side: string;
  opponentTeamNumber: string;
}

type TeamState = {
  teamNumber: string;
  issue1Name: string;
  issue1ScoreExpr: string;
  issue1Score?: number;
  issue2Name: string;
  issue2ScoreExpr: string;
  issue2Score?: number;
};

interface BallotState {
  courtroom: string;
  round: string;
  judgeName: string;
  ballotPdf?: File;
  petitioner: TeamState;
  respondent: TeamState;
}

type RequiredTeamState = Required<
  Omit<TeamState, "issue1ScoreExpr" | "issue2ScoreExpr">
>;
type RequiredBallotState = Omit<
  Required<BallotState>,
  "petitioner" | "respondent" | "ballotPdf"
> & {
  petitioner: RequiredTeamState;
  respondent: RequiredTeamState;
  pdfData?: string;
  ballotPdf?: undefined;
};

interface BallotResult {
  judgeName: string;
  round: string;
  courtroom: string;
  pTeam: string;
  pIssue1Name: string;
  pIssue1Score: number;
  pIssue2Name: string;
  pIssue2Score: number;
  rTeam: string;
  rIssue1Name: string;
  rIssue1Score: number;
  rIssue2Name: string;
  rIssue2Score: number;
  ballotPdfUrl?: string;
}

interface BallotReadout {
  timestamp: Date;
  judgeName: string;
  round: string;
  courtroom: string;
  pTeam: string;
  pIssue1Name: string;
  pIssue1WrittenFeedback: string;
  pIssue1Scores: number[];
  pIssue2Name: string;
  pIssue2WrittenFeedback: string;
  pIssue2Scores: number[];
  rTeam: string;
  rIssue1Name: string;
  rIssue1WrittenFeedback: string;
  rIssue1Scores: number[];
  rIssue2Name: string;
  rIssue2WrittenFeedback: string;
  rIssue2Scores: number[];
  ballotPdfUrl?: string;
  sourceSheet: string;
}

enum CompetitorRole {
  P_ISSUE_1 = "P_ISSUE_1",
  P_ISSUE_2 = "P_ISSUE_2",
  R_ISSUE_1 = "R_ISSUE_1",
  R_ISSUE_2 = "R_ISSUE_2",
}

enum ScoringCategory {
  CONTENT_OF_ARGUMENT = "contentOfArgument",
  EXTEMPORANEOUS_ABILITY = "extempAbility",
  FORENSIC_SKILL = "forensicSkill",
}

interface ScoreGroup {
  role: CompetitorRole;
  competitorName: string;
  writtenFeedback: string;
  [ScoringCategory.CONTENT_OF_ARGUMENT]: number;
  [ScoringCategory.EXTEMPORANEOUS_ABILITY]: number;
  [ScoringCategory.FORENSIC_SKILL]: number;
}

interface BallotScoreGrouping {
  groups: Map<CompetitorRole, ScoreGroup>;
  pTotal: number;
  rTotal: number;
  readout: BallotReadout;
}

const SCORE_GROUP_KEYS: Map<
  CompetitorRole,
  {
    name: keyof BallotReadout;
    scoreArr: keyof BallotReadout;
    writtenFeedback: keyof BallotReadout;
  }
> = new Map([
  [
    CompetitorRole.P_ISSUE_1,
    {
      name: "pIssue1Name",
      scoreArr: "pIssue1Scores",
      writtenFeedback: "pIssue1WrittenFeedback",
    },
  ],
  [
    CompetitorRole.P_ISSUE_2,
    {
      name: "pIssue2Name",
      scoreArr: "pIssue2Scores",
      writtenFeedback: "pIssue2WrittenFeedback",
    },
  ],
  [
    CompetitorRole.R_ISSUE_1,
    {
      name: "rIssue1Name",
      scoreArr: "rIssue1Scores",
      writtenFeedback: "rIssue1WrittenFeedback",
    },
  ],
  [
    CompetitorRole.R_ISSUE_2,
    {
      name: "rIssue2Name",
      scoreArr: "rIssue2Scores",
      writtenFeedback: "rIssue2WrittenFeedback",
    },
  ],
]);

const SCORE_IDX_MAP: Map<ScoringCategory, number> = new Map([
  [ScoringCategory.CONTENT_OF_ARGUMENT, 0],
  [ScoringCategory.EXTEMPORANEOUS_ABILITY, 1],
  [ScoringCategory.FORENSIC_SKILL, 2],
]);

const SCORE_CATEGORY_NAMES: Map<ScoringCategory, string> = new Map([
  [ScoringCategory.CONTENT_OF_ARGUMENT, "Content of Argument"],
  [ScoringCategory.EXTEMPORANEOUS_ABILITY, "Extemporaneous Ability"],
  [ScoringCategory.FORENSIC_SKILL, "Forensic Skill & Courtroom Demeanor"],
]);

const ROLE_NAMES: Map<CompetitorRole, string> = new Map([
  [CompetitorRole.P_ISSUE_1, "Petitioner, Issue 1"],
  [CompetitorRole.P_ISSUE_2, "Petitioner, Issue 2"],
  [CompetitorRole.R_ISSUE_1, "Respondent, Issue 1"],
  [CompetitorRole.R_ISSUE_2, "Respondent, Issue 2"],
]);

interface SwissConfig {
  previousRounds: string[];
  allowSameSchool: boolean;
  allowRepeatMatchup: boolean;
  randomizeCourtrooms: boolean;
  randomSeed: string;
}

interface RoundRobinConfig {
  prelimRounds: string[];
  allowSameSchool: boolean;
  randomSeed: string;
}

enum ByeStrategy {
  NO_ADJUSTMENT,
  PROPORTIONAL,
  AUTO_WIN,
}

export {
  MasterRange,
  BallotListRange,
  OrchestratorRange,
  MasterSpreadsheet,
  TeamInfo,
  CourtroomInfo,
  CompetitorInfo,
  TeamBallotResult,
  IndividualBallotResult,
  BallotResult,
  TeamSummary,
  IndividualSummary,
  RoundResult,
  Cell,
  SpreadsheetOutput,
  TeamState,
  BallotState,
  RequiredTeamState,
  RequiredBallotState,
  BallotReadout,
  BallotScoreGrouping,
  SwissConfig,
  ByeStrategy,
  RoundRobinConfig,
  CompetitorRole,
  ScoringCategory,
  ScoreGroup,
  SCORE_GROUP_KEYS,
  SCORE_IDX_MAP,
  SCORE_CATEGORY_NAMES,
  ROLE_NAMES,
};
