import {
  BallotListRange,
  BallotReadout,
  BallotScoreGrouping,
  Cell,
  CompetitorRole,
} from "../../Types";
import { SSContext } from "../context/Context";
import { Spreadsheet, setAndBackfillRange } from "../context/Helpers";

const PUBLISHER_FANOUT_ENDPOINT = process.env.PUBLISHER_FANOUT_ENDPOINT;
const PUBLISHER_API_KEY = process.env.PUBLISHER_API_KEY;

type PublishBallotResponse = {
  request_id: string;
  bucket_url: string;
}[];

const createBallotPdfs = (
  ballotScoreGroupings: BallotScoreGrouping[],
  tournamentName: string,
) => {
  const groupingsToPublish = ballotScoreGroupings.filter(
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
          tournament_name: tournamentName,
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
          p_total: grouping.pTotal,
          r_total: grouping.rTotal,
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
  const publishedReadouts: BallotReadout[] = responseBody.map(
    ({ request_id }) => {
      const grouping = groupingsById.get(request_id)!;
      grouping.readout.ballotPdfUrl = responseBody[request_id].bucket_url;
      return grouping.readout;
    },
  );
  return publishedReadouts;
};

const updateTeamBallotSheet = (
  teamScoreGroupings: BallotScoreGrouping[],
  teamNumber: string,
  ballotListSpreadsheet: Spreadsheet,
) => {
  const rows = teamScoreGroupings.map((grouping) =>
    getBallotRow(grouping, teamNumber),
  );
  const listRange = ballotListSpreadsheet.getRangeByName(
    BallotListRange.BallotList,
  );
  listRange.clearContent();
  setAndBackfillRange(listRange, rows);
};

const getBallotRow = (
  teamScoreGrouping: BallotScoreGrouping,
  teamNumber: string,
): Cell[] => {
  const pMargin = teamScoreGrouping.pTotal - teamScoreGrouping.rTotal;
  const isPTeam = teamScoreGrouping.readout.pTeam === teamNumber;
  let outcome: string;
  if (pMargin === 0) {
    outcome = "Draw";
  } else if (pMargin > 0) {
    outcome = isPTeam ? "Win" : "Loss";
  } else {
    outcome = isPTeam ? "Loss" : "Win";
  }
  return [
    teamScoreGrouping.readout.round,
    teamScoreGrouping.readout.judgeName,
    isPTeam ? teamScoreGrouping.readout.rTeam : teamScoreGrouping.readout.pTeam,
    outcome,
    teamScoreGrouping.readout.ballotPdfUrl,
  ];
};

function PublishBallots() {
  const context = new SSContext();
  const ballotScoreGroupings = context.ballotScoreGroupings;
  const groupingsToPublish = ballotScoreGroupings.filter(
    (grouping) => !grouping.readout.ballotPdfUrl,
  );
  const publishedReadouts = createBallotPdfs(
    groupingsToPublish,
    context.tournamentName,
  );
  context.setReadoutPdfUrls(publishedReadouts);

  const teamsWithNewBallots = new Set<string>();
  publishedReadouts.forEach((readout) => {
    teamsWithNewBallots.add(readout.pTeam);
    teamsWithNewBallots.add(readout.rTeam);
  });
  teamsWithNewBallots.forEach((teamNumber) => {
    const teamScoreGroupings = ballotScoreGroupings.filter(
      (grouping) =>
        grouping.readout.pTeam === teamNumber ||
        grouping.readout.rTeam === teamNumber,
    );
    const teamBallotSheet = context.teamBallotSheet(teamNumber);
    updateTeamBallotSheet(teamScoreGroupings, teamNumber, teamBallotSheet);
  });
}

export { PublishBallots };
