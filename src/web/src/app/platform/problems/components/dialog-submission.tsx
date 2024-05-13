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
import { RecentSubmission } from "../data/schema";

export function DialogSubmission({
  submission,
  children,
}: {
  submission: RecentSubmission;
  children?: React.ReactNode;
}) {
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
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Submission to {submission.problem.title}
              </DialogTitle>
              <DialogDescription>
                Submitted by {submission.problem.author} on{" "}
                {submission.time.toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            <div>
              <h1
                className={cn("text-lg font-bold", "text-primary-foreground", {
                  "text-green-500": submission.status === "accepted",
                  "text-red-500": submission.status === "rejected",
                  "text-yellow-500": submission.status === "pending",
                })}
              >
                {submission.status.toUpperCase()}
              </h1>
            </div>
            <DummyCodeEditor />
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