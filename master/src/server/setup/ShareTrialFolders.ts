import { SSContext } from "../context/Context";
import { getIdFromUrl } from "../context/Helpers";
import SheetLogger from "../context/SheetLogger";

function ShareTrialFolders() {
  const context = new SSContext();
  context.courtroomRecords.forEach((courtroom) => {
    courtroom.roundFolderLinks.forEach((link) => {
      const folder = DriveApp.getFolderById(getIdFromUrl(link));
      SheetLogger.log(
        `Sharing ${folder.getName()} folder with emails: ${courtroom.bailiffEmails.join(
          ", ",
        )}`,
      );
      folder.addEditors(courtroom.bailiffEmails);
    });
  });
}

export { ShareTrialFolders };
