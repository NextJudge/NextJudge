import { fetchCategories, fetchProblems } from "@/app/actions";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { Metadata } from "next";
import Link from "next/link";
import { columns } from "../../problems/components/columns";
import { DataTable } from "../../problems/components/data-table";
import { Categories, Problem } from "../../problems/data/schema";

export const metadata: Metadata = {
  title: "NextJudge Admin - Problem Management",
  description: "Manage the problems in the official NextJudge problem set.",
};

async function getAdminProblems(): Promise<Problem[]> {
  const problems = (await fetchProblems()) as Problem[];
  return problems;
}

async function getCategories(): Promise<Categories> {
  const categories = await fetchCategories();
  if (categories === null || categories === undefined) {
    return [];
  }
  return categories as Categories;
}

export default async function AdminProblemsPage() {
  const problems: Problem[] = await getAdminProblems();
  const categories: Categories = await getCategories();
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Problem Set</h3>
          <p className="text-sm text-muted-foreground">
            Manage the problems in the official NextJudge problem set.
          </p>
        </div>
        <Link
          className={cn(`text-white ${buttonVariants({ variant: "link" })}`)}
          href="/platform/admin/problems/create"
        >
          Create a new problem
        </Link>
      </div>
      <Separator />
      <DataTable columns={columns} data={problems} />
      <Toaster />
    </div>
  );
}
