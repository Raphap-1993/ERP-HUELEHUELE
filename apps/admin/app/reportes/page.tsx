import { ReportsWorkspace } from "../../components/reports-workspace";
import { AdminAuthGate } from "../../components/admin-auth-gate";
import { adminAccessRoles, adminModulePermissions } from "@huelegood/shared";

export default function ReportesPage() {
  return (
    <AdminAuthGate
      title="Reportes"
      description="Análisis de pedidos, ingresos y conversión por periodo."
      allowedRoles={adminAccessRoles.dashboard}
      allowedPermissions={adminModulePermissions.reports.read}
    >
      <ReportsWorkspace />
    </AdminAuthGate>
  );
}
