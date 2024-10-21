import { statusMap, Submission } from "@/lib/types";
import { cn } from "@/lib/utils";
export function SubmissionState({
  submission,
}: {
  submission: Submission;
}) {
  const parsedStatus = statusMap[submission.status];
  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p
            className={cn("text-lg font-semibold", {
              "text-green-500": statusMap[submission.status] === "Accepted",
              "text-yellow-500": statusMap[submission.status] === "Pending",
              "text-red-500": statusMap[submission.status] !== "Accepted",
            })}
          >
            {" "}
            {parsedStatus}
          </p>
        </div>
        <div className="flex self-center ml-2 mt-1 gap-1">
          <p className="text-xs">Runtime:</p>
          <p className="text-xs">{submission.time_elapsed}ms</p>
        </div>
      </div>
    </>
  );
}
