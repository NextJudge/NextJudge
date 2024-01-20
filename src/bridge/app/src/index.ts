import Database from "bun:sqlite";
import { Elysia, t } from "elysia";
import { randomUUID } from "node:crypto";

const PORT = 3000;

export interface Submission {
  submissionId: string;
  code: string;
  lang: string;
  problemId: string;
}

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

const app = new Elysia().use(executeCodePlugin).listen(PORT);

console.log(
  `[Main] Elysia is running at http://${app.server?.hostname}:${app.server?.port}\n\n\n`
);
