import { SettingsWorkspace } from "../../components/settings-workspace";
import { AdminAuthGate } from "../../components/admin-auth-gate";
import { adminAccessRoles } from "@huelegood/shared";

export default function SettingsPage() {
  return (
    <AdminAuthGate
      title="Configuración"
      description="Branding del admin y storefront, contacto operativo y navegación pública."
      allowedRoles={adminAccessRoles.configuration}
    >
      <SettingsWorkspace />
    </AdminAuthGate>
  );
}
