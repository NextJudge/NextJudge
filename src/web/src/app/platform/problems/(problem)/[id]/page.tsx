import EditorComponent from "@/components/editor/editor-layout";
import EditorNavbar from "@/components/editor/editor-nav";
import MarkdownRenderer from "@/components/markdown-renderer";
import UserAvatar from "@/components/nav/user-avatar";
import { apiGetLanguages, apiGetProblemCategories, apiGetRecentSubmissionsForProblem, apiGetTestCasesForProblem, fetchProblemID } from "@/lib/api";
import { EditorThemeProvider } from "@/providers/editor-theme";
import { z } from "zod";

export type ProblemDetails = {
  id: number;
  title: string;
  prompt: string;
  timeout: number;
  user_id: number;
  upload_date: Date;
  users: {
    name: string;
  };
  difficulty?: "VERY_EASY" | "EASY" | "MEDIUM" | "HARD" | "VERY_HARD";
  problem_categories?: {
    category_id: number;
    problem_id: number;
  }[];
};

const problemDetailsSchema = z.object({
  id: z.number(),
  title: z.string(),
  prompt: z.string(),
  timeout: z.number(),
  user_id: z.number(),
  upload_date: z.date(),
  users: z.object({
    name: z.string(),
  }),
  difficulty: z
    .enum(["VERY_EASY", "EASY", "MEDIUM", "HARD", "VERY_HARD"])
    .optional(),
  problem_categories: z
    .array(
      z.object({
        category_id: z.number(),
        problem_id: z.number(),
      })
    )
    .optional(),
});

export type ZodProblemDetails = z.infer<typeof problemDetailsSchema>;


const testCasesSchema = z.array(
  z.object({
    id: z.number(),
    problem_id: z.number(),
    input: z.string(),
    expected_output: z.string(),
  })
);

export type TestCases = z.infer<typeof testCasesSchema>;

export default async function Editor({ params }: { params: { id: string } }) {
  const { id } = params;
  // const session = await auth();
  // if (!session || !session.user) {
  //   throw new Error("Unauthorized");
  // }
  const details = await fetchProblemID(parseInt(id));
  const tags = await apiGetProblemCategories(parseInt(id));
  const testCases = await apiGetTestCasesForProblem(parseInt(id));
  const recentSubmissions = await apiGetRecentSubmissionsForProblem(parseInt(id),"25c054a1-e306-4851-b229-67acffa65e56");
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
