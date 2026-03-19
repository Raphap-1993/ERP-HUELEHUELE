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
  SectionHeader,
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
  const [vendorCode, setVendorCode] = useState("VEND-014");
  const [couponCode, setCouponCode] = useState("RESET10");
  const [notes, setNotes] = useState("Cliente en ruta comercial activa.");
  const [manualEvidenceReference, setManualEvidenceReference] = useState("comprobante-hg-10041.jpg");
  const [manualEvidenceNotes, setManualEvidenceNotes] = useState("Comprobante adjunto desde checkout.");
  const [customer, setCustomer] = useState<CustomerForm>({
    firstName: "Laura",
    lastName: "Mendoza",
    email: "cliente@huelegood.com",
    phone: "+51 999 000 000"
  });
  const [address, setAddress] = useState<AddressForm>({
    label: "Casa",
    recipientName: "Laura Mendoza",
    line1: "Av. Principal 123",
    line2: "Piso 4",
    city: "Lima",
    region: "Lima",
    postalCode: "15001",
    countryCode: "PE"
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
    <div className="space-y-8 py-6 md:py-10">
      <SectionHeader
        title="Checkout"
        description="Cobro con Openpay o pago manual con revisión operativa y resumen de pedido."
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Productos seleccionados</CardTitle>
              <CardDescription>Agrega referencias desde el catálogo o ajusta cantidad aquí mismo.</CardDescription>
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
                          <p className="font-semibold text-[#132016]">{product?.name ?? item.slug}</p>
                          <p className="text-sm text-black/55">{product?.sku ?? "SKU pendiente"}</p>
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
                        <div className="text-sm font-semibold text-[#132016]">
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

          <Card>
            <CardHeader>
              <CardTitle>Datos del cliente y envío</CardTitle>
              <CardDescription>Información mínima para crear el pedido y su traza operativa.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Input
                value={customer.firstName}
                onChange={(event) => setCustomer((current) => ({ ...current, firstName: event.target.value }))}
                placeholder="Nombre"
              />
              <Input
                value={customer.lastName}
                onChange={(event) => setCustomer((current) => ({ ...current, lastName: event.target.value }))}
                placeholder="Apellido"
              />
              <Input
                type="email"
                value={customer.email}
                onChange={(event) => setCustomer((current) => ({ ...current, email: event.target.value }))}
                placeholder="Email"
              />
              <Input
                value={customer.phone}
                onChange={(event) => setCustomer((current) => ({ ...current, phone: event.target.value }))}
                placeholder="Teléfono"
              />
              <Input
                value={address.recipientName}
                onChange={(event) => setAddress((current) => ({ ...current, recipientName: event.target.value }))}
                placeholder="Destinatario"
              />
              <Input
                value={address.label}
                onChange={(event) => setAddress((current) => ({ ...current, label: event.target.value }))}
                placeholder="Etiqueta"
              />
              <Input
                className="md:col-span-2"
                value={address.line1}
                onChange={(event) => setAddress((current) => ({ ...current, line1: event.target.value }))}
                placeholder="Dirección 1"
              />
              <Input
                className="md:col-span-2"
                value={address.line2}
                onChange={(event) => setAddress((current) => ({ ...current, line2: event.target.value }))}
                placeholder="Dirección 2"
              />
              <Input
                value={address.city}
                onChange={(event) => setAddress((current) => ({ ...current, city: event.target.value }))}
                placeholder="Ciudad"
              />
              <Input
                value={address.region}
                onChange={(event) => setAddress((current) => ({ ...current, region: event.target.value }))}
                placeholder="Región"
              />
              <Input
                value={address.postalCode}
                onChange={(event) => setAddress((current) => ({ ...current, postalCode: event.target.value }))}
                placeholder="Código postal"
              />
              <Input
                value={address.countryCode}
                onChange={(event) => setAddress((current) => ({ ...current, countryCode: event.target.value }))}
                placeholder="País"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pago y reglas comerciales</CardTitle>
              <CardDescription>Define método, vendedor y cupón antes de enviar el checkout.</CardDescription>
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
                <Input value={vendorCode} onChange={(event) => setVendorCode(event.target.value)} placeholder="Código de vendedor" />
                <Input value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="Cupón" />
              </div>
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notas internas" />
              {paymentMethod === "manual" ? (
                <div className="space-y-4 rounded-3xl border border-black/10 bg-black/[0.02] p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[#132016]">Comprobante manual</p>
                    <p className="text-xs text-black/55">
                      Registra una referencia clara para que el backoffice pueda revisar el pago sin ambigüedad.
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      value={manualEvidenceReference}
                      onChange={(event) => setManualEvidenceReference(event.target.value)}
                      placeholder="comprobante-hg-10041.jpg"
                    />
                    <Input
                      value={manualEvidenceNotes}
                      onChange={(event) => setManualEvidenceNotes(event.target.value)}
                      placeholder="Transferencia enviada desde banco móvil"
                    />
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={handleSubmit} disabled={submitting || activeItems.length === 0}>
                  {submitting ? "Procesando..." : paymentMethod === "openpay" ? "Crear checkout Openpay" : "Crear pago manual"}
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
            <Card>
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
                <CardDescription>{quoteLoading ? "Calculando totales..." : "Totales calculados por el API de checkout."}</CardDescription>
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

            {result ? (
              <Card>
                <CardHeader>
                  <CardTitle>Resultado</CardTitle>
                  <CardDescription>Respuesta consolidada del flujo de checkout.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-3xl bg-[#132016] px-5 py-4 text-white">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/45">Estado</p>
                    <p className="mt-2 text-xl font-semibold">{result.message}</p>
                    <p className="text-sm text-white/70">Referencia: {result.referenceId}</p>
                  </div>
                  {result.order ? (
                    <div className="space-y-2 rounded-3xl border border-black/10 p-4 text-sm text-[#132016]">
                      <p>
                        <strong>Pedido:</strong> {result.order.orderNumber}
                      </p>
                      <p>
                        <strong>Order status:</strong> {result.order.orderStatus}
                      </p>
                      <p>
                        <strong>Payment status:</strong> {result.order.paymentStatus}
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

            <Card>
              <CardHeader>
                <CardTitle>Session y trazabilidad</CardTitle>
                <CardDescription>El checkout puede usar la sesión auth para autocompletar cliente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-black/65">
                <p>
                  <strong>Sesión:</strong> {session ? `${session.user.name} · ${session.user.email}` : "Sin sesión"}
                </p>
                <p>
                  <strong>Vendedor:</strong> {vendorCode || "Sin código"}
                </p>
                <p>
                  <strong>Cupón:</strong> {couponCode || "Sin cupón"}
                </p>
                <Separator />
                <p>
                  El bloque ya conversa con el API para cotización y creación de checkout. Openpay y pago manual quedan
                  separados en el backend.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
