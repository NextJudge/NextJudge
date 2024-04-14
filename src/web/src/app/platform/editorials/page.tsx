import { Metadata } from "next";
import PlatformNavbar from "@/components/nav/platform-nav";
import { z } from "zod";
import { promises as fs } from "fs";

import { columns } from "../problems/components/columns";
import { DataTable } from "../problems/components/data-table";
import { RecentSubmissionCard } from "../problems/components/recent-submissions";
import { recentSubmissions } from "../problems/data/data";
import { RecentSubmission, problemSchema } from "../problems/data/schema";
import path from "path";


export const metadata: Metadata = {
  title: "NextJudge - Editorials",
  description: "Editorials to assist in your learning",
};

async function getEditorials() {
  const data = await fs.readFile(
    path.join(process.cwd(), "src/app/platform/problems/data/problems.json")
  );
  const mProblems = JSON.parse(data.toString());
  return z.array(problemSchema).parse(mProblems);
}

async function getRecentSubmissions(): Promise<RecentSubmission[]> {
  const promise = new Promise<RecentSubmission[]>((resolve) => {
    setTimeout(() => {
      resolve(recentSubmissions);
    }, 1000);
  });
  return promise;
}

export default async function ProblemsPage() {
  const problems = await getEditorials();
  const recentSubmissions = await getRecentSubmissions();
  return (
    <>
      <PlatformNavbar />
      <div className="max-w-7xl w-full flex-1 flex-col space-y-4 p-8 mx-8 md:flex">
        <div className="flex items-center justify-between space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Editorials</h2>
            <p className="text-muted-foreground">
              Check out our list of Editorials
            </p>
          </div>
        </div>
        <DataTable data={problems} columns={columns} />
      </div>
    </>
  );
}