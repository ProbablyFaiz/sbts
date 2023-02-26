import {
  BallotInfo,
  BallotSpreadsheet,
  Cell,
  CourtroomInfo,
  IndividualBallotResult,
  MasterRange,
  MasterSpreadsheet,
  NonSheetBallotReadout,
  NonSheetBallotResult,
  RequiredBallotState,
  TeamBallotResult,
  TeamInfo,
  TeamSummary,
} from "../../Types";
import { memoize } from "./CacheHelper";
import {
  compactRange,
  getIdFromUrl,
  getOrCreateChildFolder,
  GoogleFile,
  sheetForFile,
} from "./Helpers";
import { getBallotPdfName } from "../actions/PublishTeamBallots";

interface IContext {
  teamInfo: Record<string, TeamInfo>;
  setTeamBallotFolderLink: (
    teamNumber: string,
    ballotFolderLink: string
  ) => boolean;
  tournamentEmail: string;
  courtroomRecords: CourtroomInfo[];
  ballotRecords: BallotInfo[];
  teamBallotResults: TeamBallotResult[];
  individualBallotResults: IndividualBallotResult[];
  judgeNames: string[];
  roundNames: string[];
  roundsCompleted: number;
  firstPartyName: string;
  secondPartyName: string;
  tournamentName: string;
  teamResults: Record<string, TeamSummary>;
  addEnteredBallot: (ballotState: RequiredBallotState) => void;
}

const BYE_BUST_SCHOOL_NAME = "Bye Bust";
const PAST_OPPONENTS_SEPARATOR = ", ";

const ENTERED_BALLOTS_SHEET = "Entered Ballots";

class SSContext implements IContext {
  @memoize
  get teamInfo(): Record<string, TeamInfo> {
    const teamInfoMapping: Record<string, TeamInfo> = {};
    const ballotCompetitorNames = this.individualBallotResults.reduce(
      (acc, result) => {
        if (!acc[result.teamNumber]) {
          acc[result.teamNumber] = [];
        }
        // if already in the array, don't add it again
        if (acc[result.teamNumber].indexOf(result.competitorName) === -1) {
          acc[result.teamNumber].push(result.competitorName);
        }
        return acc;
      },
      {} as Record<string, string[]>
    );
    compactRange(this.getRangeValues(MasterRange.TeamInfo) ?? []).forEach(
      (row) => {
        const competitorNames = row[3]
          .split(",")
          .concat(ballotCompetitorNames[row[0]] ?? [])
          .map((s) => s.trim());
        // Filter duplicates and empty strings and count freqs
        const nameFreqs = competitorNames.reduce((acc, name) => {
          if (!name) {
            return acc;
          }
          if (!acc[name]) {
            acc[name] = 0;
          }
          acc[name]++;
          return acc;
        }, {} as Record<string, number>);
        const freqSortedNames = Object.keys(nameFreqs).sort((a, b) => {
          if (nameFreqs[a] !== nameFreqs[b]) {
            return nameFreqs[b] - nameFreqs[a];
          }
          // Otherwise, the one that first occurs in competitorNames wins
          return competitorNames.indexOf(a) - competitorNames.indexOf(b);
        });
        teamInfoMapping[row[0]] = {
          teamNumber: row[0],
          teamName: row[1],
          schoolName: row[2],
          byeBust: row[2] === BYE_BUST_SCHOOL_NAME, // For now, we'll just use a special school name
          competitorNames: freqSortedNames,
          emails: row[4],
          ballotFolderLink: row[5],
        };
      }
    );
    return teamInfoMapping;
  }

  @memoize
  get teamResults(): Record<string, TeamSummary> {
    const teamResultMapping: Record<string, TeamSummary> = {};
    compactRange(this.getRangeValues(MasterRange.TeamResults) ?? []).forEach(
      (row) => {
        teamResultMapping[row[1]] = {
          ballotsWon: parseFloat(row[3]),
          combinedStrength: parseFloat(row[4]),
          pointDifferential: parseFloat(row[5]),
          timesPlaintiff: parseInt(row[6]),
          timesDefense: parseInt(row[7]),
          pastOpponents: row[8].split(PAST_OPPONENTS_SEPARATOR),
          byeBust: this.teamInfo[row[1]].byeBust,
        };
      }
    );
    return teamResultMapping;
  }

  @memoize
  get teamBallotResults(): TeamBallotResult[] {
    return compactRange(this.getRangeValues(MasterRange.TeamBallots) ?? []).map(
      this.teamResultRowToResult
    );
  }

