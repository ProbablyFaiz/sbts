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
}

enum MasterRange {
  BallotLinks = "BallotLinksRange",
  TeamBallots = "TeamBallotsRange",
  IndividualBallots = "IndividualBallotsRange",
  EnteredTeamBallots = "EnteredTeamBallotsRange",
  EnteredIndividualBallots = "EnteredIndividualBallotsRange",
  EnteredTeamBallotsSheet = "Entered Team Ballots",
  EnteredIndividualBallotsSheet = "Entered Individual Ballots",
  TeamInfo = "TeamInfoRange",
  OrchestratorLink = "OrchestratorLinkRange",
  ParentFolderLink = "ParentFolderLinkRange",
  ExportFolderLink = "ExportFolderLinkRange",
  ExecutionLog = "ExecutionLogRange",
  TournamentName = "TournamentNameRange",
  TournamentEmail = "TournamentEmailRange",
  TeamResults = "TeamResultsRange",
  CourtroomInfo = "CourtroomInfoRange",
  FirstPartyName = "FirstPartyNameRange",
  SecondPartyName = "SecondPartyNameRange",
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
  ballotPdf?: File;
};

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
  TeamSummary,
  IndividualSummary,
  RoundResult,
  Cell,
  SpreadsheetOutput,
  TeamState,
  BallotState,
  RequiredTeamState,
  RequiredBallotState,
};
