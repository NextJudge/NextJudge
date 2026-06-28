"use client";

import { ContestFormFields } from "@/components/contests/contest-form-fields";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { LoadingButton } from "@/components/ui/loading-button";
import { apiCreateEvent, apiGetProblems } from "@/lib/api";
import {
  contestFormSchema,
  ContestFormValues,
} from "@/lib/schemas/contest-form";
import { CreateEventRequest, NextJudgeEvent, Problem } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface CloneContestDialogProps {
  contest: NextJudgeEvent;
  problems: Problem[];
  children: React.ReactNode;
}

export function CloneContestDialog({
  contest,
  problems,
  children,
}: CloneContestDialogProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [startTime, setStartTime] = useState<Date | undefined>(new Date());
  const [endTime, setEndTime] = useState<Date | undefined>(
    new Date(Date.now() + 24 * 60 * 60 * 1000)
  );
  const [loading, setLoading] = useState(false);
  const [availableProblems, setAvailableProblems] = useState<Problem[]>([]);
  const [selectedProblems, setSelectedProblems] = useState<
    { id: number; title: string }[]
  >([]);

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

  const fetchProblems = useCallback(async () => {
    if (!session?.nextjudge_token) return;

    try {
      const allProblems = await apiGetProblems(session.nextjudge_token);
      setAvailableProblems(allProblems);
    } catch (error) {
      console.error("failed to fetch problems:", error);
    }
  }, [session?.nextjudge_token]);

  const cloneDefaultValues: Partial<ContestFormValues> = {
    title: `${contest.title} (Clone)`,
    description: contest.description,
    startTime: new Date(),
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    teams: contest.teams,
  };

  const form = useForm<ContestFormValues>({
    resolver: zodResolver(contestFormSchema),
    defaultValues: cloneDefaultValues,
    mode: "onChange",
  });

  useEffect(() => {
    if (open) {
      fetchProblems();
      setSelectedProblems(problems.map((p) => ({ id: p.id, title: p.title })));
    }
  }, [fetchProblems, open, problems]);

  async function onSubmit(data: ContestFormValues) {
    if (!session?.nextjudge_token) {
      toast.error("you must be signed in to clone a contest.");
      return;
    }

    if (!startTime || !endTime) {
      toast.error("please select a start and end time for the contest.");
      return;
    }

    if (startTime >= endTime) {
      toast.error("end time must be after start time.");
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
      toast.success(`${data.title} contest cloned successfully!`);
      setOpen(false);
      router.push(`/platform/contests/${newContest.id}`);
    } catch (error) {
      console.error("failed to clone contest:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "failed to clone contest. please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      form.reset(cloneDefaultValues);
      setStartTime(new Date());
      setEndTime(new Date(Date.now() + 24 * 60 * 60 * 1000));
      setSelectedProblems([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="sm:max-w-[425px] lg:max-w-[640px] overflow-y-scroll max-h-[90vh]"
      >
        <DialogHeader>
          <DialogTitle>Clone Contest</DialogTitle>
          <DialogDescription>
            this will create a new contest based on the current one. you can
            customize the details below.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Icons.copy className="w-4 h-4" />
            Cloning from: {contest.title}
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>Description: {contest.description}</div>
            <div>Teams: {contest.teams ? "Enabled" : "Disabled"}</div>
            <div className="flex items-center gap-2">
              Original Problems:
              <Badge variant="secondary" className="text-xs">
                {problems.length} problem{problems.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            {problems.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {problems.map((problem, index) => (
                  <Badge key={problem.id} variant="outline" className="text-xs">
                    {index + 1}. {problem.title}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-6 grid-cols-2"
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
              variant="clone"
            />
            <div className="col-span-2 flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <LoadingButton type="submit" loading={loading} className="flex-1">
                Clone contest
              </LoadingButton>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
