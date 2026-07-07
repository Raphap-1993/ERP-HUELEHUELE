import { adminAccessRoles } from "@huelegood/shared";
import { AdminAuthGate } from "../../components/admin-auth-gate";
import { AuditWorkspace } from "../../components/audit-workspace";

export default function AuditPage() {
  return (
    <AdminAuthGate
      title="Auditoría y seguridad"
      description="Acceso restringido para revisión de postura y trazas críticas."
      allowedRoles={adminAccessRoles.audit}
    >
      <AuditWorkspace />
    </AdminAuthGate>
  );
}
