import { adminAccessRoles } from "@huelegood/shared";
import { AdminAuthGate } from "../../components/admin-auth-gate";
import { ProductsWorkspace } from "../../components/products-workspace";

export default function ProductsPage() {
  return (
    <AdminAuthGate
      title="Productos"
      description="Catálogo administrable, variantes comerciales y media del storefront."
      allowedRoles={adminAccessRoles.products}
    >
      <ProductsWorkspace />
    </AdminAuthGate>
  );
}
