import { getBridgeUrl } from "@/lib/utils";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export enum status {
  ACCEPTED = "Accepted",
  WRONG_ANSWER = "Wrong Answer",
  TIME_LIMIT_EXCEEDED = "Time Limit Exceeded",
  MEMORY_LIMIT_EXCEEDED = "Memory Limit Exceeded",
  RUNTIME_ERROR = "Runtime Error",
  COMPILE_TIME_ERROR = "Compile Time Error",
  PENDING = "Pending",
}

export const statusMap: Record<string, string> = {
  ACCEPTED: status.ACCEPTED,
  WRONG_ANSWER: status.WRONG_ANSWER,
  TIME_LIMIT_EXCEEDED: status.TIME_LIMIT_EXCEEDED,
  MEMORY_LIMIT_EXCEEDED: status.MEMORY_LIMIT_EXCEEDED,
  RUNTIME_ERROR: status.RUNTIME_ERROR,
  COMPILE_TIME_ERROR: status.COMPILE_TIME_ERROR,
  PENDING: status.PENDING,
};

type Status =
  | "ACCEPTED"
  | "WRONG_ANSWER"
  | "TIME_LIMIT_EXCEEDED"
  | "MEMORY_LIMIT_EXCEEDED"
  | "RUNTIME_ERROR"
  | "COMPILE_TIME_ERROR"
  | "PENDING";

export type CurrentSubmissionDetails = {
  failed_test_case_id: number | null;
  id: number;
  language_id: number;
  problem_id: number;
  source_code: string;
  status: Status;
  submit_time: string;
  test_cases: null;
  time_elapsed: number;
  user_id: number;
};

const useSubmitCode = (userId: number, code: string) => {
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [currentSubmissionDetails, setCurrentSubmissionDetails] =
    useState<CurrentSubmissionDetails | null>(null);

  const fetchSubmissionDetails = useCallback(async () => {
    try {
      let response = await fetch(
        `/api/submission?submissionId=${submissionId}`
      );

      if (!response.ok) {
        throw new Error("An error occurred.");
      }

      let data = (await response.json()) as CurrentSubmissionDetails;

      while (data.status === "PENDING") {
        console.log("Waiting for submission to complete...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        response = await fetch(`/api/submission?submissionId=${submissionId}`);
        data = (await response.json()) as CurrentSubmissionDetails;
      }

      setSubmissionLoading(false);
      console.log("Setting currentSubmissionDetails to: ", data);
      setCurrentSubmissionDetails(data);
    } catch (error) {
      console.error(error);
    }
  }, [submissionId, setCurrentSubmissionDetails, setSubmissionLoading]);

  const handleSubmitCode = async (languageId: number, problemId: number) => {
    setSubmissionLoading(true);
    setError(null);
    try {
      const response = await fetch(`${getBridgeUrl()}/submission`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_code: code,
          language_id: languageId,
          problem_id: problemId,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        throw new Error("An error occurred.");
      }

      const data = await response.json();
      setSubmissionId(data);
      console.log("Setting submissionId to: ", data);
    } catch (error) {
      toast.error("There was an error submitting your code.");
      // @ts-ignore
      setError(error.message);
    }
  };

  return {
    handleSubmitCode,
    submissionLoading,
    error,
    submissionId,
    setSubmissionId,
    currentSubmissionDetails,
    setCurrentSubmissionDetails,
    fetchSubmissionDetails,
  };
};

export { useSubmitCode };
