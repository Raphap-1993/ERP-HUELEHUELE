import { adminAccessRoles } from "@huelegood/shared";
import { AdminAuthGate } from "../../components/admin-auth-gate";
import { ObservabilityWorkspace } from "../../components/observability-workspace";

export default function ObservabilityPage() {
  return (
    <AdminAuthGate
      title="Observabilidad"
      description="Métricas, requests, colas y eventos de operación en una sola vista."
      allowedRoles={adminAccessRoles.observability}
    >
      <ObservabilityWorkspace />
    </AdminAuthGate>
  );
}
