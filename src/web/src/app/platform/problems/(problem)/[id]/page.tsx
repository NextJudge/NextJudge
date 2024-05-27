import { prisma } from "@/app/auth";
import EditorComponent from "@/components/editor/editor-layout";
import EditorNavbar from "@/components/editor/editor-nav";
import MarkdownRenderer from "@/components/markdown-renderer";
import UserAvatar from "@/components/nav/user-avatar";
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

async function getDetails(id: number): Promise<ProblemDetails> {
  const details = await prisma.problems.findUnique({
    where: {
      id: id,
    },
    include: {
      users: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!details) {
    throw new Error("Problem not found");
  }

  const transformedDetails = {
    ...details,
  };
  return problemDetailsSchema.parse(transformedDetails);
}

async function getProblemTags(id: number): Promise<string[]> {
  const categories = await prisma.problem_categories.findMany({
    where: {
      problem_id: id,
    },
    select: {
      categories: {
        select: {
          name: true,
        },
      },
    },
  });
  return categories.map((c) => c.categories.name);
}

const testCasesSchema = z.array(
  z.object({
    id: z.number(),
    problem_id: z.number(),
    input: z.string(),
    expected_output: z.string(),
  })
);

export type TestCases = z.infer<typeof testCasesSchema>;

async function getTestCasesForProblem(id: number): Promise<TestCases> {
  const testCases = await prisma.test_cases.findMany({
    where: {
      problem_id: id,
    },
  });
  return testCases;
}

const RecentSubmissionSchema = z.array(
  z.object({
    id: z.number(),
    status: z.enum([
      "PENDING",
      "ACCEPTED",
      "WRONG_ANSWER",
      "TIME_LIMIT_EXCEEDED",
      "MEMORY_LIMIT_EXCEEDED",
      "RUNTIME_ERROR",
      "COMPILE_TIME_ERROR",
    ]),
    submit_time: z.date(),
    languages: z.object({
      name: z.string(),
    }),
    problems: z.object({
      title: z.string(),
      users: z.object({
        name: z.string(),
      }),
    }),
  })
);

export type TRecentSubmission = z.infer<typeof RecentSubmissionSchema>;

export type SingleSubmission = z.infer<
  typeof RecentSubmissionSchema
> extends Array<infer T>
  ? T
  : never;

async function getRecentSubmissionsForProblem(
  id: number
): Promise<TRecentSubmission> {
  const submissions = await prisma.submissions.findMany({
    where: {
      problem_id: id,
    },
    select: {
      id: true,
      problems: {
        select: {
          title: true,
          users: {
            select: {
              name: true,
            },
          },
        },
      },
      status: true,
      submit_time: true,
      languages: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      submit_time: "desc",
    },
    take: 10,
  });
  return submissions;
}

async function getLanguages() {
  const languages = await prisma.languages.findMany();
  return languages;
}

export default async function Editor({ params }: { params: { id: string } }) {
  const { id } = params;
  const details = await getDetails(parseInt(id));
  const tags = await getProblemTags(parseInt(id));
  const testCases = await getTestCasesForProblem(parseInt(id));
  const recentSubmissions = await getRecentSubmissionsForProblem(parseInt(id));
  const languages = await getLanguages();
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
