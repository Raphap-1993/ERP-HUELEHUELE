"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  CHECKOUT_DOCUMENT_TYPE_OPTIONS,
  type AuthSessionSummary,
  type CheckoutItemInput,
  type CheckoutDocumentType,
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
  fullName: string;
  email: string;
  phone: string;
  documentType: CheckoutDocumentType | "";
  documentNumber: string;
}

interface AddressForm {
  line1: string;
  district: string;
  agencyName: string;
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" ")
  };
}

function normalizeDocumentNumber(value: string, documentType?: CheckoutDocumentType | "") {
  const raw = value.trim().toUpperCase();

  if (documentType === "dni" || documentType === "ruc") {
    return raw.replace(/\D/g, "");
  }

  return raw.replace(/[^0-9A-Z-]/g, "");
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
  const [notes, setNotes] = useState("");
  const [customer, setCustomer] = useState<CustomerForm>({
    fullName: "",
    email: "",
    phone: "",
    documentType: "",
    documentNumber: ""
  });
  const [address, setAddress] = useState<AddressForm>({
    line1: "",
    district: "",
    agencyName: ""
  });
  const [provinceShalomPickup, setProvinceShalomPickup] = useState(false);
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
          setCustomer((current) => ({
            ...current,
            fullName: response.data?.user.name || current.fullName,
            email: response.data?.user.email ?? current.email
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
    address.line1,
    address.district,
    address.agencyName,
    customer.fullName,
    customer.email,
    customer.phone,
    customer.documentType,
    customer.documentNumber,
    notes,
    paymentMethod,
    provinceShalomPickup
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
          shipping: provinceShalomPickup
            ? {
                deliveryMode: "province_shalom_pickup",
                carrier: "shalom",
                agencyName: address.agencyName.trim() || undefined,
                payOnPickup: true
              }
            : {
                deliveryMode: "standard"
              }
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
  }, [activeItems, address.agencyName, paymentMethod, provinceShalomPickup]);

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

    const validationError = validateCheckoutForm();
    if (validationError) {
      setQuoteError(validationError);
      return;
    }

    setSubmitting(true);
    setQuoteError(null);

    const clientRequestId = checkoutRequestIdRef.current ?? globalThis.crypto.randomUUID();
    checkoutRequestIdRef.current = clientRequestId;

    const nameParts = splitName(customer.fullName);
    const request: CheckoutRequestInput = {
      items: activeItems,
      paymentMethod,
      notes,
      customer: {
        firstName: nameParts.firstName,
        lastName: nameParts.lastName || nameParts.firstName,
        email: customer.email.trim(),
        phone: customer.phone.trim(),
        documentType: provinceShalomPickup && customer.documentType ? customer.documentType : undefined,
        documentNumber:
          provinceShalomPickup && customer.documentType
            ? normalizeDocumentNumber(customer.documentNumber, customer.documentType)
            : undefined
      },
      address: {
        recipientName: customer.fullName.trim(),
        line1: address.line1.trim(),
        city: address.district.trim(),
        region: address.district.trim(),
        postalCode: "",
        countryCode: "PE",
        deliveryMode: provinceShalomPickup ? "province_shalom_pickup" : "standard",
        carrier: provinceShalomPickup ? "shalom" : undefined,
        agencyName: provinceShalomPickup ? address.agencyName.trim() : undefined,
        payOnPickup: provinceShalomPickup ? true : undefined
      },
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

  const selectedDocumentType = useMemo(
    () => CHECKOUT_DOCUMENT_TYPE_OPTIONS.find((option) => option.value === customer.documentType),
    [customer.documentType]
  );

  function validateCheckoutForm() {
    if (activeItems.length === 0) {
      return "Agrega al menos un producto para continuar.";
    }

    if (!customer.fullName.trim()) {
      return "Ingresa tu nombre completo.";
    }

    if (!customer.phone.trim()) {
      return "Ingresa tu WhatsApp.";
    }

    if (!address.line1.trim()) {
      return provinceShalomPickup ? "Ingresa una dirección o referencia del cliente." : "Ingresa la dirección de entrega.";
    }

    if (!address.district.trim()) {
      return provinceShalomPickup ? "Ingresa tu ciudad o provincia." : "Ingresa tu distrito o ciudad.";
    }

    if (provinceShalomPickup) {
      if (!customer.documentType) {
        return "Selecciona el tipo de documento.";
      }

      const normalizedDocumentNumber = normalizeDocumentNumber(customer.documentNumber, customer.documentType);

      if (customer.documentType === "dni" && normalizedDocumentNumber.length !== 8) {
        return "Ingresa un DNI válido de 8 dígitos.";
      }

      if (customer.documentType === "ruc" && normalizedDocumentNumber.length !== 11) {
        return "Ingresa un RUC válido de 11 dígitos.";
      }

      if ((customer.documentType === "ce" || customer.documentType === "passport") && normalizedDocumentNumber.length < 6) {
        return "Ingresa un número de documento válido.";
      }

      if (customer.documentType === "other_sunat" && normalizedDocumentNumber.length < 3) {
        return "Ingresa un número de documento válido.";
      }

      if (!address.agencyName.trim()) {
        return "Indica la sucursal de Shalom más cercana.";
      }
    }

    return null;
  }

  const shippingNote = useMemo(() => {
    if (provinceShalomPickup) {
      return "Envío exclusivo por Shalom. No pagas el flete ahora; lo cancelas al momento de recoger con tu documento.";
    }

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
  }, [provinceShalomPickup, siteSettings, summary.shipping]);

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-12">
      {result ? (
        /* ── Pantalla de éxito ── */
        <div className="flex flex-col items-center py-16 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#d8f3dc] text-4xl">
            {result.order?.orderStatus === "payment_under_review" ? "📋" : "🎉"}
          </div>

          <h2 className="font-serif text-3xl font-bold text-[#1a3a2e]">
            {result.order?.orderStatus === "payment_under_review"
              ? "¡Comprobante recibido!"
              : "¡Pedido confirmado!"}
          </h2>

          {result.order ? (
            <div className="mt-4 rounded-[14px] bg-[#d8f3dc] px-8 py-3 font-mono text-lg font-black tracking-wide text-[#1a3a2e]">
              #{result.order.orderNumber}
            </div>
          ) : null}

          <p className="mt-5 max-w-sm text-[15px] leading-7 text-[#4b5563]">
            {result.order?.orderStatus === "payment_under_review"
              ? provinceShalomPickup
                ? "Revisaremos tu comprobante y coordinaremos el envío por Shalom a la sucursal indicada. El flete lo pagas al recoger con tu documento."
                : "Revisaremos tu comprobante y nos pondremos en contacto contigo para confirmar y coordinar la entrega."
              : provinceShalomPickup
                ? "Gracias por tu compra. Coordinaremos el envío por Shalom a la sucursal indicada y el flete lo pagarás al recoger."
                : "Gracias por tu compra. Te confirmaremos los detalles y coordinaremos la entrega contigo."}
          </p>

          {/* WhatsApp CTA si hay número configurado */}
          {siteSettings?.whatsapp ? (
            <a
              href={`https://wa.me/${siteSettings.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, acabo de hacer un pedido ${result.order?.orderNumber ? `#${result.order.orderNumber}` : ""} y quiero hacer seguimiento.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 flex items-center gap-2 rounded-full bg-[#25d366] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1da851]"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Contactar por WhatsApp
            </a>
          ) : null}

          <div className={siteSettings?.whatsapp ? "mt-4" : "mt-7"}>
            <a href="/catalogo" className="text-sm font-medium text-[#2d6a4f] underline underline-offset-4 hover:text-[#1a3a2e]">
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

              {/* Datos de contacto y envío */}
              <div className="rounded-[22px] border border-[rgba(26,58,46,0.1)] bg-white p-8">
                <h3 className="mb-1 font-serif text-xl font-bold text-[#1a3a2e]">Tus datos</h3>
                <p className="mb-6 text-sm leading-relaxed text-[#6b7280]">
                  {provinceShalomPickup
                    ? "Envío a provincia únicamente por Shalom. El costo del envío se paga al momento de recoger."
                    : "Enviamos a todo el Perú con Olva Courier y Shalom."}
                </p>
                <div className="space-y-4">
                  <label className="flex items-start gap-3 rounded-[14px] border border-[rgba(26,58,46,0.1)] bg-[#f8faf8] px-4 py-3">
                    <input
                      type="checkbox"
                      checked={provinceShalomPickup}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setProvinceShalomPickup(checked);
                        if (!checked) {
                          setCustomer((current) => ({ ...current, documentType: "", documentNumber: "" }));
                          setAddress((current) => ({ ...current, agencyName: "" }));
                        }
                      }}
                      className="mt-1 h-4 w-4 rounded border-[rgba(26,58,46,0.2)] text-[#2d6a4f] focus:ring-[#52b788]"
                    />
                    <span className="block text-sm leading-6 text-[#355149]">
                      <strong className="font-semibold text-[#1a3a2e]">Envío a provincia por agencia Shalom</strong>
                      <span className="mt-1 block text-[13px] text-[#5b6f67]">
                        Si recoges en provincia, necesitaremos tu tipo y número de documento, además de la sucursal Shalom más cercana. El flete se paga al recoger.
                      </span>
                    </span>
                  </label>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">Nombre completo *</label>
                    <input className="w-full rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f4f4f0] px-4 py-3 text-sm text-[#1c1c1c] placeholder:text-[#b0bbb5] outline-none transition focus:border-[#52b788] focus:bg-white" type="text" placeholder="Tu nombre y apellido" value={customer.fullName} onChange={(e) => setCustomer((c) => ({ ...c, fullName: e.target.value }))} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">WhatsApp *</label>
                      <input className="w-full rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f4f4f0] px-4 py-3 text-sm text-[#1c1c1c] placeholder:text-[#b0bbb5] outline-none transition focus:border-[#52b788] focus:bg-white" type="tel" placeholder="+51 999 000 000" value={customer.phone} onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">Email</label>
                      <input className="w-full rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f4f4f0] px-4 py-3 text-sm text-[#1c1c1c] placeholder:text-[#b0bbb5] outline-none transition focus:border-[#52b788] focus:bg-white" type="email" placeholder="tu@correo.com" value={customer.email} onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))} />
                    </div>
                  </div>
                  {provinceShalomPickup ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">Tipo de documento *</label>
                        <div className="relative">
                          <select
                            className="w-full cursor-pointer appearance-none rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f4f4f0] px-4 py-3 pr-10 text-sm text-[#1c1c1c] outline-none transition focus:border-[#52b788] focus:bg-white"
                            value={customer.documentType}
                            onChange={(e) =>
                              setCustomer((c) => ({
                                ...c,
                                documentType: e.target.value as CheckoutDocumentType | "",
                                documentNumber: ""
                              }))
                            }
                          >
                            <option value="">Selecciona tu documento</option>
                            {CHECKOUT_DOCUMENT_TYPE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6b7280]">▾</span>
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">Número de documento *</label>
                        <input
                          className="w-full rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f4f4f0] px-4 py-3 text-sm text-[#1c1c1c] placeholder:text-[#b0bbb5] outline-none transition focus:border-[#52b788] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                          type="text"
                          inputMode={selectedDocumentType?.inputMode ?? "text"}
                          maxLength={customer.documentType === "dni" ? 8 : customer.documentType === "ruc" ? 11 : 20}
                          placeholder={selectedDocumentType?.placeholder ?? "Selecciona primero el tipo de documento"}
                          value={customer.documentNumber}
                          onChange={(e) =>
                            setCustomer((c) => ({
                              ...c,
                              documentNumber: normalizeDocumentNumber(e.target.value, c.documentType).slice(
                                0,
                                c.documentType === "dni" ? 8 : c.documentType === "ruc" ? 11 : 20
                              )
                            }))
                          }
                          disabled={!customer.documentType}
                        />
                      </div>
                    </div>
                  ) : null}
                  {provinceShalomPickup ? (
                    <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">Sucursal Shalom *</label>
                        <input
                          className="w-full rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f4f4f0] px-4 py-3 text-sm text-[#1c1c1c] placeholder:text-[#b0bbb5] outline-none transition focus:border-[#52b788] focus:bg-white"
                          type="text"
                          placeholder="Ej: Shalom Juliaca Centro"
                          value={address.agencyName}
                          onChange={(e) => setAddress((a) => ({ ...a, agencyName: e.target.value }))}
                        />
                    </div>
                  ) : null}
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">
                      {provinceShalomPickup ? "Dirección o referencia del cliente *" : "Dirección de entrega *"}
                    </label>
                    <input
                      className="w-full rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f4f4f0] px-4 py-3 text-sm text-[#1c1c1c] placeholder:text-[#b0bbb5] outline-none transition focus:border-[#52b788] focus:bg-white"
                      type="text"
                      placeholder={provinceShalomPickup ? "Calle, referencia o zona donde te encuentras" : "Calle, número, urbanización, referencia"}
                      value={address.line1}
                      onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">
                      {provinceShalomPickup ? "Ciudad / Provincia *" : "Distrito / Ciudad *"}
                    </label>
                    <input
                      className="w-full rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f4f4f0] px-4 py-3 text-sm text-[#1c1c1c] placeholder:text-[#b0bbb5] outline-none transition focus:border-[#52b788] focus:bg-white"
                      type="text"
                      placeholder={provinceShalomPickup ? "Ej: Juliaca, Puno" : "Ej: Miraflores, Lima"}
                      value={address.district}
                      onChange={(e) => setAddress((a) => ({ ...a, district: e.target.value }))}
                    />
                  </div>
                  {provinceShalomPickup ? (
                    <div className="rounded-[14px] border border-[#c9a84c]/30 bg-[#fff9ea] px-4 py-3 text-[13px] leading-6 text-[#6e5a1d]">
                      <strong className="font-semibold text-[#5a4712]">PD:</strong> El costo del envío lo pagas al momento de recoger en la sucursal Shalom indicada.
                    </div>
                  ) : null}
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

              {/* Indicaciones */}
              <div className="rounded-[22px] border border-[rgba(26,58,46,0.1)] bg-white p-8">
                <h3 className="mb-1 font-serif text-xl font-bold text-[#1a3a2e]">Indicaciones del pedido</h3>
                <p className="mb-6 text-sm leading-relaxed text-[#6b7280]">Si quieres, deja una referencia corta para la entrega o alguna precisión operativa.</p>
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
                  <div className="flex justify-between text-[13px] text-[#6b7280]">
                    <span>{provinceShalomPickup ? "Envío Shalom" : "Envío"}</span>
                    <strong className="text-[#1c1c1c]">{provinceShalomPickup ? "Pago al recoger" : `S/ ${summary.shipping.toFixed(2)}`}</strong>
                  </div>
                  <p className="text-[11px] leading-5 text-[#8b8b8b]">{shippingNote}</p>
                </div>
                <div className="h-px bg-[rgba(26,58,46,0.08)]" />
                <div className="mt-4 flex justify-between font-bold text-[#1a3a2e]">
                  <span className="text-[16px]">{provinceShalomPickup ? "Total a pagar ahora" : "Total"}</span>
                  <span className="font-serif text-[22px] font-black">S/ {summary.grandTotal.toFixed(2)}</span>
                </div>
                {quoteLoading ? <p className="mt-2 text-[11px] text-[#6b7280]">Calculando totales...</p> : null}
                {quoteError ? <p className="mt-2 text-[11px] text-rose-600">{quoteError}</p> : null}
                <button
                  type="button"
                  onClick={() => {
                    const validationError = validateCheckoutForm();
                    if (validationError) {
                      setQuoteError(validationError);
                      return;
                    }

                    setQuoteError(null);
                    setShowYapeModal(true);
                  }}
                  disabled={submitting || activeItems.length === 0}
                  className="mt-5 w-full rounded-[13px] bg-[#2d6a4f] py-4 text-[15px] font-bold text-white shadow-[0_8px_24px_rgba(45,106,79,0.3)] transition hover:-translate-y-0.5 hover:bg-[#1a3a2e] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Procesando..." : "Comprar →"}
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
        walletNumber={siteSettings?.yapeNumber ?? ""}
        walletType={siteSettings?.walletType ?? "Billetera virtual"}
        walletOwnerName={siteSettings?.walletOwnerName ?? ""}
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
