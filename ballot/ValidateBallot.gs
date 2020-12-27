function LockSubmitCheckbox() {
    const submitLockDescription = "Submit Checkbox Readiness Lock";
    const readyToSubmit = validationIssues().length === 0;
    const currentSheet = SpreadsheetApp.getActive().getSheetByName("Scores");
    let existingProtection = currentSheet.getProtections(SpreadsheetApp.ProtectionType.RANGE).find(pr => pr.getDescription() === submitLockDescription);
    if (!existingProtection) {
        const lockCheckbox = currentSheet.getRange("LockedRange");
        existingProtection = lockCheckbox.protect();
        existingProtection.setDescription(submitLockDescription)
    }

    if (!readyToSubmit) {
        existingProtection.setWarningOnly(false);
        removeNonWhitelistedEditors(existingProtection);
    }
    else {
        existingProtection.setWarningOnly(true);
    }
}

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
    namedRanges.forEach(range => {
        for (let rangeType of rangeTypes) {
            if (range.getName().startsWith(rangeType.prefix)) {
                const blankCellFound = range.getRange().getValues().some(row => row.some(val => val == null || val === ""));
                if (blankCellFound) {
                    rangeType.issueFound = true;
                    break;
                }
            }
        }
    })
    return rangeTypes.filter(rt => rt.issueFound).map(rt => "Missing " + rt.output + ".")
}