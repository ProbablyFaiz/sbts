import {
  BallotSpreadsheet,
  ByeStrategy,
  Cell,
  CompetitorRole,
  CourtroomInfo,
  IndividualBallotResult,
  MasterRange,
  MasterSpreadsheet,
  NonSheetBallotReadout,
  NonSheetBallotResult,
  RequiredBallotState,
  RoundRobinConfig,
  ScoreGroup,
  SwissConfig,
  TeamBallotResult,
  TeamInfo,
} from "../../Types";
import { getBallotPdfName } from "../actions/PublishTeamBallots";
import { memoize } from "./CacheHelper";
import {
  GoogleFile,
  compactRange,
  flattenRange,
  getByeStrategy,
  getIdFromUrl,
  getOrCreateChildFolder,
  sheetForFile,
  spreadsheetTruthy,
} from "./Helpers";

interface IContext {
  teamInfo: Record<string, TeamInfo>;
  setTeamBallotFolderLink: (
    teamNumber: string,
    ballotFolderLink: string,
  ) => boolean;
  tournamentEmail: string;
  courtroomRecords: CourtroomInfo[];
  teamBallotResults: TeamBallotResult[];
  individualBallotResults: IndividualBallotResult[];
  judgeNames: string[];
  roundNames: string[];
  prelimRounds: string[];
  knockoutRounds: string[];
  roundsCompleted: number;
  firstPartyName: string;
  secondPartyName: string;
  tournamentName: string;
  swissConfig: SwissConfig;
  roundRobinConfig: RoundRobinConfig;
  byeStrategy: ByeStrategy;
  tabSystemSetup: boolean;
  addEnteredBallot: (ballotState: RequiredBallotState) => void;
}

