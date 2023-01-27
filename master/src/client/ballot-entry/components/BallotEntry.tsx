import React, { useEffect, useState } from "react";
import { Typeahead, Highlighter } from "react-bootstrap-typeahead";
import { Button, Col, Container, Form, Row } from "react-bootstrap";

// This is a wrapper for google.script.run that lets us use promises.
import { serverFunctions } from "../../utils/serverFunctions";
import {
  CourtroomInfo,
  TeamInfo,
  BallotState,
  TeamState,
  RequiredBallotState,
} from "../../../Types";
import FuzzyTypeahead from "./FuzzyTypeahead";
import TeamTypeahead from "./TeamTypeahead";
import MathTypeahead from "./MathTypeahead";

const mathjs = require("mathjs");

const BallotEntry = () => {
  const [ballot, setBallot] = useState<BallotState>({
    courtroom: "",
    round: "",
    judgeName: "",
    ballotPdf: null,
    petitioner: {
      teamNumber: "",
      issue1Name: "",
      issue1ScoreExpr: "",
      issue2Name: "",
      issue2ScoreExpr: "",
    },
    respondent: {
      teamNumber: "",
      issue1Name: "",
      issue1ScoreExpr: "",
      issue2Name: "",
      issue2ScoreExpr: "",
    },
  });
  const [possibleCourtrooms, setPossibleCourtrooms] = useState<CourtroomInfo[]>(
    []
  );
  const [possibleTeams, setPossibleTeams] = useState<TeamInfo[]>([]);
  const [possibleRoundNames, setPossibleRoundNames] = useState<string[]>([]);
  const [possibleJudgeNames, setPossibleJudgeNames] = useState<string[]>([]);

  const setBallotField = (field: keyof BallotState) => (value: any) => {
    const newBallot = { ...ballot, [field]: value };
    // if (field === "courtroom") {
    //   newBallot.petitioner.teamNumber = "12";
    // }
    setBallot(newBallot);
  };

  const setTeamField =
    (team: "petitioner" | "respondent") =>
    (field: keyof TeamState) =>
    (value: string) => {
      setBallot({
        ...ballot,
        [team]: {
          ...ballot[team],
          [field]: value,
        },
      });
    };

  useEffect(() => {
    serverFunctions.getCourtrooms().then(setPossibleCourtrooms);
    serverFunctions.getTeams().then(setPossibleTeams);
    serverFunctions.getRoundNames().then(setPossibleRoundNames);
    serverFunctions.getJudgeNames().then(setPossibleJudgeNames);
  }, []);

  const submitBallot = () => {
    try {
      const ballotToSubmit: RequiredBallotState = {
        ...ballot,
        petitioner: {
          ...ballot.petitioner,
          issue1Score: mathjs.evaluate(ballot.petitioner.issue1ScoreExpr),
          issue2Score: mathjs.evaluate(ballot.petitioner.issue2ScoreExpr),
        },
        respondent: {
          ...ballot.respondent,
          issue1Score: mathjs.evaluate(ballot.respondent.issue1ScoreExpr),
          issue2Score: mathjs.evaluate(ballot.respondent.issue2ScoreExpr),
        },
      };
      serverFunctions.submitBallot(ballotToSubmit).then((response) => {
        // TODO: Indicate success to user
        console.log(response);
      });
    } catch (e) {
      // TODO: Indicate error to user
      console.error(e);
    }
  };
  
  const handleSubmit = () => {
    // Check that all fields are filled out
    if (
      ballot.courtroom === "" ||
      ballot.round === "" ||
      ballot.judgeName === "" ||
      ballot.petitioner.teamNumber === "" ||
      ballot.petitioner.issue1Name === "" ||
      ballot.petitioner.issue1ScoreExpr === "" ||
      ballot.petitioner.issue2Name === "" ||
      ballot.petitioner.issue2ScoreExpr === "" ||
      ballot.respondent.teamNumber === "" ||
      ballot.respondent.issue1Name === "" ||
      ballot.respondent.issue1ScoreExpr === "" ||
      ballot.respondent.issue2Name === "" ||
      ballot.respondent.issue2ScoreExpr === ""
    ) {
      console.error("Not all fields are filled out");
      // TODO: Show this to the user
      return;
    }
    submitBallot();
  };

  return (
    <div>
      <p>
        Scores can be input as either a number or a summation of numbers. For
        example, you can enter <code>1+2+3+4</code> to get a total of 10, or
        just <code>10</code>.
      </p>
      <Form.Group>
        <Container style={{ marginBottom: "50px" }} className="p-0 ml-0 mr-0">
          <Row>
            <Col>
              <Form.Label>Courtroom</Form.Label>
              <FuzzyTypeahead
                id="courtroom-typeahead"
                query={ballot.courtroom}
                setQuery={setBallotField("courtroom")}
                options={possibleCourtrooms}
                labelKey={(courtroom) => courtroom.name}
                placeholder="Enter the courtroom..."
              />
            </Col>
            <Col>
              <Form.Label>Round</Form.Label>
              <FuzzyTypeahead
                id="round-typeahead"
                query={ballot.round}
                setQuery={setBallotField("round")}
                options={possibleRoundNames}
                placeholder="Enter the round..."
              />
            </Col>
          </Row>
          <Row className="pt-2">
            <Col>
              <Form.Label>Judge Name</Form.Label>
              <FuzzyTypeahead
                id="judge-name-typeahead"
                query={ballot.judgeName}
                setQuery={setBallotField("judgeName")}
                options={possibleJudgeNames}
                placeholder="Enter the judge's name..."
                minLength={2}
              />
            </Col>
          </Row>
          <hr />
          <Row>
            <Col>
              <Form.Label>Petitioner Team #</Form.Label>
              <TeamTypeahead
                id="petitioner-team-typeahead"
                query={ballot.petitioner.teamNumber}
                setQuery={setTeamField("petitioner")("teamNumber")}
                options={possibleTeams}
                placeholder="Enter the petitioner team..."
              />
            </Col>
          </Row>
          <Row className="pt-2">
            <Col>
              <Form.Label>Petitioner Issue 1 Name:</Form.Label>
              <Typeahead
                id="petitioner-issue-1-name-typeahead"
                options={["Bob", "John", "Jane", "Sally", "Joe"]}
                minLength={2}
                placeholder="Enter the speaker's name..."
              />
            </Col>
            <Col>
              <Form.Label>Petitioner Issue 1 Score:</Form.Label>
              <MathTypeahead
                id="petitioner-issue-1-score-typeahead"
                query={ballot.petitioner.issue1ScoreExpr}
                setQuery={setTeamField("petitioner")("issue1ScoreExpr")}
              />
            </Col>
          </Row>
          <Row className="pt-2">
            <Col>
              <Form.Label>Petitioner Issue 2 Name:</Form.Label>
              <Typeahead
                id="petitioner-issue-2-name-typeahead"
                options={["Bob", "John", "Jane", "Sally", "Joe"]}
                minLength={2}
                placeholder="Enter the speaker's name..."
              />
            </Col>
            <Col>
              <Form.Label>Petitioner Issue 2 Score:</Form.Label>
              <MathTypeahead
                id="petitioner-issue-2-score-typeahead"
                query={ballot.petitioner.issue2ScoreExpr}
                setQuery={setTeamField("petitioner")("issue2ScoreExpr")}
              />
            </Col>
          </Row>
          <hr />
          <Row>
            <Col>
              <Form.Label>Respondent Team #</Form.Label>
              <TeamTypeahead
                id="respondent-team-typeahead"
                query={ballot.respondent.teamNumber}
                setQuery={setTeamField("respondent")("teamNumber")}
                options={possibleTeams}
                placeholder="Enter the respondent team..."
              />
            </Col>
          </Row>
          <Row className="pt-2">
            <Col>
              <Form.Label>Respondent Issue 1 Name:</Form.Label>
              <Typeahead
                id="respondent-issue-1-name-typeahead"
                options={["Bob", "John", "Jane", "Sally", "Joe"]}
                minLength={2}
                placeholder="Enter the speaker's name..."
              />
            </Col>
            <Col>
              <Form.Label>Respondent Issue 1 Score:</Form.Label>
              <MathTypeahead
                id="respondent-issue-1-score-typeahead"
                query={ballot.respondent.issue1ScoreExpr}
                setQuery={setTeamField("respondent")("issue1ScoreExpr")}
              />
            </Col>
          </Row>
          <Row className="pt-2">
            <Col>
              <Form.Label>Respondent Issue 2 Name:</Form.Label>
              <Typeahead
                id="respondent-issue-2-name-typeahead"
                options={["Bob", "John", "Jane", "Sally", "Joe"]}
                minLength={2}
                placeholder="Enter the speaker's name..."
              />
            </Col>
            <Col>
              <Form.Label>Respondent Issue 2 Score:</Form.Label>
              <MathTypeahead
                id="respondent-issue-2-score-typeahead"
                query={ballot.respondent.issue2ScoreExpr}
                setQuery={setTeamField("respondent")("issue2ScoreExpr")}
              />
            </Col>
          </Row>
          <hr />
          <Row className="pb-2">
            <Col>
              <Form.Label>Upload the scanned ballot PDF (optional):</Form.Label>
              <Form.Control
                type="file"
                accept="application/pdf application/x-pdf"
                onChange={(e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    setBallotField("ballotPdf")(file);
                  }
                }}
              />
            </Col>
          </Row>
        </Container>
        <div
          style={{ height: "50px" }}
          className="fixed-bottom bg-white border-top border-3 text-right"
        >
          <Button className="mt-1 mr-2" variant="primary" type="submit" onClick={handleSubmit}>
            Submit
          </Button>
        </div>
      </Form.Group>
    </div>
  );
};

export default BallotEntry;
