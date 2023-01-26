import React from "react";
import { Typeahead } from "react-bootstrap-typeahead";

const mathjs = require("mathjs");

interface MathTypeaheadProps {
  query: string;
  setQuery: (query: string) => void;

  [key: string]: any;
}

const MathTypeahead = ({ query, setQuery, ...props }: MathTypeaheadProps) => {
  // Try to evaluate the query as a math expression
  let mathResult = null;
  try {
    mathResult = mathjs.evaluate(query).toString();
    mathResult = mathResult === query ? null : mathResult;
  } catch (e) {
    // Ignore
  }

  return (
    <>
      <Typeahead
        onInputChange={setQuery}
        filterBy={() => true}
        renderMenuItemChildren={(option, _, i) => (
          <>
            {option}
            {i == 1 && mathResult && (
              <span className="text-muted ml-2">
                <small>
                  ({query} = {mathResult})
                </small>
              </span>
            )}
          </>
        )}
        minLength={1}
        options={mathResult === null ? [] : [query, mathResult]}
        placeholder={"Enter a score or expression"}
        {...props}
      />
    </>
  );
};

export default MathTypeahead;
