import { auth } from "@/app/auth";
import { Metadata } from "next";
import AdminProblemsClient from "./admin-problems-client";

export const metadata: Metadata = {
  title: "NextJudge Admin - Problem Management",
  description: "Manage the problems in the official NextJudge problem set.",
};

export default async function AdminProblemsPage() {
  const session = await auth();

  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  return <AdminProblemsClient />;
}
