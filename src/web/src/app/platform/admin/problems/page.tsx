import { auth } from "@/app/auth";
import { PAGE_DESCRIPTIONS, PAGE_TITLES } from "@/lib/site";
import { Metadata } from "next";
import AdminProblemsClient from "./admin-problems-client";

export const metadata: Metadata = {
  title: PAGE_TITLES.adminProblems,
  description: PAGE_DESCRIPTIONS.adminProblems,
};

export default async function AdminProblemsPage() {
  const session = await auth();

  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  return <AdminProblemsClient />;
}