  private teamResultRowToResult(row: string[]): TeamBallotResult {
    return {
      round: row[0],
      judgeName: row[1],
      teamNumber: row[2],
      opponentTeamNumber: row[3],
      side: row[4],
      pd: parseFloat(row[5]),
      won: parseFloat(row[6]),
      courtroom: row[7],
      ballotLink: row[8],
    };
  }

  @memoize
  get individualBallotResults(): IndividualBallotResult[] {
    return compactRange(
      this.getRangeValues(MasterRange.IndividualBallots) ?? []
    ).map((row) => {
      return {
        round: row[0],
        judgeName: row[1],
        teamNumber: row[2],
        competitorName: row[3],
        side: row[4],
        score: parseFloat(row[6]),
        courtroom: row[7],
      };
    });
  }

  @memoize
  get judgeNames(): string[] {
    return Array.from(
      new Set(this.teamBallotResults.map((ballot) => ballot.judgeName))
    );
  }

  @memoize
  get roundNames(): string[] {
    const roundNames = this.teamBallotResults.map((ballot) => ballot.round);
    // Filter out duplicates, but maintain reverse order
    return roundNames
      .filter((roundName, index) => {
        return roundNames.indexOf(roundName) === index;
      })
      .reverse();
  }

  @memoize
  get roundsCompleted(): number {
    return this.roundNames.length;
  }

  @memoize
  get tournamentName(): string {
    return this.getRangeValue(MasterRange.TournamentName) ?? "";
  }

  @memoize
  get tournamentEmail(): string {
    return this.getRangeValue(MasterRange.TournamentEmail) ?? "";
  }

  @memoize
  get ballotTemplateFile(): GoogleAppsScript.Drive.File {
    const templateFileLink = this.getRangeValue(MasterRange.BallotTemplateLink);
    return DriveApp.getFileById(getIdFromUrl(templateFileLink));
  }

  // This is inefficient but hassle free. Shouldn't be that hard to optimize if it becomes a bottleneck.
  setTeamBallotFolderLink(
    teamNumber: string,
    ballotFolderLink: string
  ): boolean {
    const teamInfoRange = this.masterSpreadsheet.getRangeByName(
      MasterRange.TeamInfo
    );
    if (!teamInfoRange) return false;
    const teamInfoValues = teamInfoRange.getValues();
    const teamRow = teamInfoValues.find(
      (teamRow: Cell[]) => teamRow[0]?.toString() === teamNumber
    );
    if (!teamRow) return false;
    teamRow[5] = ballotFolderLink;
    teamInfoRange.setValues(teamInfoValues);
    return true;
  }

  teamBallotFolder(
    teamNumber: string
  ): GoogleAppsScript.Drive.Folder | undefined {
    const folderLink = this.teamInfo[teamNumber]?.ballotFolderLink;
    if (!folderLink) return undefined;
    return DriveApp.getFolderById(getIdFromUrl(folderLink));
  }

  @memoize
  get exportFolder(): GoogleAppsScript.Drive.Folder {
    return DriveApp.getFolderById(
      getIdFromUrl(
        this.masterSpreadsheet
          .getRangeByName(MasterRange.ExportFolderLink)
          ?.getValue()
      )
    );
  }

  @memoize
  get tabFolder(): GoogleAppsScript.Drive.Folder {
    return DriveApp.getFolderById(
      getIdFromUrl(
        this.masterSpreadsheet
          .getRangeByName(MasterRange.ParentFolderLink)
          ?.getValue()
      )
    );
  }

  @memoize
  get courtroomRecords(): CourtroomInfo[] {
    return compactRange(
      this.getRangeValues(MasterRange.CourtroomInfo) ?? []
    ).map((row) => {
      return {
        name: row[0],
        bailiffEmails: row[1].split(","),
        roundFolderLinks: row[2].split(","),
      };
    });
  }

  @memoize
  get ballotRecords(): BallotInfo[] {
    return (this.getRangeValues(MasterRange.BallotLinks) ?? [])
      .filter((row) =>
        row.some((cell) => !["", null, undefined, "false"].includes(cell))
      )
      .map((row) => {
        return {
          link: row[0],
          info: row[1],
          captainsFormLink: row[2],
          judgeName: row[4],
          locked: row[5] === "true",
          validated: row[6] === "true",
        };
      });
  }

