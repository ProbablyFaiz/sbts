import {
  BallotReadout,
  BallotScoreGrouping,
  Cell,
  CompetitorRole,
  ROLE_NAMES,
  SCORE_CATEGORY_NAMES,
  ScoreGroup,
  ScoringCategory,
} from "../../Types";
import { SSContext } from "../context/Context";

interface ScoreTypo {
  scoreGrouping: BallotScoreGrouping;
  competitorRole: CompetitorRole;
  category: ScoringCategory;
  reason: TypoReason;
  reasonMessage: string;
}

enum TypoReason {
  LESS_THAN_HALF_OF_MAX = "LESS_THAN_HALF_OF_MAX",
}

const MAX_SCORE_BY_CATEGORY = new Map([
  [ScoringCategory.CONTENT_OF_ARGUMENT, 20],
  [ScoringCategory.EXTEMPORANEOUS_ABILITY, 20],
  [ScoringCategory.FORENSIC_SKILL, 10],
]);

function DetectScoreTypos(): Cell[][] {
  const context = new SSContext();

  const scoreTypos: ScoreTypo[] = computeScoreTypos(
    context.ballotScoreGroupings,
  );
  return formatScoreTypos(scoreTypos);
}

const computeScoreTypos = (ballotScoreGroupings: BallotScoreGrouping[]) => {
  const scoreTypos: ScoreTypo[] = [];
  ballotScoreGroupings.forEach((scoreGrouping) => {
    scoreGrouping.groups.forEach((group) => {
      MAX_SCORE_BY_CATEGORY.forEach((maxScore, category) => {
        const score = group[category];
        if (score <= maxScore / 2) {
          scoreTypos.push({
            scoreGrouping,
            competitorRole: group.role,
            category,
            reason: TypoReason.LESS_THAN_HALF_OF_MAX,
            reasonMessage: getReasonMessage(
              TypoReason.LESS_THAN_HALF_OF_MAX,
              score,
              maxScore,
            ),
          });
        }
      });
    });
  });
  return scoreTypos;
};

const getReasonMessage = (
  reason: TypoReason,
  score: number,
  maxScore: number,
) => {
  switch (reason) {
    case TypoReason.LESS_THAN_HALF_OF_MAX:
      return `Score (${score}) is less than half of the max score (${maxScore}).`;
  }
};

const formatScoreTypos = (scoreTypos: ScoreTypo[]): Cell[][] => {
  return scoreTypos.map((scoreTypo) => {
    const group = scoreTypo.scoreGrouping.groups.get(scoreTypo.competitorRole);
    const readout = scoreTypo.scoreGrouping.readout;
    return [
      readout.judgeName,
      readout.round,
      ROLE_NAMES.get(scoreTypo.competitorRole),
      group.competitorName,
      SCORE_CATEGORY_NAMES.get(scoreTypo.category),
      scoreTypo.reasonMessage,
    ];
  });
};

export default DetectScoreTypos;
