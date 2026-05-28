import { MarketingWorkspace } from "../../components/marketing-workspace";
import { AdminAuthGate } from "../../components/admin-auth-gate";
import { adminAccessRoles } from "@huelegood/shared";

export default function MarketingPage() {
  return (
    <AdminAuthGate
      title="Marketing"
      description="Campañas, segmentos y plantillas."
      allowedRoles={adminAccessRoles.marketing}
    >
      <MarketingWorkspace />
    </AdminAuthGate>
  );
}
