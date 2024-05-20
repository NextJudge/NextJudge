"use client";

import { createProblem } from "@/app/actions";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Difficulty } from "../../app/actions";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const problemFormSchema = z.object({
  title: z
    .string()
    .min(2, {
      message: "Title must be at least 2 characters.",
    })
    .max(100, {
      message: "Title must not be longer than 100 characters.",
    }),
  prompt: z.string().min(8, {
    message: "Prompt must be at least 8 characters.",
  }),
  timeout: z.number().int().positive(),
  difficulty: z.enum(["VERY_EASY", "EASY", "MEDIUM", "HARD", "VERY_HARD"]),
});

type ProblemFormValues = z.infer<typeof problemFormSchema>;

export function CreateProblemForm() {
  const defaultValues: Partial<ProblemFormValues> = {
    title: "",
    prompt: "",
    timeout: 0,
    difficulty: "VERY_EASY",
  };

  const form = useForm<ProblemFormValues>({
    resolver: zodResolver(problemFormSchema),
    defaultValues,
    mode: "onBlur",
  });

  async function onSubmit(data: z.infer<typeof problemFormSchema>) {
    try {
      const { title, prompt, timeout, difficulty } = JSON.parse(
        JSON.stringify(data)
      );
      const parsed: Difficulty = difficulty as Difficulty;
      await createProblem({
        title,
        prompt,
        timeout,
        difficulty: parsed,
        upload_date: new Date(),
      });
      toast.success("Problem created successfully.");
    } catch (error) {
      toast.error("Something went wrong.");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="title">Title</FormLabel>
              <FormControl>
                <Input {...field} id="title" type="text" />
              </FormControl>
              <FormDescription>The title of the problem.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="prompt">Prompt</FormLabel>
              <FormControl>
                <Input {...field} id="prompt" type="text" />
              </FormControl>
              <FormDescription>The prompt of the problem.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="timeout"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="timeout">Timeout</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  id="timeout"
                  type="number"
                  onChange={(event) =>
                    field.onChange(parseInt(event.target.value))
                  }
                />
              </FormControl>
              <FormDescription>The timeout of the problem.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="difficulty"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="difficulty">Difficulty</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a difficulty" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="VERY_EASY">Very Easy</SelectItem>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                  <SelectItem value="VERY_HARD">Very Hard</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>The difficulty of the problem.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Create Problem</Button>
      </form>
    </Form>
  );
}