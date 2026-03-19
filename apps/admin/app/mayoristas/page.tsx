import { AdminDataTable, SectionHeader } from "@huelegood/ui";
import { wholesaleLeads, wholesaleQuotes } from "@huelegood/shared";

export default function WholesaleAdminPage() {
  return (
    <div className="space-y-6 pb-8">
      <SectionHeader title="Mayoristas" description="Lead B2B, calificación comercial y cotizaciones." />
      <AdminDataTable
        title="Leads mayoristas"
        headers={["Empresa", "Contacto", "Ciudad", "Estado", "Origen"]}
        rows={wholesaleLeads.map((lead) => [lead.company, lead.contact, lead.city, lead.status, lead.source])}
      />
      <AdminDataTable
        title="Cotizaciones"
        headers={["Empresa", "Estado", "Monto"]}
        rows={wholesaleQuotes.map((quote) => [quote.company, quote.status, `$${quote.amount}`])}
      />
    </div>
  );
}

