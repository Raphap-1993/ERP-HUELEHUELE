import { PaymentsWorkspace } from "../../components/payments-workspace";
import { AdminAuthGate } from "../../components/admin-auth-gate";
import { adminAccessRoles } from "@huelegood/shared";

export default function PaymentsPage() {
  return (
    <AdminAuthGate
      title="Pagos"
      description="Revisión de pagos Openpay y comprobantes manuales."
      allowedRoles={adminAccessRoles.payments}
    >
      <PaymentsWorkspace />
    </AdminAuthGate>
  );
}
