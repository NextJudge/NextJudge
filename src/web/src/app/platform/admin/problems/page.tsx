import { fetchProblems } from "@/app/actions";
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
import { columns } from "../../problems/components/columns";
import { DataTable } from "../../problems/components/data-table";
import { Problem } from "../../problems/data/schema";

async function getProblems2() {
  const problems = (await fetchProblems()) as Problem[];
  return problems;
}

export default async function AdminProblemsPage() {
  const problems = await getProblems2();
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
          <DialogContent className="sm:max-w-[425px] lg:max-w-[640px] overflow-y-scroll max-h-fit">
            <DialogHeader>
              <DialogTitle>Create a new problem</DialogTitle>
              <DialogDescription>
                Fill out the form below to create a new problem.
              </DialogDescription>
            </DialogHeader>
            <CreateProblemForm />
          </DialogContent>
        </Dialog>
      </div>
      <Separator />
      <DataTable columns={columns} data={problems} />
      <Toaster />
    </div>
  );
}
