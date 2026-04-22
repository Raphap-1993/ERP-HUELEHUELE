"use client";

import dynamic from "next/dynamic";

const CheckoutWorkspace = dynamic(
  () => import("../../components/checkout-workspace").then((module) => module.CheckoutWorkspace),
  {
    ssr: false,
    loading: () => <div className="py-16 text-center text-sm text-black/55">Cargando checkout...</div>
  }
);

export default function CheckoutPage() {
  return <CheckoutWorkspace />;
}
