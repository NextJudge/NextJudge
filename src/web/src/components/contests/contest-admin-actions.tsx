"use client";

import { EndContestButton } from "@/components/contests/end-contest-button";
import { CloneContestDialog } from "@/app/platform/contests/[id]/clone-contest-dialog";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { NextJudgeEvent, Problem } from "@/lib/types";

interface ContestAdminActionsProps {
  contest: NextJudgeEvent;
  problems: Problem[];
}

export function ContestAdminActions({
  contest,
  problems,
}: ContestAdminActionsProps) {
  return (
    <div className="flex flex-col gap-3">
      <EndContestButton contest={contest} showLabel />
      <CloneContestDialog contest={contest} problems={problems}>
        <Button className="gap-2 w-full" variant="outline">
          <Icons.copy className="w-4 h-4" />
          Clone contest
        </Button>
      </CloneContestDialog>
    </div>
  );
}
