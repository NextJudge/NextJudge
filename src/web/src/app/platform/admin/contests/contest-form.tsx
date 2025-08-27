"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { DropdownMenuCheckboxes } from "@/components/multi-selector";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { apiCreateEvent, apiGetProblems } from "@/lib/api";
import { CreateEventRequest, NextJudgeEvent, Problem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const contestFormSchema = z.object({
  startTime: z.date({ required_error: "Start time is required" }),
  endTime: z.date({ required_error: "End time is required" }),
  description: z.string({ required_error: "Description is required" }),
  title: z.string({ required_error: "Title is required" }),
  teams: z.boolean().default(false),
});

type ContestFormValues = z.infer<typeof contestFormSchema>;

const defaultValues: Partial<ContestFormValues> = {
  title: "",
  description: "",
  startTime: new Date(),
  endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  teams: false,
};

interface ContestFormProps {
  onAdd: (contest: NextJudgeEvent) => void;
}

interface DateTimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
}

function DateTimePicker({ date, setDate }: DateTimePickerProps) {
  function handleDateSelect(selectedDate: Date | undefined) {
    if (selectedDate) {
      // If we have an existing date, preserve the time
      if (date) {
        const newDate = new Date(selectedDate);
        newDate.setHours(date.getHours());
        newDate.setMinutes(date.getMinutes());
        newDate.setSeconds(date.getSeconds());
        setDate(newDate);
      } else {
        setDate(selectedDate);
      }
    }
  }

  function handleTimeChange(type: "hour" | "minute" | "ampm", value: string) {
    const currentDate = date || new Date();
    let newDate = new Date(currentDate);

    if (type === "hour") {
      const hour = parseInt(value, 10);
      const currentHours = newDate.getHours();
      const isPM = currentHours >= 12;

      if (isPM && hour !== 12) {
        newDate.setHours(hour + 12);
      } else if (!isPM && hour === 12) {
        newDate.setHours(0);
      } else if (!isPM && hour !== 12) {
        newDate.setHours(hour);
      } else {
        newDate.setHours(hour);
      }
    } else if (type === "minute") {
      newDate.setMinutes(parseInt(value, 10));
    } else if (type === "ampm") {
      const hours = newDate.getHours();
      if (value === "AM" && hours >= 12) {
        newDate.setHours(hours - 12);
      } else if (value === "PM" && hours < 12) {
        newDate.setHours(hours + 12);
      }
    }

    setDate(newDate);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full pl-3 text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          {date ? (
            format(date, "MM/dd/yyyy hh:mm aa")
          ) : (
            <span>MM/DD/YYYY hh:mm aa</span>
          )}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="sm:flex">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
          />
          <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex sm:flex-col p-2">
                {Array.from({ length: 12 }, (_, i) => i + 1)
                  .reverse()
                  .map((hour) => (
                    <Button
                      key={hour}
                      size="icon"
                      variant={
                        date &&
                          date.getHours() % 12 === hour % 12
                          ? "default"
                          : "ghost"
                      }
                      className="sm:w-full shrink-0 aspect-square"
                      onClick={() =>
                        handleTimeChange("hour", hour.toString())
                      }
                    >
                      {hour}
                    </Button>
                  ))}
              </div>
              <ScrollBar
                orientation="horizontal"
                className="sm:hidden"
              />
            </ScrollArea>
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex sm:flex-col p-2">
                {Array.from({ length: 12 }, (_, i) => i * 5).map(
                  (minute) => (
                    <Button
                      key={minute}
                      size="icon"
                      variant={
                        date &&
                          date.getMinutes() === minute
                          ? "default"
                          : "ghost"
                      }
                      className="sm:w-full shrink-0 aspect-square"
                      onClick={() =>
                        handleTimeChange("minute", minute.toString())
                      }
                    >
                      {minute.toString().padStart(2, "0")}
                    </Button>
                  )
                )}
              </div>
              <ScrollBar
                orientation="horizontal"
                className="sm:hidden"
              />
            </ScrollArea>
            <ScrollArea className="">
              <div className="flex sm:flex-col p-2">
                {["AM", "PM"].map((ampm) => (
                  <Button
                    key={ampm}
                    size="icon"
                    variant={
                      date &&
                        ((ampm === "AM" &&
                          date.getHours() < 12) ||
                          (ampm === "PM" &&
                            date.getHours() >= 12))
                        ? "default"
                        : "ghost"
                    }
                    className="sm:w-full shrink-0 aspect-square"
                    onClick={() => handleTimeChange("ampm", ampm)}
                  >
                    {ampm}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ContestForm({ onAdd }: ContestFormProps) {
  const { data: session } = useSession();
  const [startTime, setStartTime] = useState<Date | undefined>(new Date());
  const [endTime, setEndTime] = useState<Date | undefined>(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [availableProblems, setAvailableProblems] = useState<Problem[]>([]);
  const [selectedProblems, setSelectedProblems] = useState<{ id: number; title: string }[]>([]);

  const handleSelectedProblemsChange = useCallback(
    (items: { id: number; title?: string; username?: string }[]) => {
      setSelectedProblems(
        items
          .filter((item) => item.title)
          .map((item) => ({ id: item.id, title: item.title! }))
      );
    },
    [setSelectedProblems]
  );
  const [loading, setLoading] = useState(false);

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
      console.error('Failed to fetch problems:', error);
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

    if (startTime && endTime && startTime >= endTime) {
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
        problems: selectedProblems.map(problem => ({
          problem_id: problem.id,
        })),
      };

      const newContest = await apiCreateEvent(session.nextjudge_token, eventData);
      onAdd(newContest);

      toast.success(`${data.title} contest created successfully!`);

      // Reset form
      form.reset(defaultValues);
      setStartTime(new Date());
      setEndTime(new Date(Date.now() + 24 * 60 * 60 * 1000));
      setSelectedProblems([]);

    } catch (error) {
      console.error('Failed to create contest:', error);
      toast.error(error instanceof Error ? error.message : "Failed to create contest. Please try again.");
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
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Start Time</FormLabel>
              <FormControl>
                <DateTimePicker
                  date={startTime}
                  setDate={(date) => {
                    setStartTime(date);
                    field.onChange(date);
                  }}
                />
              </FormControl>
              <FormDescription>When the contest will start.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="endTime"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>End Time</FormLabel>
              <FormControl>
                <DateTimePicker
                  date={endTime}
                  setDate={(date) => {
                    setEndTime(date);
                    field.onChange(date);
                  }}
                />
              </FormControl>
              <FormDescription>When the contest will conclude.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="teams"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Teams
                </FormLabel>
                <FormDescription>
                  Allow team participation in this contest
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value || false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex flex-col space-y-2 col-span-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Problems</label>
          <DropdownMenuCheckboxes
            items={availableProblems?.map(p => ({ id: p.id, title: p.title }))}
            selectedItems={selectedProblems}
            setSelectedItems={handleSelectedProblemsChange}
            type="problems"
          />
          <p className="text-sm text-muted-foreground">
            select problems to include in the contest (optional).
          </p>
        </div>
        <LoadingButton className="col-span-2" type="submit" loading={loading}>
          Create contest
        </LoadingButton>
      </form>
    </Form>
  );
}
