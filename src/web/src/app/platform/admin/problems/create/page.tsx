import { fetchCategories } from "@/app/actions";
import { Categories } from "@/app/platform/problems/data/schema";
import { CreateProblemForm } from "@/components/forms/create-problem-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/toaster";
import "katex/dist/katex.min.css";
import { PlusIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

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
            <h3 className="text-lg font-medium">Create a new problem</h3>
            <p className="text-sm text-muted-foreground">
              Write your problem in latex format. The specific format is given
              in this link{" "}
              <a
                href="https://icpc.io/problem-package-format/spec/problem_package_format"
                target="_blank"
                className="text-osu"
              >
                here.
              </a>
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
