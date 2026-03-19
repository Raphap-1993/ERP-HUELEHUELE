import { Card, CardContent, CardDescription, CardHeader, CardTitle, SectionHeader } from "@huelegood/ui";

export default function CmsPage() {
  return (
    <div className="space-y-6 pb-8">
      <SectionHeader title="CMS interno" description="Páginas, bloques, banners, FAQs y navegación editable." />
      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Páginas</CardTitle>
            <CardDescription>Home, catálogo, mayoristas y landing pages administrables.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-black/65">
            Se publican bloques reutilizables con SEO y trazabilidad de cambios.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Contenido editorial</CardTitle>
            <CardDescription>Banners, testimoniales, FAQs y navegación.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-black/65">
            Listo para convertir decisiones de negocio en contenido editable sin redeploy.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

