import React from "react";
import { Form } from "react-bootstrap";
import { Highlighter, Typeahead } from "react-bootstrap-typeahead";
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
        selected={selectedTeam ? [selectedTeam] : []}
        isValid={!!selectedTeam}
        options={options}
        labelKey={(team) => (team as TeamInfo).teamNumber}
        onInputChange={setQuery}
        onChange={(teams) => {
          if (teams.length > 0) {
            setQuery((teams[0] as TeamInfo).teamNumber);
          }
        }}
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
