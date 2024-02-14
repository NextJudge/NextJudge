import ApiService from "@classes/ApiService";
import { BackendSubmission, SubmissionRequest, User } from "@util/types";
import { DATABASE_PORT, DATABASE_HOST } from "@util/constants";


export class SubmissionService {
  async createSubmission(
    submissionData: SubmissionRequest
  ): Promise<any> {
    try {
      const response = await ApiService.post(
        `http://${DATABASE_HOST}:${DATABASE_PORT}/v1/submissions`,
        submissionData
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const submission = await response.json();
      return submission;
    } catch (error) {
      console.error("An error occurred while creating the submission:", error);
      throw error;
    }
  }

  async getSubmission(submissionId: string): Promise<BackendSubmission> {
    try {
      console.log("[SubmissionService] Getting submission");

      const response = await ApiService.get(
        `http://${DATABASE_HOST}:${DATABASE_PORT}/v1/submissions/${submissionId}`
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      
      const submission = (await response.json()) as BackendSubmission;
      return submission;
    } catch (error) {
      console.error("An error occurred while getting the submission:", error);
      throw error;
    }
  }
}