const BYE_BUST_SCHOOL_NAME = "Bye Bust";

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
      {} as Record<string, string[]>,
    );
    compactRange(this.getRangeValues(MasterRange.TeamInfo) ?? []).forEach(
      (row) => {
        const competitorNames = row[3]
          .split(",")
          .concat(ballotCompetitorNames[row[0]] ?? [])
          .map((s) => s.trim());
        // Filter duplicates and empty strings and count freqs
        const nameFreqs = competitorNames.reduce(
          (acc, name) => {
            if (!name) {
              return acc;
            }
            if (!acc[name]) {
              acc[name] = 0;
            }
            acc[name]++;
            return acc;
          },
          {} as Record<string, number>,
        );
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
      },
    );
    return teamInfoMapping;
  }

  @memoize
  get teamBallotResults(): TeamBallotResult[] {
    const results: TeamBallotResult[] = [];
    for (const readout of this.allReadouts) {
      const petitionerPd =
        readout.pIssue1Scores.reduce((a, b) => a + b, 0) -
        readout.rIssue1Scores.reduce((a, b) => a + b, 0);
      const petitionerWon = petitionerPd === 0 ? 0.5 : petitionerPd > 0 ? 1 : 0;
      const respondentPd = -petitionerPd;
      const respondentWon = 1 - petitionerWon;
      results.push({
        round: readout.round,
        judgeName: readout.judgeName,
        teamNumber: readout.pTeam,
        opponentTeamNumber: readout.rTeam,
        side: this.firstPartyName,
        pd: petitionerPd,
        won: petitionerWon,
        courtroom: readout.courtroom,
        ballotLink: readout.ballotPdfUrl ?? "",
      });
      results.push({
        round: readout.round,
        judgeName: readout.judgeName,
        teamNumber: readout.rTeam,
        opponentTeamNumber: readout.pTeam,
        side: this.secondPartyName,
        pd: respondentPd,
        won: respondentWon,
        courtroom: readout.courtroom,
        ballotLink: readout.ballotPdfUrl ?? "",
      });
    }
    return results;
  }

  @memoize
  get individualBallotResults(): IndividualBallotResult[] {
    const results: IndividualBallotResult[] = [];
    for (const readout of this.allReadouts) {
      results.push({
        round: readout.round,
        judgeName: readout.judgeName,
        teamNumber: readout.pTeam,
        competitorName: readout.pIssue1Name,
        side: this.firstPartyName,
        score: readout.pIssue1Scores.reduce((a, b) => a + b, 0),
        courtroom: readout.courtroom,
      });
      results.push({
        round: readout.round,
        judgeName: readout.judgeName,
        teamNumber: readout.pTeam,
        competitorName: readout.pIssue2Name,
        side: this.firstPartyName,
        score: readout.pIssue2Scores.reduce((a, b) => a + b, 0),
        courtroom: readout.courtroom,
      });
      results.push({
        round: readout.round,
        judgeName: readout.judgeName,
        teamNumber: readout.rTeam,
        competitorName: readout.rIssue1Name,
        side: this.secondPartyName,
        score: readout.rIssue1Scores.reduce((a, b) => a + b, 0),
        courtroom: readout.courtroom,
      });
      results.push({
        round: readout.round,
        judgeName: readout.judgeName,
        teamNumber: readout.rTeam,
        competitorName: readout.rIssue2Name,
        side: this.secondPartyName,
        score: readout.rIssue2Scores.reduce((a, b) => a + b, 0),
        courtroom: readout.courtroom,
      });
    }
    return results;
  }

  @memoize
  get judgeNames(): string[] {
    return Array.from(
      new Set(this.teamBallotResults.map((ballot) => ballot.judgeName)),
    );
  }

  @memoize
  get roundNames(): string[] {
    const roundNames = this.teamBallotResults.map((ballot) => ballot.round);
    return roundNames.filter((roundName, index) => {
      return roundNames.indexOf(roundName) === index;
    });
  }

  @memoize
  get prelimRounds(): string[] {
    return flattenRange(
      compactRange(this.getRangeValues(MasterRange.PrelimRounds) ?? []),
    );
  }

  @memoize
  get knockoutRounds(): string[] {
    return flattenRange(
      compactRange(this.getRangeValues(MasterRange.KnockoutRounds) ?? []),
    );
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
  get byeStrategy(): ByeStrategy {
    const byeStrategyStr = this.getRangeValue(MasterRange.ByeStrategy);
    return getByeStrategy(byeStrategyStr);
  }

  @memoize
  get ballotTemplateFile(): GoogleAppsScript.Drive.File {
    const templateFileLink = this.getRangeValue(MasterRange.BallotTemplateLink);
    return DriveApp.getFileById(getIdFromUrl(templateFileLink));
  }

  // This is inefficient but hassle free. Shouldn't be that hard to optimize if it becomes a bottleneck.
  setTeamBallotFolderLink(
    teamNumber: string,
    ballotFolderLink: string,
  ): boolean {
    const teamInfoRange = this.masterSpreadsheet.getRangeByName(
      MasterRange.TeamInfo,
    );
    if (!teamInfoRange) return false;
    const teamInfoValues = teamInfoRange.getValues();
    const teamRow = teamInfoValues.find(
      (teamRow: Cell[]) => teamRow[0]?.toString() === teamNumber,
    );
    if (!teamRow) return false;
    teamRow[5] = ballotFolderLink;
    teamInfoRange.setValues(teamInfoValues);
    return true;
  }

  teamBallotFolder(
    teamNumber: string,
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
          ?.getValue(),
      ),
    );
  }

  @memoize
  get tabFolder(): GoogleAppsScript.Drive.Folder {
    return DriveApp.getFolderById(
      getIdFromUrl(
        this.masterSpreadsheet
          .getRangeByName(MasterRange.ParentFolderLink)
          ?.getValue(),
      ),
    );
  }

  @memoize
  get courtroomRecords(): CourtroomInfo[] {
    return compactRange(
      this.getRangeValues(MasterRange.CourtroomInfo) ?? [],
    ).map((row) => {
      return {
        name: row[0],
        bailiffEmails: row[1].split(","),
        roundFolderLinks: row[2].split(","),
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
      (a, b) => a.getDateCreated().getTime() - b.getDateCreated().getTime(),
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
      .filter((sheet) => sheet.getName().includes("Form Responses"));
    const formBallotReadouts: NonSheetBallotReadout[] = [];

    formResponseSheets.forEach((sheet) => {
      const formResponses = compactRange(
        sheet.getDataRange().getValues().slice(1),
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
      ENTERED_BALLOTS_SHEET,
    );
    if (!enteredBallotSheets) return [];
    return compactRange(
      enteredBallotSheets.getDataRange().getValues().slice(1),
    ).map((row) => this.formRowToReadout(row, ENTERED_BALLOTS_SHEET));
  }

  @memoize
  get allReadouts(): NonSheetBallotReadout[] {
    return [...this.formBallotReadouts, ...this.enteredBallotReadouts];
  }

  @memoize
  get swissConfig(): SwissConfig {
    const previousRounds = compactRange(
      this.getRangeValues(MasterRange.SwissPreviousRounds) ?? [],
    ).map((row) => row[0]);
    const allowSameSchool = spreadsheetTruthy(
      this.getRangeValue(MasterRange.SwissAllowSameSchool),
    );
    const allowRepeatMatchup = spreadsheetTruthy(
      this.getRangeValue(MasterRange.SwissAllowRepeatMatchup),
    );
    const randomizeCourtrooms = spreadsheetTruthy(
      this.getRangeValue(MasterRange.SwissRandomizeCourtrooms),
    );
    const randomSeed = this.getRangeValue(MasterRange.SwissRandomSeed) || "0";
    return {
      previousRounds,
      allowSameSchool,
      allowRepeatMatchup,
      randomizeCourtrooms,
      randomSeed,
    };
  }

  @memoize
  get roundRobinConfig(): RoundRobinConfig {
    const prelimRounds = compactRange(
      this.getRangeValues(MasterRange.RoundRobinPrelimRounds) ?? [],
    ).map((row) => row[0]);
    const allowSameSchool = spreadsheetTruthy(
      this.getRangeValue(MasterRange.RoundRobinAllowSameSchool),
    );
    const randomSeed =
      this.getRangeValue(MasterRange.RoundRobinRandomSeed) || "0";
    return {
      prelimRounds,
      allowSameSchool,
      randomSeed,
    };
  }

  @memoize
  get tabSystemSetup(): boolean {
    return spreadsheetTruthy(this.getRangeValue(MasterRange.TabSystemSetup));
  }

  private formRowToReadout(
    response: any[],
    sourceSheet: string,
  ): NonSheetBallotReadout {
    const getScores = (start: number, end: number) =>
      response
        .slice(start, end + 1)
        .reduce((acc, cur) => [...acc, parseFloat(cur)], [] as number[]);
    let timestamp = response[0];
    if (typeof timestamp === "string") {
      timestamp = new Date(timestamp);
    }
    return {
      timestamp: timestamp,
      judgeName: response[1].toString(),
      round: response[2].toString(),
      courtroom: response[3].toString(),
      pTeam: response[4].toString(),
      pIssue1Name: response[5].toString(),
      pIssue1WrittenFeedback: response[6].toString(),
      pIssue1Scores: getScores(7, 9),
      pIssue2Name: response[10].toString(),
      pIssue2WrittenFeedback: response[11].toString(),
      pIssue2Scores: getScores(12, 14),
      rTeam: response[15].toString(),
      rIssue1Name: response[16].toString(),
      rIssue1WrittenFeedback: response[17].toString(),
      rIssue1Scores: getScores(18, 20),
      rIssue2Name: response[21].toString(),
      rIssue2WrittenFeedback: response[22].toString(),
      rIssue2Scores: getScores(23, 25),
      ballotPdfUrl: response.length > 26 ? response[26].toString() : undefined,
      sourceSheet: sourceSheet,
    };
  }

  private readoutToResult(
    readout: NonSheetBallotReadout,
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

  setReadoutPdfUrl(readout: NonSheetBallotReadout, ballotPdfUrl: string) {
    const sourceSheet = this.masterSpreadsheet.getSheetByName(
      readout.sourceSheet,
    );
    if (!sourceSheet) {
      Logger.log(
        `Could not find sheet ${readout.sourceSheet} to update ballot PDF URL. This is really weird and scary.`,
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
    courtroom: string,
  ): GoogleAppsScript.Drive.Folder {
    const roundFolder = getOrCreateChildFolder(this.tabFolder, round);
    const trialFolder = getOrCreateChildFolder(
      roundFolder,
      `${round} - ${courtroom}`,
    );
    return trialFolder;
  }

  addEnteredBallot(ballotState: RequiredBallotState) {
    const enteredBallotsSheet = this.masterSpreadsheet.getSheetByName(
      ENTERED_BALLOTS_SHEET,
    );
    let pdfUrl = "";
    if (ballotState.pdfData) {
      const trialFolder = this.getOrCreateTrialFolder(
        ballotState.round,
        ballotState.courtroom,
      );
      const pdfName = getBallotPdfName(
        ballotState.round,
        ballotState.petitioner.teamNumber,
        ballotState.respondent.teamNumber,
        ballotState.judgeName,
      );
      const decodedPdfData = Utilities.base64Decode(
        ballotState.pdfData,
        Utilities.Charset.UTF_8,
      );
      const pdfBlob = Utilities.newBlob(
        decodedPdfData,
        "application/pdf",
        pdfName,
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

export { SSContext, IContext, BYE_BUST_SCHOOL_NAME };
