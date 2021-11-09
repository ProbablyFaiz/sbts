const FAILOVER_MAP = {
    "PAttorneys": "FailoverPAttorneys",
    "DAttorneys": "FailoverDAttorneys",
    "PWitnesses": "FailoverPWitnesses",
    "DWitnesses": "FailoverDWitnesses",
    "PWitnessNames": "FailoverPWitnessNames",
    "DWitnessNames": "FailoverDWitnessNames",
}

function RefreshFailoverNames() {
    const context = new OrchestratorContext();
    const ballotRecords = context.ballotData;
    ballotRecords.forEach(ballotInfo => {
        const ballot = SpreadsheetApp.openByUrl(ballotInfo.ballotLink);
        const captainsForm = SpreadsheetApp.openByUrl(ballot.getRangeByName("CaptainsFormUrlRange").getValue());
        Object.entries(FAILOVER_MAP).forEach(([cptRangeName, ballotRangeName]) => {
            Logger.log(`Updating failover for ballot ${ballotInfo.ballotLink}`);
            const cptFormValues = captainsForm.getRangeByName(cptRangeName).getValues();
            ballot.getRangeByName(ballotRangeName).setValues(cptFormValues);
        })
    });
}

function EnableFullFailover() {
    RefreshFailoverNames();
    SpreadsheetApp.flush();
    const context = new OrchestratorContext();
    const ballotRecords = context.ballotData;
    ballotRecords.forEach(ballotInfo => {
        const ballot = SpreadsheetApp.openByUrl(ballotInfo.ballotLink);
        ballot.getRangeByName("SystemFailover").setValue(true);
    });
}

function DisableFullFailover() {
    const context = new OrchestratorContext();
    const ballotRecords = context.ballotData;
    ballotRecords.forEach(ballotInfo => {
        const ballot = SpreadsheetApp.openByUrl(ballotInfo.ballotLink);
        ballot.getRangeByName("SystemFailover").setValue(false);
    });
}
