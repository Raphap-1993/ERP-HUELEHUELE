import { SettingsWorkspace } from "../../components/settings-workspace";
import { AdminAuthGate } from "../../components/admin-auth-gate";
import { adminAccessRoles } from "@huelegood/shared";

export default function SettingsPage() {
  return (
    <AdminAuthGate
      title="Configuración"
      description="Parámetros base del storefront, branding y operación."
      allowedRoles={adminAccessRoles.configuration}
    >
      <SettingsWorkspace />
    </AdminAuthGate>
  );
}
