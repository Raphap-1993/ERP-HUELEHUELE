"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  featuredProducts,
  type AuthSessionSummary,
  type CheckoutItemInput,
  type CheckoutQuoteSummary,
  type CheckoutRequestInput,
  type CatalogProduct
} from "@huelegood/shared";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CheckoutSummary,
  Input,
  StatusBadge,
  Textarea,
  Badge,
  Separator
} from "@huelegood/ui";
import {
  createManualCheckout,
  createOpenpayCheckout,
  fetchCatalogSummary,
  fetchCheckoutQuote,
  fetchSession
} from "../lib/api";
import {
  addStoredCartItem,
  clearStoredCart,
  clearStoredSessionToken,
  readStoredCart,
  readStoredSessionToken,
  writeStoredCart
} from "../lib/session";
import { EditorialMedia } from "./public-brand";
import { brandArt } from "./public-brand-art";
import { PublicField, PublicPageHero, PublicSectionHeading } from "./public-shell";

type PaymentMethod = "openpay" | "manual";

interface CustomerForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface AddressForm {
  label: string;
  recipientName: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode: string;
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" ")
  };
}

function buildFallbackProducts(products: CatalogProduct[]) {
  return products.length > 0 ? products : featuredProducts;
}

export function CheckoutWorkspace() {
  const searchParams = useSearchParams();
  const checkoutRequestIdRef = useRef<string | null>(null);
  const [products, setProducts] = useState<CatalogProduct[]>(featuredProducts);
  const [items, setItems] = useState<CheckoutItemInput[]>([
    {
      slug: searchParams.get("producto") || featuredProducts[0].slug,
      quantity: 1
    }
  ]);
  const [session, setSession] = useState<AuthSessionSummary | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("openpay");
  const [vendorCode, setVendorCode] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [notes, setNotes] = useState("");
  const [manualEvidenceReference, setManualEvidenceReference] = useState("");
  const [manualEvidenceNotes, setManualEvidenceNotes] = useState("");
  const [customer, setCustomer] = useState<CustomerForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  });
  const [address, setAddress] = useState<AddressForm>({
    label: "",
    recipientName: "",
    line1: "",
    line2: "",
    city: "",
    region: "",
    postalCode: "",
    countryCode: ""
  });
  const [quote, setQuote] = useState<CheckoutQuoteSummary | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    status: string;
    message: string;
    referenceId?: string;
    order?: {
      orderNumber: string;
      orderStatus: string;
      paymentStatus: string;
      paymentMethod: PaymentMethod;
      manualStatus?: string;
      manualRequestId?: string;
      manualEvidenceReference?: string;
      manualEvidenceNotes?: string;
      providerReference: string;
      nextStep: string;
      checkoutUrl?: string;
      evidenceRequired?: boolean;
    };
  } | null>(null);

  const activeItems = useMemo(() => {
    return items.filter((item) => item.slug.trim().length > 0 && item.quantity > 0);
  }, [items]);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const token = readStoredSessionToken();
      if (!token) {
        return;
      }

      try {
        const response = await fetchSession(token);
        if (active && response.data) {
          setSession(response.data);
          const split = splitName(response.data.user.name);
          setCustomer((current) => ({
            ...current,
            firstName: split.firstName || current.firstName,
            lastName: split.lastName || current.lastName,
            email: response.data?.user.email ?? current.email
          }));
          setAddress((current) => ({
            ...current,
            recipientName: response.data?.user.name ?? current.recipientName
          }));
        } else if (active) {
          clearStoredSessionToken();
        }
      } catch {
        // no-op: checkout can run without auth session
      }
    }

    async function loadCatalog() {
      try {
        const response = await fetchCatalogSummary();
        if (active) {
          setProducts(buildFallbackProducts(response.data.products));
        }
      } catch {
        if (active) {
          setProducts(featuredProducts);
        }
      }
    }

    void loadSession();
    void loadCatalog();

    const storedCart = readStoredCart();
    if (storedCart.length > 0) {
      setItems(storedCart);
    }

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    checkoutRequestIdRef.current = null;
  }, [
    activeItems,
    address.city,
    address.countryCode,
    address.label,
    address.line1,
    address.line2,
    address.postalCode,
    address.region,
    address.recipientName,
    customer.email,
    customer.firstName,
    customer.lastName,
    customer.phone,
    couponCode,
    manualEvidenceNotes,
    manualEvidenceReference,
    notes,
    paymentMethod,
    vendorCode
  ]);

  useEffect(() => {
    if (activeItems.length === 0) {
      setQuote(null);
      setQuoteError(null);
      setQuoteLoading(false);
      return;
    }

    let active = true;
    setQuoteLoading(true);

    async function loadQuote() {
      try {
        const response = await fetchCheckoutQuote({
          items: activeItems,
          paymentMethod,
          vendorCode: vendorCode.trim() || undefined,
          couponCode: couponCode.trim() || undefined
        });

        if (active) {
          setQuote(response.data);
          setQuoteError(null);
        }
      } catch (fetchError) {
        if (active) {
          setQuote(null);
          setQuoteError(fetchError instanceof Error ? fetchError.message : "No pudimos cotizar el checkout.");
        }
      } finally {
        if (active) {
          setQuoteLoading(false);
        }
      }
    }

    void loadQuote();

    return () => {
      active = false;
    };
  }, [activeItems, couponCode, paymentMethod, vendorCode]);

  const resolvedProducts = useMemo(() => {
    return products.length > 0 ? products : featuredProducts;
  }, [products]);

  const availableToAdd = useMemo(() => {
    return resolvedProducts.filter((product) => !activeItems.some((item) => item.slug === product.slug));
  }, [activeItems, resolvedProducts]);

  function updateItem(slug: string, quantity: number) {
    setItems((current) => {
      const next = current.map((item) => (item.slug === slug ? { ...item, quantity: Math.max(1, quantity) } : item));
      writeStoredCart(next);
      return next;
    });
  }

  function addItem(slug: string) {
    const next = addStoredCartItem({ slug, quantity: 1 });
    setItems(next);
  }

  function removeItem(slug: string) {
    setItems((current) => {
      const next = current.filter((item) => item.slug !== slug);
      writeStoredCart(next);
      return next;
    });
  }

  async function handleSubmit() {
    if (!quote) {
      setQuoteError("Primero genera una cotización válida.");
      return;
    }

    setSubmitting(true);
    setQuoteError(null);

    const clientRequestId = checkoutRequestIdRef.current ?? globalThis.crypto.randomUUID();
    checkoutRequestIdRef.current = clientRequestId;

    const request: CheckoutRequestInput = {
      items: activeItems,
      paymentMethod,
      vendorCode: vendorCode.trim() || undefined,
      couponCode: couponCode.trim() || undefined,
      notes,
      customer,
      address,
      clientRequestId,
      ...(paymentMethod === "manual"
        ? {
            manualEvidenceReference: manualEvidenceReference.trim() || undefined,
            manualEvidenceNotes: manualEvidenceNotes.trim() || undefined
          }
        : {})
    };

    try {
      const response =
        paymentMethod === "openpay" ? await createOpenpayCheckout(request) : await createManualCheckout(request);

      setResult(response);
      clearStoredCart();
      setItems([]);
      checkoutRequestIdRef.current = null;
    } catch (submitError) {
      setQuoteError(submitError instanceof Error ? submitError.message : "No pudimos crear el checkout.");
    } finally {
      setSubmitting(false);
    }
  }

  const summary = quote ?? {
    items: [],
    subtotal: 0,
    discount: 0,
    shipping: 0,
    grandTotal: 0,
    currencyCode: "MXN",
    paymentMethod,
    estimatedPoints: 0
  };

  return (
    <div className="space-y-10 py-6 md:space-y-14 md:py-10">
      <PublicPageHero
        eyebrow="Checkout"
        title="Compra clara, elegante y sin pasos que distraigan."
        description="La experiencia de cierre debe verse tan cuidada como la home: producto, datos, pago y confirmación en un flujo limpio."
        actions={[
          { label: "Ver catálogo", href: "/catalogo" },
          { label: "Mi cuenta", href: "/cuenta", variant: "secondary" }
        ]}
        metrics={[
          { label: "Métodos", value: "2", detail: "Openpay o comprobante manual con revisión." },
          { label: "Compra", value: session ? "Autocompleta" : "Invitado", detail: "Puedes comprar con o sin sesión activa." },
          { label: "Resumen", value: quote ? `$${quote.grandTotal}` : "En vivo", detail: "Los totales se recalculan durante tu compra." }
        ]}
        aside={<EditorialMedia src={brandArt.checkout} alt="Visual editorial del checkout" className="min-h-[440px]" />}
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <Card className="rounded-[2.3rem] border-black/8 bg-white/92">
            <CardHeader>
              <CardTitle>Productos seleccionados</CardTitle>
              <CardDescription>Agrega productos desde el catálogo o ajusta la cantidad aquí mismo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <select
                  className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none"
                  defaultValue={availableToAdd[0]?.slug ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value) {
                      addItem(value);
                      event.target.value = "";
                    }
                  }}
                >
                  <option value="">Agregar un producto</option>
                  {availableToAdd.map((product) => (
                    <option key={product.slug} value={product.slug}>
                      {product.name}
                    </option>
                  ))}
                </select>
                <Button type="button" variant="secondary" onClick={() => addItem(resolvedProducts[0].slug)}>
                  Agregar destacado
                </Button>
              </div>

              <div className="space-y-3">
                {activeItems.map((item) => {
                  const product = resolvedProducts.find((entry) => entry.slug === item.slug);
                  return (
                    <div key={item.slug} className="rounded-3xl border border-black/10 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[#1a3a2e]">{product?.name ?? item.slug}</p>
                          <p className="text-sm text-black/55">{product?.sku ?? "Referencia del producto"}</p>
                        </div>
                        <Badge tone="neutral">{product?.categorySlug ?? "productos"}</Badge>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(event) => updateItem(item.slug, Number(event.target.value))}
                        />
                        <div className="text-sm font-semibold text-[#1a3a2e]">
                          ${(product?.price ?? 0) * item.quantity}
                        </div>
                        <Button type="button" variant="secondary" onClick={() => removeItem(item.slug)}>
                          Quitar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.3rem] border-black/8 bg-[linear-gradient(180deg,#ffffff_0%,#faf8f3_100%)]">
            <CardHeader>
              <CardTitle>Datos del cliente y envío</CardTitle>
              <CardDescription>Completa los datos necesarios para entregar tu pedido correctamente.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <PublicField label="Nombre">
                <Input
                  value={customer.firstName}
                  onChange={(event) => setCustomer((current) => ({ ...current, firstName: event.target.value }))}
                  placeholder="Nombre"
                />
              </PublicField>
              <PublicField label="Apellido">
                <Input
                  value={customer.lastName}
                  onChange={(event) => setCustomer((current) => ({ ...current, lastName: event.target.value }))}
                  placeholder="Apellido"
                />
              </PublicField>
              <PublicField label="Correo electrónico">
                <Input
                  type="email"
                  value={customer.email}
                  onChange={(event) => setCustomer((current) => ({ ...current, email: event.target.value }))}
                  placeholder="Email"
                />
              </PublicField>
              <PublicField label="Teléfono">
                <Input
                  value={customer.phone}
                  onChange={(event) => setCustomer((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="Teléfono"
                />
              </PublicField>
              <PublicField label="Destinatario">
                <Input
                  value={address.recipientName}
                  onChange={(event) => setAddress((current) => ({ ...current, recipientName: event.target.value }))}
                  placeholder="Destinatario"
                />
              </PublicField>
              <PublicField label="Etiqueta">
                <Input
                  value={address.label}
                  onChange={(event) => setAddress((current) => ({ ...current, label: event.target.value }))}
                  placeholder="Casa, oficina, etc."
                />
              </PublicField>
              <PublicField label="Dirección principal" className="md:col-span-2">
                <Input
                  value={address.line1}
                  onChange={(event) => setAddress((current) => ({ ...current, line1: event.target.value }))}
                  placeholder="Dirección 1"
                />
              </PublicField>
              <PublicField label="Complemento" className="md:col-span-2">
                <Input
                  value={address.line2}
                  onChange={(event) => setAddress((current) => ({ ...current, line2: event.target.value }))}
                  placeholder="Dirección 2"
                />
              </PublicField>
              <PublicField label="Ciudad">
                <Input
                  value={address.city}
                  onChange={(event) => setAddress((current) => ({ ...current, city: event.target.value }))}
                  placeholder="Ciudad"
                />
              </PublicField>
              <PublicField label="Región o estado">
                <Input
                  value={address.region}
                  onChange={(event) => setAddress((current) => ({ ...current, region: event.target.value }))}
                  placeholder="Región"
                />
              </PublicField>
              <PublicField label="Código postal">
                <Input
                  value={address.postalCode}
                  onChange={(event) => setAddress((current) => ({ ...current, postalCode: event.target.value }))}
                  placeholder="Código postal"
                />
              </PublicField>
              <PublicField label="País">
                <Input
                  value={address.countryCode}
                  onChange={(event) => setAddress((current) => ({ ...current, countryCode: event.target.value }))}
                  placeholder="País"
                />
              </PublicField>
            </CardContent>
          </Card>

          <Card className="rounded-[2.3rem] border-black/8 bg-white/92">
            <CardHeader>
              <CardTitle>Pago y reglas comerciales</CardTitle>
              <CardDescription>Elige tu método de pago y agrega un código si cuentas con uno.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant={paymentMethod === "openpay" ? "primary" : "secondary"} onClick={() => setPaymentMethod("openpay")}>
                  Openpay
                </Button>
                <Button type="button" variant={paymentMethod === "manual" ? "primary" : "secondary"} onClick={() => setPaymentMethod("manual")}>
                  Pago manual
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <PublicField label="Código de vendedor o recomendación">
                  <Input value={vendorCode} onChange={(event) => setVendorCode(event.target.value)} placeholder="Opcional" />
                </PublicField>
                <PublicField label="Cupón de descuento">
                  <Input value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="Opcional" />
                </PublicField>
              </div>
              <PublicField label="Indicaciones del pedido">
                <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Opcional" />
              </PublicField>
              {paymentMethod === "manual" ? (
                <div className="space-y-4 rounded-3xl border border-black/10 bg-black/[0.02] p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[#1a3a2e]">Comprobante manual</p>
                    <p className="text-xs text-black/55">
                      Comparte una referencia clara para identificar tu pago y agilizar la validación.
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <PublicField label="Referencia del comprobante">
                      <Input
                        value={manualEvidenceReference}
                        onChange={(event) => setManualEvidenceReference(event.target.value)}
                        placeholder="Referencia o nombre del comprobante"
                      />
                    </PublicField>
                    <PublicField label="Notas del comprobante">
                      <Input
                        value={manualEvidenceNotes}
                        onChange={(event) => setManualEvidenceNotes(event.target.value)}
                        placeholder="Ejemplo: transferencia enviada desde banca móvil"
                      />
                    </PublicField>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={handleSubmit} disabled={submitting || activeItems.length === 0}>
                  {submitting ? "Procesando..." : paymentMethod === "openpay" ? "Pagar con Openpay" : "Enviar pago manual"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setItems([{ slug: resolvedProducts[0].slug, quantity: 1 }]);
                    writeStoredCart([{ slug: resolvedProducts[0].slug, quantity: 1 }]);
                    checkoutRequestIdRef.current = null;
                  }}
                >
                  Reiniciar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="sticky top-24 space-y-6">
            <Card className="rounded-[2.3rem] border-black/8 bg-[linear-gradient(180deg,#ffffff_0%,#faf8f3_100%)]">
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
                <CardDescription>{quoteLoading ? "Calculando totales..." : "Totales actualizados al momento de tu compra."}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <CheckoutSummary
                  subtotal={summary.subtotal}
                  discount={summary.discount}
                  shipping={summary.shipping}
                  total={summary.grandTotal}
                  vendorCode={summary.vendorCode}
                />
                <div className="flex flex-wrap gap-2">
                  <StatusBadge
                    tone={paymentMethod === "openpay" ? "info" : "warning"}
                    label={paymentMethod === "openpay" ? "Openpay" : "Manual"}
                  />
                  <Badge tone="neutral">{summary.estimatedPoints} puntos estimados</Badge>
                </div>
                {quoteError ? <p className="text-sm text-rose-700">{quoteError}</p> : null}
              </CardContent>
            </Card>

            <section className="space-y-4">
              <PublicSectionHeading
                eyebrow="Apoyo visual"
                title="Una compra bien presentada transmite confianza."
                description="El checkout no tiene que verse técnico; tiene que verse claro."
              />
              <EditorialMedia src={brandArt.office} alt="Apoyo visual del checkout" className="min-h-[220px]" />
            </section>

            {result ? (
              <Card className="rounded-[2.3rem] border-black/8 bg-white/92">
                <CardHeader>
                  <CardTitle>Confirmación</CardTitle>
                  <CardDescription>Resumen de tu compra y siguientes pasos.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-3xl bg-[#1a3a2e] px-5 py-4 text-white">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/45">Estado</p>
                    <p className="mt-2 text-xl font-semibold">{result.message}</p>
                    <p className="text-sm text-white/70">Referencia: {result.referenceId}</p>
                  </div>
                  {result.order ? (
                    <div className="space-y-2 rounded-3xl border border-black/10 p-4 text-sm text-[#1a3a2e]">
                      <p>
                        <strong>Pedido:</strong> {result.order.orderNumber}
                      </p>
                      <p>
                        <strong>Estado del pedido:</strong> {result.order.orderStatus}
                      </p>
                      <p>
                        <strong>Estado del pago:</strong> {result.order.paymentStatus}
                      </p>
                      <p>
                        <strong>Método:</strong> {result.order.paymentMethod === "manual" ? "Pago manual" : "Openpay"}
                      </p>
                      {result.order.manualRequestId ? (
                        <p>
                          <strong>Solicitud manual:</strong> {result.order.manualRequestId}
                        </p>
                      ) : null}
                      {result.order.manualEvidenceReference ? (
                        <p>
                          <strong>Comprobante:</strong> {result.order.manualEvidenceReference}
                        </p>
                      ) : null}
                      {result.order.manualEvidenceNotes ? (
                        <p>
                          <strong>Notas del comprobante:</strong> {result.order.manualEvidenceNotes}
                        </p>
                      ) : null}
                      {result.order.evidenceRequired ? (
                        <p>
                          <strong>Evidencia requerida:</strong> Sí
                        </p>
                      ) : null}
                      <p>
                        <strong>Siguiente paso:</strong> {result.order.nextStep}
                      </p>
                      {result.order.checkoutUrl ? (
                        <p className="break-all">
                          <strong>URL:</strong> {result.order.checkoutUrl}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            <Card className="rounded-[2.3rem] border-black/8 bg-white/92">
              <CardHeader>
                <CardTitle>Datos aplicados</CardTitle>
                <CardDescription>Si tienes sesión activa, tus datos pueden autocompletarse para una compra más rápida.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-black/65">
                <p>
                  <strong>Sesión:</strong> {session ? `${session.user.name} · ${session.user.email}` : "Compra como invitado"}
                </p>
                <p>
                  <strong>Código aplicado:</strong> {vendorCode || "Ninguno"}
                </p>
                <p>
                  <strong>Cupón:</strong> {couponCode || "Sin cupón"}
                </p>
                <Separator />
                <p>
                  Revisa bien tus datos antes de confirmar. Si eliges pago manual, usa una referencia clara para facilitar la validación.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
