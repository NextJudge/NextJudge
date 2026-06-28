"use client";

import { DropdownMenuCheckboxes } from "@/components/multi-selector";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ContestFormValues } from "@/lib/schemas/contest-form";
import { cn } from "@/lib/utils";
import { UseFormReturn } from "react-hook-form";

import { DateTimePicker } from "./datetime-picker";

type SelectableItem = { id: number; title?: string; username?: string };

interface ContestFormFieldsProps {
  form: UseFormReturn<ContestFormValues>;
  startTime: Date | undefined;
  endTime: Date | undefined;
  setStartTime: (date: Date | undefined) => void;
  setEndTime: (date: Date | undefined) => void;
  availableProblems: { id: number; title: string }[];
  selectedProblems: { id: number; title: string }[];
  onSelectedProblemsChange: (items: SelectableItem[]) => void;
  variant?: "default" | "clone";
}

const fieldText = {
  default: {
    titleDescription: "The public display name for the contest.",
    descriptionDescription: "A brief description of the contest.",
    startTimeDescription: "When the contest will start.",
    endTimeDescription: "When the contest will conclude.",
    teamsDescription: "Allow team participation in this contest",
    problemsLabel: "Problems",
    problemsDescription:
      "select problems to include in the contest (optional).",
  },
  clone: {
    titleDescription: "the public display name for the cloned contest.",
    descriptionDescription: "a brief description of the cloned contest.",
    startTimeDescription: "when the cloned contest will start.",
    endTimeDescription: "when the cloned contest will conclude.",
    teamsDescription: "allow team participation in this contest",
    problemsLabel: "Problems for Cloned Contest",
    problemsDescription:
      "choose which problems to include in the cloned contest (starts with original problems).",
  },
};

export function ContestFormFields({
  form,
  startTime,
  endTime,
  setStartTime,
  setEndTime,
  availableProblems,
  selectedProblems,
  onSelectedProblemsChange,
  variant = "default",
}: ContestFormFieldsProps) {
  const text = fieldText[variant];

  return (
    <>
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input placeholder="Contest Title" {...field} />
            </FormControl>
            <FormDescription>{text.titleDescription}</FormDescription>
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
            <FormDescription>{text.descriptionDescription}</FormDescription>
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
            <FormDescription>{text.startTimeDescription}</FormDescription>
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
            <FormDescription>{text.endTimeDescription}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="teams"
        render={({ field }) => (
          <FormItem
            className={cn(
              "flex flex-row items-center justify-between rounded-lg border p-4",
              variant === "clone" && "col-span-2"
            )}
          >
            <div className="space-y-0.5">
              <FormLabel className="text-base">Teams</FormLabel>
              <FormDescription>{text.teamsDescription}</FormDescription>
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
        <label
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {text.problemsLabel}
        </label>
        <DropdownMenuCheckboxes
          items={availableProblems.map((p) => ({ id: p.id, title: p.title }))}
          selectedItems={selectedProblems}
          setSelectedItems={onSelectedProblemsChange}
          type="problems"
        />
        <p className="text-sm text-muted-foreground">
          {text.problemsDescription}
        </p>
      </div>
    </>
  );
}
