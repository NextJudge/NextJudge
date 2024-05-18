"use client";

import { sendEmail, signUpUser } from "@/app/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import { AuthorizeSchema, FormSchema } from "@/lib/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
                <FormLabel className="text-sm dark:text-white">Name</FormLabel>
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
                <FormLabel className="text-sm dark:text-white">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder=""
                    {...field}
                    className={cn({
                      "border-red-500": form.formState.errors.email,
                    })}
                  />
                </FormControl>
                <FormMessage className="text-red-500" />
                <FormDescription>
                  We'll send you a welcome email.
                </FormDescription>
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

export function UserAuthForm({ children }: { children?: React.ReactNode }) {
  const form = useForm<z.infer<typeof AuthorizeSchema>>({
    resolver: zodResolver(AuthorizeSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: z.infer<typeof AuthorizeSchema>) {
    try {
      const { email, password, confirmPassword } = JSON.parse(
        JSON.stringify(data)
      );
      await signUpUser({ email, password, confirmPassword });
      toast("Account created successfully");
    } catch (error) {
      toast(error as string);
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>Sign up to get started with NextJudge</CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4">
        {/* OAuth Providers */}
        <div className="grid grid-cols-2 gap-6">{children}</div>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex gap-2 flex-col"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className={cn(
                buttonVariants({ variant: "default" }),
                "w-full mt-2"
              )}
            >
              Sign Up
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
