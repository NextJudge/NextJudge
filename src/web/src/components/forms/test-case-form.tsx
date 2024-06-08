"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Checkbox } from "../ui/checkbox";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";

const testCaseFormSchema = z.object({
  input: z.string().min(1, {
    message: "Input is required.",
  }),
  output: z.string().min(1, {
    message: "Output is required.",
  }),
});

type TestCaseFormValues = z.infer<typeof testCaseFormSchema>;

// TODO: Allow test cases to be added to a problem before it is created.
export default function TestCaseForm({ problemId }: { problemId: string }) {
  const defaultValues: Partial<TestCaseFormValues> = {
    input: "",
    output: "",
  };

  const form = useForm<TestCaseFormValues>({
    resolver: zodResolver(testCaseFormSchema),
    defaultValues,
    mode: "onBlur",
  });

  async function onSubmit(data: TestCaseFormValues) {
    console.log({ data, problemId });
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center space-x-4 self-center"
              >
                <PlusIcon className="size-4" /> <span>Add Test Case</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] lg:max-w-[640px]">
              <DialogHeader>
                <DialogTitle>Create Test Case</DialogTitle>
                <DialogDescription>
                  Create a new test case for the problem.
                </DialogDescription>
              </DialogHeader>
              <FormField
                control={form.control}
                name="input"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="input">Input</FormLabel>
                    <FormControl>
                      <Textarea
                        id="input"
                        {...field}
                        placeholder="Enter the test case input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="output"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="output">Output</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        id="output"
                        placeholder="Enter the expected output"
                      />
                    </FormControl>
                    <FormDescription>
                      Expected output of the test case.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Add Test Case</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </form>
      </Form>
    </>
  );
}

export function CreateProblemTestCaseForm({
  form,
  setTestCases,
}: {
  form: any;
  setTestCases: any;
}) {
  const [open, setOpen] = useState(false);
  function onSubmitTestCase() {
    const { input, output, is_public } = form.getValues();
    setTestCases(input, output, is_public);
    setOpen(false);
    toast.success("Test case added successfully.");
  }
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center space-x-4 self-center"
          >
            <PlusIcon className="size-4" /> <span>Add Test Case</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] lg:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Create Test Case</DialogTitle>
            <DialogDescription>
              Create a new test case for the problem.
            </DialogDescription>
          </DialogHeader>
          <FormField
            control={form.control}
            name="is_public"
            render={({ field }) => (
              <FormItem className="flex flex-col space-x-2">
                <FormLabel htmlFor="is_public">Public</FormLabel>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>
                  Whether or not the test case is visible within a problem.
                </FormDescription>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="input"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="input">Input</FormLabel>
                <FormControl>
                  <Textarea
                    id="input"
                    {...field}
                    placeholder="Enter the test case input"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* TODO: Why isn't the error message appearing? (on empty) */}
          <FormField
            control={form.control}
            name="output"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="output">Output</FormLabel>
                <FormControl>
                  <Textarea
                    id="output"
                    {...field}
                    placeholder="Enter the expected output"
                  />
                </FormControl>
                <FormDescription>
                  Expected output of the test case.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button onClick={onSubmitTestCase}>Add Test Case</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
