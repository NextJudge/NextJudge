"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useEndEvent } from "@/hooks/queries/use-event-queries";
import { getContestStatus } from "@/lib/contest-utils";
import { NextJudgeEvent } from "@/lib/types";
import { StopCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";

interface EndContestButtonProps {
  contest: NextJudgeEvent;
  onEnded?: () => void;
  variant?: "default" | "destructive" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
  showLabel?: boolean;
  className?: string;
}

export function EndContestButton({
  contest,
  onEnded,
  variant = "destructive",
  size = "sm",
  showLabel = true,
  className,
}: EndContestButtonProps) {
  const { data: session } = useSession();
  const token = session?.nextjudge_token;
  const endEvent = useEndEvent(token);
  const [open, setOpen] = useState(false);
  const status = getContestStatus(contest.start_time, contest.end_time);

  if (status !== "ongoing") {
    return null;
  }

  const handleEnd = async () => {
    try {
      await endEvent.mutateAsync(contest.id);
      toast.success(`"${contest.title}" has been ended`);
      setOpen(false);
      onEnded?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to end contest",
      );
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        disabled={endEvent.isPending}
        className={className}
        onClick={() => setOpen(true)}
      >
        <StopCircle className="h-4 w-4" />
        {showLabel && <span className="ml-2">End now</span>}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End contest early?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately end &quot;{contest.title}&quot;. Participants
              will no longer be able to submit solutions. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleEnd()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              End contest
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
