import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, SectionHeader, WholesalePlanCard } from "@huelegood/ui";
import { wholesalePlans } from "@huelegood/shared";

export default function WholesalePage() {
  return (
    <div className="space-y-8 py-6 md:py-10">
      <SectionHeader
        title="Mayoristas y distribuidores"
        description="Lead B2B con cotización, seguimiento comercial y tiers visibles."
      />
      <div className="grid gap-5 md:grid-cols-2">
        {wholesalePlans.map((plan) => (
          <WholesalePlanCard key={plan.tier} plan={plan} />
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Formulario de contacto comercial</CardTitle>
          <CardDescription>Se conecta con el funnel de mayoristas en la API y el backoffice.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button href="/trabaja-con-nosotros">Contactar ventas</Button>
          <Button variant="secondary" href="/catalogo">
            Ver referencias
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

