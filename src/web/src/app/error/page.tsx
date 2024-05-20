"use client";

import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

enum Error {
  Configuration = "There is a problem with the server configuration. Check if your options are correct.",
  AccessDenied = "Usually occurs when you restricted access through the signIn callback, or redirect callback.",
  Verification = "Related to the Email provider. The token has expired or has already been used.",
  Default = "Catch all, will apply, if none of the above matched.",
}

const errorMap = {
  [Error.Configuration]: (
    <div className="space-y-2 flex md:flex-col items-center justify-center">
      <p>Error Code:</p>
      <Badge variant="destructive">
        <code className="text-xs dark:text-white p-1 rounded">
          {Error.Configuration}
        </code>
      </Badge>
    </div>
  ),
  [Error.AccessDenied]: (
    <div className="space-y-2 flex md:flex-col items-center justify-center">
      <p>Error Code:</p>
      <Badge variant="destructive">
        <code className="text-xs dark:text-white p-1 rounded">
          {Error.AccessDenied}
        </code>
      </Badge>
    </div>
  ),
  [Error.Verification]: (
    <div className="space-y-2 flex md:flex-col items-center justify-center">
      <p>Error Code:</p>
      <Badge variant="destructive">
        <code className="text-xs dark:text-white p-1 rounded">
          {Error.Verification}
        </code>
      </Badge>
    </div>
  ),
  [Error.Default]: (
    <div className="space-y-2 flex md:flex-col items-center justify-center">
      <p>Error Code:</p>
      <Badge variant="destructive">
        <code className="text-xs dark:text-white p-1 rounded">
          {Error.Default}
        </code>
      </Badge>
    </div>
  ),
};

const errorStringToEnum = {
  Configuration: errorMap[Error.Configuration],
  AccessDenied: errorMap[Error.AccessDenied],
  Verification: errorMap[Error.Verification],
  Default: errorMap[Error.Default],
};

function ErrorContent() {
  const search = useSearchParams();
  const error =
    (search?.get("error") as keyof typeof errorStringToEnum) || "Default";
  return <>{errorStringToEnum[error]}</>;
}

export default function AuthErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-screen">
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Authentication Error</CardTitle>
              <CardDescription>
                There was a problem when trying to authenticate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Loading...</div>}>
                <ErrorContent />
              </Suspense>
            </CardContent>
            <CardFooter>
              <a
                href="/"
                className={cn(`${buttonVariants({ variant: "link" })}`)}
              >
                Return to home
              </a>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
