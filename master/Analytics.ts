function CalculateSideBias(teamBallotsRange) {
  const resultsDict = {"Plaintiff": 0, "Defense": 0, "Tie": 0};
  for (let ballot of teamBallotsRange) {
    if (ballot[TeamResultsIndex.Won] == 0.5) {
      resultsDict["Tie"] += ballot[TeamResultsIndex.Won]
    } else {
      resultsDict[ballot[TeamResultsIndex.Side]] += ballot[TeamResultsIndex.Won];
    }
  }
  return [
    ["Plaintiff Wins:", resultsDict["Plaintiff"]],
    ["Defense Wins:", resultsDict["Defense"]],
    ["Ties:", resultsDict["Tie"]]
  ];
}

