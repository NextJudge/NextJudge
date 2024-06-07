import { prisma } from "@/app/auth";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("submissionId");
  if (!query) {
    return NextResponse.error();
  }
  const submissionId = parseInt(query);
  if (isNaN(submissionId)) {
    return NextResponse.error();
  }
  try {
    const submission = await prisma.submissions.findUnique({
      where: {
        id: submissionId,
      },
      include: {
        test_cases: true,
      },
    });
    return NextResponse.json(submission);
  } catch (error) {
    return NextResponse.error();
  }
}
