import { VendorsWorkspace } from "../../components/vendors-workspace";
import { AdminAuthGate } from "../../components/admin-auth-gate";
import { adminAccessRoles, adminModulePermissions } from "@huelegood/shared";

export default function VendorsPage() {
  return (
    <AdminAuthGate
      title="Vendedores"
      description="Postulaciones, códigos y operación comercial."
      allowedRoles={adminAccessRoles.vendors}
      allowedPermissions={adminModulePermissions.vendors.read}
    >
      <VendorsWorkspace />
    </AdminAuthGate>
  );
}
