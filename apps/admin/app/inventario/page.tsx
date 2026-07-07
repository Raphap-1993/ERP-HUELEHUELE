import { adminAccessRoles } from "@huelegood/shared";
import { AdminAuthGate } from "../../components/admin-auth-gate";
import { InventoryWorkspace } from "../../components/inventory-workspace";

export default function InventoryPage() {
  return (
    <AdminAuthGate
      title="Inventario"
      description="Stock operativo por variante, almacén preferido y alertas de disponibilidad."
      allowedRoles={adminAccessRoles.inventory}
    >
      <InventoryWorkspace />
    </AdminAuthGate>
  );
}
