import { WholesaleWorkspace } from "../../components/wholesale-workspace";
import { AdminAuthGate } from "../../components/admin-auth-gate";
import { adminAccessRoles, adminModulePermissions } from "@huelegood/shared";

export default function WholesaleAdminPage() {
  return (
    <AdminAuthGate
      title="Mayoristas"
      description="Leads, cotizaciones y tiers comerciales."
      allowedRoles={adminAccessRoles.wholesale}
      allowedPermissions={adminModulePermissions.wholesale.read}
    >
      <WholesaleWorkspace />
    </AdminAuthGate>
  );
}
