import { onOpen, openBallotEntry, openAboutSidebar } from "./ui";

import { getSheetsData, addSheet, deleteSheet, setActiveSheet } from "./sheets";
import {
  OnCreateTeamBallotFolderClick,
  OnEmailBallotFolderLinksClick,
  OnPublishBallotsClick,
  OnSetupMasterSpreadsheetClick,
} from "./ControlPanel";
import DetectNameTypos from "./monitoring/DetectNameTypos";
import { TabulateIndividualBallots } from "./tab/TabulateIndividualBallots";
import { TabulateTeamBallots } from "./tab/TabulateTeamBallots";
import DisplayMatchResults from "./tab/DisplayMatchResults";
import {
  PopulateTeamBallots,
  PopulateIndividualBallots,
} from "./actions/PopulateBallotSheets";
import { SSContext } from "./context/Context";
import { RequiredBallotState } from "../Types";
import { PrintMatchupSummary, PrintTeamSummary } from "./tab/PrintTabSummary";
import { DetectMatchupTypos } from "./monitoring/DetectMatchupTypos";
import {
  PairTeams,
  PairTeamsWithCourtrooms,
  PairTeamsWithMetadata,
} from "./pairing/Swiss";

const getCourtrooms = () => {
  const context = new SSContext();
  return context.courtroomRecords;
};
const getTeams = () => {
  const context = new SSContext();
  return Object.values(context.teamInfo);
};
const getTeamBallotResults = () => {
  const context = new SSContext();
  return context.teamBallotResults;
};
const getRoundNames = () => {
  const context = new SSContext();
  return context.roundNames;
};
const getJudgeNames = () => {
  const context = new SSContext();
  return context.judgeNames;
};
const submitBallot = (ballotState: RequiredBallotState) => {
  const context = new SSContext();
  context.addEnteredBallot(ballotState);
  // appendRow doesn't trigger onEdit, so we have to manually update the ballot sheets
  // TODO: Set the range values instead of using appendRow (if it can be done
  //  safely/atomically) so that onEdit is triggered
  PopulateTeamBallots();
  PopulateIndividualBallots();
};

// Public functions must be exported as named exports
export {
  onOpen,
  openBallotEntry,
  openAboutSidebar,
  getSheetsData,
  addSheet,
  deleteSheet,
  setActiveSheet,
  OnCreateTeamBallotFolderClick,
  OnEmailBallotFolderLinksClick,
  OnPublishBallotsClick,
  OnSetupMasterSpreadsheetClick,
  DetectNameTypos,
  TabulateIndividualBallots,
  TabulateTeamBallots,
  PopulateIndividualBallots,
  PopulateTeamBallots,
  DisplayMatchResults,
  PrintMatchupSummary,
  PrintTeamSummary,
  PairTeams,
  PairTeamsWithCourtrooms,
  PairTeamsWithMetadata,
  getCourtrooms,
  getTeams,
  getTeamBallotResults,
  getRoundNames,
  getJudgeNames,
  submitBallot,
};

// The webpack functionality for adding these to the global scope is not working
// so we have to add them manually
global.onOpen = onOpen;
global.openBallotEntry = openBallotEntry;
global.openAboutSidebar = openAboutSidebar;
global.OnCreateTeamBallotFolderClick = OnCreateTeamBallotFolderClick;
global.OnEmailBallotFolderLinksClick = OnEmailBallotFolderLinksClick;
global.OnPublishBallotsClick = OnPublishBallotsClick;
global.OnSetupMasterSpreadsheetClick = OnSetupMasterSpreadsheetClick;
/**
 * Tabulate individual results for the given rounds. Arguments provided after the below-listed argument are
 * solely for telling the custom function when to recalculate.
 * @param {string[] | string} roundRange The rounds to tabulate. Can be a single round, a range of rounds, or an array of rounds.
 * @return {(string|number)[][]} The tabulated individual results, of the form (Rank, Team #, Team Name, Speaker Name, Average Score)
 * @customfunction
 */
global.TabulateIndividualBallots = (roundRange: string | string[]) =>
  TabulateIndividualBallots(roundRange);
/**
 * Tabulate team results for the given rounds. The arguments provided after the below-listed arguments are
 * solely for telling the custom function when to recalculate.
 * @param {string[] | string} roundRange The rounds to tabulate. Can be a single round, a range of rounds, or an array of rounds.
 * @param {number} ballotsPerMatch The number of ballots per round to normalize to. For example, if this is 2, then a
 * team that wins a round 2 ballots to 1 will receive 2*2/3 = 1.33 ballots for that round.
 * @return {(string|number)[][]} The tabulated team results, of the form (Rank, Team #, Team Name, Ballots Won, Combined Strength, Point Differential, Times Petitioner, Times Respondent, Past Opponents)
 * @customfunction
 */
global.TabulateTeamBallots = (
  roundRange: string | string[],
  ballotsPerMatch: number
) => TabulateTeamBallots(roundRange, ballotsPerMatch);
global.DetectNameTypos = DetectNameTypos;
global.DetectMatchupTypos = DetectMatchupTypos;
global.PopulateIndividualBallots = PopulateIndividualBallots;
global.PopulateTeamBallots = PopulateTeamBallots;
global.DisplayMatchResults = DisplayMatchResults;
global.PrintMatchupSummary = PrintMatchupSummary;
global.PrintTeamSummary = PrintTeamSummary;
global.PairTeams = PairTeams;
/**
 * Pair teams using the Swiss system and assign them to courtrooms.
 * Order of the matchups is randomized. All parameters are provided via
 * configuration fields, and not as arguments to this function.
 * Any passed are solely for telling the custom function when to recalculate.
 * @return {string[][]} The pairings for the next round, of the form (Courtroom, Petitioner, Respondent)
 * @customfunction
 */
global.PairTeamsWithCourtrooms = PairTeamsWithCourtrooms;
/**
 * Pair teams using the Swiss System, showing the pairing process and how each
 * conflict was resolved. All parameters are provided via configuration fields,
 * and not as arguments to this function; any passed are solely for telling the
 * custom function when to recalculate.
 * @return {string[][]} A series of intermediate pairing steps used to generate
 * the final pairings.
 * @customfunction
 */
global.PairTeamsWithMetadata = PairTeamsWithMetadata;
global.getCourtrooms = getCourtrooms;
global.getTeams = getTeams;
global.getTeamBallotResults = getTeamBallotResults;
global.getRoundNames = getRoundNames;
global.getJudgeNames = getJudgeNames;
global.submitBallot = submitBallot;
