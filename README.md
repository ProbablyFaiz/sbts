# Santa Barbara Tabulation System

SBTS is a comprehensive tabulation system for moot court tournaments built with Google Sheets and Google Apps Script. It
is based on [TABitha](https://github.com/ProbablyFaiz/TABitha), the definitive mock trial tabulation system.

## Current Features

- Fully integrated captains forms, ballots, and central tabulation system
- Automatically computed individual ranking results
- Automatically computed team ranking results across 4 rounds
- Autocomplete suggestions on captains' form based on past rounds of team to prevent typos/different name spellings
  between rounds
- Ballots with all competitor names automatically populated in appropriate locations to aid judge completing
  ballot
- Validation that prevents ballot submission until all scores are entered, with error messages to aid correction.
- On submission of ballot, ballot prevents further changes and marks ballot ready for tabulation pending
  human-validation
- One-click publication of PDF versions of ballots to each team's Google Drive folder after every round
- Full customization of various tournament characteristics, including tournament name, number of rounds, number of
  courtrooms, courtroom names, and ballots per round
- Accessible logs for user-run scripts
