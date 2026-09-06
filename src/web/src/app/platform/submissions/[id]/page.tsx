import { auth } from "@/app/auth";
import PlatformNavbar from "@/components/nav/platform-navbar";
import { UserAvatar } from "@/components/nav/user-avatar";
import { apiGetSubmissionRuns } from "@/lib/api";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SubmissionDetailView } from "./submission-detail";

interface SubmissionDetailPageProps {
	params: Promise<{ id: string }>;
}

export async function generateMetadata(
	props: SubmissionDetailPageProps,
): Promise<Metadata> {
	const params = await props.params;
	return {
		title: `NextJudge - Submission ${params.id.slice(0, 8)}`,
		description: "View submission details, test runs, and source code.",
	};
}

export default async function SubmissionDetailPage(
	props: SubmissionDetailPageProps,
) {
	const session = await auth();
	const params = await props.params;

	if (!session?.nextjudge_token) {
		throw new Error("You must be signed in to view this page");
	}

	let submission;
	try {
		submission = await apiGetSubmissionRuns(session.nextjudge_token, params.id);
	} catch {
		notFound();
	}

	return (
		<>
			<PlatformNavbar session={session}>
				<UserAvatar session={session} />
			</PlatformNavbar>
			<div className="w-full">
				<div className="px-8 pt-6">
					<Link
						href="/platform/submissions"
						className="text-sm text-muted-foreground hover:text-foreground hover:underline"
					>
						← Back to submissions
					</Link>
				</div>
				<SubmissionDetailView submission={submission} />
			</div>
		</>
	);
}
