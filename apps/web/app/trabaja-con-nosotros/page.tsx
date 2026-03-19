import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Textarea } from "@huelegood/ui";
import { brandArt, EditorialMedia } from "../../components/public-brand";
import { PublicChecklist, PublicField, PublicPageHero, PublicSectionHeading } from "../../components/public-shell";

export default function VendorApplicationPage() {
  return (
    <div className="space-y-10 py-6 md:space-y-14 md:py-10">
      <PublicPageHero
        eyebrow="Comunidad comercial"
        title="Trabaja con nosotros si puedes representar bien la marca."
        description="Esta página debe comunicar una oportunidad comercial seria: buena presencia, enfoque real en venta y alineación con la narrativa del producto."
        actions={[
          { label: "Postularme ahora", href: "#postulacion" },
          { label: "Ver cómo funciona", href: "#proceso", variant: "secondary" }
        ]}
        metrics={[
          { label: "Perfil", value: "Comercial", detail: "Buscamos personas con criterio para mover la marca." },
          { label: "Acceso", value: "Código", detail: "Cada vendedor recibe atribución y seguimiento." },
          { label: "Comisión", value: "Visible", detail: "El desempeño se sigue con trazabilidad." }
        ]}
        aside={<EditorialMedia src={brandArt.seller} alt="Visual editorial para vendedores Huele Huele" className="min-h-[460px]" />}
      />

      <section className="grid gap-6 xl:grid-cols-[1fr_0.92fr]">
        <Card id="postulacion" className="rounded-[2.4rem] border-black/8 bg-[linear-gradient(180deg,#ffffff_0%,#f2f6ee_100%)]">
          <CardHeader>
            <CardTitle>Postulación</CardTitle>
            <CardDescription>Cuéntanos quién eres, desde dónde venderías y por qué conectas con la marca.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <PublicField label="Nombre completo">
                <Input placeholder="Nombre y apellido" />
              </PublicField>
              <PublicField label="Correo electrónico">
                <Input placeholder="correo@ejemplo.com" type="email" />
              </PublicField>
              <PublicField label="Ciudad">
                <Input placeholder="Ciudad base" />
              </PublicField>
              <PublicField label="Canal o red">
                <Input placeholder="Punto de venta, red personal, e-commerce, etc." />
              </PublicField>
            </div>
            <PublicField label="Por qué quieres vender Huele Huele" helper="Buscamos claridad comercial, no un texto genérico." className="md:col-span-2">
              <Textarea placeholder="Cuéntanos cómo lo moverías, con qué tipo de cliente conectas y por qué te interesa representar la marca." />
            </PublicField>
            <Button>Enviar postulación</Button>
          </CardContent>
        </Card>

        <Card id="proceso" className="overflow-hidden rounded-[2.4rem] border-black/8 bg-[#132016] text-white shadow-[0_28px_90px_rgba(19,32,22,0.24)]">
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Badge className="w-fit bg-white/14 text-white">Onboarding comercial</Badge>
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white">Qué evaluamos y qué recibe el vendedor.</h2>
              <p className="text-sm leading-7 text-white/74">
                La página no debe vender humo. Debe explicar con claridad cómo entra alguien al canal comercial.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[1.8rem] border border-white/10 bg-white/8 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">Lo que evaluamos</p>
                <PublicChecklist
                  tone="dark"
                  className="mt-4"
                  items={[
                    "Presencia comercial y criterio para hablar del producto.",
                    "Capacidad para mover ventas en una ciudad o red concreta.",
                    "Afinidad real con la marca y su narrativa pública."
                  ]}
                />
              </div>

              <div className="rounded-[1.8rem] border border-white/10 bg-white/8 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">Lo que recibe</p>
                <PublicChecklist
                  tone="dark"
                  className="mt-4"
                  items={[
                    "Código comercial para atribución de ventas.",
                    "Seguimiento de comisiones y liquidaciones.",
                    "Acompañamiento para crecer dentro del canal."
                  ]}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        <PublicSectionHeading
          eyebrow="Ruta de entrada"
          title="Así se activa un vendedor dentro de Huelegood."
          description="El proceso debe verse profesional, corto y entendible para la persona que quiere aplicar."
        />
        <div className="grid gap-5 md:grid-cols-3">
          <Card className="rounded-[2rem] border-black/8 bg-white/92">
            <CardContent className="space-y-3">
              <p className="text-xs uppercase tracking-[0.24em] text-black/38">Paso 1</p>
              <CardTitle>Postulación</CardTitle>
              <p className="text-sm leading-6 text-black/64">
                Recibimos perfil, ciudad, canal y motivación comercial.
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-[2rem] border-black/8 bg-white/92">
            <CardContent className="space-y-3">
              <p className="text-xs uppercase tracking-[0.24em] text-black/38">Paso 2</p>
              <CardTitle>Revisión</CardTitle>
              <p className="text-sm leading-6 text-black/64">
                Validamos fit con la marca, potencial de ventas y capacidad de representación.
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-[2rem] border-black/8 bg-white/92">
            <CardContent className="space-y-3">
              <p className="text-xs uppercase tracking-[0.24em] text-black/38">Paso 3</p>
              <CardTitle>Activación</CardTitle>
              <p className="text-sm leading-6 text-black/64">
                Se crea el código comercial y se habilita el seguimiento de comisiones.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
