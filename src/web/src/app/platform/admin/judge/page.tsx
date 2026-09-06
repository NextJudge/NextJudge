import { auth } from "@/app/auth";
import { Metadata } from "next";
import AdminJudgeClient from "./admin-judge-client";

export const metadata: Metadata = {
	title: "Judge operations",
	description: "Monitor judge workers and submission queue health.",
};

export default async function AdminJudgePage() {
	const session = await auth();

	if (!session || !session.user) {
		throw new Error("Unauthorized");
	}

	return <AdminJudgeClient />;
}
