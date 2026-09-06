import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiGetPublicProfile } from "@/lib/api";
import { createPageMetadata } from "@/lib/seo";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type ProfilePageProps = {
  params: Promise<{ handle: string }>;
};

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { handle } = await params;

  try {
    const profile = await apiGetPublicProfile(handle);
    return createPageMetadata({
      title: `@${profile.handle}`,
      description: `${profile.name} on NextJudge — ${profile.contest_count} contests, ${profile.submission_count} submissions.`,
      path: `/profiles/${profile.handle}`,
    });
  } catch {
    return createPageMetadata({
      title: "Profile",
      description: "Competitive programming profile on NextJudge.",
      path: `/profiles/${handle}`,
    });
  }
}

const formatJoinDate = (joinDate: string) => {
  if (!joinDate) {
    return "Unknown";
  }

  const parsed = new Date(joinDate);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { handle } = await params;

  let profile;
  try {
    profile = await apiGetPublicProfile(handle);
  } catch {
    notFound();
  }

  const avatarSeed = profile.handle || profile.name || profile.id;
  const avatarUrl =
    profile.image && profile.image.trim() !== ""
      ? profile.image
      : `https://api.dicebear.com/8.x/pixel-art/svg?seed=${encodeURIComponent(avatarSeed)}`;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-12">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <Avatar className="h-20 w-20">
          <AvatarImage src={avatarUrl} alt={`${profile.name} avatar`} />
          <AvatarFallback>{profile.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">@{profile.handle}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{profile.name}</h1>
          <p className="text-sm text-muted-foreground">
            Joined {formatJoinDate(profile.join_date)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{profile.contest_count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{profile.submission_count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {profile.rating ?? "Unrated"}
            </p>
            {profile.max_rating !== undefined ? (
              <p className="text-sm text-muted-foreground">
                Peak {profile.max_rating}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground">
        Looking for more? Explore{" "}
        <Link href="/platform" className="text-primary underline-offset-4 hover:underline">
          the platform
        </Link>
        .
      </p>
    </main>
  );
}
