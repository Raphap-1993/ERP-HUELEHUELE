import { CrmWorkspace } from "../../components/crm-workspace";
import { AdminAuthGate } from "../../components/admin-auth-gate";
import { adminAccessRoles, adminModulePermissions } from "@huelegood/shared";

export default function CrmPage() {
  return (
    <AdminAuthGate
      title="Clientes"
      description="CRUD operativo de clientes, direcciones y lectura reciente de pedidos."
      allowedRoles={adminAccessRoles.crm}
      allowedPermissions={adminModulePermissions.crm.read}
    >
      <CrmWorkspace />
    </AdminAuthGate>
  );
}
