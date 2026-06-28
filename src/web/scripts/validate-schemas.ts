import {
  parseEvent,
  parseEventQuestionList,
} from "../src/lib/schemas/event";
import { parseNotificationList } from "../src/lib/schemas/notification";
import {
  parsePostProblemResponse,
  parseProblemDetail,
  parseProblemList,
  parseProblemListItem,
} from "../src/lib/schemas/problem";
import {
  parseSubmission,
  parseSubmissionList,
} from "../src/lib/schemas/submission";

const assert = (label: string, fn: () => void) => {
  try {
    fn();
    console.log(`✓ ${label}`);
  } catch (error) {
    console.error(`✗ ${label}`);
    throw error;
  }
};

assert("event detail with problem refs", () => {
  parseEvent({
    id: 7,
    user_id: "00000000-0000-0000-0000-000000000001",
    title: "Contest",
    description: "desc",
    start_time: "2026-01-01T00:00:00Z",
    end_time: "2026-01-02T00:00:00Z",
    teams: false,
    problems: [{ id: 1 }, { id: 2 }],
    participants: [],
  });
});

assert("event create with join rows", () => {
  parseEvent({
    id: 8,
    user_id: "00000000-0000-0000-0000-000000000001",
    title: "Contest",
    description: "desc",
    start_time: "2026-01-01T00:00:00Z",
    end_time: "2026-01-02T00:00:00Z",
    teams: false,
    problems: [
      {
        id: 10,
        event_id: 8,
        problem_id: 3,
        hidden: false,
      },
    ],
  });
});

assert("contest problem list (GetEventProblemType)", () => {
  parseProblemList([
    {
      id: 1,
      event_id: 7,
      title: "A + B",
      prompt: "Add",
      source: "",
      difficulty: "EASY",
      user_id: "00000000-0000-0000-0000-000000000001",
      upload_date: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      public: true,
      accept_timeout: 2,
      execution_timeout: 2,
      memory_limit: 256,
    },
  ]);
});

assert("nested ProblemDescription on submission", () => {
  parseSubmission({
    id: "00000000-0000-0000-0000-000000000010",
    user_id: "00000000-0000-0000-0000-000000000001",
    problem_id: 1,
    problem: {
      id: 1,
      title: "A + B",
      prompt: "Add",
      source: "",
      difficulty: "EASY",
      user_id: "00000000-0000-0000-0000-000000000001",
      upload_date: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      public: true,
      default_accept_timeout: 2,
      default_execution_timeout: 2,
      default_memory_timeout: 256,
    },
    time_elapsed: 1.2,
    language_id: "00000000-0000-0000-0000-000000000002",
    language: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Python",
      extension: "py",
      version: "3.11",
    },
    status: "ACCEPTED",
    submit_time: "2026-01-01T00:00:00Z",
    source_code: "print(1)",
    stdout: "",
    stderr: "",
  });
});

assert("recent submissions partial problem", () => {
  parseSubmissionList([
    {
      id: "00000000-0000-0000-0000-000000000010",
      user_id: "00000000-0000-0000-0000-000000000001",
      problem_id: 1,
      problem: {
        id: 1,
        title: "A + B",
        difficulty: "EASY",
        identifier: "a-plus-b",
      },
      time_elapsed: 1.2,
      language_id: "00000000-0000-0000-0000-000000000002",
      language: {
        id: "00000000-0000-0000-0000-000000000002",
        name: "Python",
        extension: "py",
        version: "3.11",
      },
      status: "ACCEPTED",
      submit_time: "2026-01-01T00:00:00Z",
      source_code: "print(1)",
      stdout: "",
      stderr: "",
    },
  ]);
});

assert("event submissions without nested objects", () => {
  parseSubmissionList([
    {
      id: "00000000-0000-0000-0000-000000000010",
      user_id: "00000000-0000-0000-0000-000000000001",
      problem_id: 1,
      problem: null,
      time_elapsed: 1.2,
      language_id: "00000000-0000-0000-0000-000000000002",
      language: null,
      status: "ACCEPTED",
      submit_time: "2026-01-01T00:00:00Z",
      source_code: "print(1)",
      stdout: "",
      stderr: "",
    },
  ]);
});

assert("event question with nested ProblemDescription", () => {
  parseEventQuestionList([
    {
      id: "00000000-0000-0000-0000-000000000020",
      event_id: 7,
      user_id: "00000000-0000-0000-0000-000000000001",
      problem_id: 1,
      question: "Can we use fast io?",
      is_answered: false,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      problem: {
        id: 1,
        title: "A + B",
        prompt: "Add",
        source: "",
        difficulty: "EASY",
        user_id: "00000000-0000-0000-0000-000000000001",
        upload_date: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
        public: true,
        default_accept_timeout: 2,
        default_execution_timeout: 2,
        default_memory_timeout: 256,
      },
    },
  ]);
});

assert("notification with nested question.problem", () => {
  parseNotificationList([
    {
      id: "00000000-0000-0000-0000-000000000030",
      user_id: "00000000-0000-0000-0000-000000000001",
      event_id: 7,
      question_id: "00000000-0000-0000-0000-000000000020",
      notification_type: "question",
      is_read: false,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      question: {
        id: "00000000-0000-0000-0000-000000000020",
        event_id: 7,
        user_id: "00000000-0000-0000-0000-000000000001",
        problem_id: 1,
        question: "Can we use fast io?",
        is_answered: false,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
        problem: {
          id: 1,
          title: "A + B",
          prompt: "Add",
          source: "",
          difficulty: "EASY",
          user_id: "00000000-0000-0000-0000-000000000001",
          upload_date: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
          public: true,
          default_accept_timeout: 2,
          default_execution_timeout: 2,
          default_memory_timeout: 256,
        },
      },
    },
  ]);
});

assert("toggle visibility response", () => {
  parseProblemListItem({
    id: 1,
    event_id: 0,
    title: "A + B",
    prompt: "Add",
    source: "",
    difficulty: "EASY",
    user_id: "00000000-0000-0000-0000-000000000001",
    upload_date: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    public: true,
    accept_timeout: 2,
    memory_limit: 256,
  });
});

assert("create/update problem response", () => {
  parsePostProblemResponse({ id: 42, event_problem_id: 0 });
});

assert("problem detail with GetEventProblemType shape", () => {
  parseProblemDetail({
    id: 1,
    event_id: 0,
    title: "A + B",
    identifier: "a-plus-b",
    prompt: "Add",
    source: "",
    difficulty: "EASY",
    user_id: "00000000-0000-0000-0000-000000000001",
    upload_date: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    public: true,
    accept_timeout: 2,
    execution_timeout: 2,
    memory_limit: 256,
    test_cases: [
      {
        id: "00000000-0000-0000-0000-000000000040",
        problem_id: 1,
        input: "1 2",
        expected_output: "3",
        hidden: false,
      },
    ],
  });
});

console.log("\nAll schema fixture checks passed.");
