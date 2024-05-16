"use client";
import { zodResolver } from "@hookform/resolvers/zod";

import { sendEmail } from "@/app/actions";
import { buttonVariants } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { toast } from "sonner";

const FormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
});

export function EmailForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      const { name, email } = JSON.parse(JSON.stringify(data));
      await sendEmail({ name, email });
      form.reset();
      toast("Thank you for joining the waitlist!");
    } catch (error) {
      toast("An error occurred. Please try again later.");
    }
  }

  return (
    <Card className="p-4 m-4 md:p-6">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex gap-2 flex-col"
        >
          <div className="space-y-4">
            <h2 className="text-lg md:text-2xl font-semibold text-center">
              Be part of the{" "}
              <span
                className=" font-serif italic font-semibold mx-1 underline text-[#FF6600]"
                // Should we remove this gradient?
                // style={{
                //   background: "linear-gradient(transparent 50%, #FF6600 50%)",
                // }}
              >
                future
              </span>{" "}
              of competitive programming
            </h2>
            <p className="text-center text-sm md:text-base text-muted-foreground max-w-md mx-auto">
              Join the waitlist to get early access to NextJudge. We'll notify
              you when we're ready to onboard new users.
            </p>
          </div>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-white">Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder=""
                    {...field}
                    className={cn({
                      "border-red-500": form.formState.errors.name,
                    })}
                  />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="mb-2">
                <FormLabel className="text-sm text-white">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder=""
                    {...field}
                    className={cn({
                      "border-red-500": form.formState.errors.email,
                    })}
                  />
                </FormControl>
                <FormDescription>
                  We'll send you a welcome email.
                </FormDescription>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className={cn(buttonVariants({ variant: "default" }), "w-full")}
          >
            Submit
          </Button>
        </form>
      </Form>
    </Card>
  );
}
