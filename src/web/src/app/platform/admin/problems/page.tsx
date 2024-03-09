"use client";

import { ProblemsTable } from "@/components/admin-problems-table";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/toaster";
import { PlusIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";

export default function AdminProblemsPage() {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Problem Set</h3>
          <p className="text-sm text-muted-foreground">
            Manage the problems in the official NextJudge problem set.
          </p>
        </div>
        <Button
          variant="outline"
          className="flex items-center space-x-4"
          onClick={() => router.push("/platform/admin/problems/create")}
        >
          <PlusIcon /> <span>Create new problem</span>
        </Button>
      </div>
      <Separator />
      <ProblemsTable />
      <Toaster />
    </div>
  );
}
