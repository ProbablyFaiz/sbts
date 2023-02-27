import { onOpen, openBallotEntry, openAboutSidebar } from "./ui";

import { getSheetsData, addSheet, deleteSheet, setActiveSheet } from "./sheets";
import {
  OnCreateTeamBallotFolderClick,
  OnEmailBallotFolderLinksClick,
  OnPublishBallotsClick,
  OnSetupMasterSpreadsheetClick,
} from "./ControlPanel";
import DetectNameTypos from "./tab/DetectNameTypos";
import { TabulateIndividualBallots } from "./tab/TabulateIndividualBallots";
import { TabulateTeamBallots } from "./tab/TabulateTeamBallots";
import DisplayMatchResults from "./tab/DisplayMatchResults";
import {
  PopulateTeamBallots,
  PopulateIndividualBallots,
} from "./actions/PopulateBallotSheets";
import { SSContext } from "./context/Context";
import { RequiredBallotState } from "../Types";
import PrintTabSummary from "./tab/PrintTabSummary";

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
  PrintTabSummary,
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
 * @param {boolean} byeAdjustment Whether to adjust for bye rounds. If true, teams with fewer than the maximum number of opponents
 * will have their totals multiplied by the factor of the number of opponents. E.g. a team with 2 opponents when
 * other teams have 3 opponents will have their totals multiplied by 3/2.
 * @return {(string|number)[][]} The tabulated team results, of the form (Rank, Team #, Team Name, Ballots Won, Combined Strength, Point Differential, Times Petitioner, Times Respondent, Past Opponents)
 * @customfunction
 */
global.TabulateTeamBallots = (
  roundRange: string | string[],
  ballotsPerMatch: number,
  byeAdjustment: boolean
) => TabulateTeamBallots(roundRange, ballotsPerMatch, byeAdjustment);
global.DetectNameTypos = DetectNameTypos;
global.PopulateIndividualBallots = PopulateIndividualBallots;
global.PopulateTeamBallots = PopulateTeamBallots;
global.DisplayMatchResults = DisplayMatchResults;
global.PrintTabSummary = PrintTabSummary;
global.getCourtrooms = getCourtrooms;
global.getTeams = getTeams;
global.getTeamBallotResults = getTeamBallotResults;
global.getRoundNames = getRoundNames;
global.getJudgeNames = getJudgeNames;
global.submitBallot = submitBallot;
