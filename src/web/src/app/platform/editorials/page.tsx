import { auth } from "@/app/auth";
import PlatformNavbar from "@/components/nav/platform-navbar";
import { UserAvatar } from "@/components/nav/user-avatar";
import { Badge } from "@/components/ui/badge";
import { apiGetProblems } from "@/lib/api";
import { PAGE_DESCRIPTIONS, PAGE_TITLES } from "@/lib/site";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: PAGE_TITLES.editorials,
  description: PAGE_DESCRIPTIONS.editorials,
};

export default async function EditorialsPage() {
  const session = await auth();

  if (!session?.nextjudge_token) {
    throw "You must be signed-in to view this page";
  }

  const problemsResult = await Promise.allSettled([
    apiGetProblems(session.nextjudge_token),
  ]);

  const problems =
    problemsResult[0].status === "fulfilled" ? problemsResult[0].value : [];
  const visibleProblems = problems.filter((problem) => problem.public !== false);

  return (
    <>
      <PlatformNavbar session={session}>
        <UserAvatar session={session} />
      </PlatformNavbar>
      <div className="max-w-7xl w-full flex-1 flex-col space-y-8 p-8 mx-8 md:flex">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">Editorials</h2>
            <Badge variant="secondary">Coming soon</Badge>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Written editorials are not available yet. In the meantime, you can
            solve problems directly from the list below or browse the full
            problem set.
          </p>
          <Link
            href="/platform/problems"
            className="text-sm text-primary hover:underline"
          >
            View all problems
          </Link>
        </div>

        {visibleProblems.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Problems to solve</h3>
            <ul className="divide-y divide-border rounded-lg border">
              {visibleProblems.map((problem) => (
                <li key={problem.id}>
                  <Link
                    href={`/platform/problems/${problem.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-medium">{problem.title}</span>
                    <Badge variant="outline">{problem.difficulty}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-muted-foreground">
            No problems are available right now. Check back later or visit the{" "}
            <Link href="/platform/problems" className="text-primary hover:underline">
              problems page
            </Link>
            .
          </p>
        )}
      </div>
    </>
  );
}
