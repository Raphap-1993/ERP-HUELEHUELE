import { AdminDataTable, CommissionTable, SectionHeader } from "@huelegood/ui";
import { vendorApplications, vendorOverview } from "@huelegood/shared";

export default function VendorsPage() {
  return (
    <div className="space-y-6 pb-8">
      <SectionHeader title="Vendedores" description="Postulaciones, códigos, estado comercial y comisiones." />
      <AdminDataTable
        title="Postulaciones"
        headers={["Nombre", "Email", "Ciudad", "Estado", "Origen"]}
        rows={vendorApplications.map((application) => [
          application.name,
          application.email,
          application.city,
          application.status,
          application.source
        ])}
      />
      <AdminDataTable
        title="Resumen de vendedores activos"
        headers={["Nombre", "Código", "Estado", "Ventas", "Comisiones"]}
        rows={vendorOverview.map((vendor) => [
          vendor.name,
          vendor.code,
          vendor.status,
          `$${vendor.sales}`,
          `$${vendor.commissions}`
        ])}
      />
      <CommissionTable />
    </div>
  );
}

