import { isValidToken } from "@util/main";
import { JudgeEvent, SubmissionRequest, SubmissionResult } from "@util/types";
import { randomUUID } from "node:crypto";

// TODO: Implement this in the data-layer so that we can append submissions.
// const submissionService = new SubmissionService();

export const createSubmission = async ({
  bearer,
  body,
}: {
  bearer: string;
  body: { userId: string; code: string; lang: string; problemId: string };
}) => {
  try {
    const [isValid, user] = await isValidToken(bearer, body.userId);

    if (!isValid) {
      throw new Error("Unauthorized");
    }

    if (!user) {
      throw new Error("User not found");
    }

    /*
    * TODO: Implement this in the data-later so that we can append submissions.
    const submission = await submissionService.createSubmission(
      user,
      body as SubmissionRequest
    );
    */

    const submission: SubmissionRequest = {
      ...body,
      userId: user.id.toString(),
      submissionId: randomUUID(),
    };

    const [output, isCorrect] = await setupWorkers(submission);

    return { submission, output, isCorrect };
  } catch (error) {
    throw { success: false, message: error };
  }
};

interface WorkerSetup {
  executorWorker: Worker;
  judgeWorker: Worker;
}

const setupWorkers = (
  submission: SubmissionRequest
): Promise<[SubmissionResult[], boolean]> => {
  return new Promise((resolve, reject) => {
    let [output, isCorrect]: [SubmissionResult[], boolean] = [[], false];

    const executorWorker = new Worker(
      new URL("../workers/executor", import.meta.url).href
    );
    const judgeWorker = new Worker(
      new URL("../workers/judge", import.meta.url).href
    );

    executorWorker.postMessage(submission);

    executorWorker.onmessage = (output: MessageEvent) => {
      if (output.data.error) {
        reject(output.data.error);
        executorWorker.terminate();
      } else {
        judgeWorker.postMessage(output.data);
      }
    };

    judgeWorker.onmessage = (result: JudgeEvent) => {
      output = result.data.results;
      isCorrect = result.data.isCorrect;
      resolve([output, isCorrect]);
    };

    executorWorker.onerror = (error) => {
      console.error("An error occurred while executing the code:", error);
      reject(error);
      executorWorker.terminate();
    };

    judgeWorker.onerror = (error) => {
      console.error("An error occurred while judging the code:", error);
      reject(error);
      judgeWorker.terminate();
    };
  });
};
