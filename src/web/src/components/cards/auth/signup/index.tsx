"use client";

import { signUpUser } from "@/app/actions";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AuthorizeSchema } from "@/lib/zod";
import { SignUpCardProps } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export function SignUpCard({ children }: SignUpCardProps) {
  const form = useForm<z.infer<typeof AuthorizeSchema>>({
    resolver: zodResolver(AuthorizeSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const router = useRouter();

  async function onSubmit(data: z.infer<typeof AuthorizeSchema>) {
    try {
      const { email, password, confirmPassword } = JSON.parse(
        JSON.stringify(data)
      );
      const res = await signUpUser({ email, password, confirmPassword });
      if (res.status === "error") {
        toast.error(res.message);
        return;
      }
      toast("Account created successfully");
      router.push("/auth/login");
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
