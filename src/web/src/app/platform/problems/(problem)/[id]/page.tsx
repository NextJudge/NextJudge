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

export default async function Editor({ params }: { params: { id: string } }) {
  const { id } = params;
  const details = await getDetails(parseInt(id));
  const tags = await getProblemTags(parseInt(id));
  return (
    <>
      <EditorThemeProvider>
        <EditorNavbar>
          <UserAvatar />
        </EditorNavbar>
        <EditorComponent details={details} tags={tags} />
      </EditorThemeProvider>
    </>
  );
}
