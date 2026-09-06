import { auth } from "@/app/auth";
import PlatformNavbar from "@/components/nav/platform-navbar";
import { UserAvatar } from "@/components/nav/user-avatar";
import { Metadata } from "next";
import { SubmissionsList } from "./submissions-list";

export const metadata: Metadata = {
	title: "NextJudge - Submissions",
	description: "Browse and filter your submission history.",
};

export default async function SubmissionsPage() {
	const session = await auth();

	if (!session?.nextjudge_token) {
		throw new Error("You must be signed in to view this page");
	}

	return (
		<>
			<PlatformNavbar session={session}>
				<UserAvatar session={session} />
			</PlatformNavbar>
			<SubmissionsList token={session.nextjudge_token} />
		</>
	);
}
