function ShareTrialFolders() {
    const context = new Context();
    context.courtroomRecords.forEach(courtroom => {
        courtroom.roundFolderLinks.forEach(link => {
            const folder = DriveApp.getFolderById(getIdFromUrl(link));
            SheetLogger.log(`Sharing ${folder.getName()} folder with emails: ${courtroom.bailiffEmails.join(", ")}`);
            folder.addEditors(courtroom.bailiffEmails);
        })
    })
}
