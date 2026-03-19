import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, CheckoutSummary, SellerCodeInput } from "@huelegood/ui";

export default function CheckoutPage() {
  return (
    <div className="grid gap-6 py-6 lg:grid-cols-[1fr_0.9fr] md:py-10">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Checkout Huelegood</CardTitle>
            <CardDescription>Pago Openpay o ruta manual con revisión operativa.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3 rounded-3xl bg-black/[0.02] p-5">
              <h3 className="text-lg font-semibold text-[#132016]">Datos del cliente</h3>
              <p className="text-sm text-black/60">Se capturan datos, dirección y contacto con validación directa.</p>
            </div>
            <div className="space-y-3 rounded-3xl bg-black/[0.02] p-5">
              <h3 className="text-lg font-semibold text-[#132016]">Pago manual</h3>
              <p className="text-sm text-black/60">El cliente puede subir comprobante y esperar revisión.</p>
            </div>
          </CardContent>
        </Card>

        <SellerCodeInput />
      </div>

      <div className="space-y-4">
        <CheckoutSummary subtotal={699} discount={100} shipping={49} total={648} vendorCode="VEND-014" />
        <Card>
          <CardHeader>
            <CardTitle>Acción de pago</CardTitle>
            <CardDescription>La implementación final elegirá Openpay o comprobante manual según método.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button>Continuar con Openpay</Button>
            <Button variant="secondary">Subir comprobante</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

