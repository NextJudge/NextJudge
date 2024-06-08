"use client";

import { DummyCodeEditor } from "@/components/landing/bento";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { SingleSubmission } from "../(problem)/[id]/page";

export function DialogSubmission({
  submission,
  children,
}: {
  submission: any;
  children?: React.ReactNode;
}) {
  if (!submission) return null;
  return (
    <>
      <div className="flex flex-col gap-4">
        <Dialog>
          <DialogTrigger asChild>
            {children ? (
              children
            ) : (
              <Button variant="outline">View Submission</Button>
            )}
          </DialogTrigger>
          <DialogContent className="min-w-2xl max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                Submission to {submission.problems.title}
              </DialogTitle>
              <DialogDescription>
                Submitted by {submission.problems.users.name} on{" "}
                {format(submission.submit_time, "PPP 'at' p")}
              </DialogDescription>
            </DialogHeader>
            <div>
              <h1
                className={cn("text-lg font-bold", "text-primary-foreground", {
                  "text-green-500": submission.status === "ACCEPTED",
                  "text-red-500":
                    submission.status === "WRONG_ANSWER" ||
                    submission.status === "TIME_LIMIT_EXCEEDED" ||
                    submission.status === "MEMORY_LIMIT_EXCEEDED" ||
                    submission.status === "RUNTIME_ERROR" ||
                    submission.status === "COMPILE_TIME_ERROR",
                  "text-yellow-500": submission.status === "PENDING",
                })}
              >
                {submission.status.toUpperCase()}
              </h1>
            </div>
            <DummyCodeEditor sourceCode={submission.source_code as any} language={submission.languages.name} />
            <DialogFooter className="sm:justify-start">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
