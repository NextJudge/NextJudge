import { getBridgeUrl } from "@/lib/utils";
import { useCallback, useState } from "react";
import { toast } from "sonner";

const useSubmitCode = (userId: number, code: string) => {
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submissionId, setSubmissionId] = useState(null);

  const handleSubmitCode = useCallback(
    async (languageId: number, problemId: number) => {
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

        console.log(response);

        if (!response.ok) {
          throw new Error("An error occurred.");
        }

        const data = await response.json();
        setSubmissionId(data);
      } catch (error) {
        toast.error("There was an error submitting your code.");
        // @ts-ignore
        setError(error.message);
      } finally {
        setSubmissionLoading(false);
      }
    },
    [code]
  );

  return { handleSubmitCode, submissionLoading, error, submissionId };
};

export { useSubmitCode };
