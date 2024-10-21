import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { PlusIcon } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { columns } from "../../problems/components/columns";
import { DataTable } from "../../problems/components/data-table";
import { apiGetCategories, apiGetProblems } from "@/lib/api";
import { Category } from "@/lib/types";

export const metadata: Metadata = {
  title: "NextJudge Admin - Problem Management",
  description: "Manage the problems in the official NextJudge problem set.",
};

export default async function AdminProblemsPage() {
  const problems = await apiGetProblems();
  const categories = await apiGetCategories();
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Problem Set</h3>
          <p className="text-sm text-muted-foreground">
            As an admin, you can manage the problems in the official NextJudge
            problem set.
          </p>
        </div>
        <Link
          className={cn(`text-white ${buttonVariants({ variant: "outline" })}`)}
          href="/platform/admin/problems/create"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Create Problem
        </Link>
      </div>
      <Separator />
      <DataTable columns={columns} data={problems} />
      <Toaster />
    </div>
  );
}
