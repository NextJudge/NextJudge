import { fetchCategories } from "@/app/actions";
import { Categories } from "@/app/platform/problems/data/schema";
import { CreateProblemForm } from "@/components/forms/create-problem-form";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/toaster";
import "katex/dist/katex.min.css";

async function getCategories(): Promise<Categories> {
  const categories = await fetchCategories();
  if (categories === null || categories === undefined) {
    return [];
  }
  return categories as Categories;
}
export default async function CreateProblemPage() {
  const categories: Categories = await getCategories();
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
