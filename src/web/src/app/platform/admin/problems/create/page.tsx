import { CreateProblemForm } from "@/components/forms/create-problem-form";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/toaster";
import { apiGetCategories } from "@/lib/api";
import { Category } from "@/lib/types";
import "katex/dist/katex.min.css";

export default async function CreateProblemPage() {
  const categories: Category[] = await apiGetCategories();
  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h3 className="text-lg font-medium">
              Contribute Problems to NextJudge
            </h3>
            <p className="text-sm text-muted-foreground">
              Fill out the fields below to add a new problem to the platform.
            </p>
          </div>
        </div>
        <Separator />
        <div className="max-w-5xl">
          <CreateProblemForm categories={categories} />
        </div>

        <Toaster />
      </div>
    </>
  );
}
