import { auth } from "@/app/auth";
import { Metadata } from "next";
import AdminOrganizationsClient from "./admin-organizations-client";

export const metadata: Metadata = {
  title: "Organizations",
  description: "Manage organizations, classes, and rosters.",
};

export default async function AdminOrganizationsPage() {
  const session = await auth();

  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  return <AdminOrganizationsClient />;
}
