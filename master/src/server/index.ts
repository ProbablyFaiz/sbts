import { onOpen, openDialogBootstrap, openAboutSidebar } from "./ui";

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
import { SSContext } from "./context/Context";

const getCourtrooms = () => {
  const context = new SSContext();
  return context.courtroomRecords;
};
const getTeams = () => {
  const context = new SSContext();
  return Object.values(context.teamInfo);
};

// Public functions must be exported as named exports
export {
  onOpen,
  openDialogBootstrap,
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
  DisplayMatchResults,
  getCourtrooms,
  getTeams,
};

// The webpack functionality for adding these to the global scope is not working
// so we have to add them manually
// @ts-ignore
global.onOpen = onOpen;
// @ts-ignore
global.openDialogBootstrap = openDialogBootstrap;
// @ts-ignore
global.openAboutSidebar = openAboutSidebar;
// @ts-ignore
global.getSheetsData = getSheetsData;
// @ts-ignore
global.addSheet = addSheet;
// @ts-ignore
global.deleteSheet = deleteSheet;
// @ts-ignore
global.setActiveSheet = setActiveSheet;
// @ts-ignore
global.OnCreateTeamBallotFolderClick = OnCreateTeamBallotFolderClick;
// @ts-ignore
global.OnEmailBallotFolderLinksClick = OnEmailBallotFolderLinksClick;
// @ts-ignore
global.OnPublishBallotsClick = OnPublishBallotsClick;
// @ts-ignore
global.OnSetupMasterSpreadsheetClick = OnSetupMasterSpreadsheetClick;
// @ts-ignore
global.DetectNameTypos = DetectNameTypos;
// @ts-ignore
global.TabulateIndividualBallots = TabulateIndividualBallots;
// @ts-ignore
global.TabulateTeamBallots = TabulateTeamBallots;
// @ts-ignore
global.DisplayMatchResults = DisplayMatchResults;
// @ts-ignore
global.getCourtrooms = getCourtrooms;
// @ts-ignore
global.getTeams = getTeams;
