import { ProfileForm } from "@/components/forms/profile-form";
import { Separator } from "@/components/ui/separator";

export default function SettingsProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profile</h3>
        <p className="text-sm text-muted-foreground">
          Your admin profile details. You can edit the information below.
        </p>
      </div>
      <Separator />
      <ProfileForm />
    </div>
  );
}