  @memoize
  get masterSpreadsheet(): MasterSpreadsheet {
    return SpreadsheetApp.getActiveSpreadsheet();
  }

  @memoize
  get ballotFiles(): GoogleFile[] {
    const ballots: GoogleFile[] = [];
    const roundFolders = this.tabFolder.searchFolders('title contains "Round"');
    while (roundFolders.hasNext()) {
      const roundFolder = roundFolders.next();
      const trialFolders = roundFolder.getFolders();
      while (trialFolders.hasNext()) {
        const ballotFiles = trialFolders
          .next()
          .searchFiles('title contains "Ballot"');
        while (ballotFiles.hasNext()) {
          const file = ballotFiles.next();
          ballots.push(file);
        }
      }
    }
    // Sorting ballots by date created should be sufficient to ensure that they're in the correct order
    ballots.sort(
      (a, b) => a.getDateCreated().getTime() - b.getDateCreated().getTime()
    );
    return ballots;
  }

  @memoize
  get ballotSpreadsheets(): BallotSpreadsheet[] {
    return this.ballotFiles.map((file) => sheetForFile(file));
  }

  @memoize
  get firstPartyName(): string {
    return this.getRangeValue(MasterRange.FirstPartyName) ?? "";
  }

  @memoize
  get secondPartyName(): string {
    return this.getRangeValue(MasterRange.SecondPartyName) ?? "";
  }

  @memoize
  get formBallotResults(): NonSheetBallotResult[] {
    return this.formBallotReadouts.map(this.readoutToResult);
  }

  @memoize
  get formBallotReadouts(): NonSheetBallotReadout[] {
    const formResponseSheets = this.masterSpreadsheet
      .getSheets()
      .filter((sheet) => sheet.getFormUrl());
    const formBallotReadouts: NonSheetBallotReadout[] = [];

    formResponseSheets.forEach((sheet) => {
      const formResponses = compactRange(
        sheet.getDataRange().getValues().slice(1)
      ).map((row) => this.formRowToReadout(row, sheet.getName()));
      formBallotReadouts.push(...formResponses);
    });
    return formBallotReadouts;
  }

  @memoize
  get enteredBallotResults(): NonSheetBallotResult[] {
    return this.enteredBallotReadouts.map(this.readoutToResult);
  }

  @memoize
  get enteredBallotReadouts(): NonSheetBallotReadout[] {
    const enteredBallotSheets = this.masterSpreadsheet.getSheetByName(
      ENTERED_BALLOTS_SHEET
    );
    if (!enteredBallotSheets) return [];
    return compactRange(
      enteredBallotSheets.getDataRange().getValues().slice(1)
    ).map((row) => this.formRowToReadout(row, ENTERED_BALLOTS_SHEET));
  }

  private formRowToReadout(
    response: any[],
    sourceSheet: string
  ): NonSheetBallotReadout {
    const getScores = (start: number, end: number) =>
      response
        .slice(start, end + 1)
        .reduce((acc, cur) => [...acc, parseInt(cur)], [] as number[]);
    return {
      timestamp: response[0],
      judgeName: response[1],
      round: response[2],
      courtroom: response[3],
      pTeam: response[4],
      pIssue1Name: response[5],
      pIssue1WrittenFeedback: response[6],
      pIssue1Scores: getScores(7, 9),
      pIssue2Name: response[10],
      pIssue2WrittenFeedback: response[11],
      pIssue2Scores: getScores(12, 14),
      rTeam: response[15],
      rIssue1Name: response[16],
      rIssue1WrittenFeedback: response[17],
      rIssue1Scores: getScores(18, 20),
      rIssue2Name: response[21],
      rIssue2WrittenFeedback: response[22],
      rIssue2Scores: getScores(23, 25),
      ballotPdfUrl: response.length > 26 ? response[26] : undefined,
      sourceSheet: sourceSheet,
    };
  }

  private readoutToResult(
    readout: NonSheetBallotReadout
  ): NonSheetBallotResult {
    return {
      judgeName: readout.judgeName,
      round: readout.round,
      courtroom: readout.courtroom,
      pTeam: readout.pTeam,
      pIssue1Name: readout.pIssue1Name,
      pIssue1Score: readout.pIssue1Scores.reduce((a, b) => a + b, 0),
      pIssue2Name: readout.pIssue2Name,
      pIssue2Score: readout.pIssue2Scores.reduce((a, b) => a + b, 0),
      rTeam: readout.rTeam,
      rIssue1Name: readout.rIssue1Name,
      rIssue1Score: readout.rIssue1Scores.reduce((a, b) => a + b, 0),
      rIssue2Name: readout.rIssue2Name,
      rIssue2Score: readout.rIssue2Scores.reduce((a, b) => a + b, 0),
      ballotPdfUrl: readout.ballotPdfUrl,
    };
  }

