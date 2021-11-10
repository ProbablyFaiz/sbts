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
    TeamResults = "TeamResultsRange",
    CourtroomInfo = "CourtroomInfoRange",
}

enum CaptainsFormRange {
    Round = "RoundNum",
    Courtroom = "CourtroomLetter",
}

enum OrchestratorRange {
    MasterLink = "MasterSpreadsheetLinkRange",
}

interface BallotSpreadsheet extends Spreadsheet {
    getRangeByName(name: BallotRange): Range | null;
}

interface MasterSpreadsheet extends Spreadsheet {
    getRangeByName(name: MasterRange): Range | null;
}

interface TeamInfo {
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
