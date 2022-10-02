const RESULT_SHEETS = ["R1", "R2", "R3", "KR64", "KR32", "KR16", "KR8", "KR4"];

const RESULT_INDEX_MAP = {
  PTeam: 4,
  RTeam: 5,
  PScore: 34,
  RScore: 35,
};

// For each round of a team's results, normalize their results as if there were only BALLOTS_PER_ROUND ballots
const BALLOTS_PER_ROUND = 2;

const TEAM_LOOKUP_SHEET = "Team Numbers";
const RESULTS_SHEET = "Results";

function RankTeams() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const teamLookupMap = getTeamLookupMap(ss);
  const teamResults = getTeamResults(ss);

  const schoolResults = getSchoolResults(teamResults, teamLookupMap);
  writeResults(schoolResults);
}

function getTeamLookupMap(ss) {
  const teamLookupValues = ss
    .getSheetByName(TEAM_LOOKUP_SHEET)
    .getDataRange()
    .getValues();
  const teamLookupMap = {};
  for (let i = 1; i < teamLookupValues.length; i++) {
    const teamLookupValue = teamLookupValues[i];
    const teamNum = teamLookupValue[0].toString().trim();
    const schoolName = teamLookupValue[1].toString().trim();
    teamLookupMap[teamNum] = schoolName;
  }
  return teamLookupMap;
}

function getTeamResults(ss) {
  // Key: team number, value: sum of ballots won by that team
  const teamResults = {};
  for (const resultSheetName of RESULT_SHEETS) {
    // Key: team number, value: array of results for that team for the current round
    const teamBallotResults = {};

    const resultSheet = ss.getSheetByName(resultSheetName);
    const resultValues = resultSheet.getDataRange().getValues();
    for (let i = 1; i < resultValues.length; i++) {
      let currBallot = resultValues[i];
      const pTeam = currBallot[RESULT_INDEX_MAP.PTeam].toString().trim();
      const rTeam = currBallot[RESULT_INDEX_MAP.RTeam].toString().trim();
      const pScore = parseFloat(currBallot[RESULT_INDEX_MAP.PScore]);
      const rScore = parseFloat(currBallot[RESULT_INDEX_MAP.RScore]);

      if (pTeam === "") {
        console.log(`Empty PTeam for ${resultSheetName} at ${i + 1}`);
      }
      if (rTeam === "") {
        console.log(`Empty RTeam for ${resultSheetName} at ${i + 1}`);
      }

      if (!(pTeam in teamBallotResults)) {
        teamBallotResults[pTeam] = [];
      }
      if (!(rTeam in teamBallotResults)) {
        teamBallotResults[rTeam] = [];
      }
      teamBallotResults[pTeam].push(getBallotOutcome(pScore, rScore));
      teamBallotResults[rTeam].push(getBallotOutcome(rScore, pScore));
    }

    // Now normalize the results for each team using BALLOTS_PER_ROUND and store in teamResults
    Object.entries(teamBallotResults).forEach(([teamNum, ballotResults]) => {
      const totalBallots = ballotResults.reduce((acc, curr) => acc + curr, 0);
      if (!(teamNum in teamResults)) {
        teamResults[teamNum] = {
          ballotsWon: 0,
          possibleBallots: 0,
        };
      }
      teamResults[teamNum].ballotsWon +=
        (totalBallots * BALLOTS_PER_ROUND) / ballotResults.length;
      teamResults[teamNum].possibleBallots += BALLOTS_PER_ROUND;
    });
  }
  return teamResults;
}

function getBallotOutcome(teamScore, otherTeamScore) {
  if (teamScore === otherTeamScore) {
    return 0.5;
  }
  return teamScore > otherTeamScore ? 1 : 0;
}

function getSchoolResults(teamResults, teamLookupMap) {
  // Key: school name, value: sum of ballots won by that school
  const schoolResults = {};
  Object.entries(teamResults).forEach(([teamNum, teamResult]) => {
    const schoolName = teamLookupMap[teamNum];
    if (schoolName === undefined) {
      console.log(`Could not find school name for team "${teamNum}"`);
    }
    if (!(schoolName in schoolResults)) {
      schoolResults[schoolName] = {
        ballotsWon: 0,
        possibleBallots: 0,
      };
    }
    schoolResults[schoolName].ballotsWon += teamResult.ballotsWon;
    schoolResults[schoolName].possibleBallots += teamResult.possibleBallots;
  });

  const ballotSum = Object.values(schoolResults).reduce(
    (acc, curr) => acc + curr.ballotsWon,
    0
  );
  console.log(`Sanity check: total ballots: ${ballotSum}`);

  Object.entries(schoolResults).forEach(([schoolName, schoolResult]) => {
    schoolResult.totalPossibleBallots = ballotSum;
    schoolResult.overallScore =
      (schoolResult.ballotsWon / schoolResult.possibleBallots) *
      (schoolResult.ballotsWon / schoolResult.totalPossibleBallots);
  });

  return schoolResults;
}

function writeResults(schoolResults) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const resultSheet = ss.getSheetByName(RESULTS_SHEET);
  const resultRows = Object.entries(schoolResults)
    // .filter(([schoolName, _]) => schoolName !== "HYBRID")
    .sort((a, b) => b[1].overallScore - a[1].overallScore)
    .map(([schoolName, schoolResult]) => [
      schoolName,
      schoolResult.ballotsWon,
      schoolResult.possibleBallots,
      schoolResult.totalPossibleBallots,
      schoolResult.overallScore,
    ]);
  resultSheet
    .getRange(2, 1, resultRows.length, resultRows[0].length)
    .setValues(resultRows);
}
