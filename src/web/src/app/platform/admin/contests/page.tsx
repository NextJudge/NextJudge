"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useAdminEvents } from "@/hooks/queries/use-event-queries";
import { apiDeleteEvent } from "@/lib/api";
import { NextJudgeEvent } from "@/lib/types";
import { PlusIcon } from "@radix-ui/react-icons";
import { useSession } from "next-auth/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ContestForm } from "./contest-form";
import { EditContestForm } from "./edit-contest-form";
import { EnhancedContestGrid } from "./enhanced-contest-card";

export default function AdminContestsPage() {
  const { data: session } = useSession();
  const {
    data: contests = [],
    isLoading: loading,
    refetch: fetchContests,
  } = useAdminEvents(session?.nextjudge_token);
  const [editingContest, setEditingContest] = useState<NextJudgeEvent | null>(null);

  const refreshContests = useCallback(async () => {
    await fetchContests();
  }, [fetchContests]);

  const onDelete = useCallback(async (id: number) => {
    if (!session?.nextjudge_token) return;

    try {
      await apiDeleteEvent(session.nextjudge_token, id);
      await refreshContests();
      toast.success("Contest deleted successfully.");
    } catch (error) {
      console.error('Failed to delete contest:', error);
      toast.error("Failed to delete contest. Please try again.");
    }
  }, [session?.nextjudge_token, refreshContests]);

  const onAdd = useCallback(async (_contest: NextJudgeEvent) => {
    await refreshContests();
  }, [refreshContests]);

  const onEdit = useCallback((contest: NextJudgeEvent) => {
    setEditingContest(contest);
  }, []);

  const onUpdate = useCallback(async (_updatedContest: NextJudgeEvent) => {
    await refreshContests();
  }, [refreshContests]);

  const onParticipantAdded = useCallback(async () => {
    await refreshContests();
  }, [refreshContests]);
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h3 className="text-lg font-medium">Contest Management</h3>
            <p className="text-sm text-muted-foreground">
              Loading contests...
            </p>
          </div>
        </div>
        <Separator />
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Contest Management</h3>
          <p className="text-sm text-muted-foreground">
            The hub of all the NextJudge contests. Create, edit, and delete
            contests here.
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center space-x-4">
              <PlusIcon /> <span>Create contest</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] lg:max-w-[640px] overflow-y-scroll">
            <DialogHeader>
              <DialogTitle>Create a new contest</DialogTitle>
              <DialogDescription>
                Fill in the details of the contest you want to create.
              </DialogDescription>
            </DialogHeader>
            <ContestForm onAdd={onAdd} />
          </DialogContent>
        </Dialog>
      </div>
      <Separator />
      <EnhancedContestGrid
        contests={contests}
        onDelete={onDelete}
        onEdit={onEdit}
        onParticipantAdded={onParticipantAdded}
        onContestEnded={refreshContests}
      />

      {/* Edit Contest Dialog */}
      <Dialog open={!!editingContest} onOpenChange={() => setEditingContest(null)}>
        <DialogContent className="sm:max-w-[425px] lg:max-w-[640px] overflow-y-scroll">
          <DialogHeader>
            <DialogTitle>Edit Contest</DialogTitle>
            <DialogDescription>
              Update the details of the contest.
            </DialogDescription>
          </DialogHeader>
          {editingContest && (
            <EditContestForm
              contest={editingContest}
              onUpdate={onUpdate}
              onClose={() => setEditingContest(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
