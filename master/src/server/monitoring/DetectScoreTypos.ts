import { BallotReadout, CompetitorRole, ScoreGroup } from "../../Types";

interface ScoreTypo {
  readout: BallotReadout;
}

enum TypoReason {
  LESS_THAN_HALF_OF_MAX = "LESS_THAN_HALF_OF_MAX",
}

const detectScoreTypos = (ballotScoreGroupings: any[]) => {};
