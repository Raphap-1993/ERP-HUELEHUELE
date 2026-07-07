import { OrdersWorkspace } from "../../components/orders-workspace";
import { AdminAuthGate } from "../../components/admin-auth-gate";
import { adminAccessRoles } from "@huelegood/shared";

export default function OrdersPage() {
  return (
    <AdminAuthGate
      title="Pedidos"
      description="Operación de órdenes, timeline y estados."
      allowedRoles={adminAccessRoles.orders}
    >
      <OrdersWorkspace />
    </AdminAuthGate>
  );
}
