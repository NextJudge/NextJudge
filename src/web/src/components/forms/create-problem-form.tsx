"use client";

import { createProblem } from "@/app/actions";
import { CategorySelector } from "@/components/forms/category-selector";
import { TestCasesEditor } from "@/components/forms/test-cases-editor";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  ProblemFormValues,
  parseOptionalFloat,
  parseOptionalInt,
  problemFormSchema,
} from "@/lib/schemas/problem-form";
import { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useAutoIdentifierFromTitle } from "@/hooks/use-auto-identifier-from-title";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Editor from "../editor/rich-text/editor";

export function CreateProblemForm({ categories }: { categories: Category[] }) {
  const router = useRouter();

  const form = useForm<ProblemFormValues>({
    resolver: zodResolver(problemFormSchema),
    defaultValues: {
      title: "",
      identifier: "",
      prompt: "",
      source: "",
      accept_timeout: 10.0,
      execution_timeout: 5.0,
      memory_limit: 256,
      difficulty: undefined,
      problem_categories: [],
      test_cases: [{ input: "", expected_output: "", hidden: false }],
      public: true,
    },
    mode: "onChange",
  });

  const titleValue = form.watch("title");
  const selectedCategoryIds = form.watch("problem_categories");

  useAutoIdentifierFromTitle(form);

  const onSubmit = async (data: ProblemFormValues) => {
    try {
      const status = await createProblem(data);

      if (status.status === "success") {
        toast.success(status.message);
        router.push("/platform/admin/problems");
        return;
      }

      toast.error(status.message);
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Something went wrong.");
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("grid min-h-full gap-6 p-2 md:grid-cols-2")}
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
          name="identifier"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="identifier">Identifier</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  id="identifier"
                  type="text"
                  placeholder="e.g. add-two-numbers"
                />
              </FormControl>
              <FormDescription>
                Unique identifier (auto-populated from title, editable).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="source"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="source">Source (optional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  id="source"
                  type="text"
                  placeholder="e.g. LeetCode, CodeForces"
                />
              </FormControl>
              <FormDescription>Source or origin of the problem.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="accept_timeout"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="accept_timeout">Accept timeout (seconds)</FormLabel>
              <FormControl>
                <Input
                  id="accept_timeout"
                  type="number"
                  step="0.1"
                  value={field.value}
                  onChange={(event) => {
                    const parsed = parseOptionalFloat(event.target.value);
                    if (parsed !== undefined) {
                      field.onChange(parsed);
                    }
                  }}
                />
              </FormControl>
              <FormDescription>Time limit for accepting the solution.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="execution_timeout"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="execution_timeout">Execution timeout (seconds)</FormLabel>
              <FormControl>
                <Input
                  id="execution_timeout"
                  type="number"
                  step="0.1"
                  value={field.value}
                  onChange={(event) => {
                    const parsed = parseOptionalFloat(event.target.value);
                    if (parsed !== undefined) {
                      field.onChange(parsed);
                    }
                  }}
                />
              </FormControl>
              <FormDescription>Time limit for code execution.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="memory_limit"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="memory_limit">Memory limit (MB)</FormLabel>
              <FormControl>
                <Input
                  id="memory_limit"
                  type="number"
                  value={field.value}
                  onChange={(event) => {
                    const parsed = parseOptionalInt(event.target.value);
                    if (parsed !== undefined) {
                      field.onChange(parsed);
                    }
                  }}
                />
              </FormControl>
              <FormDescription>Memory limit in megabytes.</FormDescription>
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
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a difficulty" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="VERY EASY">Very Easy</SelectItem>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                  <SelectItem value="VERY HARD">Very Hard</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>The difficulty of the problem.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <CategorySelector
          categories={categories}
          selectedIds={selectedCategoryIds}
          onChange={(ids) =>
            form.setValue("problem_categories", ids, { shouldValidate: true })
          }
        />
        <FormField
          control={form.control}
          name="public"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Make public</FormLabel>
                <FormDescription>
                  Make this problem visible to all users.
                </FormDescription>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="col-span-2">
          <TestCasesEditor form={form} />
        </div>
        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel htmlFor="prompt">Prompt</FormLabel>
              <FormControl>
                <Editor
                  content={field.value}
                  onChange={field.onChange}
                  placeholder="Enter the prompt here..."
                />
              </FormControl>
              <FormDescription>Supports LaTeX and Markdown.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="mt-2 w-1/2 self-end"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Creating..." : "Create problem"}
        </Button>
      </form>
    </Form>
  );
}
