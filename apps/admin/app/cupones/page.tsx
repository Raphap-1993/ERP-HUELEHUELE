import { CouponsWorkspace } from "../../components/coupons-workspace";
import { AdminAuthGate } from "../../components/admin-auth-gate";
import { adminAccessRoles } from "@huelegood/shared";

export default function CuponesPage() {
  return (
    <AdminAuthGate
      title="Cupones"
      description="Gestión de códigos de descuento para el checkout."
      allowedRoles={adminAccessRoles.coupons}
    >
      <CouponsWorkspace />
    </AdminAuthGate>
  );
}
