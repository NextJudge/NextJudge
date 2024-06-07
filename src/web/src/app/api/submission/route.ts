import { prisma } from "@/app/auth";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("submissionId");

  console.log(query);

  if (!query) {
    return NextResponse.error();
  }

  const submissionId = parseInt(query);

  if (isNaN(submissionId)) {
    return NextResponse.error();
  }

  try {
    console.log({ submissionId });
    const submission = await prisma.submissions.findUnique({
      where: {
        id: submissionId,
      },
      include: {
        test_cases: true,
      },
    });

    console.log(submission);

    return NextResponse.json(submission);
  } catch (error) {
    return NextResponse.error();
  }
}
