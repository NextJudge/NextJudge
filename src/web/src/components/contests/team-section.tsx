"use client";

import { TeamRegistrationDialog } from "@/components/contests/team-registration-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMyEventTeam } from "@/hooks/queries/use-event-teams";
import { getContestStatus } from "@/lib/contest-utils";
import { NextJudgeEvent } from "@/lib/types";
import { UsersIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";

interface TeamSectionProps {
  contest: NextJudgeEvent;
  isParticipant: boolean;
}

export function TeamSection({ contest, isParticipant }: TeamSectionProps) {
  const { data: session } = useSession();
  const token = session?.nextjudge_token;
  const [dialogOpen, setDialogOpen] = useState(false);

  const status = getContestStatus(contest.start_time, contest.end_time);
  const { data: myTeam, isLoading } = useMyEventTeam(
    token,
    contest.id,
    isParticipant && contest.teams,
  );

  if (!contest.teams || status === "ended") {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <UsersIcon className="h-4 w-4" />
              Team Contest
            </CardTitle>
            <Badge variant="secondary">Teams enabled</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading team info...</p>
          ) : myTeam ? (
            <div className="space-y-2">
              <p className="text-sm">
                Your team:{" "}
                <span className="font-semibold text-foreground">{myTeam.name}</span>
              </p>
              {myTeam.members && myTeam.members.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {myTeam.members.map((member) => (
                    <Badge key={member.id} variant="outline">
                      {member.name || member.email}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ) : isParticipant ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                You are registered but not on a team yet. Create or join a team to
                submit solutions.
              </p>
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                Create or join team
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Register for this contest, then create or join a team.
            </p>
          )}
        </CardContent>
      </Card>

      <TeamRegistrationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        eventId={contest.id}
        eventTitle={contest.title}
      />
    </>
  );
}
