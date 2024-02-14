import ApiService from "@classes/ApiService";
import { BackendSubmission, SubmissionRequest, User } from "@util/types";
import { DATABASE_PORT, DATABASE_HOST } from "@util/constants";


export class SubmissionService {
  async createSubmission(
    submissionData: SubmissionRequest
  ): Promise<any> {
    try {
      console.log("Sending submission to db")
      console.log(submissionData)
      const response = await ApiService.post(
        `http://${DATABASE_HOST}:${DATABASE_PORT}/v1/submissions`,
        submissionData
      );

      if (!response.ok){
        console.log(await response.json())
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const submission = await response.json();
      console.log("Returned value", submission);
      return submission;
    } catch (error) {
      console.error("An error occurred while creating the submission:", error);
      throw error;
    }
  }

  async getSubmission(submission_id: number): Promise<BackendSubmission> {
    try {
      console.log("[SubmissionService] Getting submission", submission_id);

      const response = await ApiService.get(
        `http://${DATABASE_HOST}:${DATABASE_PORT}/v1/submissions/${submission_id}`
      );

      if (!response.ok){
        console.log(await response.json())
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const submission = (await response.json()) as BackendSubmission;
      return submission;
    } catch (error) {
      console.error("An error occurred while getting the submission:", error);
      throw error;
    }
  }
}
