import { DashboardWorkspace } from "../components/dashboard-workspace";
import { AdminAuthGate } from "../components/admin-auth-gate";
import { adminAccessRoles } from "@huelegood/shared";

export default function AdminHomePage() {
  return (
    <AdminAuthGate
      title="Dashboard"
      description="Visión operacional general del backoffice Huelegood."
      allowedRoles={adminAccessRoles.dashboard}
    >
      <DashboardWorkspace />
    </AdminAuthGate>
  );
}
