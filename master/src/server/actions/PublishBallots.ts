import { CompetitorRole } from "../../Types";
import { SSContext } from "../context/Context";

const PUBLISHER_FANOUT_ENDPOINT = process.env.PUBLISHER_FANOUT_ENDPOINT;
const PUBLISHER_API_KEY = process.env.PUBLISHER_API_KEY;

type PublishBallotResponse = {
  request_id: string;
  ballot_pdf_url: string;
}[];

const PublishBallots = () => {
  const context = new SSContext();
  const groupingsToPublish = context.ballotScoreGroupings.filter(
    (grouping) => !grouping.readout.ballotPdfUrl,
  );
  const groupingsById = new Map(
    groupingsToPublish.map((grouping, idx) => [idx.toString(), grouping]),
  );

  const requestBody = Array.from(groupingsById.entries()).map(
    ([idx, grouping]) => {
      const groups = grouping.groups;
      const readout = grouping.readout;
      const p1 = groups.get(CompetitorRole.P_ISSUE_1)!;
      const p2 = groups.get(CompetitorRole.P_ISSUE_2)!;
      const r1 = groups.get(CompetitorRole.R_ISSUE_1)!;
      const r2 = groups.get(CompetitorRole.R_ISSUE_2)!;

      return {
        request_id: idx,
        template_name: "ballot",
        ballot_fields: {
          round: readout.round,
          p_team: readout.pTeam,
          r_team: readout.rTeam,
          judge_name: readout.judgeName,
          tournament_name: context.tournamentName,
          courtroom: readout.courtroom,
          p1_name: p1.competitorName,
          p2_name: p2.competitorName,
          r1_name: r1.competitorName,
          r2_name: r2.competitorName,
          p1_content: p1.contentOfArgument,
          p1_extemp: p1.extempAbility,
          p1_forensic: p1.forensicSkill,
          p2_content: p2.contentOfArgument,
          p2_extemp: p2.extempAbility,
          p2_forensic: p2.forensicSkill,
          r1_content: r1.contentOfArgument,
          r1_extemp: r1.extempAbility,
          r1_forensic: r1.forensicSkill,
          r2_content: r2.contentOfArgument,
          r2_extemp: r2.extempAbility,
          r2_forensic: r2.forensicSkill,
          p1_comments: p1.writtenFeedback,
          p2_comments: p2.writtenFeedback,
          r1_comments: r1.writtenFeedback,
          r2_comments: r2.writtenFeedback,
          p_total:
            p1.contentOfArgument +
            p1.extempAbility +
            p1.forensicSkill +
            p2.contentOfArgument +
            p2.extempAbility +
            p2.forensicSkill,
          r_total:
            r1.contentOfArgument +
            r1.extempAbility +
            r1.forensicSkill +
            r2.contentOfArgument +
            r2.extempAbility +
            r2.forensicSkill,
        },
      };
    },
  );

  const response = UrlFetchApp.fetch(PUBLISHER_FANOUT_ENDPOINT + "/publish", {
    method: "POST",
    contentType: "application/json",
    payload: JSON.stringify(requestBody),
    headers: {
      Authorization: "Bearer " + PUBLISHER_API_KEY,
    },
  });

  const responseBody: PublishBallotResponse = JSON.parse(
    response.getContentText(),
  );
  const publishedReadouts = responseBody.map(
    ({ request_id }) => groupingsById.get(request_id)?.readout,
  );
  const publishedPdfUrls = responseBody.map(
    ({ ballot_pdf_url }) => ballot_pdf_url,
  );
  context.setReadoutPdfUrls(publishedReadouts, publishedPdfUrls);
};

export { PublishBallots };
