declare var self: Window & typeof globalThis;
import { LANG_TO_EXTENSION } from "@util/constants";
import { SubmissionRequest } from "@util/types";
import * as fs from "node:fs";

const TMP_DIR = "tmp";

const createTempDir = () => {
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR);
  }
};

const languageHandlers: Record<string, (fileName: string) => void> = {
  "C++": (fileName) => {
    const executableName = fileName.split(".")[0];
    const result = Bun.spawnSync({
      cmd: ["g++", fileName, "-o", executableName],
      cwd: TMP_DIR,
      stderr: "pipe",
      stdout: "pipe",
    });

    const error = result.stderr.toString();

    if (error) {
      console.log(
        "[Executor] Error occurred while executing code...\n\n",
        error
      );
      return;
    }

    const runOutput = Bun.spawnSync({
      cmd: [`${TMP_DIR}/${executableName}`],
      stderr: "pipe",
      stdout: "pipe",
    });

    const output = runOutput.stdout.toString();
    const runtimeError = runOutput.stderr.toString();

    if (runtimeError) {
      console.log(
        "[Executor] Error occurred while executing code...\n\n",
        runtimeError
      );
      return;
    }

    postMessage(output);
  },
  Python: (fileName) => {
    const result = Bun.spawnSync({
      cmd: ["python3", fileName],
      cwd: TMP_DIR,
      stderr: "pipe",
      stdout: "pipe",
    });

    const output = result.stdout.toString();
    const error = result.stderr.toString();

    if (error) {
      console.log(
        "[Executor] Error occurred while executing code...\n\n",
        error
      );
      return;
    }

    postMessage(output);
  },
  Go: (fileName) => {
    const result = Bun.spawnSync({
      cmd: ["go", "run", fileName],
      cwd: TMP_DIR,
      stderr: "pipe",
      stdout: "pipe",
    });

    const output = result.stdout.toString();
    const error = result.stderr.toString();

    if (error) {
      console.error(
        "[Executor] Error occurred while executing code...\n\n",
        error
      );
      return;
    }

    postMessage(output);
  },
  Java: () => {
    const compile = Bun.spawnSync({
      cmd: ["javac", "Main.java"],
      cwd: TMP_DIR,
      stderr: "pipe",
      stdout: "pipe",
    });

    const error = compile.stderr.toString();

    if (error) {
      console.log(
        "[Executor] Error occurred while executing code...\n\n",
        error
      );
      return;
    }

    const runOutput = Bun.spawnSync({
      cmd: ["java", "Main"],
      cwd: TMP_DIR,
      stderr: "pipe",
      stdout: "pipe",
    });

    const output = runOutput.stdout.toString();
    const runtimeError = runOutput.stderr.toString();

    if (runtimeError) {
      console.log(
        "[Executor] Error occurred while executing code...\n\n",
        runtimeError
      );
      return;
    }

    postMessage(output);
  },
  Node: (fileName) => {
    const result = Bun.spawnSync({
      cmd: ["bun", "run", fileName],
      cwd: TMP_DIR,
      stderr: "pipe",
      stdout: "pipe",
    });
    const output = result.stdout.toString();
    let error = result.stderr.toString();

    // TODO: Find a better way to do this? 0.o
    if (error.includes("at")) {
      error = error.substring(0, error.indexOf("at"));
    }

    if (error) {
      self.postMessage({ error: error });
    } else {
      postMessage(output);
    }
  },
};

self.onmessage = async (event: MessageEvent) => {
  const submission: SubmissionRequest = event.data;
  const fileName = `${submission.submissionId.substring(0, 5)}.${
    LANG_TO_EXTENSION[submission.lang]
  }`;

  if (!fs.existsSync(TMP_DIR)) {
    createTempDir();
  }

  const filePath = `./${TMP_DIR}/${fileName}`;
  fs.writeFileSync(filePath, submission.code);

  try {
    if (!languageHandlers[submission.lang]) {
      throw new Error("Language not supported!");
    }

    if (submission.lang === "Java")
      fs.renameSync(filePath, `./${TMP_DIR}/Main.java`);

    languageHandlers[submission.lang](fileName);

    fs.unlinkSync(filePath);
  } catch (e) {
    fs.unlinkSync(filePath);
    self.reportError(e);
    postMessage({ error: e });
    return;
  }
};
