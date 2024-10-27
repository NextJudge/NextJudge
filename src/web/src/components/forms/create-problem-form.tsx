"use client";

import { createProblem } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";
import { useCallback, useReducer } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import Editor from "../editor/rich-text/editor";
import { ScrollArea } from "../ui/scroll-area";
import { CreateProblemTestCaseForm } from "./test-case-form";
import { Category, Difficulty } from "@/lib/types";

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
    message: "You must enter a problem statement.",
  }),
  timeout: z.number().int().positive(),
  difficulty: z
    .enum(["VERY_EASY", "EASY", "MEDIUM", "HARD", "VERY_HARD", ""])
    .default("")
    .refine((value) => value !== "", {
      message: "Difficulty must be selected.",
    }),
  problem_categories: z.array(z.number().int().positive()).default([]),
  input: z.string().min(1, {
    message: "Input is required.",
  }),
  output: z.string().min(1, {
    message: "Output is required.",
  }),
  is_public: z.boolean().default(true),
});

type ProblemFormValues = z.infer<typeof problemFormSchema>;

type Checked = DropdownMenuCheckboxItemProps["checked"];

// TODO: Make the multi-select more UI/UX friendly
export function CreateProblemForm({ categories }: { categories: Category[] }) {
  const [selectedCategories, setSelectedCategories] = useReducer(
    (state: Category[], action: Category[]) => action,
    []
  );

  const defaultValues: Partial<ProblemFormValues> = {
    title: "",
    prompt: "",
    timeout: 0,
    difficulty: undefined,
    problem_categories: [],
    input: "",
    output: "",
    is_public: true,
  };

  const form = useForm<ProblemFormValues>({
    resolver: zodResolver(problemFormSchema),
    defaultValues,
    mode: "onBlur",
  });

  async function onSubmit(data: z.infer<typeof problemFormSchema>) {
    try {
      const { title, prompt, timeout, difficulty, input, output, is_public } =
        JSON.parse(JSON.stringify(data));
      const parsed: Difficulty = difficulty as Difficulty;
      const status = await createProblem({
        categories: selectedCategories.map((c) => c.id),
        difficulty: parsed,
        prompt,
        title,
        timeout,
        upload_date: new Date(),
        input: input,
        output: output,
        is_public: is_public,
      });
      // toast.success(status.message);
    } catch (error) {
      toast.error("Something went wrong.");
    }
  }

  // TODO: Support multiple test cases on problem creation
  const setTestCases = useCallback(
    (input: string, output: string, is_public: boolean) => {
      form.setValue("input", input);
      form.setValue("output", output);
      form.setValue("is_public", is_public);
    },
    [form]
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("grid md:grid-cols-2 gap-6 min-h-full p-2")}
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="title">Title</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  id="title"
                  type="text"
                  placeholder="e.g. Add Two Numbers"
                />
              </FormControl>
              <FormDescription>The title of the problem.</FormDescription>
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
        <FormField
          control={form.control}
          // TODO: Make this styling consistent
          name="problem_categories"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-0">
              <FormLabel htmlFor="problem_categories" className="mb-1">
                Tags
              </FormLabel>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Select tags</Button>
                </DropdownMenuTrigger>
                <ScrollArea>
                  <DropdownMenuContent className="w-56 max-h-96">
                    <DropdownMenuLabel>Select Tags</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {categories.map((category: Category) => (
                      <DropdownMenuCheckboxItem
                        key={category.id}
                        checked={selectedCategories
                          .map((c) => c.id)
                          .includes(category.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCategories([
                              ...selectedCategories,
                              category,
                            ]);
                          } else {
                            setSelectedCategories(
                              selectedCategories.filter(
                                (c) => c.id !== category.id
                              )
                            );
                          }
                        }}
                      >
                        {category.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </ScrollArea>
              </DropdownMenu>
              <FormDescription>The problem categories.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <CreateProblemTestCaseForm form={form} setTestCases={setTestCases} />
        <FormDescription className="col-span-2 -mt-3">
          The input and output format of the problem.
        </FormDescription>
        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel htmlFor="prompt">Prompt</FormLabel>
              <FormControl>
                {/* <Textarea
                  className="max-h-[120px] lg:max-h-[180px]"
                  {...field}
                  id="prompt"
                /> */}
                <Editor
                  content={field.value}
                  onChange={(value) => field.onChange(value)}
                  placeholder="Enter the prompt here..."
                  //   readOnly={false}
                />
              </FormControl>
              <FormDescription>Supports Latex and Markdown.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-1/2 self-end mt-2">
          Create Problem
        </Button>
      </form>
    </Form>
  );
}
