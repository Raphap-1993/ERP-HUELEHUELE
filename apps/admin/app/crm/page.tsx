import { CrmWorkspace } from "../../components/crm-workspace";
import { AdminAuthGate } from "../../components/admin-auth-gate";
import { adminAccessRoles } from "@huelegood/shared";

export default function CrmPage() {
  return (
    <AdminAuthGate
      title="CRM"
      description="Campañas, segmentos y eventos de comunicación comercial."
      allowedRoles={adminAccessRoles.crm}
    >
      <CrmWorkspace />
    </AdminAuthGate>
  );
}
