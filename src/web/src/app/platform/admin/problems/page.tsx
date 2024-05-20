import { fetchProblems } from "@/app/actions";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/toaster";
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
        {/* TODO: Make a modal here */}
        {/* <Button
          variant="outline"
          className="flex items-center space-x-4"
          onClick={() => router.push("/platform/admin/problems/create")}
        >
          <PlusIcon /> <span>Create new problem</span>
        </Button> */}
      </div>
      <Separator />
      <DataTable columns={columns} data={problems} />
      <Toaster />
    </div>
  );
}
