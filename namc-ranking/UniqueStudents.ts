interface Student {
  schoolName: string;
  studentName: string;
  lastSeen: Date;
}

const studentKey = (student: Student) =>
  `${student.schoolName}|${student.studentName}`;

const getStudents = (team: TeamRank, tournamentStartTimestamp: number) => {
  return [
    {
      schoolName: team.teamSchool,
      studentName: team.competitor1Name,
      lastSeen: new Date(tournamentStartTimestamp),
    },
    {
      schoolName: team.teamSchool,
      studentName: team.competitor2Name,
      lastSeen: new Date(tournamentStartTimestamp),
    },
  ];
};
function UniqueStudents() {
  const context = new RankerContext();
  const uniqueStudents = new Map<string, Student>();
  context.tabSummaries.forEach((t) => {
    t.teams.forEach((team) => {
      getStudents(team, t.tournamentStartTimestamp).forEach((student) => {
        uniqueStudents.set(studentKey(student), student);
      });
    });
  });
  const uniqueStudentsArray = Array.from(uniqueStudents.values());
  // sort by school and then by student name
  uniqueStudentsArray.sort((a, b) => {
    if (a.schoolName === b.schoolName) {
      return a.studentName.localeCompare(b.studentName);
    }
    return a.schoolName.localeCompare(b.schoolName);
  });
  return uniqueStudentsArray.map((student) => [
    student.schoolName,
    student.studentName,
    student.lastSeen.toDateString(),
  ]);
}
