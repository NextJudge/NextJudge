"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BRAND_NAME } from "@/lib/site";
import { SignoutCardProps } from "@/types";

export const SignoutForm = ({ children, ...props }: SignoutCardProps) => {
  return (
    <Card {...props}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Sign out</CardTitle>
        <CardDescription>Sign out of {BRAND_NAME}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">{children}</CardContent>
      <CardFooter>
        <Button className="w-full">Sign out</Button>
      </CardFooter>
    </Card>
  );
};
