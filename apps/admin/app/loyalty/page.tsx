import { LoyaltyWorkspace } from "../../components/loyalty-workspace";
import { AdminAuthGate } from "../../components/admin-auth-gate";
import { adminAccessRoles, adminModulePermissions } from "@huelegood/shared";

export default function LoyaltyPage() {
  return (
    <AdminAuthGate
      title="Fidelización"
      description="Puntos, movimientos, canjes y reglas base."
      allowedRoles={adminAccessRoles.loyalty}
      allowedPermissions={adminModulePermissions.loyalty.read}
    >
      <LoyaltyWorkspace />
    </AdminAuthGate>
  );
}
