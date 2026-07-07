import { CrmWorkspace } from "../../components/crm-workspace";
import { AdminAuthGate } from "../../components/admin-auth-gate";
import { adminAccessRoles } from "@huelegood/shared";

export default function CrmPage() {
  return (
    <AdminAuthGate
      title="Clientes"
      description="CRUD operativo de clientes, direcciones y lectura reciente de pedidos."
      allowedRoles={adminAccessRoles.crm}
    >
      <CrmWorkspace />
    </AdminAuthGate>
  );
}
