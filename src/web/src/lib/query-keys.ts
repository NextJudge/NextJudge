export const queryKeys = {
  languages: ["languages"] as const,
  problems: (token: string) => ["problems", token] as const,
  events: {
    public: (token: string) => ["events", "public", token] as const,
    admin: (token: string) => ["events", "admin", token] as const,
  },
  event: {
    problems: (token: string, eventId: number) =>
      ["events", eventId, "problems", token] as const,
    attempts: (token: string, eventId: number) =>
      ["events", eventId, "attempts", token] as const,
    questions: (token: string, eventId: number) =>
      ["events", eventId, "questions", token] as const,
    submissions: (token: string, eventId: number) =>
      ["events", eventId, "submissions", token] as const,
    userStatus: (token: string, eventId: number) =>
      ["events", eventId, "userStatus", token] as const,
    stats: (token: string, eventId: number) =>
      ["events", eventId, "stats", token] as const,
    teams: (token: string, eventId: number) =>
      ["events", eventId, "teams", token] as const,
    myTeam: (token: string, eventId: number) =>
      ["events", eventId, "myTeam", token] as const,
    metadata: (token: string, eventId: number) =>
      ["events", eventId, "metadata", token] as const,
  },
  submissions: {
    status: (token: string, id: string) => ["submissions", token, id] as const,
    customInput: (token: string, id: string) =>
      ["customInput", token, id] as const,
  },
  notifications: {
    list: (token: string) => ["notifications", token] as const,
    count: (token: string) => ["notifications", "count", token] as const,
  },
  users: (token: string) => ["users", token] as const,
  eventParticipants: (token: string, eventId: number) =>
    ["events", eventId, "participants", token] as const,
} as const;
