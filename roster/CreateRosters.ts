function CreateRosters() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    const rosterInfoRange = sheet.getRangeByName("RosterInfo");
    const rootFolder = DriveApp.getFolderById(getIdFromUrl(sheet.getRangeByName("RosterRootFolderLink").getValue()))
    const rosterTemplate = DriveApp.getFileById(getIdFromUrl(sheet.getRangeByName("RosterTemplateLink").getValue()))
    rosterInfoRange.getValues().forEach((row, rowNum) => {
        const teamName = row[RosterInfoIndex.TeamName];
        console.log(`Creating roster folder for ${teamName}`);
        const teamFolder = rootFolder.createFolder(teamName);
        teamFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        const folderLinkRange = rosterInfoRange.getCell(rowNum + 1, RosterInfoIndex.RosterFolder + 1);
        folderLinkRange.setValue(teamFolder.getUrl());
        for (let i = 0; i < row[RosterInfoIndex.NumberOfTeams]; i++) {
            const rosterFile = rosterTemplate.makeCopy(`${teamName} Roster ${i + 1}`, teamFolder);
            rosterFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
            const rosterLinkRange = rosterInfoRange.getCell(rowNum + 1, RosterInfoIndex.IndividualRosterStart + 1 + i);
            rosterLinkRange.setValue(rosterFile.getUrl());
        }
    })
}

function getIdFromUrl(url: string): string {
    return url.match(/[-\w]{25,}/)?.toString() ?? "";
}

