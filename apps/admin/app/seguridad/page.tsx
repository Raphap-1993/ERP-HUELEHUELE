import { adminModulePermissions } from "@huelegood/shared";
import { AdminAuthGate } from "../../components/admin-auth-gate";
import { SecurityWorkspace } from "../../components/security-workspace";

export default function SecurityPage() {
  return (
    <AdminAuthGate
      title="Seguridad"
      description="Roles, permisos, navegación y overrides temporales."
      allowedPermissions={adminModulePermissions.security.read}
    >
      <SecurityWorkspace />
    </AdminAuthGate>
  );
}
