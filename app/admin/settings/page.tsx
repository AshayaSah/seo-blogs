import { requireAdminPage } from "@/src/lib/admin-guard";
import { getAutoPublishEnabled } from "@/src/lib/settings";
import AdminNav from "../AdminNav";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdminPage();
  const autoPublishEnabled = await getAutoPublishEnabled();

  return (
    <div>
      <AdminNav active="settings" />

      <header className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Control how incoming agent submissions are handled.
        </p>
      </header>

      <SettingsForm initialValue={autoPublishEnabled} />
    </div>
  );
}
