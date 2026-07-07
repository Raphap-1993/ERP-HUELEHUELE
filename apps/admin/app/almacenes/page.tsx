import { adminAccessRoles } from "@huelegood/shared";
import { AdminAuthGate } from "../../components/admin-auth-gate";
import { WarehousesWorkspace } from "../../components/warehouses-workspace";

export default function WarehousesPage() {
  return (
    <AdminAuthGate
      title="Almacenes"
      description="Ubicación operativa, prioridad y estado de los orígenes logísticos."
      allowedRoles={adminAccessRoles.warehouses}
    >
      <WarehousesWorkspace />
    </AdminAuthGate>
  );
}
