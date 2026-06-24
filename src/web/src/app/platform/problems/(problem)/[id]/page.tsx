import { auth } from "@/app/auth";
import EditorComponent from "@/components/editor/editor-layout";
import EditorNavbar from "@/components/editor/editor-nav";
import MarkdownRenderer from "@/components/markdown-renderer";
import { UserAvatar } from "@/components/nav/user-avatar";
import { NotificationBellServer } from "@/components/ui/notification-bell-server";
import { apiGetLanguages, apiGetProblemCategories, apiGetRecentSubmissionsForProblem, fetchProblemID } from "@/lib/api";
import { Category, Problem } from "@/lib/types";
import { EditorThemeProvider } from "@/providers/editor-theme";
import { redirect } from "next/navigation";

// Used in the case of network failure
const dummyProblem: Problem = {
    id: -1,
    prompt: "",
    title: "",
    timeout: 0,
    difficulty: "MEDIUM",
    user_id: "-1",
    upload_date: "",
    updated_at: "",
    identifier: "",
    source: "",
    accept_timeout: 0,
    execution_timeout: 0,
    memory_limit: 0,
    test_cases: [],
    categories: [],
}


export default async function Editor({
    params,
    searchParams
}: {
    params: { id: string };
    searchParams: { contest?: string }
}) {
    const { id } = params;
    const problem_id = parseInt(id)
    const contestId = searchParams.contest ? parseInt(searchParams.contest) : undefined;
    const session = await auth();

    if (!session?.user || !session.nextjudge_token || !session.nextjudge_id) {
        redirect(
            "/platform/"
        );
    }

    const token = session.nextjudge_token;
    const userId = session.nextjudge_id;

    const results = await Promise.allSettled(
        [
            fetchProblemID(token, problem_id),
            apiGetProblemCategories(token, problem_id),
            apiGetRecentSubmissionsForProblem(token, problem_id, userId),
            apiGetLanguages()
        ]
    )

    const [detailsResult, tagsResult, recentSubmissionsResult, languagesResult] = results

    const details = detailsResult.status === 'fulfilled' ? detailsResult.value : dummyProblem

    const testCases = detailsResult.status === 'fulfilled' ? (detailsResult.value.test_cases || []) : []

    const tags =
        tagsResult.status === "fulfilled" && Array.isArray(tagsResult.value)
            ? (tagsResult.value as Category[]).map((category) => category.name)
            : [];

    const recentSubmissions = recentSubmissionsResult.status === 'fulfilled' ? (recentSubmissionsResult.value || []) : []
    const languages = languagesResult.status === 'fulfilled' ? languagesResult.value : []

    return (
        <div className="editor-workspace dark h-screen flex flex-col overflow-hidden bg-background text-foreground">
            <EditorThemeProvider>
                    <div className="px-2 pb-2 flex flex-col flex-1 min-h-0">
                        <EditorNavbar
                            notificationSlot={<NotificationBellServer session={session} />}
                            backHref={contestId ? `/platform/contests/${contestId}` : "/platform/problems"}
                        >
                            <UserAvatar session={session} />
                        </EditorNavbar>
                        <div className="flex-1 min-h-0">
                            <EditorComponent
                                details={details}
                                testCases={testCases}
                                recentSubmissions={recentSubmissions}
                                languages={languages}
                                tags={tags}
                                contestId={contestId}
                                slot={<MarkdownRenderer prompt={details.prompt} />}
                            />
                        </div>
                    </div>
            </EditorThemeProvider>
        </div>
    );
}
