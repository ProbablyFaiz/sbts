const NUM_BALLOTS = 2;
const ROUND_INDEX = 0;
const JUDGE_NAME_INDEX = 1;
const TEAM_NUMBER_INDEX = 2;

const normalizeTotal = (total, factor) => {
    return Math.round(((total * factor) + Number.EPSILON) * 100) / 100
}

function TABULATEINDIVIDUALBALLOTS() {

}

TABULATEINDIVIDUALBALLOTS();
