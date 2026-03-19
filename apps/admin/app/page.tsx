import {
  AdminDataTable,
  CommissionTable,
  MetricCard,
  ReviewDrawer,
  SectionHeader,
  TimelinePedido
} from "@huelegood/ui";
import { adminDashboard, recentOrders } from "@huelegood/shared";

export default function AdminHomePage() {
  return (
    <div className="space-y-6 pb-8">
      <SectionHeader
        title="Dashboard"
        description="Visión de pedidos, pagos, comisiones y cola de revisión manual."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {adminDashboard.metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <AdminDataTable
          title="Pedidos recientes"
          description="Snapshot operativo del circuito comercial."
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
        <ReviewDrawer title="Revisión de pagos" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <TimelinePedido />
        <CommissionTable />
      </div>
    </div>
  );
}

