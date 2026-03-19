import { AdminDataTable, ReviewDrawer, SectionHeader } from "@huelegood/ui";
import { paymentReviews, reviewQueue } from "@huelegood/shared";

export default function PaymentsPage() {
  return (
    <div className="space-y-6 pb-8">
      <SectionHeader title="Pagos" description="Openpay, manuales y cola de aprobación operativa." />
      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <AdminDataTable
          title="Estado de pagos"
          headers={["Pedido", "Estado", "Importe", "Proveedor", "Manual", "Notificación"]}
          rows={paymentReviews.map((item) => [
            item.orderNumber,
            item.status,
            `$${item.amount}`,
            item.provider,
            item.manualStatus,
            item.notificationStatus
          ])}
        />
        <ReviewDrawer title="Solicitudes manuales" items={reviewQueue} />
      </div>
    </div>
  );
}

