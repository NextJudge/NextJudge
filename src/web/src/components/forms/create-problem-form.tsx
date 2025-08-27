"use client";

import { createProblem } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";
import { useEffect, useReducer } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import Editor from "../editor/rich-text/editor";
import { ScrollArea } from "../ui/scroll-area";

const problemFormSchema = z.object({
  title: z
    .string()
    .min(2, {
      message: "Title must be at least 2 characters.",
    })
    .max(100, {
      message: "Title must not be longer than 100 characters.",
    }),
  identifier: z
    .string()
    .min(2, {
      message: "Identifier must be at least 2 characters.",
    })
    .max(50, {
      message: "Identifier must not be longer than 50 characters.",
    })
    .regex(/^[a-z0-9-]+$/, {
      message: "Identifier must only contain lowercase letters, numbers, and dashes.",
    }),
  prompt: z.string().min(8, {
    message: "You must enter a problem statement.",
  }),
  source: z.string().optional(),
  accept_timeout: z.number().positive().min(0.1, {
    message: "Accept timeout must be at least 0.1 seconds.",
  }),
  execution_timeout: z.number().positive().min(0.1, {
    message: "Execution timeout must be at least 0.1 seconds.",
  }),
  memory_limit: z.number().int().positive().min(1, {
    message: "Memory limit must be at least 1 MB.",
  }),
  difficulty: z
    .enum(["VERY EASY", "EASY", "MEDIUM", "HARD", "VERY HARD"])
    .refine((value) => value !== undefined, {
      message: "Difficulty must be selected.",
    }),
  problem_categories: z.array(z.string()).default([]),
  test_cases: z.array(z.object({
    input: z.string().min(1, { message: "Input is required." }),
    expected_output: z.string().min(1, { message: "Expected output is required." }),
    hidden: z.boolean().default(false),
  })).min(1, { message: "At least one test case is required." }),
  public: z.boolean().default(true),
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
  };

  const form = useForm<ProblemFormValues>({
    resolver: zodResolver(problemFormSchema),
    defaultValues,
    mode: "onBlur",
  });

  // auto-populate identifier from title
  const titleValue = form.watch("title");
  const identifierValue = form.watch("identifier");

  useEffect(() => {
    // only auto-populate if identifier is empty and title has content
    if (titleValue && !identifierValue) {
      const generatedIdentifier = titleValue
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "") // remove special chars
        .trim()
        .replace(/\s+/g, "-") // replace spaces with dashes
        .replace(/-+/g, "-") // collapse multiple dashes
        .replace(/^-|-$/g, ""); // remove leading/trailing dashes

      if (generatedIdentifier) {
        form.setValue("identifier", generatedIdentifier);
      }
    }
  }, [titleValue, identifierValue, form]);

  async function onSubmit(data: z.infer<typeof problemFormSchema>) {
    try {
      const status = await createProblem(data, selectedCategories.map((c) => c.id));

      if (status.status === "success") {
        toast.success(status.message);
        form.reset();
        setSelectedCategories([]);
      } else {
        toast.error(status.message);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Something went wrong.");
    }
  }

  // Functions to manage test cases
  const addTestCase = () => {
    const currentTestCases = form.getValues("test_cases");
    form.setValue("test_cases", [
      ...currentTestCases,
      { input: "", expected_output: "", hidden: false }
    ]);
  };

  const removeTestCase = (index: number) => {
    const currentTestCases = form.getValues("test_cases");
    if (currentTestCases.length > 1) {
      form.setValue(
        "test_cases",
        currentTestCases.filter((_, i) => i !== index)
      );
    }
  };

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
              <FormLabel htmlFor="source">Source (Optional)</FormLabel>
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
              <FormLabel htmlFor="accept_timeout">Accept Timeout (seconds)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  id="accept_timeout"
                  type="number"
                  step="0.1"
                  onChange={(event) =>
                    field.onChange(parseFloat(event.target.value))
                  }
                />
              </FormControl>
              <FormDescription>Time limit for accepting the solution (seconds).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="execution_timeout"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="execution_timeout">Execution Timeout (seconds)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  id="execution_timeout"
                  type="number"
                  step="0.1"
                  onChange={(event) =>
                    field.onChange(parseFloat(event.target.value))
                  }
                />
              </FormControl>
              <FormDescription>Time limit for code execution (seconds).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="memory_limit"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="memory_limit">Memory Limit (MB)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  id="memory_limit"
                  type="number"
                  onChange={(event) =>
                    field.onChange(parseInt(event.target.value))
                  }
                />
              </FormControl>
              <FormDescription>Memory limit in megabytes (MB).</FormDescription>
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
                <FormLabel>Make Public</FormLabel>
                <FormDescription>
                  Make this problem visible to all users.
                </FormDescription>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Test Cases</h3>
            <Button type="button" onClick={addTestCase} variant="outline" size="sm">
              Add Test Case
            </Button>
          </div>
          <FormField
            control={form.control}
            name="test_cases"
            render={() => (
              <FormItem>
                <div className="space-y-4">
                  {form.watch("test_cases").map((testCase, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                      <div className="md:col-span-3 flex items-center justify-between mb-2">
                        <h4 className="font-medium">Test Case {index + 1}</h4>
                        {form.watch("test_cases").length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeTestCase(index)}
                            variant="destructive"
                            size="sm"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <FormField
                        control={form.control}
                        name={`test_cases.${index}.input`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Input</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Input for this test case"
                                className="min-h-[100px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`test_cases.${index}.expected_output`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expected Output</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Expected output for this test case"
                                className="min-h-[100px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`test_cases.${index}.hidden`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-6">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Hidden Test Case</FormLabel>
                              <FormDescription>
                                Hide this test case from users.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
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
