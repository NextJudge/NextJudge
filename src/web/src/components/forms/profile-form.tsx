"use client";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../ui/button";
import { User } from "@/lib/types";

const profileFormSchema = z.object({
  name: z.string(),
  email: z.string(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileForm({ userDetails }: { userDetails: User }) {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: userDetails?.name ?? "",
      email: userDetails?.email ?? "",
    },
  });

  return (
    <Form {...form}>
      <form className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter a name" disabled readOnly {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name. It can be your real name or a
                pseudonym.
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
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Profile updates coming soon.
          </p>
          <Button type="button" disabled>
            Update profile
          </Button>
        </div>
      </form>
    </Form>
  );
}
