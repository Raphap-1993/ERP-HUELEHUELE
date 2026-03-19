import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Textarea } from "@huelegood/ui";
import { brandArt, EditorialMedia } from "../../components/public-brand";

export default function VendorApplicationPage() {
  return (
    <div className="space-y-6 py-6 md:py-10">
      <section className="grid gap-6 lg:grid-cols-[1fr_0.92fr]">
        <Card className="rounded-[2.4rem] border-black/8 bg-[linear-gradient(180deg,#ffffff_0%,#f2f6ee_100%)]">
          <CardContent className="space-y-5">
            <Badge className="bg-[#132016] text-white">Comunidad comercial</Badge>
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-[#132016] md:text-5xl">Trabaja con nosotros</h1>
              <p className="max-w-2xl text-base leading-7 text-black/66">
                Si conectas bien con el producto y te interesa mover Huele Huele en tu ciudad o red de contactos,
                postulate aqui. Buscamos perfiles comerciales con buena presencia y enfoque real en venta.
              </p>
            </div>
          </CardContent>
        </Card>
        <EditorialMedia src={brandArt.seller} alt="Visual editorial para vendedores Huele Huele" className="min-h-[320px]" />
      </section>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-[2rem] border-black/8 bg-white/92">
          <CardHeader>
            <CardTitle>Postulacion</CardTitle>
            <CardDescription>Cuéntanos quién eres y por qué quieres vender Huele Huele.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Nombre completo" />
            <Input placeholder="Correo electronico" type="email" />
            <Input placeholder="Ciudad" />
            <Textarea placeholder="Cuéntanos por qué quieres vender Huele Huele" />
            <Button>Enviar postulacion</Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-[2rem] border-black/8 bg-white/92">
            <CardHeader>
              <CardTitle>Proceso de onboarding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-black/65">
              <p>1. El formulario crea una postulacion comercial.</p>
              <p>2. El equipo revisa perfil, ciudad y fit con la marca.</p>
              <p>3. Si se aprueba, se genera codigo comercial y activacion.</p>
            </CardContent>
          </Card>
          <Card className="rounded-[2rem] border-black/8 bg-[#132016] text-white">
            <CardHeader>
              <CardTitle className="text-white">Que recibe el vendedor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-white/78">
              <p>• Codigo para atribucion de ventas.</p>
              <p>• Seguimiento de comisiones.</p>
              <p>• Base lista para crecimiento del seller panel.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
