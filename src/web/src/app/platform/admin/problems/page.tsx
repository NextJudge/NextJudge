import { fetchCategories } from "@/app/actions";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { Prisma } from "@prisma/client";
import { PlusIcon } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { columns } from "../../problems/components/columns";
import { DataTable } from "../../problems/components/data-table";
import { Categories } from "../../problems/data/schema";

export const metadata: Metadata = {
  title: "NextJudge Admin - Problem Management",
  description: "Manage the problems in the official NextJudge problem set.",
};

async function getAdminProblems() {
  const problems = await prisma.problems.findMany({
    select: {
      id: true,
      title: true,
      difficulty: true,
      problem_categories: {
        select: {
          categories: {
            select: {
              name: true,
            },
          },
        },
      },
      upload_date: true,
      submissions: {
        select: {
          id: true,
        },
      },
      users: {
        select: {
          name: true,
        },
      },
    },
  });
  return problems;
}

async function getCategories(): Promise<Categories> {
  const categories = await fetchCategories();
  if (categories === null || categories === undefined) {
    return [];
  }
  return categories as Categories;
}

export type TProblem = Prisma.problemsGetPayload<{
  include: {
    problem_categories: {
      select: {
        categories: {
          select: {
            name: true;
          };
        };
      };
    };
    submissions: {
      select: {
        id: true;
      };
    };
    users: {
      select: {
        name: true;
      };
    };
  };
}>;

export default async function AdminProblemsPage() {
  const problems = await getAdminProblems();
  const categories: Categories = await getCategories();
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
