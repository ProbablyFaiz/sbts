import React from "react";
import { Typeahead } from "react-bootstrap-typeahead";

const mathjs = require("mathjs");

interface MathTypeaheadProps {
  query: string;
  setQuery: (query: string) => void;
  isInvalid?: boolean;

  [key: string]: any;
}

const MathTypeahead = ({
  query,
  setQuery,
  isInvalid,
  ...props
}: MathTypeaheadProps) => {
  // Try to evaluate the query as a math expression
  let mathResult = null;
  try {
    mathResult = mathjs.evaluate(query).toString();
  } catch (_) {}
  const options = mathResult === null ? [] : [query, mathResult];
  if (options.length === 2 && options[0] === options[1]) {
    options.pop();
  }

  return (
    <>
      <Typeahead
        {...props}
        selected={options.length > 0 ? [options[0]] : []}
        onInputChange={setQuery}
        onChange={(values) => {
          if (values.length > 0) {
            setQuery(values[0] as string);
          }
        }}
        isInvalid={isInvalid || (query && mathResult === null)}
        isValid={mathResult !== null}
        filterBy={() => true}
        renderMenuItemChildren={(option, _, i) => (
          <>
            {option}
            {i === 1 && mathResult && (
              <span className="text-muted ml-2">
                <small>
                  ({query} = {mathResult})
                </small>
              </span>
            )}
          </>
        )}
        minLength={1}
        options={options}
        placeholder={"Enter a score or expression"}
      />
    </>
  );
};

export default MathTypeahead;
