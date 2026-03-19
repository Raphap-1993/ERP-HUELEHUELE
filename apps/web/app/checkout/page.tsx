import { Suspense } from "react";
import { CheckoutWorkspace } from "../../components/checkout-workspace";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-sm text-black/55">Cargando checkout...</div>}>
      <CheckoutWorkspace />
    </Suspense>
  );
}
