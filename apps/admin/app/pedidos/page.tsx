import { AdminDataTable, SectionHeader, TimelinePedido } from "@huelegood/ui";
import { recentOrders, orderTimeline } from "@huelegood/shared";

export default function OrdersPage() {
  return (
    <div className="space-y-6 pb-8">
      <SectionHeader title="Pedidos" description="Listado filtrable y timeline del estado comercial." />
      <AdminDataTable
        title="Pedidos activos"
        headers={["Pedido", "Cliente", "Total", "Estado", "Pago", "Vendedor", "Actualizado"]}
        rows={recentOrders.map((order) => [
          order.number,
          order.customer,
          `$${order.total}`,
          order.status,
          order.paymentStatus,
          order.vendorCode ?? "Sin código",
          order.updatedAt
        ])}
      />
      <TimelinePedido items={orderTimeline} />
    </div>
  );
}

