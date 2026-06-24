import { Metadata } from "next";
import { DefaultLanguageSetting } from "@/components/settings/default-language-setting";
import { DeleteAccountSetting } from "@/components/settings/delete-account-setting";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "General Settings",
  description: "Manage your general settings and preferences.",
};

export default function SettingsPage() {
  return (
    <section aria-labelledby="general-settings-heading" className="space-y-6">
      <header>
        <h2 id="general-settings-heading" className="text-lg font-medium">
          General Settings
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage your general preferences and settings.
        </p>
      </header>
      <Separator />
      <DefaultLanguageSetting />
      <DeleteAccountSetting />
    </section>
  );
}
