import { SSContext } from "../context/Context";

const PUBLISHER_FANOUT_ENDPOINT = process.env.PUBLISHER_FANOUT_ENDPOINT;
const PUBLISHER_FANOUT_API_KEY = process.env.PUBLISHER_FANOUT_API_KEY;

type PublishBallotResponse = {
  request_id: string;
  ballot_pdf_url: string;
}[];

const PublishBallots = () => {
  const context = new SSContext();
  const readoutsToPublish = context.allReadouts.filter(
    (readout) => !readout.ballotPdfUrl,
  );
  const readoutsById = new Map(
    readoutsToPublish.map((readout, idx) => [idx.toString(), readout]),
  );
  const requestBody = Array.from(readoutsById.entries()).map(
    ([idx, readout]) => ({
      request_id: idx,
      template_name: "ballot",
      ballot_fields: {
        round: readout.round,
        p_team: readout.pTeam,
        r_team: readout.rTeam,
        judge_name: readout.judgeName,
        tournament_name: context.tournamentName,
        courtroom: readout.courtroom,
        p_issue_1_name: readout.pIssue1Name,
        p_issue_2_name: readout.pIssue2Name,
        r_issue_1_name: readout.rIssue1Name,
        r_issue_2_name: readout.rIssue2Name,
        p_issue_1_scores: readout.pIssue1Scores,
        p_issue_2_scores: readout.pIssue2Scores,
        r_issue_1_scores: readout.rIssue1Scores,
        r_issue_2_scores: readout.rIssue2Scores,
        p_issue_1_comments: readout.pIssue1WrittenFeedback,
        p_issue_2_comments: readout.pIssue2WrittenFeedback,
        r_issue_1_comments: readout.rIssue1WrittenFeedback,
        r_issue_2_comments: readout.rIssue2WrittenFeedback,
      },
    }),
  );

  const response = UrlFetchApp.fetch(PUBLISHER_FANOUT_ENDPOINT + "/publish", {
    method: "POST",
    contentType: "application/json",
    payload: JSON.stringify(requestBody),
    headers: {
      Authorization: "Bearer " + PUBLISHER_FANOUT_API_KEY,
    },
  });

  const responseBody: PublishBallotResponse = JSON.parse(
    response.getContentText(),
  );
  const publishedReadouts = responseBody.map(({ request_id }) =>
    readoutsById.get(request_id),
  );
  const publishedPdfUrls = responseBody.map(
    ({ ballot_pdf_url }) => ballot_pdf_url,
  );
  context.setReadoutPdfUrls(publishedReadouts, publishedPdfUrls);
};
