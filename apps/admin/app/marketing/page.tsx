import { AdminDataTable, SectionHeader } from "@huelegood/ui";
import { campaignSummary } from "@huelegood/shared";

export default function MarketingPage() {
  return (
    <div className="space-y-6 pb-8">
      <SectionHeader title="Marketing" description="Segmentos, campañas y corridas con trazabilidad." />
      <AdminDataTable
        title="Campañas activas"
        headers={["Campaña", "Estado", "Corrida", "Destinatarios"]}
        rows={campaignSummary.map((campaign) => [
          campaign.name,
          campaign.status,
          campaign.runStatus,
          campaign.recipients.join(", ")
        ])}
      />
    </div>
  );
}

