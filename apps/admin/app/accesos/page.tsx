import { adminAccessRoles } from "@huelegood/shared";
import { AdminAuthGate } from "../../components/admin-auth-gate";
import { CommercialAccessesWorkspace } from "../../components/commercial-accesses-workspace";

export default function CommercialAccessesPage() {
  return (
    <AdminAuthGate
      title="Accesos comerciales"
      description="Credenciales web para vendedores y mayoristas."
      allowedRoles={adminAccessRoles.commercialAccesses}
    >
      <CommercialAccessesWorkspace />
    </AdminAuthGate>
  );
}
