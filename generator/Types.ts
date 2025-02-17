import Spreadsheet = GoogleAppsScript.Spreadsheet.Spreadsheet;
import Folder = GoogleAppsScript.Drive.Folder;
import GoogleFile = GoogleAppsScript.Drive.File;

enum SimpleGeneratorRange {
  MasterSpreadsheetTemplate = "MasterSpreadsheetTemplate",
  FormBallotTemplate = "FormBallotTemplate",
  BallotListTemplateLink = "BallotListTemplateLink",
  TournamentName = "TournamentName",
  TournamentContactEmail = "TournamentContactEmail",
  ShowSwissPairings = "ShowSwissPairings",
  ShowRoundRobinPairings = "ShowRoundRobinPairings",
  ShowKnockoutBracket = "ShowKnockoutBracket",
  ByeStrategy = "ByeStrategy",
  PrelimRounds = "PrelimRounds",
  ElimRounds = "ElimRounds",
  Courtrooms = "Courtrooms",
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
  GoogleFormBallotLink = "GoogleFormBallotLinkRange",
  BallotListTemplateLink = "BallotListTemplateLinkRange",

  TeamIncludeRounds = "TeamIncludeRoundsRange",
  IndividualIncludeRounds = "IndividualIncludeRoundsRange",
  KnockoutIncludeRounds = "KnockoutIncludeRoundsRange",
  RoundRobinPrelimRounds = "RoundRobinPrelimRoundsRange",
  ByeStrategy = "ByeStrategyRange",
}

interface MasterSpreadsheet extends Spreadsheet {
  getRangeByName(name: MasterRange);
}

interface ICourtroomInfo {
  name: string;
  bailiffEmails: string[];
}

interface IRoundInfo {
  name: string;
  numBallots: number;
  numCourtrooms: number;
}

interface GeneratedCourtroomRecord {
  name: string;
  bailiffEmails: string[];
  roundFolderLinks: string[];
}
