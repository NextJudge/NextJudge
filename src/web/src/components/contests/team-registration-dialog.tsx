"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useEventTeams,
  useTeamMutations,
} from "@/hooks/queries/use-event-teams";
import { EventTeam } from "@/lib/types";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";

interface TeamRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: number;
  eventTitle: string;
}

export function TeamRegistrationDialog({
  open,
  onOpenChange,
  eventId,
  eventTitle,
}: TeamRegistrationDialogProps) {
  const { data: session } = useSession();
  const token = session?.nextjudge_token;
  const [teamName, setTeamName] = useState("");

  const { data: teams = [], isLoading } = useEventTeams(token, eventId);
  const { createTeam, joinTeam } = useTeamMutations(token, eventId);

  const handleCreateTeam = async () => {
    const trimmed = teamName.trim();
    if (!trimmed) {
      toast.error("Enter a team name");
      return;
    }

    try {
      await createTeam.mutateAsync(trimmed);
      toast.success(`Team "${trimmed}" created`);
      setTeamName("");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create team",
      );
    }
  };

  const handleJoinTeam = async (team: EventTeam) => {
    try {
      await joinTeam.mutateAsync(team.id);
      toast.success(`Joined team "${team.name}"`);
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to join team",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Team registration</DialogTitle>
          <DialogDescription>
            Create a new team or join an existing one for {eventTitle}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="team-name">Create a team</Label>
            <div className="flex gap-2">
              <Input
                id="team-name"
                placeholder="Team name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    void handleCreateTeam();
                  }
                }}
              />
              <Button
                onClick={() => void handleCreateTeam()}
                disabled={createTeam.isPending}
              >
                Create
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Join an existing team</Label>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading teams...</p>
            ) : teams.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No teams yet. Be the first to create one.
              </p>
            ) : (
              <ScrollArea className="max-h-48 rounded-md border">
                <div className="divide-y">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center justify-between gap-2 p-3"
                    >
                      <span className="text-sm font-medium">{team.name}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleJoinTeam(team)}
                        disabled={joinTeam.isPending}
                      >
                        Join
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
