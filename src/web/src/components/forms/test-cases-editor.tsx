"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
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
import { Textarea } from "@/components/ui/textarea";
import {
  AddTestCaseFormValues,
  ProblemFormValues,
  addTestCaseFormSchema,
} from "@/lib/schemas/problem-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { UseFormReturn, useFieldArray, useForm } from "react-hook-form";

type AddTestCaseDialogProps = {
  onAdd: (testCase: AddTestCaseFormValues) => void;
};

const AddTestCaseDialog = ({ onAdd }: AddTestCaseDialogProps) => {
  const [open, setOpen] = useState(false);

  const dialogForm = useForm<AddTestCaseFormValues>({
    resolver: zodResolver(addTestCaseFormSchema),
    defaultValues: {
      input: "",
      expected_output: "",
      hidden: false,
    },
    mode: "onChange",
  });

  const handleSubmit = dialogForm.handleSubmit((values) => {
    onAdd(values);
    dialogForm.reset({
      input: "",
      expected_output: "",
      hidden: false,
    });
    setOpen(false);
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      dialogForm.reset({
        input: "",
        expected_output: "",
        hidden: false,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <PlusIcon className="mr-2 h-4 w-4" />
          Add via dialog
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Add test case</DialogTitle>
          <DialogDescription>
            Add a test case before creating the problem. Input and expected output are required.
          </DialogDescription>
        </DialogHeader>
        <Form {...dialogForm}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={dialogForm.control}
              name="input"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Input</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter the test case input"
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={dialogForm.control}
              name="expected_output"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected output</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter the expected output"
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={dialogForm.control}
              name="hidden"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Hidden test case</FormLabel>
                    <FormDescription>
                      Hide this test case from users solving the problem.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Add test case</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

type TestCasesEditorProps = {
  form: UseFormReturn<ProblemFormValues>;
  variant?: "default" | "scroll";
};

export const TestCasesEditor = ({
  form,
  variant = "default",
}: TestCasesEditorProps) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "test_cases",
  });

  const handleAddInline = () => {
    append({ input: "", expected_output: "", hidden: false });
    void form.trigger("test_cases");
  };

  const handleAddFromDialog = (testCase: AddTestCaseFormValues) => {
    append(testCase);
    void form.trigger("test_cases");
  };

  const handleRemove = (index: number) => {
    if (fields.length <= 1) {
      return;
    }
    remove(index);
    void form.trigger("test_cases");
  };

  const testCaseList = (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-3"
        >
          <div className="mb-2 flex items-center justify-between md:col-span-3">
            <h4 className="font-medium">Test case {index + 1}</h4>
            {fields.length > 1 ? (
              <Button
                type="button"
                onClick={() => handleRemove(index)}
                variant="destructive"
                size="sm"
              >
                Remove
              </Button>
            ) : null}
          </div>
          <FormField
            control={form.control}
            name={`test_cases.${index}.input`}
            render={({ field: inputField }) => (
              <FormItem>
                <FormLabel>Input</FormLabel>
                <FormControl>
                  <Textarea
                    {...inputField}
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
            render={({ field: outputField }) => (
              <FormItem>
                <FormLabel>Expected output</FormLabel>
                <FormControl>
                  <Textarea
                    {...outputField}
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
            render={({ field: hiddenField }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-6">
                <FormControl>
                  <Checkbox
                    checked={hiddenField.value}
                    onCheckedChange={hiddenField.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Hidden test case</FormLabel>
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
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-medium">Test cases</h3>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={handleAddInline} variant="outline" size="sm">
            <PlusIcon className="mr-2 h-4 w-4" />
            Add inline
          </Button>
          <AddTestCaseDialog onAdd={handleAddFromDialog} />
        </div>
      </div>
      {variant === "scroll" ? (
        <div className="h-96 w-full overflow-y-auto rounded-md border p-4">
          {testCaseList}
        </div>
      ) : (
        testCaseList
      )}
      {form.formState.errors.test_cases?.message ? (
        <p className="text-sm font-medium text-destructive">
          {form.formState.errors.test_cases.message}
        </p>
      ) : null}
      {form.formState.errors.test_cases?.root?.message ? (
        <p className="text-sm font-medium text-destructive">
          {form.formState.errors.test_cases.root.message}
        </p>
      ) : null}
    </div>
  );
};
