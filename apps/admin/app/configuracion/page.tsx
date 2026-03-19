import { Card, CardContent, CardDescription, CardHeader, CardTitle, SectionHeader } from "@huelegood/ui";
import { siteSetting } from "@huelegood/shared";

export default function SettingsPage() {
  return (
    <div className="space-y-6 pb-8">
      <SectionHeader title="Configuración" description="Branding, soporte y parámetros base del sistema." />
      <Card>
        <CardHeader>
          <CardTitle>Site settings</CardTitle>
          <CardDescription>Valores base que alimentan storefront, admin y API.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-black/65">
          <p>Marca: {siteSetting.brandName}</p>
          <p>Tagline: {siteSetting.tagline}</p>
          <p>Soporte: {siteSetting.supportEmail}</p>
          <p>WhatsApp: {siteSetting.whatsapp}</p>
        </CardContent>
      </Card>
    </div>
  );
}

