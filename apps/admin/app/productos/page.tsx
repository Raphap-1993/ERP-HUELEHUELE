import { adminAccessRoles } from "@huelegood/shared";
import { AdminAuthGate } from "../../components/admin-auth-gate";
import { ProductsWorkspace } from "../../components/products-workspace";

export default function ProductsPage() {
  return (
    <AdminAuthGate
      title="Productos"
      description="Catálogo administrable, combos e imágenes para el storefront."
      allowedRoles={adminAccessRoles.products}
    >
      <ProductsWorkspace />
    </AdminAuthGate>
  );
}
