import React from "react";
import { Highlighter, Typeahead } from "react-bootstrap-typeahead";
import { Form } from "react-bootstrap";
import { TeamInfo } from "../../../Types";

interface TeamTypeaheadProps {
  query: string;
  setQuery: (query: string) => void;
  options: TeamInfo[];

  [key: string]: any;
}

const TeamTypeahead = ({
  query,
  setQuery,
  options,
  ...props
}: TeamTypeaheadProps) => {
  let selectedTeam = options.find((team) => team.teamNumber === query) as
    | TeamInfo
    | undefined;
  return (
    <>
      <Typeahead
        options={options}
        labelKey={(team) => (team as TeamInfo).teamNumber}
        onInputChange={setQuery}
        renderMenuItemChildren={(team) => (
          <>
            <Highlighter search={query}>
              {(team as TeamInfo).teamNumber}
            </Highlighter>
            <span className="text-muted ml-2">
              {(team as TeamInfo).teamName}
            </span>
          </>
        )}
        minLength={1}
        {...props}
      />
      {selectedTeam && (
        <Form.Text className="text-muted">{selectedTeam.teamName}</Form.Text>
      )}
    </>
  );
};

export default TeamTypeahead;
