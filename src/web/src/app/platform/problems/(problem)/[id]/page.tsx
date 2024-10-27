import { auth } from "@/app/auth";
import EditorComponent from "@/components/editor/editor-layout";
import EditorNavbar from "@/components/editor/editor-nav";
import MarkdownRenderer from "@/components/markdown-renderer";
import UserAvatar from "@/components/nav/user-avatar";
import { apiGetLanguages, apiGetProblemCategories, apiGetRecentSubmissionsForProblem, fetchProblemID } from "@/lib/api";
import { EditorThemeProvider } from "@/providers/editor-theme";


export default async function Editor({ params }: { params: { id: string } }) {
  const { id } = params;
  const session = await auth();

  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  
  const details = await fetchProblemID(session.nextjudge_token,parseInt(id));
  const tags = await apiGetProblemCategories(session.nextjudge_token,parseInt(id));
  const testCases = details.test_cases
  const recentSubmissions = await apiGetRecentSubmissionsForProblem(session.nextjudge_token,parseInt(id),session.nextjudge_id);
  const languages = await apiGetLanguages();


  return (
    <>
      <EditorThemeProvider>
        <EditorNavbar>
          <UserAvatar />
        </EditorNavbar>
        <EditorComponent
          userId={123123} //{parseInt(session.user.id as string)}
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
