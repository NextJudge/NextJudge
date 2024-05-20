import { prisma } from "@/app/auth";
import EditorComponent from "@/components/editor/editor-layout";
import EditorNavbar from "@/components/editor/editor-nav";
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

export default async function Editor({ params }: any) {
  const { id } = params;
  const details = await getDetails(parseInt(id));
  return (
    <>
      <EditorThemeProvider>
        <EditorNavbar>
          <UserAvatar />
        </EditorNavbar>
        <EditorComponent details={details} />
      </EditorThemeProvider>
    </>
  );
}
