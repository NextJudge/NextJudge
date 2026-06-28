"use client";

import { ContestFormFields } from "@/components/contests/contest-form-fields";
import { Form } from "@/components/ui/form";
import { LoadingButton } from "@/components/ui/loading-button";
import { apiCreateEvent, apiGetProblems } from "@/lib/api";
import {
  contestFormDefaultValues,
  contestFormSchema,
  ContestFormValues,
} from "@/lib/schemas/contest-form";
import { CreateEventRequest, NextJudgeEvent, Problem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface ContestFormProps {
  onAdd: (contest: NextJudgeEvent) => void;
}

export function ContestForm({ onAdd }: ContestFormProps) {
  const { data: session } = useSession();
  const [startTime, setStartTime] = useState<Date | undefined>(new Date());
  const [endTime, setEndTime] = useState<Date | undefined>(
    new Date(Date.now() + 24 * 60 * 60 * 1000)
  );
  const [availableProblems, setAvailableProblems] = useState<Problem[]>([]);
  const [selectedProblems, setSelectedProblems] = useState<
    { id: number; title: string }[]
  >([]);
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

  const form = useForm<ContestFormValues>({
    resolver: zodResolver(contestFormSchema),
    defaultValues: contestFormDefaultValues,
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

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  async function onSubmit(data: ContestFormValues) {
    if (!session?.nextjudge_token) {
      toast.error("You must be signed in to create a contest.");
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

      const newContest = await apiCreateEvent(session.nextjudge_token, eventData);
      onAdd(newContest);

      toast.success(`${data.title} contest created successfully!`);

      form.reset(contestFormDefaultValues);
      setStartTime(new Date());
      setEndTime(new Date(Date.now() + 24 * 60 * 60 * 1000));
      setSelectedProblems([]);
    } catch (error) {
      console.error("Failed to create contest:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create contest. Please try again."
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
        <LoadingButton className="col-span-2" type="submit" loading={loading}>
          Create contest
        </LoadingButton>
      </form>
    </Form>
  );
}
