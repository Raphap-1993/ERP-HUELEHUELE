import { AdminDataTable, SectionHeader } from "@huelegood/ui";
import { loyaltyOverview } from "@huelegood/shared";

export default function LoyaltyPage() {
  return (
    <div className="space-y-6 pb-8">
      <SectionHeader title="Loyalty" description="Puntos, movimientos y canjes controlados por reglas." />
      <AdminDataTable
        title="Cuentas de loyalty"
        headers={["Cliente", "Disponibles", "Pendientes", "Canjeados", "Último estado"]}
        rows={loyaltyOverview.map((item) => [
          item.customer,
          item.availablePoints,
          item.pendingPoints,
          item.redeemedPoints,
          item.redemptionStatus
        ])}
      />
    </div>
  );
}

