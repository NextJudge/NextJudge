"use client";

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
import { apiUpdateMyHandle } from "@/lib/api";
import { User } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "../ui/button";

const handlePattern = /^[a-zA-Z0-9_]{3,32}$/;

const profileFormSchema = z.object({
  handle: z
    .string()
    .min(3, "Handle must be at least 3 characters")
    .max(32, "Handle must be at most 32 characters")
    .regex(
      handlePattern,
      "Handle can only contain letters, numbers, and underscores",
    ),
  name: z.string(),
  email: z.string(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileForm({ userDetails }: { userDetails: User }) {
  const { data: session } = useSession();
  const [pending, setPending] = useState(false);
  const [currentHandle, setCurrentHandle] = useState(userDetails.handle);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      handle: userDetails.handle ?? "",
      name: userDetails.name ?? "",
      email: userDetails.email ?? "",
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    const token = session?.nextjudge_token;
    if (!token) {
      toast.error("You must be signed in to update your handle.");
      return;
    }

    if (values.handle === currentHandle) {
      toast.message("Handle unchanged.");
      return;
    }

    setPending(true);
    try {
      const updated = await apiUpdateMyHandle(token, values.handle);
      setCurrentHandle(updated.handle);
      form.setValue("handle", updated.handle);
      toast.success("Handle updated.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update handle.";
      toast.error(message);
    } finally {
      setPending(false);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-8">
        <FormField
          control={form.control}
          name="handle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Handle</FormLabel>
              <FormControl>
                <Input
                  placeholder="your_handle"
                  autoComplete="off"
                  spellCheck={false}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Your public profile lives at{" "}
                <Link
                  href={currentHandle ? `/profiles/${currentHandle}` : "#"}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  /profiles/{currentHandle || "your_handle"}
                </Link>
                . Handles are unique and can be changed once every 30 days.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display name</FormLabel>
              <FormControl>
                <Input disabled readOnly {...field} />
              </FormControl>
              <FormDescription>
                This comes from your sign-in provider and is shown on your public profile.
              </FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" disabled readOnly {...field} />
              </FormControl>
              <FormDescription>
                The email address associated with your account.
              </FormDescription>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Update handle"}
        </Button>
      </form>
    </Form>
  );
}
