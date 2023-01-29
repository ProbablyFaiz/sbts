import { Highlighter, Typeahead } from "react-bootstrap-typeahead";
import React from "react";
import FuzzySet from "fuzzyset.js";

interface FuzzyTypeaheadProps<T> {
  query: string;
  setQuery: (query: string) => void;
  options: T[];
  labelKey?: (option: T) => string;
  descriptionKey?: (option: T) => string;
  fuzzyThreshold?: number;

  [key: string]: any;
}

const FuzzyTypeahead = <T extends {}>({
  query,
  setQuery,
  options,
  labelKey = (option) => option.toString(),
  descriptionKey = null,
  fuzzyThreshold = 0.25,
  ...props
}: FuzzyTypeaheadProps<T>) => {
  // We keep the set in state so we don't have to recompute it every time
  const [fuzzySet, setFuzzySet] = React.useState<FuzzySet | null>(null);
  React.useEffect(() => {
    setFuzzySet(FuzzySet(options.map(labelKey)));
  }, [options]);

  const fuzzyResults = new Set(
    fuzzySet?.get(query, [], fuzzyThreshold).map((match) => match[1]) ?? []
  );
  const results = options.filter((option) =>
    fuzzyResults.has(labelKey(option))
  );
  const match = results.find((option) => labelKey(option) === query);

  return (
    <Typeahead
      selected={match ? [match] : []}
      isValid={!!match}
      onInputChange={(query) => {
        setQuery(query);
      }}
      onChange={(options) => {
        if (options.length > 0) {
          setQuery(labelKey(options[0] as T));
        }
      }}
      labelKey={labelKey}
      filterBy={() => true}
      options={results}
      renderMenuItemChildren={(option) => (
        <>
          <Highlighter search={query}>{labelKey(option as T)}</Highlighter>
          {descriptionKey && (
            <div>
              <small>{descriptionKey(option as T)}</small>
            </div>
          )}
        </>
      )}
      minLength={2}
      {...props}
    />
  );
};

export default FuzzyTypeahead;
