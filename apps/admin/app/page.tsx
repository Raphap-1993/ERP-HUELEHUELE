import { DashboardWorkspace } from "../components/dashboard-workspace";
import { AdminAuthGate } from "../components/admin-auth-gate";
import { adminAccessRoles } from "@huelegood/shared";

export default function AdminHomePage() {
  return (
    <AdminAuthGate
      title="Dashboard"
      description="Visión operativa general de Huelegood."
      allowedRoles={adminAccessRoles.dashboard}
    >
      <DashboardWorkspace />
    </AdminAuthGate>
  );
}