  setReadoutPdfUrl(
    readout: NonSheetBallotReadout,
    ballotPdfUrl: string
  ) {
    const sourceSheet = this.masterSpreadsheet.getSheetByName(
      readout.sourceSheet
    );
    if (!sourceSheet) {
      Logger.log(
        `Could not find sheet ${readout.sourceSheet} to update ballot PDF URL. This is really weird and scary.`
      );
      return;
    }
    const row = sourceSheet
      .getDataRange()
      .getValues()
      .slice(1)
      .findIndex((row) => {
        const rowReadout = this.formRowToReadout(row, readout.sourceSheet);
        // This ought to be sufficient to conclude it's the same one
        return (
          rowReadout.timestamp.getTime() === readout.timestamp.getTime() &&
          rowReadout.judgeName === readout.judgeName &&
          rowReadout.round === readout.round &&
          rowReadout.courtroom === readout.courtroom &&
          rowReadout.pTeam === readout.pTeam &&
          rowReadout.rTeam === readout.rTeam
        );
      });
    if (row === -1) {
      Logger.log(`Could not find row to update ballot PDF URL. Giving up...`);
      return;
    }
    // We add 2 to the row because we cut off the header row before findIndex,
    // and second because Google Sheets is 1-indexed
    sourceSheet.getRange(row + 2, 27).setValue(ballotPdfUrl);
  }

  getOrCreateTrialFolder(
    round: string,
    courtroom: string
  ): GoogleAppsScript.Drive.Folder {
    const roundFolder = getOrCreateChildFolder(
      this.tabFolder,
      `Round ${round}`
    );
    const trialFolder = getOrCreateChildFolder(
      roundFolder,
      `R${round} - ${courtroom}`
    );
    return trialFolder;
  }

  addEnteredBallot(ballotState: RequiredBallotState) {
    const enteredBallotsSheet = this.masterSpreadsheet.getSheetByName(
      ENTERED_BALLOTS_SHEET
    );
    let pdfUrl = "";
    if (ballotState.pdfData) {
      const trialFolder = this.getOrCreateTrialFolder(
        ballotState.round,
        ballotState.courtroom
      );
      const pdfName = getBallotPdfName(
        ballotState.round,
        ballotState.petitioner.teamNumber,
        ballotState.respondent.teamNumber,
        ballotState.judgeName
      );
      const decodedPdfData = Utilities.base64Decode(
        ballotState.pdfData,
        Utilities.Charset.UTF_8
      );
      const pdfBlob = Utilities.newBlob(
        decodedPdfData,
        "application/pdf",
        pdfName
      );
      pdfUrl = trialFolder.createFile(pdfBlob).getUrl();
    }
    // There are lots of empty strings and 0s in the below array
    // to maintain the same interface as the form responses sheet
    const rowToAdd = [
      new Date(),
      ballotState.judgeName,
      ballotState.round,
      ballotState.courtroom,
      ballotState.petitioner.teamNumber,
      ballotState.petitioner.issue1Name,
      "",
      ballotState.petitioner.issue1Score,
      0,
      0,
      ballotState.petitioner.issue2Name,
      "",
      ballotState.petitioner.issue2Score,
      0,
      0,
      ballotState.respondent.teamNumber,
      ballotState.respondent.issue1Name,
      "",
      ballotState.respondent.issue1Score,
      0,
      0,
      ballotState.respondent.issue2Name,
      "",
      ballotState.respondent.issue2Score,
      0,
      0,
      pdfUrl,
    ];
    enteredBallotsSheet.appendRow(rowToAdd);
  }

  private getRangeValue(rangeName: MasterRange): string | undefined {
    return this.masterSpreadsheet
      .getRangeByName(rangeName)
      ?.getValue()
      .toString();
  }

  private getRangeValues(rangeName: MasterRange): string[][] | undefined {
    return this.masterSpreadsheet
      .getRangeByName(rangeName)
      ?.getValues()
      .map((arr: Cell[][]) => arr.map((cell) => cell.toString()));
  }
}

export { SSContext, IContext, PAST_OPPONENTS_SEPARATOR, BYE_BUST_SCHOOL_NAME };
