import { auth } from "@/app/auth";
import EditorComponent from "@/components/editor/editor-layout";
import EditorNavbar from "@/components/editor/editor-nav";
import MarkdownRenderer from "@/components/markdown-renderer";
import UserAvatar from "@/components/nav/user-avatar";
import { apiGetLanguages, apiGetProblemCategories, apiGetRecentSubmissionsForProblem, fetchProblemID } from "@/lib/api";
import { Problem } from "@/lib/types";
import { EditorThemeProvider } from "@/providers/editor-theme";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Used in the case of network failure
const dummyProblem: Problem = {
    id:-1,
    prompt: "",
    title: "",
    timeout: 0,
    difficulty: "MEDIUM",
    user_id: "-1",
    upload_date: "",
    test_cases: [],
    categories: [],
}


export default async function Editor({ params }: { params: { id: string } }) {
    const { id } = params;
    const problem_id = parseInt(id)
    const session = await auth();

    
    if (!session || !session.user) {
        throw new Error("Unauthorized");
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
    const testCases = detailsResult.status === 'fulfilled' ? detailsResult.value.test_cases : []
    const tags = tagsResult.status === 'fulfilled' ? tagsResult.value : []
    const recentSubmissions = recentSubmissionsResult.status === 'fulfilled' ? recentSubmissionsResult.value : []
    const languages = languagesResult.status === 'fulfilled' ? languagesResult.value : []

    // const details = await fetchProblemID(session.nextjudge_token, parseInt(id));
    // const tags = await apiGetProblemCategories(session.nextjudge_token, parseInt(id));
    // const testCases = details.test_cases
    // const recentSubmissions = await apiGetRecentSubmissionsForProblem(session.nextjudge_token, parseInt(id), session.nextjudge_id);
    // const languages = await apiGetLanguages();

    return (
        <>
            <EditorThemeProvider>
                <EditorNavbar>
                    <UserAvatar />
                </EditorNavbar>
                <EditorComponent
                    details={details}
                    testCases={testCases}
                    recentSubmissions={recentSubmissions}
                    languages={languages}
                    tags={tags}
                    slot={<MarkdownRenderer prompt={details.prompt} />}
                />
            </EditorThemeProvider>
        </>
    );
}
