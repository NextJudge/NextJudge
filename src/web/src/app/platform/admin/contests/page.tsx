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
import { apiDeleteEvent, apiGetEvents } from "@/lib/api";
import { NextJudgeEvent } from "@/lib/types";
import { PlusIcon } from "@radix-ui/react-icons";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ContestForm } from "./contest-form";
import { EditContestForm } from "./edit-contest-form";
import { EnhancedContestGrid } from "./enhanced-contest-card";

export default function AdminContestsPage() {
  const { data: session } = useSession();
  const [contests, setContests] = useState<NextJudgeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingContest, setEditingContest] = useState<NextJudgeEvent | null>(null);

  const fetchContests = useCallback(async () => {
    if (!session?.nextjudge_token) return;

    try {
      const events = await apiGetEvents(session.nextjudge_token);
      setContests(Array.isArray(events) ? events : []);
    } catch (error) {
      console.error('Failed to fetch contests:', error);
      toast.error("Failed to load contests. Please try again.");
      setContests([]);
    } finally {
      setLoading(false);
    }
  }, [session?.nextjudge_token]);

  useEffect(() => {
    fetchContests();
  }, [fetchContests]);

  const onDelete = useCallback(async (id: number) => {
    if (!session?.nextjudge_token) return;

    try {
      await apiDeleteEvent(session.nextjudge_token, id);
      setContests((prev) => prev.filter((contest) => contest.id !== id));
      toast.success("Contest deleted successfully.");
    } catch (error) {
      console.error('Failed to delete contest:', error);
      toast.error("Failed to delete contest. Please try again.");
    }
  }, [session?.nextjudge_token]);

  const onAdd = useCallback((contest: NextJudgeEvent) => {
    setContests((prev) => [...(Array.isArray(prev) ? prev : []), contest]);
  }, []);

  const onEdit = useCallback((contest: NextJudgeEvent) => {
    setEditingContest(contest);
  }, []);

  const onUpdate = useCallback((updatedContest: NextJudgeEvent) => {
    setContests((prev) => (Array.isArray(prev) ? prev : []).map(contest =>
      contest.id === updatedContest.id ? updatedContest : contest
    ));
  }, []);

  const onParticipantAdded = useCallback(async (eventId: number) => {
    // refresh the contests to get updated participant counts
    fetchContests();
  }, [fetchContests]);
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
            {/* TODO: add a button to create a new contest here */}
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
