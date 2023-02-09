import {
  BallotInfo,
  BallotSpreadsheet,
  Cell,
  CourtroomInfo,
  FormBallotResult,
  IndividualBallotResult,
  MasterRange,
  MasterSpreadsheet,
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
  getTrialFolder: (
    round: string,
    courtroom: string
  ) => GoogleAppsScript.Drive.Folder;
}

const BYE_BUST_SCHOOL_NAME = "Bye Bust";
const PAST_OPPONENTS_SEPARATOR = ", ";

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
        // Filter duplicates and empty strings
        const uniqueCompetitorNames = Array.from(
          new Set(competitorNames.filter((s) => !!s))
        );
        teamInfoMapping[row[0]] = {
          teamNumber: row[0],
          teamName: row[1],
          schoolName: row[2],
          byeBust: row[2] === BYE_BUST_SCHOOL_NAME, // For now, we'll just use a special school name
          competitorNames: uniqueCompetitorNames,
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
    return compactRange(this.getRangeValues(MasterRange.TeamBallots) ?? [])
      .concat(
        compactRange(this.getRangeValues(MasterRange.EnteredTeamBallots) ?? [])
      )
      .map(this.teamResultRowToResult);
  }

  @memoize
  get enteredTeamBallotResults(): Required<TeamBallotResult>[] {
    return compactRange(
      this.getRangeValues(MasterRange.EnteredTeamBallots) ?? []
    ).map(this.teamResultRowToResult);
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
    )
      .concat(
        compactRange(
          this.getRangeValues(MasterRange.EnteredIndividualBallots) ?? []
        )
      )
      .map((row) => {
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
    teamRow[4] = ballotFolderLink;
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
  get formBallotResults(): FormBallotResult[] {
    const formResponseSheets = this.masterSpreadsheet
      .getSheets()
      .filter((sheet) => sheet.getName().startsWith("Form Responses "));
    const formBallotResults: FormBallotResult[] = [];
    const formRowToResult = (response: string[]) => {
      const getScore = (start: number, end: number) =>
        response
          .slice(start, end + 1)
          .reduce((acc, cur) => acc + parseInt(cur), 0);
      return {
        judgeName: response[1],
        round: response[2],
        courtroom: response[3],
        pTeam: response[4],
        pIssue1Name: response[5],
        pIssue1Score: getScore(6, 8),
        pIssue2Name: response[9],
        pIssue2Score: getScore(10, 12),
        rTeam: response[13],
        rIssue1Name: response[14],
        rIssue1Score: getScore(15, 17),
        rIssue2Name: response[18],
        rIssue2Score: getScore(19, 21),
      } as FormBallotResult;
    };
    formResponseSheets.forEach((sheet) => {
      const formResponses = sheet
        .getDataRange()
        .getValues()
        .map(formRowToResult);
      formBallotResults.push(...formResponses);
    });
    return formBallotResults;
  }


  getTrialFolder(
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
    if (ballotState.pdfData) {
      const trialFolder = this.getTrialFolder(
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
      const pdfUrl = trialFolder.createFile(pdfBlob).getUrl();
      this.addResultRowsForEnteredBallot(ballotState, pdfUrl);
    } else {
      this.addResultRowsForEnteredBallot(ballotState, "");
    }
  }

  private addResultRowsForEnteredBallot(
    ballotState: RequiredBallotState,
    ballotPdfUrl: string
  ) {
    const enteredTeamSheet = this.masterSpreadsheet.getSheetByName(
      MasterRange.EnteredTeamBallotsSheet
    );
    const petitionerMargin =
      ballotState.petitioner.issue1Score +
      ballotState.petitioner.issue2Score -
      ballotState.respondent.issue1Score -
      ballotState.respondent.issue2Score;
    const petitionerWon =
      petitionerMargin === 0 ? 0.5 : petitionerMargin > 0 ? 1 : 0;
    enteredTeamSheet.appendRow([
      ballotState.round,
      ballotState.judgeName,
      ballotState.petitioner.teamNumber,
      ballotState.respondent.teamNumber,
      this.firstPartyName,
      petitionerMargin,
      petitionerWon,
      ballotState.courtroom,
      ballotPdfUrl,
    ]);
    enteredTeamSheet.appendRow([
      ballotState.round,
      ballotState.judgeName,
      ballotState.respondent.teamNumber,
      ballotState.petitioner.teamNumber,
      this.secondPartyName,
      -petitionerMargin,
      1 - petitionerWon,
      ballotState.courtroom,
      ballotPdfUrl,
    ]);

    const enteredIndividualSheet = this.masterSpreadsheet.getSheetByName(
      MasterRange.EnteredIndividualBallotsSheet
    );
    enteredIndividualSheet.appendRow([
      ballotState.round,
      ballotState.judgeName,
      ballotState.petitioner.teamNumber,
      ballotState.petitioner.issue1Name,
      this.firstPartyName,
      "Attorney",
      ballotState.petitioner.issue1Score,
      ballotState.courtroom,
      ballotPdfUrl,
    ]);
    enteredIndividualSheet.appendRow([
      ballotState.round,
      ballotState.judgeName,
      ballotState.petitioner.teamNumber,
      ballotState.petitioner.issue2Name,
      this.firstPartyName,
      "Attorney",
      ballotState.petitioner.issue2Score,
      ballotState.courtroom,
      ballotPdfUrl,
    ]);
    enteredIndividualSheet.appendRow([
      ballotState.round,
      ballotState.judgeName,
      ballotState.respondent.teamNumber,
      ballotState.respondent.issue1Name,
      this.secondPartyName,
      "Attorney",
      ballotState.respondent.issue1Score,
      ballotState.courtroom,
      ballotPdfUrl,
    ]);
    enteredIndividualSheet.appendRow([
      ballotState.round,
      ballotState.judgeName,
      ballotState.respondent.teamNumber,
      ballotState.respondent.issue2Name,
      this.secondPartyName,
      "Attorney",
      ballotState.respondent.issue2Score,
      ballotState.courtroom,
      ballotPdfUrl,
    ]);
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