import { CompetitorRole, NonSheetBallotReadout, ScoreGroup } from "../../Types";


interface ScoreTypo {
  readout: NonSheetBallotReadout;
}

enum TypoReason {
    LESS_THAN_HALF_OF_MAX = "LESS_THAN_HALF_OF_MAX",
}

  


const SCORE_GROUP_KEYS: Map<CompetitorRole, {
    name: keyof NonSheetBallotReadout;
    scoreArr: keyof NonSheetBallotReadout;
  }> = new Map([
    [CompetitorRole.P_ISSUE_1, {
      name: "pIssue1Name",
      scoreArr: "pIssue1Scores"
    }],
    [CompetitorRole.P_ISSUE_2, {
      name: "pIssue2Name",
      scoreArr: "pIssue2Scores"
    }],
    [CompetitorRole.R_ISSUE_1, {
      name: "rIssue1Name",
      scoreArr: "rIssue1Scores"
    }],
    [CompetitorRole.R_ISSUE_2, {
      name: "rIssue2Name",
      scoreArr: "rIssue2Scores"
    }]
  ])
  
  const SCORE_IDX_MAP: Map<keyof ScoreGroup, number> = new Map([
    ["contentOfArgument", 0],
    ["extempAbility", 1],
    ["forensicSkill", 2]
  ])
  

const getScoreGroups = (readout: NonSheetBallotReadout): ScoreGroup[] => {
    return [];
}
const detectScoreTypos = (ballotReadouts: NonSheetBallotReadout[]) => {

};
