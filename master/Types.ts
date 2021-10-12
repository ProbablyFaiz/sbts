import Spreadsheet = GoogleAppsScript.Spreadsheet.Spreadsheet;
import GoogleFile = GoogleAppsScript.Drive.File;

type Cell = string | number | undefined;
type SpreadsheetOutput = Cell | Cell[] | Cell[][]

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
    TeamInfo = "TeamInfoRange",
    OrchestratorLink = "OrchestratorLinkRange",
    ParentFolderLink = "ParentFolderLinkRange",
    ExportFolderLink = "ExportFolderLinkRange",
    ExecutionLog = "ExecutionLogRange",
    TournamentName = "TournamentNameRange",
    TournamentEmail = "TournamentEmailRange",
    TeamResults = "TeamResultsRange"
}

enum CaptainsFormRange {
    Round = "RoundNum",
    Courtroom = "CourtroomLetter",
}

enum OrchestratorRange {
    MasterLink = "MasterSpreadsheetLinkRange",
}

interface BallotSpreadsheet extends Spreadsheet {
    getRangeByName(name: BallotRange);
}

interface MasterSpreadsheet extends Spreadsheet {
    getRangeByName(name: MasterRange);
}

interface TeamInfo {
    teamName: string;
    schoolName: string;
    ballotFolderLink: string;
    emails: string;
}
