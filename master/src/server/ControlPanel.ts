import { CreateTeamBallotSheets } from "./actions/CreateTeamBallotSheets";
import { EmailBallotFolderLinks } from "./actions/EmailBallotFolderLinks";
import { PublishBallots } from "./actions/PublishBallots";
import SheetLogger from "./context/SheetLogger";

function OnPublishBallotsClick() {
  const ui = SpreadsheetApp.getUi();

  const result = ui.alert(
    "Please confirm",
    "Are you sure you want to publish PDF ballots to the team ballot folders?",
    ui.ButtonSet.YES_NO,
  );

  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(1000)) {
    ui.alert(
      "Please wait",
      "Another ballot publishing operation is in progress. Please wait for it to finish before trying again.",
      ui.ButtonSet.OK,
    );
    return;
  }

  try {
    if (result == ui.Button.YES) {
      ui.showModelessDialog(
        HtmlService.createHtmlOutput(
          "<p>This may take a minute. You can close this window.</p>",
        ),
        "Publishing ballots...",
      );
      PublishBallots();
      const htmlOutput = HtmlService.createHtmlOutput(
        "<p>Ballots were successfully published.</p>",
      )
        .setWidth(250)
        .setHeight(100);
      ui.showModelessDialog(htmlOutput, "Success!");
    } else {
      // User clicked "No" or X in the title bar.
    }
  } finally {
    lock.releaseLock();
  }
}

function OnCreateTeamBallotSheetsClick() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.alert(
    "Please confirm",
    "Are you sure you want to create team ballot folders? Only run this once, prior to the start of the tournament" +
      "and once you have added team numbers and names to the Teams sheet.",
    ui.ButtonSet.YES_NO,
  );
  // Process the user's response.
  if (result == ui.Button.YES) {
    SheetLogger.log("Creating team ballot sheets...");
    CreateTeamBallotSheets();
    const htmlOutput = HtmlService.createHtmlOutput(
      "<p>Successfully created team ballot sheets.</p>",
    )
      .setWidth(250)
      .setHeight(100);
    ui.showModelessDialog(htmlOutput, "Success!");
  } else {
  }
}

function OnEmailBallotSheetsLinksClick() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.alert(
    "Please confirm",
    "Are you sure you want to email links to ballot sheets? Be careful about running this so as to not spam " +
      "the competing teams.",
    ui.ButtonSet.YES_NO,
  );
  // Process the user's response.
  if (result == ui.Button.YES) {
    SheetLogger.log("Emailing ballot sheet links...");
    EmailBallotFolderLinks();
    const htmlOutput = HtmlService.createHtmlOutput(
      "<p>Successfully emailed ballot folder links.</p>",
    )
      .setWidth(250)
      .setHeight(100);
    ui.showModelessDialog(htmlOutput, "Success!");
  } else {
  }
}

export {
  OnPublishBallotsClick,
  OnCreateTeamBallotSheetsClick,
  OnEmailBallotSheetsLinksClick,
};
