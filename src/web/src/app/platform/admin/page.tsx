import { auth } from "@/app/auth";
import { ProfileForm } from "@/components/forms/profile-form";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/toaster";
import { apiGetUser } from "@/lib/api";


export default async function SettingsProfilePage() {

  const session = await auth()

  if (!session?.user || !session.nextjudge_token || !session.nextjudge_id) {
    throw new Error("Unauthorized");
  }
  const details = await apiGetUser(session.nextjudge_token, session.nextjudge_id);
  return (
    <>
      <Toaster />
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Overview</h3>
          <p className="text-sm text-muted-foreground">
            Your organizer account details. Profile editing is not available yet.
          </p>
        </div>
        <Separator />
        <ProfileForm userDetails={details} />
      </div>
    </>
  );
}
