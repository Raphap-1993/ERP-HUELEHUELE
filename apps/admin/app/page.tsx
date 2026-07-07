import { DashboardWorkspace } from "../components/dashboard-workspace";
import { AdminAuthGate } from "../components/admin-auth-gate";
import { adminAccessRoles, adminModulePermissions } from "@huelegood/shared";

export default function AdminHomePage() {
  return (
    <AdminAuthGate
      title="Dashboard"
      description="Visión operativa general de Huelegood."
      allowedRoles={adminAccessRoles.dashboard}
      allowedPermissions={adminModulePermissions.dashboard.read}
    >
      <DashboardWorkspace />
    </AdminAuthGate>
  );
}
