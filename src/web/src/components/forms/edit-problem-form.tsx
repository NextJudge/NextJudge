"use client";

import { updateProblem } from "@/app/actions";
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
import { Category, Problem } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";
import { useRouter } from "next/navigation";
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

interface EditProblemFormProps {
    categories: Category[];
    problem: Problem;
    problemId: number;
}

export function EditProblemForm({ categories, problem, problemId }: EditProblemFormProps) {
    const router = useRouter();
    const [selectedCategories, setSelectedCategories] = useReducer(
        (state: Category[], action: Category[]) => action,
        []
    );

    const defaultValues: Partial<ProblemFormValues> = {
        title: problem.title || "",
        identifier: problem.identifier || "",
        prompt: problem.prompt || "",
        source: problem.source || "",
        accept_timeout: problem.accept_timeout || 10.0,
        execution_timeout: problem.execution_timeout || 5.0,
        memory_limit: problem.memory_limit || 256,
        difficulty: problem.difficulty || undefined,
        problem_categories: [],
        test_cases: problem.test_cases?.length > 0
            ? problem.test_cases.map(tc => ({
                input: tc.input || "",
                expected_output: tc.expected_output || "",
                hidden: tc.hidden || false,
            }))
            : [{ input: "", expected_output: "", hidden: false }],
        public: problem.public !== undefined ? problem.public : true,
    };

    const form = useForm<ProblemFormValues>({
        resolver: zodResolver(problemFormSchema),
        defaultValues,
        mode: "onBlur",
    });

    // set selected categories from problem data
    useEffect(() => {
        if (problem.categories) {
            const problemCategories = problem.categories.filter(cat =>
                categories.some(availableCat => availableCat.id === cat.id)
            );
            setSelectedCategories(problemCategories);
        }
    }, [problem.categories, categories]);

    // auto-populate identifier from title (only if identifier becomes empty)
    const titleValue = form.watch("title");
    const identifierValue = form.watch("identifier");

    useEffect(() => {
        // only auto-populate if identifier is empty and title has content
        // this helps when user clears the identifier field manually
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
            const status = await updateProblem(problemId, data, selectedCategories.map((c) => c.id));

            if (status.status === "success") {
                toast.success(status.message);
                router.push("/platform/admin/problems");
            } else {
                toast.error(status.message);
            }
        } catch (error) {
            console.error("Form submission error:", error);
            toast.error("Something went wrong.");
        }
    }

    // functions to manage test cases
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Problem Title</FormLabel>
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
                                <FormLabel>Problem Identifier</FormLabel>
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
                            <FormLabel>Problem Statement</FormLabel>
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
                            <FormLabel>Source (Optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., LeetCode, Codeforces, Original" {...field} />
                            </FormControl>
                            <FormDescription>
                                Where this problem originated from.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                        control={form.control}
                        name="accept_timeout"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Accept Timeout (seconds)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        placeholder="10.0"
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                                <FormLabel>Execution Timeout (seconds)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        placeholder="5.0"
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                                <FormLabel>Memory Limit (MB)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder="256"
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                    <FormItem>
                        <FormLabel>Categories</FormLabel>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full justify-start">
                                    {selectedCategories.length === 0
                                        ? "Select categories"
                                        : `${selectedCategories.length} selected`}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-full">
                                <DropdownMenuLabel>Categories</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {categories.map((category) => (
                                    <DropdownMenuCheckboxItem
                                        key={category.id}
                                        checked={selectedCategories.some((c) => c.id === category.id)}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setSelectedCategories([...selectedCategories, category]);
                                            } else {
                                                setSelectedCategories(
                                                    selectedCategories.filter((c) => c.id !== category.id)
                                                );
                                            }
                                        }}
                                    >
                                        {category.name}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <FormDescription>
                            Select relevant categories for this problem.
                        </FormDescription>
                    </FormItem>
                </div>

                <div>
                    <FormLabel>Test Cases</FormLabel>
                    <ScrollArea className="h-96 w-full rounded-md border p-4">
                        <div className="space-y-4">
                            {form.watch("test_cases").map((_, index) => (
                                <div key={index} className="space-y-4 p-4 border rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-sm font-medium">Test Case {index + 1}</h4>
                                        <div className="flex items-center space-x-2">
                                            <FormField
                                                control={form.control}
                                                name={`test_cases.${index}.hidden`}
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        </FormControl>
                                                        <div className="space-y-1 leading-none">
                                                            <FormLabel className="text-sm">Hidden</FormLabel>
                                                        </div>
                                                    </FormItem>
                                                )}
                                            />
                                            {form.watch("test_cases").length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => removeTestCase(index)}
                                                >
                                                    Remove
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name={`test_cases.${index}.input`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Input</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Enter test input"
                                                            className="resize-none"
                                                            {...field}
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
                                                            placeholder="Enter expected output"
                                                            className="resize-none"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={addTestCase}
                                className="w-full"
                            >
                                Add Test Case
                            </Button>
                        </div>
                    </ScrollArea>
                    <FormDescription>
                        Add test cases to validate submissions. Mark test cases as hidden if they shouldn't be visible to users.
                    </FormDescription>
                </div>

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
                                <FormLabel>Public Problem</FormLabel>
                                <FormDescription>
                                    Make this problem visible to all users. Uncheck to keep it private.
                                </FormDescription>
                            </div>
                        </FormItem>
                    )}
                />

                <div className="flex space-x-4">
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? "Updating..." : "Update Problem"}
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
