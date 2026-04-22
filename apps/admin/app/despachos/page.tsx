import { adminAccessRoles } from "@huelegood/shared";
import { AdminAuthGate } from "../../components/admin-auth-gate";
import { DispatchesWorkspace } from "../../components/dispatches-workspace";

export default function DispatchesPage() {
  return (
    <AdminAuthGate
      title="Despachos"
      description="Cola operativa de packing, sticker y salida de pedidos."
      allowedRoles={adminAccessRoles.dispatch}
    >
      <DispatchesWorkspace />
    </AdminAuthGate>
  );
}
