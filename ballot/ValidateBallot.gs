function ValidationMessages() {
    const issues = validationIssues();
    if (issues.length === 0) {
        return ["Ballot Status: Ready to submit."];
    }
    const validationOutput = [["Ballot Status: Not ready to submit."]]
    issues.forEach(issue => {
        validationOutput.push([issue]);
    });
    return validationOutput;
}

function validationIssues() {
    const rangeTypes = [
        {
            prefix: "BallotRange",
            output: "one or more ballot scores",
            issueFound: false
        },
        {
            prefix: "JudgeNameRange",
            output: "judge name",
            issueFound: false
        },
        {
            prefix: "RankingRange",
            output: "one or more competitor rankings",
            issueFound: false
        }
    ];
    const namedRanges = SpreadsheetApp.getActive().getSheetByName("Scores").getNamedRanges();
    const otherValidationIssues = new Set();
    namedRanges.forEach(range => {
        for (let rangeType of rangeTypes) {
            if (range.getName().startsWith(rangeType.prefix)) {
                const rangeValues = range.getRange().getValues();
                if (rangeType.prefix === "RankingRange") {
                    const rankingValues = rangeValues.map(row => row[0]).filter(name => name !== "");
                    if (rankingValues.length !== new Set(rankingValues).size) {
                        otherValidationIssues.add("Duplicate competitor ranking found.")
                    }
                }
                const blankCellFound = rangeValues.some(row => row.some(val => val == null || val === ""));
                if (blankCellFound) {
                    rangeType.issueFound = true;
                    break;
                }
            }
        }
    });
    const completionValidations = rangeTypes.filter(rt => rt.issueFound).map(rt => "Missing " + rt.output + ".");
    return [...completionValidations, ...otherValidationIssues];
}
