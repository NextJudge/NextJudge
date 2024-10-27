"use client";

import { changeProfile } from "@/app/actions";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Icons } from "../icons";
import { Button } from "../ui/button";
import { User } from "@/lib/types";

const profileFormSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Display name must be at least 2 characters.",
    })
    .max(20, {
      message: "Name must not be longer than 20 characters.",
    }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileForm({ userDetails }: { userDetails: User }) {
  const defaultValues: Partial<ProfileFormValues> = {
    name: userDetails?.name,
    password: "",
  };
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  });

  // // TODO: Figure out how to update the session after this form is submitted
  // async function onSubmit(data: z.infer<typeof profileFormSchema>) {
  //   try {
  //     const { name, password } = JSON.parse(JSON.stringify(data));
  //     const id = userDetails?.id;
  //     if (!id) {
  //       throw new Error("User ID not found.");
  //     }
  //     const newUser = await changeProfile({ id, name, password });
  //     if (!newUser) {
  //       throw new Error("An error occurred. Please try again later.");
  //     }
  //     form.reset();
  //     form.clearErrors();
  //     if (newUser.newProfile) {
  //       form.setValue("password", newUser.newProfile.password);
  //       form.setValue("name", newUser.newProfile.name);
  //     }
  //     toast(newUser.message);
  //   } catch (error) {
  //     toast.error("An error occurred. Please try again later.");
  //   }
  // }

  // toast({
  //   title: "You submitted the following values:",
  //   description: (
  //     <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
  //       <code className="text-white">{JSON.stringify(data, null, 2)}</code>
  //     </pre>
  //   ),
  // });
  return (
    <Form {...form}>
      <form onSubmit={() => {} /*form.handleSubmit(onSubmit)*/} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter a name" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name. It can be your real name or a
                pseudonym.
              </FormDescription>
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
                <>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter a password"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <Icons.eyeOff /> : <Icons.eye />}
                  </button>
                </>
              </FormControl>
              <FormDescription>
                Your password must be at least 8 characters long.
              </FormDescription>

              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Update profile</Button>
      </form>
    </Form>
  );
}
