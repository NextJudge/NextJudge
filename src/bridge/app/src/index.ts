import Database from "bun:sqlite";
import { Elysia, t, type ErrorHandler } from "elysia";
import { randomUUID } from "node:crypto";
import { Submission } from "../types";
import UserService from "./UserService";
import { userRouter } from "./routes";

const PORT = Bun.env.PORT || 3000;

const setupDatabase = () => {
  console.log("[Main] Setting up database...");
  const db = new Database("mydb.sqlite");
  if (
    !db
      .query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='submissions'"
      )
      .get()
  ) {
    console.log("[Main] Creating table...");
    const createSubmissionsTable = db.prepare(`
          CREATE TABLE submissions (
              id TEXT PRIMARY KEY,
              code TEXT NOT NULL,
              lang TEXT NOT NULL,
              problemId TEXT NOT NULL
          )
    `);
    createSubmissionsTable.run();
  } else {
    console.log("[Main] Table already exists...");
  }

  return db;
};

const setupWorkers = (submission: Submission) => {
  const executorWorker = new Worker(
    new URL("executor.ts", import.meta.url).href
  );
  const judgeWorker = new Worker(new URL("judge.ts", import.meta.url).href);

  executorWorker.postMessage(submission);

  executorWorker.onmessage = (output: MessageEvent) => {
    judgeWorker.postMessage(output.data);
  };

  judgeWorker.onmessage = (result: MessageEvent) => {
    console.log(
      `[Main] Submission result for ${submission.submissionId}: ${result.data}`
    );
    console.log("\n\n");
  };
};

const db = setupDatabase();

const executeCodePlugin = new Elysia().post(
  "/submission",
  async (req) => {
    const submissionId = randomUUID();
    const submission: Submission = { ...req.body, submissionId };

    const query = db.query(
      "INSERT INTO submissions (id, code, lang, problemId) VALUES (?, ?, ?, ?)"
    );

    query.run(
      submissionId,
      submission.code,
      submission.lang,
      submission.problemId
    );

    console.log("[Main] Submission saved to database...");
    console.log("[Main] Bootstrapping workers...");

    setupWorkers(submission);

    return {
      submissionId,
    };
  },
  {
    body: t.Object({
      code: t.String(),
      lang: t.String(),
      problemId: t.String(),
    }),
  }
);

const errorHandler: ErrorHandler = ({
  error,
  set,
  code,
  path,
  request: { method },
}) => {
  switch (code) {
    case "VALIDATION":
      set.status = 400;
      break;
    case "PARSE":
    case "INVALID_COOKIE_SIGNATURE":
      set.status = 401;
      break;
    case "NOT_FOUND":
      set.status = 404;
      break;
    default:
      set.status = 500;
  }

  console.error(method, path, set.status);
  error.stack && console.error(error.stack);

  return { success: false, message: error.message };
};

async function init() {
  const userService = new UserService();
  const users = await userService.getUsers();
  console.log("[Main] Users:", users);
  if (users.length === 0) await userService.createUser("test", "test");
  else console.log("[Main] Test user already exist...");
}

init();

const app = new Elysia().use(userRouter).listen(PORT);

app.onError(errorHandler);

console.log(
  `[Main] Elysia is running at http://${app.server?.hostname}:${app.server?.port}\n\n\n`
);

export type App = typeof app;
