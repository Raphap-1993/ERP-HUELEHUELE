"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  type AuthSessionSummary,
  type CheckoutItemInput,
  type CheckoutQuoteSummary,
  type CheckoutRequestInput,
  type CatalogProduct,
  type SiteSetting
} from "@huelegood/shared";
import {
  createManualCheckout,
  createOpenpayCheckout,
  fetchCatalogSummary,
  fetchCmsSiteSettings,
  fetchCheckoutQuote,
  fetchSession
} from "../lib/api";
import { YapePaymentModal } from "./yape-payment-modal";
import {
  cloudflareImageLoader,
  isRemoteStorefrontMediaUrl,
  resolveStorefrontMediaSrc,
  storefrontProductArtBySlug
} from "../features/storefront-v2/lib/media";
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

function resolveCheckoutProductImage(product?: CatalogProduct) {
  const fallback = storefrontProductArtBySlug[product?.slug ?? "clasico-verde"] ?? storefrontProductArtBySlug["clasico-verde"];
  const src = resolveStorefrontMediaSrc(product?.imageUrl ?? fallback);

  return {
    src,
    remote: isRemoteStorefrontMediaUrl(src),
    alt: product?.imageAlt ?? product?.name ?? "Producto Huele Huele"
  };
}

export function CheckoutWorkspace() {
  const searchParams = useSearchParams();
  const checkoutRequestIdRef = useRef<string | null>(null);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [items, setItems] = useState<CheckoutItemInput[]>([]);
  const [session, setSession] = useState<AuthSessionSummary | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSetting | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("manual");
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
  const [showYapeModal, setShowYapeModal] = useState(false);
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

  const firstCatalogSlug = products[0]?.slug ?? searchParams.get("producto") ?? "";

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
          setProducts(response.data.products ?? []);
        }
      } catch {
        if (active) {
          setProducts([]);
        }
      }
    }

    async function loadSiteSettings() {
      try {
        const response = await fetchCmsSiteSettings();
        if (active) {
          setSiteSettings(response.data ?? null);
        }
      } catch {
        if (active) {
          setSiteSettings(null);
        }
      }
    }

    void loadSession();
    void loadCatalog();
    void loadSiteSettings();

    const storedCart = readStoredCart();
    if (storedCart.length > 0) {
      setItems(storedCart);
    }

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (items.length > 0) {
      return;
    }

    if (products.length === 0) {
      return;
    }

    const preferredSlug = searchParams.get("producto");
    const preferredVariantId = searchParams.get("variantId") ?? searchParams.get("variante");
    const fallbackSlug = preferredSlug && products.some((product) => product.slug === preferredSlug) ? preferredSlug : firstCatalogSlug;

    if (fallbackSlug) {
      setItems([
        {
          slug: fallbackSlug,
          quantity: 1,
          variantId: preferredVariantId?.trim() || undefined
        }
      ]);
    }
  }, [firstCatalogSlug, items.length, products, searchParams]);

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
    return products;
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

  async function handleSubmit(evidenceImageUrl?: string) {
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
      evidenceImageUrl
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
    currencyCode: "PEN",
    paymentMethod,
    estimatedPoints: 0
  };

  const shippingNote = useMemo(() => {
    if (!siteSettings) {
      return "El costo de envío se calcula según el total de tu pedido.";
    }

    const threshold = Number.isFinite(siteSettings.freeShippingThreshold) ? siteSettings.freeShippingThreshold : 0;
    const flatRate = Number.isFinite(siteSettings.shippingFlatRate) ? siteSettings.shippingFlatRate : 0;

    if (threshold > 0 && flatRate > 0) {
      if (summary.shipping <= 0) {
        return `Tu pedido ya califica para envío gratis desde S/ ${threshold.toFixed(2)}.`;
      }

      return `Envío gratis desde S/ ${threshold.toFixed(2)}. Tarifa base S/ ${flatRate.toFixed(2)}.`;
    }

    if (threshold > 0) {
      return `Envío gratis desde S/ ${threshold.toFixed(2)}.`;
    }

    if (flatRate > 0) {
      return `Tarifa base de envío: S/ ${flatRate.toFixed(2)}.`;
    }

    return "El costo de envío se calcula según el total de tu pedido.";
  }, [siteSettings, summary.shipping]);

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-12">
      {result ? (
        /* ── Pantalla de éxito ── */
        <div className="flex flex-col items-center py-16 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#d8f3dc] text-4xl">🎉</div>
          <h2 className="font-serif text-3xl font-bold text-[#1a3a2e]">¡Pedido confirmado!</h2>
          <p className="mt-3 max-w-md text-sm leading-7 text-[#6b7280]">
            Gracias por tu compra. Te enviaremos la confirmación y coordinaremos la entrega contigo.
          </p>
          {result.order ? (
            <div className="mt-6 rounded-[14px] bg-[#d8f3dc] px-8 py-4 font-serif text-2xl font-black text-[#1a3a2e]">
              #{result.order.orderNumber}
            </div>
          ) : null}
          <div className="mt-8 w-full max-w-sm space-y-2 rounded-[16px] border border-[rgba(26,58,46,0.1)] bg-white p-5 text-left text-sm text-[#6b7280]">
            {result.order ? (
              <>
                <p><strong className="text-[#1a3a2e]">Estado:</strong> {result.order.orderStatus}</p>
                <p><strong className="text-[#1a3a2e]">Pago:</strong> {result.order.paymentStatus}</p>
                <p><strong className="text-[#1a3a2e]">Método:</strong> {result.order.paymentMethod === "manual" ? "Pago manual" : "Openpay"}</p>
                {result.order.manualEvidenceReference ? <p><strong className="text-[#1a3a2e]">Comprobante:</strong> {result.order.manualEvidenceReference}</p> : null}
                <p><strong className="text-[#1a3a2e]">Siguiente paso:</strong> {result.order.nextStep}</p>
                {result.order.checkoutUrl ? <p className="break-all"><strong className="text-[#1a3a2e]">URL Pago:</strong> {result.order.checkoutUrl}</p> : null}
              </>
            ) : (
              <p>{result.message}</p>
            )}
          </div>
          <div className="mt-8">
            <a href="/catalogo" className="rounded-full bg-[#2d6a4f] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1a3a2e]">
              Seguir comprando
            </a>
          </div>
        </div>
      ) : (
        <>
          {/* Steps bar */}
          <div className="mb-10 flex flex-wrap items-center gap-0">
            <div className="flex items-center gap-2.5 text-[13px] font-medium text-[#52b788]">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#52b788] text-[11px] font-bold text-white">✓</div>
              <span>Carrito</span>
            </div>
            <div className="mx-2 h-px w-10 bg-[#52b788]" />
            <div className="flex items-center gap-2.5 text-[13px] font-semibold text-[#1a3a2e]">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#2d6a4f] text-[11px] font-bold text-white">2</div>
              <span>Datos y envío</span>
            </div>
            <div className="mx-2 h-px w-10 bg-[rgba(26,58,46,0.15)]" />
            <div className="flex items-center gap-2.5 text-[13px] font-medium text-[#6b7280]">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 border-[rgba(26,58,46,0.2)] text-[11px] font-bold text-[#6b7280]">3</div>
              <span>Pago</span>
            </div>
            <div className="mx-2 h-px w-10 bg-[rgba(26,58,46,0.15)]" />
            <div className="flex items-center gap-2.5 text-[13px] font-medium text-[#6b7280]">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 border-[rgba(26,58,46,0.2)] text-[11px] font-bold text-[#6b7280]">4</div>
              <span>Confirmación</span>
            </div>
          </div>

          {/* Main grid */}
          <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">

            {/* LEFT: Forms */}
            <div className="space-y-5">

              {/* Productos */}
              <div className="rounded-[22px] border border-[rgba(26,58,46,0.1)] bg-white p-8">
                <h3 className="mb-1 font-serif text-xl font-bold text-[#1a3a2e]">Productos en tu pedido</h3>
                <p className="mb-6 text-sm leading-relaxed text-[#6b7280]">Ajusta cantidades o agrega un producto desde el catálogo.</p>
                <div className="mb-4">
                  <div className="relative">
                    <select
                      className="w-full cursor-pointer appearance-none rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f4f4f0] px-4 py-3 text-sm text-[#1c1c1c] outline-none transition focus:border-[#52b788] focus:bg-white"
                      defaultValue=""
                      onChange={(event) => {
                        const value = event.target.value;
                        if (value) { addItem(value); event.target.value = ""; }
                      }}
                    >
                      <option value="">Agregar un producto</option>
                      {availableToAdd.map((product) => (
                        <option key={product.slug} value={product.slug}>{product.name}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6b7280]">▾</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {activeItems.length === 0 ? (
                    <p className="text-sm text-[#6b7280]">No hay productos. Agrega uno arriba.</p>
                  ) : activeItems.map((item) => {
                    const product = resolvedProducts.find((p) => p.slug === item.slug);
                    const image = resolveCheckoutProductImage(product);
                    return (
                      <div key={item.slug} className="flex items-center gap-4 rounded-[13px] border border-[rgba(26,58,46,0.08)] bg-[#f4f4f0] p-4">
                        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-[10px] bg-[#d8f3dc]">
                          {image.src ? (
                            <Image
                              fill
                              src={image.src}
                              loader={image.remote ? cloudflareImageLoader : undefined}
                              alt={image.alt}
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xl">
                              {item.slug.includes("negro") ? "🖤" : (item.slug.includes("combo") || item.slug.includes("pack")) ? "✨" : "🌿"}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-[#1a3a2e]">{product?.name ?? item.slug}</p>
                          <p className="text-[11px] text-[#6b7280]">{product?.sku ?? ""}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateItem(item.slug, Number(e.target.value))}
                            className="w-14 rounded-[8px] border border-[rgba(26,58,46,0.12)] bg-white px-2 py-1.5 text-center text-sm outline-none"
                          />
                          <span className="font-serif text-[15px] font-bold text-[#1a3a2e]">
                            S/ {((product?.price ?? 0) * item.quantity).toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItem(item.slug)}
                            className="ml-1 rounded-[7px] px-2 py-1.5 text-xs text-[#6b7280] transition hover:bg-rose-50 hover:text-rose-600"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Datos de contacto */}
              <div className="rounded-[22px] border border-[rgba(26,58,46,0.1)] bg-white p-8">
                <h3 className="mb-1 font-serif text-xl font-bold text-[#1a3a2e]">Datos de contacto</h3>
                <p className="mb-6 text-sm leading-relaxed text-[#6b7280]">
                  {session ? `Sesión activa: ${session.user.name}` : "Puedes comprar sin cuenta o iniciar sesión para autocompletar."}
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">Nombre *</label>
                    <input className="w-full rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f4f4f0] px-4 py-3 text-sm text-[#1c1c1c] placeholder:text-[#b0bbb5] outline-none transition focus:border-[#52b788] focus:bg-white" type="text" placeholder="Tu nombre" value={customer.firstName} onChange={(e) => setCustomer((c) => ({ ...c, firstName: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">Apellido *</label>
                    <input className="w-full rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f4f4f0] px-4 py-3 text-sm text-[#1c1c1c] placeholder:text-[#b0bbb5] outline-none transition focus:border-[#52b788] focus:bg-white" type="text" placeholder="Tu apellido" value={customer.lastName} onChange={(e) => setCustomer((c) => ({ ...c, lastName: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">Email *</label>
                    <input className="w-full rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f4f4f0] px-4 py-3 text-sm text-[#1c1c1c] placeholder:text-[#b0bbb5] outline-none transition focus:border-[#52b788] focus:bg-white" type="email" placeholder="tu@correo.com" value={customer.email} onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">WhatsApp *</label>
                    <input className="w-full rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f4f4f0] px-4 py-3 text-sm text-[#1c1c1c] placeholder:text-[#b0bbb5] outline-none transition focus:border-[#52b788] focus:bg-white" type="tel" placeholder="+51 999 000 000" value={customer.phone} onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))} />
                  </div>
                </div>
              </div>

              {/* Dirección */}
              <div className="rounded-[22px] border border-[rgba(26,58,46,0.1)] bg-white p-8">
                <h3 className="mb-1 font-serif text-xl font-bold text-[#1a3a2e]">Dirección de envío</h3>
                <p className="mb-6 text-sm leading-relaxed text-[#6b7280]">Enviamos a todo el Perú con Olva Courier y Shalom.</p>
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">Destinatario</label>
                      <input className="w-full rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f4f4f0] px-4 py-3 text-sm text-[#1c1c1c] placeholder:text-[#b0bbb5] outline-none transition focus:border-[#52b788] focus:bg-white" type="text" placeholder="Nombre destinatario" value={address.recipientName} onChange={(e) => setAddress((a) => ({ ...a, recipientName: e.target.value }))} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">Etiqueta</label>
                      <input className="w-full rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f4f4f0] px-4 py-3 text-sm text-[#1c1c1c] placeholder:text-[#b0bbb5] outline-none transition focus:border-[#52b788] focus:bg-white" type="text" placeholder="Casa, oficina..." value={address.label} onChange={(e) => setAddress((a) => ({ ...a, label: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">Dirección principal *</label>
                    <input className="w-full rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f4f4f0] px-4 py-3 text-sm text-[#1c1c1c] placeholder:text-[#b0bbb5] outline-none transition focus:border-[#52b788] focus:bg-white" type="text" placeholder="Calle, número, referencia" value={address.line1} onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">Complemento</label>
                    <input className="w-full rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f4f4f0] px-4 py-3 text-sm text-[#1c1c1c] placeholder:text-[#b0bbb5] outline-none transition focus:border-[#52b788] focus:bg-white" type="text" placeholder="Referencia adicional" value={address.line2} onChange={(e) => setAddress((a) => ({ ...a, line2: e.target.value }))} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">Ciudad *</label>
                      <input className="w-full rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f4f4f0] px-4 py-3 text-sm text-[#1c1c1c] placeholder:text-[#b0bbb5] outline-none transition focus:border-[#52b788] focus:bg-white" type="text" placeholder="Ciudad" value={address.city} onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">Región *</label>
                      <input className="w-full rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f4f4f0] px-4 py-3 text-sm text-[#1c1c1c] placeholder:text-[#b0bbb5] outline-none transition focus:border-[#52b788] focus:bg-white" type="text" placeholder="Región" value={address.region} onChange={(e) => setAddress((a) => ({ ...a, region: e.target.value }))} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">País *</label>
                      <input className="w-full rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f4f4f0] px-4 py-3 text-sm text-[#1c1c1c] placeholder:text-[#b0bbb5] outline-none transition focus:border-[#52b788] focus:bg-white" type="text" placeholder="PE" value={address.countryCode} onChange={(e) => setAddress((a) => ({ ...a, countryCode: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">Código postal</label>
                    <input className="w-full rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f4f4f0] px-4 py-3 text-sm text-[#1c1c1c] placeholder:text-[#b0bbb5] outline-none transition focus:border-[#52b788] focus:bg-white" type="text" placeholder="Código postal" value={address.postalCode} onChange={(e) => setAddress((a) => ({ ...a, postalCode: e.target.value }))} />
                  </div>
                </div>
              </div>

              {/* Método de pago */}
              <div className="rounded-[22px] border border-[rgba(26,58,46,0.1)] bg-white p-8">
                <h3 className="mb-1 font-serif text-xl font-bold text-[#1a3a2e]">Método de pago</h3>
                <p className="mb-6 text-sm leading-relaxed text-[#6b7280]">Todos los pagos son 100% seguros.</p>
                <div className="rounded-[14px] bg-[#d8f3dc] p-5">
                  <p className="mb-1.5 text-[13px] font-semibold text-[#1a3a2e]">📱 Pago con Yape</p>
                  <p className="text-[12px] leading-relaxed text-[#2d6a4f]">Al confirmar tu pedido, te mostraremos el número Yape para realizar el pago y podrás subir tu comprobante.</p>
                </div>
              </div>

              {/* Cupón y código */}
              <div className="rounded-[22px] border border-[rgba(26,58,46,0.1)] bg-white p-8">
                <h3 className="mb-1 font-serif text-xl font-bold text-[#1a3a2e]">Códigos de descuento</h3>
                <p className="mb-6 text-sm leading-relaxed text-[#6b7280]">Aplica un cupón promocional o el código de tu vendedor.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">Cupón de descuento</label>
                    <input className="w-full rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f4f4f0] px-4 py-3 text-sm text-[#1c1c1c] placeholder:text-[#b0bbb5] outline-none transition focus:border-[#52b788] focus:bg-white" type="text" placeholder="Ej: ROSA5, CUPON10" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">Código de vendedor</label>
                    <input className="w-full rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f4f4f0] px-4 py-3 text-sm text-[#1c1c1c] placeholder:text-[#b0bbb5] outline-none transition focus:border-[#52b788] focus:bg-white" type="text" placeholder="Opcional" value={vendorCode} onChange={(e) => setVendorCode(e.target.value)} />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">Indicaciones del pedido</label>
                  <textarea className="w-full resize-none rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f4f4f0] px-4 py-3 text-sm text-[#1c1c1c] placeholder:text-[#b0bbb5] outline-none transition focus:border-[#52b788] focus:bg-white" rows={3} placeholder="Indicaciones opcionales para tu pedido" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>
            </div>

            {/* RIGHT: Order Summary */}
            <div className="sticky top-[84px]">
              <div className="rounded-[22px] border border-[rgba(26,58,46,0.1)] bg-white p-7">
                <h3 className="mb-5 font-serif text-[18px] font-bold text-[#1a3a2e]">Tu pedido</h3>
                <div className="mb-5 space-y-3.5">
                  {activeItems.length === 0 ? (
                    <p className="text-sm text-[#6b7280]">Sin productos seleccionados.</p>
                  ) : activeItems.map((item) => {
                    const product = resolvedProducts.find((p) => p.slug === item.slug);
                    const image = resolveCheckoutProductImage(product);
                    return (
                      <div key={item.slug} className="flex items-center gap-3.5">
                        <div className="relative h-[52px] w-[52px] flex-shrink-0 overflow-hidden rounded-[12px] bg-[#f4f4f0]">
                          {image.src ? (
                            <Image
                              fill
                              src={image.src}
                              loader={image.remote ? cloudflareImageLoader : undefined}
                              alt={image.alt}
                              sizes="52px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-2xl">
                              {item.slug.includes("negro") ? "🖤" : (item.slug.includes("combo") || item.slug.includes("pack")) ? "✨" : "🌿"}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-[#1a3a2e]">{product?.name ?? item.slug}</p>
                          <p className="text-[12px] text-[#6b7280]">x {item.quantity}</p>
                        </div>
                        <div className="font-serif text-[15px] font-bold text-[#1a3a2e]">
                          S/ {((product?.price ?? 0) * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="h-px bg-[rgba(26,58,46,0.08)]" />
                <div className="my-4 space-y-2.5">
                  <div className="flex justify-between text-[13px] text-[#6b7280]">
                    <span>Subtotal</span>
                    <strong className="text-[#1c1c1c]">S/ {summary.subtotal.toFixed(2)}</strong>
                  </div>
                  {summary.discount > 0 ? (
                    <div className="flex justify-between text-[13px] text-[#52b788]">
                      <span>Descuento</span>
                      <strong>− S/ {summary.discount.toFixed(2)}</strong>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-[13px] text-[#6b7280]">
                    <span>Envío</span>
                    <strong className="text-[#1c1c1c]">S/ {summary.shipping.toFixed(2)}</strong>
                  </div>
                  <p className="text-[11px] leading-5 text-[#8b8b8b]">{shippingNote}</p>
                </div>
                <div className="h-px bg-[rgba(26,58,46,0.08)]" />
                <div className="mt-4 flex justify-between font-bold text-[#1a3a2e]">
                  <span className="text-[16px]">Total</span>
                  <span className="font-serif text-[22px] font-black">S/ {summary.grandTotal.toFixed(2)}</span>
                </div>
                {quoteLoading ? <p className="mt-2 text-[11px] text-[#6b7280]">Calculando totales...</p> : null}
                {quoteError ? <p className="mt-2 text-[11px] text-rose-600">{quoteError}</p> : null}
                <button
                  type="button"
                  onClick={() => setShowYapeModal(true)}
                  disabled={submitting || activeItems.length === 0}
                  className="mt-5 w-full rounded-[13px] bg-[#2d6a4f] py-4 text-[15px] font-bold text-white shadow-[0_8px_24px_rgba(45,106,79,0.3)] transition hover:-translate-y-0.5 hover:bg-[#1a3a2e] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Procesando..." : "Pagar con Yape →"}
                </button>
                <div className="mt-4 flex justify-center gap-5">
                  {[{ icon: "🔒", label: "Pago seguro" }, { icon: "📍", label: "Envío rastreado" }, { icon: "🌿", label: "100% natural" }].map((badge) => (
                    <div key={badge.label} className="flex items-center gap-1.5 text-[11px] text-[#6b7280]">
                      <span>{badge.icon}</span>{badge.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </>
      )}

      <YapePaymentModal
        open={showYapeModal}
        yapeNumber={siteSettings?.yapeNumber ?? ""}
        total={`S/ ${summary.grandTotal.toFixed(2)}`}
        onConfirm={(evidenceImageUrl) => {
          setShowYapeModal(false);
          void handleSubmit(evidenceImageUrl);
        }}
        onClose={() => setShowYapeModal(false)}
      />
    </div>
  );
}
