const OUTPUT_SHEET = "Competitor Names By Team";

function GroupCompetitorNames() {
    const context = new AutocompleteContext();
    const competitorNamesByTeam: Record<string, Set<string>> = {};
    context.captainsFormData.forEach(record => {
        if (!competitorNamesByTeam[record.pTeamNum]) competitorNamesByTeam[record.pTeamNum] = new Set();
        record.pNames.forEach(name => name?.length > 0 && competitorNamesByTeam[record.pTeamNum].add(name))

        if (!competitorNamesByTeam[record.dTeamNum]) competitorNamesByTeam[record.dTeamNum] = new Set();
        record.dNames.forEach(name => name?.length > 0 && competitorNamesByTeam[record.dTeamNum].add(name))
    });
    const outputSheet = context.autocompleteSpreadsheet.getSheetByName(OUTPUT_SHEET)!;
    Object.entries(competitorNamesByTeam)
        .forEach(([teamNum, nameSet], i) => {
            const headerRange = outputSheet.getRange(0, i);
            headerRange.setValue(teamNum);
            const namesRange = outputSheet.getRange(1, i, nameSet.size, 1);
            namesRange.setValues(Array.from(nameSet.values()).map(name => [name]));
            context.autocompleteSpreadsheet.setNamedRange(teamNum, namesRange);
        });
}

