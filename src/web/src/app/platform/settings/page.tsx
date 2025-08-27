import { Metadata } from "next";
import { DefaultLanguageSetting } from "@/components/settings/default-language-setting";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "General Settings",
  description: "Manage your general settings and preferences.",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">General Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your general preferences and settings.
        </p>
      </div>
      <Separator />
      <DefaultLanguageSetting />
    </div>
  );
}
