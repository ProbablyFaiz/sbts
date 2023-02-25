import Spreadsheet = GoogleAppsScript.Spreadsheet.Spreadsheet;
import Folder = GoogleAppsScript.Drive.Folder;
import GoogleFile = GoogleAppsScript.Drive.File;

enum BallotRange {
  CaptainsFormUrl = "CaptainsFormUrlRange",
  PlaintiffTeam = "PlaintiffTeamRange",
  DefenseTeam = "DefenseTeamRange",
  Round = "RoundRange",
  JudgeName = "JudgeNameRange",
  Submitted = "SubmittedRange",
  TeamResults = "TeamResults",
  IndividualResults = "IndividualResults",
  TournamentName = "TournamentNameRange",
  FirstPartyName = "FirstPartyNameRange",
  SecondPartyName = "SecondPartyNameRange",
}

enum MasterRange {
  BallotLinks = "BallotLinksRange",
  OrchestratorLink = "OrchestratorLinkRange",
  ParentFolderLink = "ParentFolderLinkRange",
  ExportFolderLink = "ExportFolderLinkRange",
  TournamentName = "TournamentNameRange",
  TournamentEmail = "TournamentEmailRange",
  CourtroomInfo = "CourtroomInfoRange",
  FirstPartyName = "FirstPartyNameRange",
  SecondPartyName = "SecondPartyNameRange",
  BallotTemplateLink = "BallotTemplateLinkRange",
}

enum CaptainsFormRange {
  Round = "RoundNum",
  Courtroom = "CourtroomLetter",
  TournamentName = "TournamentNameRange",
  FirstPartyName = "FirstPartyNameRange",
  SecondPartyName = "SecondPartyNameRange",
  AutocompleteEngineLink = "AutocompleteEngineLink",
  CourtroomsCommaSep = "CourtroomsCommaSep",
  RoundsCommaSep = "RoundsCommaSep",
}

enum OrchestratorRange {
  MasterLink = "MasterSpreadsheetLinkRange",
  AutocompleteEngineLink = "AutocompleteLinkRange",
}

interface BallotSpreadsheet extends Spreadsheet {
  getRangeByName(name: BallotRange);
}

interface MasterSpreadsheet extends Spreadsheet {
  getRangeByName(name: MasterRange);
}
