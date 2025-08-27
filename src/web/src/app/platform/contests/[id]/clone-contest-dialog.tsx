"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Icons } from "@/components/icons";
import { DropdownMenuCheckboxes } from "@/components/multi-selector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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

const cloneContestSchema = z.object({
    startTime: z.date({ required_error: "start time is required" }),
    endTime: z.date({ required_error: "end time is required" }),
    description: z.string({ required_error: "description is required" }),
    title: z.string({ required_error: "title is required" }),
    teams: z.boolean().default(false),
});

type CloneContestFormValues = z.infer<typeof cloneContestSchema>;

interface CloneContestDialogProps {
    contest: NextJudgeEvent;
    problems: Problem[];
    children: React.ReactNode;
    onCloneSuccess?: () => void;
}

interface DateTimePickerProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
}

function DateTimePicker({ date, setDate }: DateTimePickerProps) {
    function handleDateSelect(selectedDate: Date | undefined) {
        if (selectedDate) {
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

export function CloneContestDialog({ contest, problems, children, onCloneSuccess }: CloneContestDialogProps) {
    const { data: session } = useSession();
    const [open, setOpen] = useState(false);
    const [startTime, setStartTime] = useState<Date | undefined>(new Date());
    const [endTime, setEndTime] = useState<Date | undefined>(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const [loading, setLoading] = useState(false);
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
        []
    );

    const fetchProblems = useCallback(async () => {
        if (!session?.nextjudge_token) return;

        try {
            const allProblems = await apiGetProblems(session.nextjudge_token);
            setAvailableProblems(allProblems);
        } catch (error) {
            console.error('failed to fetch problems:', error);
        }
    }, [session?.nextjudge_token]);

    useEffect(() => {
        if (open) {
            fetchProblems();
            // set initial selected problems from the original contest
            setSelectedProblems(problems.map(p => ({ id: p.id, title: p.title })));
        }
    }, [fetchProblems, open, problems]);

    const defaultValues: Partial<CloneContestFormValues> = {
        title: `${contest.title} (Clone)`,
        description: contest.description,
        startTime: new Date(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        teams: contest.teams,
    };

    const form = useForm<CloneContestFormValues>({
        resolver: zodResolver(cloneContestSchema),
        defaultValues,
        mode: "onChange",
    });

    async function onSubmit(data: CloneContestFormValues) {
        if (!session?.nextjudge_token) {
            toast.error("you must be signed in to clone a contest.");
            return;
        }

        if (!startTime || !endTime) {
            toast.error("please select a start and end time for the contest.");
            return;
        }

        if (startTime && endTime && startTime >= endTime) {
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
                problems: selectedProblems.map(problem => ({
                    problem_id: problem.id,
                })),
            };

            await apiCreateEvent(session.nextjudge_token, eventData);
            toast.success(`${data.title} contest cloned successfully!`);
            setOpen(false);
            onCloneSuccess?.();

        } catch (error) {
            console.error('failed to clone contest:', error);
            toast.error(error instanceof Error ? error.message : "failed to clone contest. please try again.");
        } finally {
            setLoading(false);
        }
    }

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            form.reset(defaultValues);
            setStartTime(new Date());
            setEndTime(new Date(Date.now() + 24 * 60 * 60 * 1000));
            setSelectedProblems([]);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] lg:max-w-[640px] overflow-y-scroll max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Clone Contest</DialogTitle>
                    <DialogDescription>
                        this will create a new contest based on the current one. you can customize the details below.
                    </DialogDescription>
                </DialogHeader>

                {/* Original Contest Preview */}
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
                                {problems.length} problem{problems.length !== 1 ? 's' : ''}
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
                                        the public display name for the cloned contest.
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
                                        a brief description of the cloned contest.
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
                                    <FormDescription>when the cloned contest will start.</FormDescription>
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
                                    <FormDescription>when the cloned contest will conclude.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="teams"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 col-span-2">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">
                                            Teams
                                        </FormLabel>
                                        <FormDescription>
                                            allow team participation in this contest
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
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Problems for Cloned Contest
                            </label>
                            <DropdownMenuCheckboxes
                                items={availableProblems.map(p => ({ id: p.id, title: p.title }))}
                                selectedItems={selectedProblems}
                                setSelectedItems={handleSelectedProblemsChange}
                                type="problems"
                            />
                            <p className="text-sm text-muted-foreground">
                                choose which problems to include in the cloned contest (starts with original problems).
                            </p>
                        </div>
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
