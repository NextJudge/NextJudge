import { fetchCategories, fetchProblems } from "@/app/actions";
import { CreateProblemForm } from "@/components/forms/create-problem-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/toaster";
import { PlusIcon } from "@radix-ui/react-icons";
import { Metadata } from "next";
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
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center space-x-4">
              <PlusIcon /> <span>Create new problem</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] lg:max-w-[640px]">
            <DialogHeader>
              <DialogTitle>Create a new problem</DialogTitle>
              <DialogDescription>
                Fill out the form below to create a new problem.
              </DialogDescription>
            </DialogHeader>
            <CreateProblemForm categories={categories} />
          </DialogContent>
        </Dialog>
      </div>
      <Separator />
      <DataTable columns={columns} data={problems} />
      <Toaster />
    </div>
  );
}
