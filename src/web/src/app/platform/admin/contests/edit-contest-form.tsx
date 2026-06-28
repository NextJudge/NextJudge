"use client";

import { ContestFormFields } from "@/components/contests/contest-form-fields";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { LoadingButton } from "@/components/ui/loading-button";
import {
  apiAddEventParticipant,
  apiGetProblems,
  apiGetUsers,
  apiUpdateEvent,
} from "@/lib/api";
import {
  contestFormSchema,
  ContestFormValues,
} from "@/lib/schemas/contest-form";
import { CreateEventRequest, NextJudgeEvent, Problem, User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { UserSelector } from "./user-selector";

interface EditContestFormProps {
  contest: NextJudgeEvent;
  onUpdate: (contest: NextJudgeEvent) => void;
  onClose: () => void;
}

export function EditContestForm({
  contest,
  onUpdate,
  onClose,
}: EditContestFormProps) {
  const { data: session } = useSession();
  const [startTime, setStartTime] = useState<Date | undefined>(
    new Date(contest.start_time)
  );
  const [endTime, setEndTime] = useState<Date | undefined>(
    new Date(contest.end_time)
  );
  const [availableProblems, setAvailableProblems] = useState<Problem[]>([]);
  const [selectedProblems, setSelectedProblems] = useState<
    { id: number; title: string }[]
  >([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSelectedProblemsChange = useCallback(
    (items: { id: number; title?: string; username?: string }[]) => {
      setSelectedProblems(
        items
          .filter((item) => item.title)
          .map((item) => ({ id: item.id, title: item.title! }))
      );
    },
    []
  );

  const defaultValues: Partial<ContestFormValues> = {
    title: contest.title,
    description: contest.description,
    startTime: new Date(contest.start_time),
    endTime: new Date(contest.end_time),
    teams: contest.teams,
  };

  const form = useForm<ContestFormValues>({
    resolver: zodResolver(contestFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const fetchProblems = useCallback(async () => {
    if (!session?.nextjudge_token) return;

    try {
      const problems = await apiGetProblems(session.nextjudge_token);
      setAvailableProblems(problems);
    } catch (error) {
      console.error("Failed to fetch problems:", error);
    }
  }, [session?.nextjudge_token]);

  const fetchUsers = useCallback(async () => {
    if (!session?.nextjudge_token) return;

    setLoadingUsers(true);
    try {
      const allUsers = await apiGetUsers(session.nextjudge_token);
      setUsers(allUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  }, [session?.nextjudge_token]);

  const handleAddParticipant = async (userId: string) => {
    if (!session?.nextjudge_token) return;

    try {
      await apiAddEventParticipant(
        session.nextjudge_token,
        contest.id,
        userId
      );
      toast.success("Participant added successfully");
    } catch (error) {
      console.error("Failed to add participant:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add participant";

      if (
        errorMessage.includes("404") ||
        errorMessage.includes("not implemented")
      ) {
        toast.error(
          "Participant management is not yet fully implemented in the backend"
        );
      } else {
        toast.error(errorMessage);
      }
    }
  };

  useEffect(() => {
    fetchProblems();
    fetchUsers();
    if (contest.problems) {
      setSelectedProblems(
        contest.problems.map((p) => ({
          id: p.id,
          title: "title" in p ? p.title : `Problem ${p.id}`,
        }))
      );
    }
  }, [fetchProblems, fetchUsers, contest.problems]);

  async function onSubmit(data: ContestFormValues) {
    if (!session?.nextjudge_token) {
      toast.error("You must be signed in to update a contest.");
      return;
    }

    if (!startTime || !endTime) {
      toast.error("Please select a start and end time for the contest.");
      return;
    }

    if (startTime >= endTime) {
      toast.error("End time must be after start time.");
      return;
    }

    setLoading(true);

    try {
      const eventData: CreateEventRequest = {
        title: data.title,
        description: data.description,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        teams: data.teams,
        problems: selectedProblems.map((problem) => ({
          problem_id: problem.id,
        })),
      };

      const updatedContest = await apiUpdateEvent(
        session.nextjudge_token,
        contest.id,
        eventData
      );
      onUpdate(updatedContest);

      toast.success(`${data.title} contest updated successfully!`);
      onClose();
    } catch (error) {
      console.error("Failed to update contest:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update contest. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("grid gap-6 grid-cols-2")}
      >
        <ContestFormFields
          form={form}
          startTime={startTime}
          endTime={endTime}
          setStartTime={setStartTime}
          setEndTime={setEndTime}
          availableProblems={availableProblems}
          selectedProblems={selectedProblems}
          onSelectedProblemsChange={handleSelectedProblemsChange}
        />
        <div className="flex flex-col space-y-2 col-span-2">
          <label
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Participants
          </label>
          <UserSelector
            users={users}
            loading={loadingUsers}
            onUserSelect={handleAddParticipant}
            existingParticipants={contest.participants || []}
            multiple={true}
          />
          <p className="text-sm text-muted-foreground">
            Add participants to this contest.
          </p>
        </div>
        <div className="col-span-2 flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <LoadingButton type="submit" loading={loading} className="flex-1">
            Update contest
          </LoadingButton>
        </div>
      </form>
    </Form>
  );
}
