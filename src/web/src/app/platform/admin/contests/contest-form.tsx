"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { DateTimePicker } from "@/components/date-time-picker";
import { DropdownMenuCheckboxes } from "@/components/multi-selector";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/ui/loading-button";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useState } from "react";

const accountFormSchema = z.object({
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  description: z.string({ required_error: "Description is required" }),
  title: z.string({ required_error: "Title is required" }),
  problems: z
    .array(
      z.object({
        id: z.number(),
        title: z.string(),
      })
    )
    .optional(),
  participants: z
    .array(
      z.object({
        id: z.number(),
        username: z.string(),
      })
    )
    .optional(),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

// TODO: Fetch problems and participants from the bridge
const defaultValues: Partial<AccountFormValues> = {
  title: "Contest Title",
  description: "Contest Description",
  startTime: new Date(),
  endTime: new Date(),
  problems: [
    { id: 1, title: "Problem 1" },
    { id: 2, title: "Problem 2" },
    { id: 3, title: "Problem 3" },
  ],
  participants: [
    { id: 1, username: "nyumat" },
    { id: 2, username: "nyumat" },
    { id: 3, username: "nyumat" },
  ],
};

export function ContestForm({ onAdd }: any) {
  const [startTime, setStartTime] = useState<Date | undefined>(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [participants, setParticipants] = useState(defaultValues.participants);
  const [problems, setProblems] = useState(defaultValues.problems);
  const [selectedProblems, setSelectedProblems] = useState<any[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues,
    mode: "onChange",
  });

  function onSubmit(data: AccountFormValues) {
    setLoading(true);
    if (startTime && endTime) {
      data = { ...data, startTime, endTime };
      // Debug
      //   toast({
      //     title: "You submitted the following values:",
      //     description: (
      //       <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
      //         <code className="text-white">{JSON.stringify(data, null, 2)}</code>
      //       </pre>
      //     ),
      //   });
      onAdd(data);
      setTimeout(() => {
        toast({
          title: `${data.title} event created successfully`,
          description:
            "The contest has been created successfully and is now live, participants can now join the event.",
        });
        setLoading(false);
        setOpen(false);
      }, 2000);
    } else {
      toast({
        title: "Please select a start and end time.",
        description: "You must select a start and end time for the contest.",
      });
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("grid gap-6 grid-cols-2")}
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Contest Title" {...field} />
              </FormControl>
              <FormDescription>
                The public display name for the contest.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Contest Description" {...field} />
              </FormControl>
              <FormDescription>
                A brief description of the contest.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="startTime"
          render={() => {
            return (
              <FormItem className="flex flex-col">
                <FormLabel>Start Time</FormLabel>
                <DateTimePicker date={startTime} setDate={setStartTime} />
                <FormDescription>When the contest will start.</FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="endTime"
          render={() => (
            <FormItem className="flex flex-col">
              <FormLabel>End Time</FormLabel>
              <DateTimePicker date={endTime} setDate={setEndTime} />
              <FormDescription>When the contest will conclude.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="problems"
          render={() => (
            <FormItem className="flex flex-col">
              <FormLabel>Problems</FormLabel>
              <FormControl>
                <DropdownMenuCheckboxes
                  items={problems}
                  selectedItems={selectedProblems}
                  setSelectedItems={setSelectedProblems}
                  type="problems"
                >
                  {selectedProblems.map((problem) => (
                    <div key={problem.id}>{problem.title}</div>
                  ))}
                </DropdownMenuCheckboxes>
              </FormControl>
              <FormDescription>
                Select some problems to include in the contest.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="participants"
          render={() => (
            <FormItem className="flex flex-col">
              <FormLabel>Participants</FormLabel>
              <FormControl>
                <DropdownMenuCheckboxes
                  items={participants}
                  selectedItems={selectedParticipants}
                  setSelectedItems={setSelectedParticipants}
                  type="participants"
                >
                  {selectedParticipants.map((participant) => (
                    <div key={participant.id}>{participant.username}</div>
                  ))}
                </DropdownMenuCheckboxes>
              </FormControl>
              <FormDescription>
                Select some participants to include in the contest.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <LoadingButton className="col-span-2" type="submit" loading={loading}>
          Create contest
        </LoadingButton>
      </form>
    </Form>
  );
}
