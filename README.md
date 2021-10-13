# TABitha

*A surprisingly well-featured tabulation system for AMTA mock trial tournaments built with Google Sheets and Google Apps Script*

Built for use at Mocktopia V (January 2021) and Mocktopia VI (November 2021).

## Current Features
- Fully integrated captains forms, ballots, and central tabulation system
- Fully computed individual ranking results
- Fully computed team ranking results across all 4 rounds
- Automatic creation of round pairings (including resolving impermissible matchups) for Rounds 2-4 fully to specification of the AMTA Tabulation Manual
- Autocomplete suggestions on captains' form based on past rounds of team to prevent typos/different name spellings between rounds
- Typo/anomaly detection on individual ranking names
- Ballots with all competitor and witness names in appropriate locations to aid judge completing ballot
- Ballots offer dropdown of names of round's competitors when completing individual rankings instead of freeform text
- Validation that prevents ballot submission until all scores are entered and rankings have been correctly completed, with error messages to aid correction.
- On submission of ballot, ballot prevents further changes and marks ballot ready for tabulation pending human-validation
- Automatic publication of PDF versions of ballots to each team's Google Drive folder after every round
- Real-time analytics about side bias and witness call frequency
- Full customization of various tournament characteristics, including tournament name, number of rounds, number of courtrooms, courtroom names, ballots per trial, and party names (Prosecution/Plaintiff)
- Accessible logs for user-run scripts

## How to Use

While all the code behind this system is freely available in this repository (subject to the terms of the GPL license), the Google Sheets spreadsheets that they interact to form the full system are not currently public. I hope to set up a reasonable means of doing so in the near future, but if you are interested in using the system in the meantime, please contact me at `faiz at faizsurani dot com` and we can talk more.
