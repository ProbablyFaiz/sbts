function CalculateSideBias(teamBallotsRange) {
  const resultsDict = {"Plaintiff": 0, "Defense": 0, "Tie": 0};
  for (let ballot of teamBallotsRange) {
    if (ballot[TeamResultsIndices.WON] == 0.5) {
      resultsDict["Tie"] += ballot[TeamResultsIndices.WON]
    } else {
      resultsDict[ballot[TeamResultsIndices.SIDE]] += ballot[TeamResultsIndices.WON];
    }
  }
  return [
    ["Plaintiff Wins:", resultsDict["Plaintiff"]],
    ["Defense Wins:", resultsDict["Defense"]],
    ["Ties:", resultsDict["Tie"]]
  ];
}

const WITNESS_NAME_MAP = {
  "Casey Soto": "Soto, Casy",
  "Sam Arnould": "Arnould, Sam",
  "Dr. R Cannon": "Cannon, R.",
  "Austin Lewis": "Lewis, Austin",
  "Blaire Osbourne": "Osborne, Blaire",
  "Riley Adkins-O'Keefe": "Adkins-O'Keefe, Riley",
  "Angel Rodriguez": "Rodriguez, Angel",
  "Dr. Jimin Kwon": "Kwon, Jimin",
  "Lonnie Paras": "Paras, Lonnie",
  "Danny Francazio": "Francazio, Danny",
  "Harper Martini": "Martini, Harper"
}


const EXPERT_PRIORITY_MAP = {
  "Yes": "y",
  "No": "n"
}

const CHARGE_MAP = { // Illiterate asshole who made the tab summary sheet makes me do this
  "Battery": "Battery",
  "Negligence Per Se": "Neglegence Per Se"
}

function summarizeCaptains(captainsRange) {
  const singleForms = captainsRange.filter((row, index) => index % 2 == 1);
  const outputRows = [];
  singleForms.forEach(row => {
    outputRows.push([row[9], WITNESS_NAME_MAP[row[3]], WITNESS_NAME_MAP[row[6]]], [row[9], WITNESS_NAME_MAP[row[4]], WITNESS_NAME_MAP[row[7]]], [row[9], WITNESS_NAME_MAP[row[5]], WITNESS_NAME_MAP[row[8]]]);
  });
  return outputRows;
}

function summarizeChargeAndExpert(captainsRange) {
  const singleForms = captainsRange.filter((row, index) => index % 2 == 1);
  const outputRows = [];
  singleForms.forEach(row => {
    outputRows.push([row[9], CHARGE_MAP[row[1]]], [row[9], EXPERT_PRIORITY_MAP[row[10]]], [row[9], EXPERT_PRIORITY_MAP[row[11]]]);
  });
  return outputRows;
}