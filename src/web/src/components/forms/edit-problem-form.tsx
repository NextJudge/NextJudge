"use client";

import { updateProblem } from "@/app/actions";
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
import { Category, Problem } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useAutoIdentifierFromTitle } from "@/hooks/use-auto-identifier-from-title";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Editor from "../editor/rich-text/editor";

interface EditProblemFormProps {
  categories: Category[];
  problem: Problem;
  problemId: number;
}

export function EditProblemForm({
  categories,
  problem,
  problemId,
}: EditProblemFormProps) {
  const router = useRouter();

  const form = useForm<ProblemFormValues>({
    resolver: zodResolver(problemFormSchema),
    defaultValues: {
      title: problem.title || "",
      identifier: problem.identifier || "",
      prompt: problem.prompt || "",
      source: problem.source || "",
      accept_timeout: problem.accept_timeout || 10.0,
      execution_timeout: problem.execution_timeout || 5.0,
      memory_limit: problem.memory_limit || 256,
      difficulty: problem.difficulty,
      problem_categories:
        problem.categories?.map((category) => category.id) ?? [],
      test_cases:
        problem.test_cases && problem.test_cases.length > 0
          ? problem.test_cases.map((testCase) => ({
              input: testCase.input || "",
              expected_output: testCase.expected_output || "",
              hidden: testCase.hidden || false,
            }))
          : [{ input: "", expected_output: "", hidden: false }],
      public: problem.public !== undefined ? problem.public : true,
    },
    mode: "onChange",
  });

  const titleValue = form.watch("title");
  const selectedCategoryIds = form.watch("problem_categories");

  useAutoIdentifierFromTitle(form);

  const onSubmit = async (data: ProblemFormValues) => {
    try {
      const status = await updateProblem(problemId, data);

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Problem title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter problem title" {...field} />
                </FormControl>
                <FormDescription>
                  A clear, descriptive title for your problem.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="identifier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Problem identifier</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., two-sum" {...field} />
                </FormControl>
                <FormDescription>
                  Unique identifier (required, auto-populated from title if empty).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Problem statement</FormLabel>
              <FormControl>
                <Editor
                  content={field.value}
                  onChange={field.onChange}
                  placeholder="Write your problem statement here... You can use Markdown and LaTeX."
                />
              </FormControl>
              <FormDescription>
                Use Markdown for formatting and LaTeX for mathematical expressions.
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
              <FormLabel>Source (optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., LeetCode, Codeforces, Original" {...field} />
              </FormControl>
              <FormDescription>Where this problem originated from.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <FormField
            control={form.control}
            name="accept_timeout"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Accept timeout (seconds)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="10.0"
                    value={field.value}
                    onChange={(event) => {
                      const parsed = parseOptionalFloat(event.target.value);
                      if (parsed !== undefined) {
                        field.onChange(parsed);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="execution_timeout"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Execution timeout (seconds)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="5.0"
                    value={field.value}
                    onChange={(event) => {
                      const parsed = parseOptionalFloat(event.target.value);
                      if (parsed !== undefined) {
                        field.onChange(parsed);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="memory_limit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Memory limit (MB)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="256"
                    value={field.value}
                    onChange={(event) => {
                      const parsed = parseOptionalInt(event.target.value);
                      if (parsed !== undefined) {
                        field.onChange(parsed);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="difficulty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Difficulty</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
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
        </div>

        <TestCasesEditor form={form} variant="scroll" />

        <FormField
          control={form.control}
          name="public"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Public problem</FormLabel>
                <FormDescription>
                  Make this problem visible to all users. Uncheck to keep it private.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="flex space-x-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Updating..." : "Update problem"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/platform/admin/problems")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
