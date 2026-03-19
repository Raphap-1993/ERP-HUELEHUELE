import { Card, CardContent, CardDescription, CardHeader, CardTitle, MetricCard, SectionHeader, StatusBadge } from "@huelegood/ui";
import { loyaltyOverview, recentOrders } from "@huelegood/shared";

export default function AccountPage() {
  const loyalty = loyaltyOverview[0];

  return (
    <div className="space-y-8 py-6 md:py-10">
      <SectionHeader title="Mi cuenta" description="Pedidos, puntos y estado de la relación comercial." />
      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard metric={{ label: "Puntos disponibles", value: `${loyalty.availablePoints}`, detail: "Acumulados y listos para usar", trend: "+12" }} />
        <MetricCard metric={{ label: "Puntos pendientes", value: `${loyalty.pendingPoints}`, detail: "A la espera de pedido elegible" }} />
        <MetricCard metric={{ label: "Canjes", value: `${loyalty.redeemedPoints}`, detail: "Historial de uso" }} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Pedidos recientes</CardTitle>
          <CardDescription>Visibilidad básica de tus órdenes y estado operativo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentOrders.map((order) => (
            <div key={order.number} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 px-4 py-3">
              <div>
                <div className="font-semibold text-[#132016]">{order.number}</div>
                <div className="text-sm text-black/55">{order.customer} · {order.updatedAt}</div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge label={order.status} tone={order.status === "paid" ? "success" : order.status === "payment_under_review" ? "warning" : "neutral"} />
                <span className="font-semibold text-[#132016]">${order.total}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

