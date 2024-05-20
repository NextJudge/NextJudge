import { auth, prisma } from "@/app/auth";
import { ProfileForm } from "@/components/forms/profile-form";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/toaster";
import { Prisma } from "@prisma/client";

async function getAdminDetails() {
  const session = await auth();
  if (session && session.user && session.user.email) {
    const admin = await prisma.users.findFirst({
      where: {
        email: session.user.email,
      },
    });
    return admin;
  }
  return null;
}

export type AdminDetails = Prisma.PromiseReturnType<typeof getAdminDetails>;

export default async function SettingsProfilePage() {
  const details = await getAdminDetails();
  return (
    <>
      <Toaster />
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Profile</h3>
          <p className="text-sm text-muted-foreground">
            Your admin profile details. You can edit the information below.
          </p>
        </div>
        <Separator />
        <ProfileForm userDetails={details} />
      </div>
    </>
  );
}
