import { adminAccessRoles, adminModulePermissions } from "@huelegood/shared";
import { AdminAuthGate } from "../../components/admin-auth-gate";
import { TransfersWorkspace } from "../../components/transfers-workspace";

export default function TransfersPage() {
  return (
    <AdminAuthGate
      title="Transferencias"
      description="Preparación y control de movimientos entre almacenes con guía, paquete y sticker."
      allowedRoles={adminAccessRoles.transfers}
      allowedPermissions={adminModulePermissions.transfers.read}
    >
      <TransfersWorkspace />
    </AdminAuthGate>
  );
}
