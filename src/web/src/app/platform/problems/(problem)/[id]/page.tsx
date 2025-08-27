import { auth } from "@/app/auth";
import EditorComponent from "@/components/editor/editor-layout";
import EditorNavbar from "@/components/editor/editor-nav";
import MarkdownRenderer from "@/components/markdown-renderer";
import UserAvatar from "@/components/nav/user-avatar";
import { apiGetLanguages, apiGetProblemCategories, apiGetRecentSubmissionsForProblem, fetchProblemID } from "@/lib/api";
import { Problem } from "@/lib/types";
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

    if (!session || !session.user) {
        redirect(
            "/platform/"
        );
    }

    const results = await Promise.allSettled(
        [
            fetchProblemID(session.nextjudge_token, problem_id),
            apiGetProblemCategories(session.nextjudge_token, problem_id),
            apiGetRecentSubmissionsForProblem(session.nextjudge_token, problem_id, session.nextjudge_id),
            apiGetLanguages()
        ]
    )

    const [detailsResult, tagsResult, recentSubmissionsResult, languagesResult] = results

    const details = detailsResult.status === 'fulfilled' ? detailsResult.value : dummyProblem

    const testCases = detailsResult.status === 'fulfilled' ? (detailsResult.value.test_cases || []) : []

    let tags = tagsResult.status === 'fulfilled' ? tagsResult.value : []
    tags = []

    const recentSubmissions = recentSubmissionsResult.status === 'fulfilled' ? (recentSubmissionsResult.value || []) : []
    const languages = languagesResult.status === 'fulfilled' ? languagesResult.value : []

    return (
        <>
            <EditorThemeProvider>
                <EditorNavbar>
                    <UserAvatar session={session} />
                </EditorNavbar>
                <EditorComponent
                    details={details}
                    testCases={testCases}
                    recentSubmissions={recentSubmissions}
                    languages={languages}
                    tags={tags}
                    contestId={contestId}
                    slot={<MarkdownRenderer prompt={details.prompt} />}
                />
            </EditorThemeProvider>
        </>
    );
}
