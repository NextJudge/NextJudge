import { createClient } from 'redis';


import { isValidToken } from "@util/main";
import { JudgeEvent, SubmissionRequest, SubmissionResult } from "@util/types";
import { randomUUID } from "node:crypto";
import { REDIS_HOST, REDIS_PORT } from '@util/constants';

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
      // userId: user.id.toString(),
      submissionId: randomUUID(),
    };

    console.log("Sending submission to the queue")
    await add_submission_to_queue(submission.submissionId);
    
    // Responds with SOMETHING to indicate success
    return { submission };
  } catch (error) {
    throw { success: false, message: error };
  }
};


async function add_submission_to_queue(submission_id: string){
  const client = createClient({
    url:`redis://${REDIS_HOST}:${REDIS_PORT}`
  });
  client.on('error', err => console.log('Redis Client Error', err));
  await client.connect();

  await client.lPush('submissions', [submission_id]);
}



