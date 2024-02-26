type Cell = string | number | undefined;
type SpreadsheetOutput = Cell | Cell[] | Cell[][];

enum BallotRange {
  CaptainsFormUrl = "CaptainsFormUrlRange",
  PlaintiffTeam = "PlaintiffTeamRange",
  DefenseTeam = "DefenseTeamRange",
  Round = "RoundRange",
  JudgeName = "JudgeNameRange",
  Submitted = "SubmittedRange",
  TeamResults = "TeamResults",
  IndividualResults = "IndividualResults",

  EndOfScores = "EndOfScores",
  PIssue1Name = "PAttorney1",
  PIssue1Comments = "CommentsRangeP1",
  PIssue1Scores = "BallotRangeP1",
  PIssue2Name = "PAttorney2",
  PIssue2Comments = "CommentsRangeP2",
  PIssue2Scores = "BallotRangeP2",
  RIssue1Name = "DAttorney1",
  RIssue1Comments = "CommentsRangeD1",
  RIssue1Scores = "BallotRangeD1",
  RIssue2Name = "DAttorney2",
  RIssue2Comments = "CommentsRangeD2",
  RIssue2Scores = "BallotRangeD2",
}

enum MasterRange {
  BallotLinks = "BallotLinksRange",
  TeamBallots = "TeamBallotsRange",
  IndividualBallots = "IndividualBallotsRange",
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
  SwissPreviousRounds = "SwissPreviousRoundsRange",
  SwissAllowSameSchool = "SwissAllowSameSchoolRange",
  SwissAllowRepeatMatchup = "SwissAllowRepeatMatchupRange",
  SwissRandomizeCourtrooms = "SwissRandomizeCourtroomsRange",
  SwissRandomSeed = "SwissRandomSeedRange",
  ByeStrategy = "ByeStrategyRange",
}

enum CaptainsFormRange {
  Round = "RoundNum",
  Courtroom = "CourtroomLetter",
}

enum OrchestratorRange {
  MasterLink = "MasterSpreadsheetLinkRange",
}

interface BallotSpreadsheet extends GoogleAppsScript.Spreadsheet.Spreadsheet {
  getRangeByName(name: BallotRange): GoogleAppsScript.Spreadsheet.Range | null;
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
  ballotFolderLink: string;
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

interface BallotInfo {
  link: string;
  info: string;
  captainsFormLink: string;
  judgeName: string;
  locked: boolean;
  validated: boolean;
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

interface NonSheetBallotResult {
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


interface NonSheetBallotReadout {
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

interface SwissConfig {
  previousRounds: string[];
  allowSameSchool: boolean;
  allowRepeatMatchup: boolean;
  randomizeCourtrooms: boolean;
  randomSeed: string;
}

enum ByeStrategy {
  NO_ADJUSTMENT,
  PROPORTIONAL,
  AUTO_WIN,
}

export {
  BallotRange,
  MasterRange,
  CaptainsFormRange,
  OrchestratorRange,
  BallotSpreadsheet,
  MasterSpreadsheet,
  TeamInfo,
  CourtroomInfo,
  CompetitorInfo,
  BallotInfo,
  TeamBallotResult,
  IndividualBallotResult,
  NonSheetBallotResult,
  TeamSummary,
  IndividualSummary,
  RoundResult,
  Cell,
  SpreadsheetOutput,
  TeamState,
  BallotState,
  RequiredTeamState,
  RequiredBallotState,
  NonSheetBallotReadout,
  SwissConfig,
  ByeStrategy,
};
