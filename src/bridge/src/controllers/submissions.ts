import { isValidToken } from "@util/main";
import { JudgeEvent, SubmissionRequest, SubmissionResult } from "@util/types";
import { randomUUID } from "node:crypto";
import { RABBITMQ_HOST, RABBITMQ_PORT, DATABASE_HOST, DATABASE_PORT } from '@util/constants';
import { SubmissionService } from '@classes/SubmissionService';
import ApiService from '@classes/ApiService';
import { rabbitmq } from "../rabbitmq/rabbitmq";

const submissionService = new SubmissionService();

export const createSubmission = async ({
  bearer,
  body,
}: {
  bearer: string;
  body: { user_id: number; source_code: string; language_id: number; problem_id: number };
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

    const submission_id: number = submission_to_db_response.id;

    console.log("Sending submission to the queue", submission_id)
    rabbitmq.addSubmissionToQueue(submission_id);


    return submission_id;
  } catch (error) {
    throw { success: false, message: error };
  }
};

