import { auth } from "@/app/auth";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("problemId");

  const user = await auth();

  if (!user) {
    return NextResponse.error();
  }

  if (!query) {
    return NextResponse.error();
  }

  const problemId = parseInt(query);

  if (isNaN(problemId)) {
    return NextResponse.error();
  }

  try {
    const recentSubmissions = await prisma.submissions.findMany({
      where: {
        problem_id: problemId,
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

    return NextResponse.json(recentSubmissions);
  } catch (error) {
    return NextResponse.error();
  }
}
