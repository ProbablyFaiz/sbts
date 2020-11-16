function FILTERRAWBALLOTS(ballotIngressRange) {
    return ballotIngressRange.filter(ballot => ballot[7] == true);
}
