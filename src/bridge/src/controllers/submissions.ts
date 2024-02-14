import { createClient } from 'redis';


import { isValidToken } from "@util/main";
import { JudgeEvent, SubmissionRequest, SubmissionResult } from "@util/types";
import { randomUUID } from "node:crypto";
import { REDIS_HOST, REDIS_PORT } from '@util/constants';
import { SubmissionService } from '@classes/SubmissionService';

// TODO: Implement this in the data-layer so that we can append submissions.
const submissionService = new SubmissionService();

export const createSubmission = async ({
  bearer,
  body,
}: {
  bearer: string;
  body: { user_id: number; source_code: string; language: string; problem_id: number };
}) => {
  try {
    // const [isValid, user] = await isValidToken(bearer, body.userId);

    // if (!isValid) {
    //   throw new Error("Unauthorized");
    // }

    // if (!user) {
    //   throw new Error("User not found");
    // }

    // Send submission to the database
    const submission_to_db_response = await submissionService.createSubmission(
      body as SubmissionRequest
    );

    const submission_id: number = submission_to_db_response.problem_id;

    console.log("Sending submission to the queue", submission_id)
    await add_submission_to_queue(submission_id);
    
    return submission_id;
  } catch (error) {
    throw { success: false, message: error };
  }
};


async function add_submission_to_queue(submission_id: number){
  console.log(`Connecting to redis queue      redis://${REDIS_HOST}:${REDIS_PORT}`)
  const client = createClient({
    url:`redis://${REDIS_HOST}:${REDIS_PORT}`
  });
  client.on('error', err => console.log('Redis Client Error', err));
  await client.connect();

  console.log(`Connected to queue`)
  await client.lPush('submissions', [submission_id.toString()]);
  console.log(`Pushed submission ${submission_id} }to queue`)
}


