import { CommissionsWorkspace } from "../../components/commissions-workspace";
import { AdminAuthGate } from "../../components/admin-auth-gate";
import { adminAccessRoles, adminModulePermissions } from "@huelegood/shared";

export default function CommissionsPage() {
  return (
    <AdminAuthGate
      title="Comisiones"
      description="Atención operativa de reglas, liquidación y payout."
      allowedRoles={adminAccessRoles.commissions}
      allowedPermissions={adminModulePermissions.commissions.read}
    >
      <CommissionsWorkspace />
    </AdminAuthGate>
  );
}
