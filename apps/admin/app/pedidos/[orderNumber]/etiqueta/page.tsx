import { adminAccessRoles } from "@huelegood/shared";
import { AdminAuthGate } from "../../../../components/admin-auth-gate";
import { OrderDispatchLabelView } from "../../../../components/order-dispatch-label-view";

export default async function OrderDispatchLabelRoute({
  params,
  searchParams
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams?: Promise<{ from?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const source = resolvedSearchParams?.from === "despachos" ? "despachos" : "pedidos";

  return (
    <AdminAuthGate
      title="Sticker operativo"
      description="Vista print-ready de caja para operación y despacho."
      allowedRoles={adminAccessRoles.dispatch}
    >
      <OrderDispatchLabelView orderNumber={decodeURIComponent(resolvedParams.orderNumber)} source={source} />
    </AdminAuthGate>
  );
}
