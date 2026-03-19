import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Textarea } from "@huelegood/ui";

export default function VendorApplicationPage() {
  return (
    <div className="grid gap-6 py-6 md:py-10 lg:grid-cols-[0.95fr_1.05fr]">
      <Card>
        <CardHeader>
          <CardTitle>Trabaja con nosotros</CardTitle>
          <CardDescription>Postulación de vendedor con revisión interna y generación de código comercial.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Nombre completo" />
          <Input placeholder="Correo electrónico" type="email" />
          <Input placeholder="Ciudad" />
          <Textarea placeholder="Cuéntanos por qué quieres vender Huelegood" />
          <Button>Enviar postulación</Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Proceso de onboarding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-black/65">
            <p>1. El formulario crea una vendor_application.</p>
            <p>2. El seller_manager revisa perfil y disponibilidad.</p>
            <p>3. Si se aprueba, se genera vendor code y estado activo.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Qué recibe el vendedor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-black/65">
            <p>• Código para atribución de ventas.</p>
            <p>• Seguimiento de comisiones.</p>
            <p>• Acceso posterior a seller panel.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

