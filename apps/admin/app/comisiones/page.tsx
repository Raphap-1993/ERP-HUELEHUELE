import { CommissionsWorkspace } from "../../components/commissions-workspace";
import { AdminAuthGate } from "../../components/admin-auth-gate";
import { adminAccessRoles } from "@huelegood/shared";

export default function CommissionsPage() {
  return (
    <AdminAuthGate
      title="Comisiones"
      description="Atención operativa de reglas, liquidación y payout."
      allowedRoles={adminAccessRoles.commissions}
    >
      <CommissionsWorkspace />
    </AdminAuthGate>
  );
}
