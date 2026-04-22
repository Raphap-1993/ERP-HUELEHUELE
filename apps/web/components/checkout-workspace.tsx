"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import {
  CHECKOUT_DOCUMENT_TYPE_OPTIONS,
  isCheckoutStandardDeliveryDepartmentCode,
  isCheckoutStandardDeliveryProvinceCode,
  type AuthSessionSummary,
  type CheckoutItemInput,
  type CheckoutDocumentType,
  type CheckoutDocumentLookupSummary,
  type CheckoutQuoteSummary,
  type CheckoutRequestInput,
  type CatalogProduct,
  type PeruDepartmentSummary,
  type PeruDistrictSummary,
  type PeruProvinceSummary,
  type SiteSetting
} from "@huelegood/shared";
import {
  createManualCheckout,
  createOpenpayCheckout,
  fetchCatalogSummary,
  fetchCheckoutDocumentLookup,
  fetchCmsSiteSettings,
  fetchCheckoutQuote,
  fetchPeruDepartments,
  fetchPeruDistricts,
  fetchPeruProvinces,
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
type CheckoutStep = 1 | 2 | 3;
type StepTwoSection = 1 | 2 | 3 | 4;
type IdentityLookupStatus = "idle" | "loading" | "verified" | "matched" | "manual" | "error";

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
  departmentCode: string;
  departmentName: string;
  provinceCode: string;
  provinceName: string;
  districtCode: string;
  districtName: string;
}

const CHECKOUT_STEPS: Array<{
  id: CheckoutStep;
  label: string;
  title: string;
  navTitle: string;
  description: string;
}> = [
  {
    id: 1,
    label: "Pedido",
    title: "Revisa tu pedido",
    navTitle: "Revisa pedido",
    description: "Ajusta cantidades y deja lista tu compra."
  },
  {
    id: 2,
    label: "Entrega",
    title: "Datos y entrega",
    navTitle: "Datos y entrega",
    description: "Documento, entrega, ubicación y WhatsApp, en ese orden."
  },
  {
    id: 3,
    label: "Pago",
    title: "Confirma y paga",
    navTitle: "Confirma pago",
    description: "Comprueba todo, copia el número y sube tu comprobante."
  }
];

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" ")
  };
}

function getDocumentMaxLength(documentType?: CheckoutDocumentType | "") {
  if (documentType === "dni") {
    return 8;
  }

  if (documentType === "ruc") {
    return 11;
  }

  return 20;
}

function resolveLocationLabel(address: Pick<AddressForm, "districtName" | "provinceName" | "departmentName" | "district">) {
  const parts = [address.districtName, address.provinceName, address.departmentName].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(", ");
  }

  return address.district.trim();
}

function normalizeDocumentNumber(value: string, documentType?: CheckoutDocumentType | "") {
  const raw = value.trim().toUpperCase();

  if (documentType === "dni" || documentType === "ruc") {
    return raw.replace(/\D/g, "");
  }

  return raw.replace(/[^0-9A-Z-]/g, "");
}

function isDniLookupUnavailableMessage(message: string) {
  return /apiperu|integraci[oó]n con apiperu|no pudimos consultar/i.test(message);
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

function getCheckoutAvailableStock(product?: CatalogProduct) {
  if (typeof product?.availableStock === "number") {
    return Math.max(0, product.availableStock);
  }

  return Number.POSITIVE_INFINITY;
}

function isCheckoutProductPurchasable(product?: CatalogProduct) {
  if (!product) {
    return false;
  }

  if (typeof product.isPurchasable === "boolean") {
    return product.isPurchasable;
  }

  return getCheckoutAvailableStock(product) > 0;
}

function resolveCheckoutStockLabel(product?: CatalogProduct) {
  if (!product) {
    return "Producto no disponible";
  }

  if (product.stockStatus === "out_of_stock") {
    return product.stockLabel ?? "Sin stock";
  }

  if (product.stockStatus === "low_stock") {
    return product.stockLabel ?? "Pocas unidades";
  }

  return null;
}

function formatCurrency(value: number, currencyCode = "PEN") {
  try {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  } catch {
    return `S/ ${value.toFixed(2)}`;
  }
}

function resolveValidationStep(message: string): CheckoutStep {
  if (message.toLowerCase().includes("producto")) {
    return 1;
  }

  return 2;
}

function isInventoryAvailabilityError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("no hay stock suficiente") ||
    normalized.includes("no encontramos saldo por almacén") ||
    normalized.includes("no encontramos saldo por almacen") ||
    normalized.includes("disponible:") ||
    normalized.includes("warehouse")
  );
}

function resolvePublicCheckoutErrorMessage(
  error: unknown,
  context: { evidenceUploaded?: boolean } = {}
) {
  const rawMessage = error instanceof Error ? error.message : "No pudimos crear el checkout.";

  if (isInventoryAvailabilityError(rawMessage)) {
    if (context.evidenceUploaded) {
      return "No pudimos registrar tu pedido porque el stock cambió antes de confirmar la reserva. No vuelvas a pagar: escríbenos por WhatsApp y comparte tu comprobante para ayudarte.";
    }

    return "No pudimos reservar stock para uno de los productos de tu pedido. Actualiza el checkout o escríbenos por WhatsApp para ayudarte a cerrarlo.";
  }

  if (rawMessage.toLowerCase().includes("no pudimos conectar con el api")) {
    return "No pudimos conectar con la tienda para terminar tu pedido. Revisa tu conexión e inténtalo otra vez en unos minutos.";
  }

  return rawMessage;
}

function CopyFlatIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="7" y="3.5" width="9" height="11" rx="2.2" />
      <path d="M5.5 6.5H5A2.5 2.5 0 0 0 2.5 9v6A2.5 2.5 0 0 0 5 17.5h5.5" />
    </svg>
  );
}

function ReceiptUploadFlatIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 2.75h6l2.25 2.25V15.5A1.75 1.75 0 0 1 12.5 17.25h-5A1.75 1.75 0 0 1 5.75 15.5v-11A1.75 1.75 0 0 1 7.5 2.75H6Z" />
      <path d="M12 2.75V5h2.25" />
      <path d="M10 13V8.5" />
      <path d="m8.5 10 1.5-1.5 1.5 1.5" />
    </svg>
  );
}

function PaymentFlatIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3.25 6.25A2.25 2.25 0 0 1 5.5 4h9A2.25 2.25 0 0 1 16.75 6.25v7.5A2.25 2.25 0 0 1 14.5 16h-9a2.25 2.25 0 0 1-2.25-2.25Z" />
      <path d="M3.25 7.75h13.5" />
      <path d="M12.25 11.5h2.25" />
      <path d="M6.5 12.25h2.75" />
    </svg>
  );
}

function WhatsAppFlatIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M10 17.25A7.25 7.25 0 1 0 3.66 6.43 7.2 7.2 0 0 0 3.2 10.7L2.5 17.5l6.3-1.63A7.4 7.4 0 0 0 10 17.25Z" />
      <path d="M7.55 8.05c.16-.37.33-.38.57-.39h.48c.16 0 .38.06.49.33.12.27.4.95.43 1.02.04.07.07.18 0 .29-.07.11-.1.18-.21.29-.11.11-.22.24-.31.32-.1.08-.2.17-.08.33.11.17.51.83 1.11 1.35.77.67 1.43.88 1.6.98.16.09.26.08.35-.05.09-.13.39-.46.49-.62.1-.16.21-.13.35-.08.15.06.94.44 1.1.52.17.08.28.12.33.19.05.07.05.42-.1.83-.15.41-.84.8-1.15.83-.3.03-.69.05-1.11-.09-.26-.09-.59-.19-1.01-.37a8.45 8.45 0 0 1-2.82-2.45c-.22-.3-.63-.84-.86-1.43-.22-.6-.24-1.11-.17-1.53.08-.42.31-.77.45-.92Z" />
    </svg>
  );
}

export function CheckoutWorkspace() {
  const checkoutRequestIdRef = useRef<string | null>(null);
  const lastDocumentLookupRef = useRef<string | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const stepPanelRef = useRef<HTMLDivElement | null>(null);
  const successCardRef = useRef<HTMLDivElement | null>(null);
  const identityPanelRef = useRef<HTMLDivElement | null>(null);
  const productSlideCardRef = useRef<HTMLDivElement | null>(null);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [items, setItems] = useState<CheckoutItemInput[]>([]);
  const [session, setSession] = useState<AuthSessionSummary | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSetting | null>(null);
  const [paymentMethod] = useState<PaymentMethod>("manual");
  const [activeStep, setActiveStep] = useState<CheckoutStep>(1);
  const [stepTwoSection, setStepTwoSection] = useState<StepTwoSection>(1);
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
    agencyName: "",
    departmentCode: "",
    departmentName: "",
    provinceCode: "",
    provinceName: "",
    districtCode: "",
    districtName: ""
  });
  const [identityLookupStatus, setIdentityLookupStatus] = useState<IdentityLookupStatus>("idle");
  const [identityMessage, setIdentityMessage] = useState<string | null>(null);
  const [matchedCustomer, setMatchedCustomer] = useState<CheckoutDocumentLookupSummary["customer"] | null>(null);
  const [departments, setDepartments] = useState<PeruDepartmentSummary[]>([]);
  const [provinces, setProvinces] = useState<PeruProvinceSummary[]>([]);
  const [districts, setDistricts] = useState<PeruDistrictSummary[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [provincesLoading, setProvincesLoading] = useState(false);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [provinceShalomPickup, setProvinceShalomPickup] = useState(false);
  const [quote, setQuote] = useState<CheckoutQuoteSummary | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showYapeModal, setShowYapeModal] = useState(false);
  const [paymentCopied, setPaymentCopied] = useState(false);
  const [productSlideIndex, setProductSlideIndex] = useState(0);
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

    async function loadPeruDepartments() {
      setDepartmentsLoading(true);

      try {
        const response = await fetchPeruDepartments();
        if (active) {
          setDepartments(response.data ?? []);
        }
      } catch {
        if (active) {
          setDepartments([]);
        }
      } finally {
        if (active) {
          setDepartmentsLoading(false);
        }
      }
    }

    void loadSession();
    void loadCatalog();
    void loadSiteSettings();
    void loadPeruDepartments();

    const storedCart = readStoredCart();
    if (storedCart.length > 0) {
      setItems(storedCart);
    }

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (products.length === 0 || items.length === 0) {
      return;
    }

    const productBySlug = new Map(products.map((product) => [product.slug, product]));
    const nextItems = items.flatMap((item) => {
      const product = productBySlug.get(item.slug);

      if (!isCheckoutProductPurchasable(product)) {
        return [];
      }

      const availableStock = getCheckoutAvailableStock(product);
      const quantity = Number.isFinite(availableStock)
        ? Math.min(item.quantity, availableStock)
        : item.quantity;

      return quantity > 0 ? [{ ...item, quantity }] : [];
    });

    const changed =
      nextItems.length !== items.length ||
      nextItems.some((item, index) => item.slug !== items[index]?.slug || item.quantity !== items[index]?.quantity);

    if (changed) {
      writeStoredCart(nextItems);
      setItems(nextItems);
    }
  }, [items, products]);

  useEffect(() => {
    checkoutRequestIdRef.current = null;
  }, [
    activeItems,
    address.line1,
    address.district,
    address.agencyName,
    address.departmentCode,
    address.provinceCode,
    address.districtCode,
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
    if (!address.departmentCode) {
      setProvinces([]);
      setDistricts([]);
      return;
    }

    let active = true;
    setProvincesLoading(true);

    void fetchPeruProvinces(address.departmentCode)
      .then((response) => {
        if (active) {
          setProvinces(response.data ?? []);
        }
      })
      .catch(() => {
        if (active) {
          setProvinces([]);
        }
      })
      .finally(() => {
        if (active) {
          setProvincesLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [address.departmentCode]);

  useEffect(() => {
    if (!address.provinceCode) {
      setDistricts([]);
      return;
    }

    let active = true;
    setDistrictsLoading(true);

    void fetchPeruDistricts(address.provinceCode)
      .then((response) => {
        if (active) {
          setDistricts(response.data ?? []);
        }
      })
      .catch(() => {
        if (active) {
          setDistricts([]);
        }
      })
      .finally(() => {
        if (active) {
          setDistrictsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [address.provinceCode]);

  useEffect(() => {
    if (provinceShalomPickup) {
      return;
    }

    if (address.departmentCode && !isCheckoutStandardDeliveryDepartmentCode(address.departmentCode)) {
      setAddress((current) => ({
        ...current,
        agencyName: "",
        departmentCode: "",
        departmentName: "",
        provinceCode: "",
        provinceName: "",
        districtCode: "",
        districtName: "",
        district: ""
      }));
      return;
    }

    if (address.provinceCode && !isCheckoutStandardDeliveryProvinceCode(address.provinceCode)) {
      setAddress((current) => ({
        ...current,
        agencyName: "",
        provinceCode: "",
        provinceName: "",
        districtCode: "",
        districtName: "",
        district: ""
      }));
    }
  }, [address.departmentCode, address.provinceCode, provinceShalomPickup]);

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
          console.error("Checkout quote failed", fetchError);
          setQuote(null);
          setQuoteError(resolvePublicCheckoutErrorMessage(fetchError));
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

  useEffect(() => {
    if (!shellRef.current) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from("[data-checkout-intro]", {
        autoAlpha: 0,
        y: 22,
        duration: 0.7,
        stagger: 0.1,
        ease: "power2.out"
      });
    }, shellRef);

    return () => {
      ctx.revert();
    };
  }, []);

  useEffect(() => {
    if (!stepPanelRef.current) {
      return;
    }

    const progressTween = progressBarRef.current
      ? gsap.to(progressBarRef.current, {
          width: `${(activeStep / CHECKOUT_STEPS.length) * 100}%`,
          duration: 0.45,
          ease: "power2.out"
        })
      : null;

    const panelTween = gsap.fromTo(
      stepPanelRef.current,
      { autoAlpha: 0, y: 22 },
      { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out" }
    );

    return () => {
      progressTween?.kill();
      panelTween.kill();
    };
  }, [activeStep]);

  useEffect(() => {
    if (!result || !successCardRef.current) {
      return;
    }

    const tween = gsap.fromTo(
      successCardRef.current,
      { autoAlpha: 0, y: 28, scale: 0.98 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: "power2.out" }
    );

    return () => {
      tween.kill();
    };
  }, [result]);

  useEffect(() => {
    if (!identityPanelRef.current || activeStep !== 2) {
      return;
    }

    const tween = gsap.fromTo(
      "[data-step-two-card]",
      { autoAlpha: 0, y: 18 },
      { autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.08, ease: "power2.out" }
    );

    return () => {
      tween.kill();
    };
  }, [activeStep, identityLookupStatus, customer.documentType, provinceShalomPickup, stepTwoSection]);

  const resolvedProducts = useMemo(() => {
    return products;
  }, [products]);

  const availableToAdd = useMemo(() => {
    return resolvedProducts.filter(
      (product) => isCheckoutProductPurchasable(product) && !activeItems.some((item) => item.slug === product.slug)
    );
  }, [activeItems, resolvedProducts]);
  const productPickerItems = useMemo(() => {
    return resolvedProducts
      .filter(isCheckoutProductPurchasable)
      .map((product) => ({
        product,
        image: resolveCheckoutProductImage(product),
        selected: activeItems.some((item) => item.slug === product.slug)
      }));
  }, [activeItems, resolvedProducts]);
  const productSlideCount = productPickerItems.length;
  const activeProductSlide = productPickerItems[productSlideIndex] ?? productPickerItems[0] ?? null;
  const summaryPreviewItems = useMemo(() => {
    return activeItems.slice(0, 2).map((item) => {
      const product = resolvedProducts.find((candidate) => candidate.slug === item.slug);

      return {
        item,
        product,
        lineTotal: (product?.price ?? 0) * item.quantity
      };
    });
  }, [activeItems, resolvedProducts]);
  const summaryOverflowCount = Math.max(activeItems.length - summaryPreviewItems.length, 0);
  const summaryOverflowUnits = useMemo(() => {
    return activeItems.slice(summaryPreviewItems.length).reduce((total, item) => total + item.quantity, 0);
  }, [activeItems, summaryPreviewItems.length]);
  const summaryOverflowTotal = useMemo(() => {
    return activeItems.slice(summaryPreviewItems.length).reduce((total, item) => {
      const product = resolvedProducts.find((candidate) => candidate.slug === item.slug);
      return total + (product?.price ?? 0) * item.quantity;
    }, 0);
  }, [activeItems, resolvedProducts, summaryPreviewItems.length]);

  useEffect(() => {
    setProductSlideIndex((current) => {
      if (productPickerItems.length === 0) {
        return 0;
      }

      return Math.min(current, productPickerItems.length - 1);
    });
  }, [productPickerItems.length]);

  useEffect(() => {
    if (activeStep !== 1 || !productSlideCardRef.current) {
      return;
    }

    const tween = gsap.fromTo(
      productSlideCardRef.current,
      { autoAlpha: 0, x: 18, scale: 0.985 },
      { autoAlpha: 1, x: 0, scale: 1, duration: 0.32, ease: "power2.out" }
    );

    return () => {
      tween.kill();
    };
  }, [activeStep, productSlideIndex]);

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

  const currentStep = CHECKOUT_STEPS.find((step) => step.id === activeStep) ?? CHECKOUT_STEPS[0];
  const shippingThreshold = Number.isFinite(siteSettings?.freeShippingThreshold) ? siteSettings?.freeShippingThreshold ?? 0 : 0;
  const shippingFlatRate = Number.isFinite(siteSettings?.shippingFlatRate) ? siteSettings?.shippingFlatRate ?? 0 : 0;
  const shippingProgress = shippingThreshold > 0 ? Math.min((summary.subtotal / shippingThreshold) * 100, 100) : 0;
  const shippingRemaining = Math.max(shippingThreshold - summary.subtotal, 0);
  const activeItemUnits = activeItems.reduce((total, item) => total + item.quantity, 0);
  const hasBlockedStock = activeItems.some((item) => {
    const product = resolvedProducts.find((candidate) => candidate.slug === item.slug);
    const availableStock = getCheckoutAvailableStock(product);

    return !isCheckoutProductPurchasable(product) || (Number.isFinite(availableStock) && item.quantity > availableStock);
  });
  const whatsappPhone = siteSettings?.whatsapp?.replace(/\D/g, "") ?? "";
  const whatsappHref = whatsappPhone
    ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent("Hola, necesito ayuda con mi checkout de Huelegood.")}`
    : null;
  const successOrderStatus = result?.order?.orderStatus ?? null;
  const successHasCheckoutUrl = Boolean(result?.order?.checkoutUrl);
  const successWhatsappHref = whatsappPhone
    ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
        result?.order?.orderNumber
          ? `Hola, acabo de registrar mi pedido #${result.order.orderNumber} en Huelegood y quiero confirmarlo por WhatsApp.`
          : "Hola, acabo de registrar mi pedido en Huelegood y quiero confirmarlo por WhatsApp."
      )}`
    : null;
  const successPaymentTitle = "Estado de tu pago";
  const successPaymentLabel =
    successOrderStatus === "payment_under_review"
      ? "Estamos revisando tu comprobante"
      : successHasCheckoutUrl
        ? "Falta completar tu pago"
        : "Pago confirmado";
  const successPaymentSupport =
    successOrderStatus === "payment_under_review"
      ? "Te avisaremos apenas quede validado."
      : successHasCheckoutUrl
        ? "Cuando termines el pago, confirmaremos tu pedido."
        : "Tu pedido ya quedó registrado correctamente.";
  const successNextStepTitle = "Lo que sigue";
  const successNextStepLabel =
    successOrderStatus === "payment_under_review"
      ? "Si quieres agilizarlo, escríbenos por WhatsApp"
      : successHasCheckoutUrl
        ? "Completa tu pago para confirmar el pedido"
        : "Nos pondremos en contacto contigo para coordinar";
  const successNextStepSupport =
    successOrderStatus === "payment_under_review"
      ? "Compártenos tu número de pedido y te ayudamos a confirmar más rápido."
      : successHasCheckoutUrl
        ? "Si necesitas ayuda, también puedes escribirnos por WhatsApp con tu número de pedido."
        : provinceShalomPickup
          ? "Si prefieres, también puedes escribirnos por WhatsApp para coordinar el envío por Shalom."
          : "Si prefieres, también puedes escribirnos por WhatsApp con tu número de pedido.";
  const successWhatsappTitle = "Coordinación por WhatsApp";
  const successWhatsappSupport = successHasCheckoutUrl
    ? "Si quieres, escríbenos con tu número de pedido y te ayudamos a completar el pago y coordinar la entrega."
    : "Si quieres, escríbenos con tu número de pedido y te ayudamos a confirmarlo y coordinar la entrega.";
  const locationSummary = resolveLocationLabel(address);
  const requiresDniLookup = customer.documentType === "dni";
  const normalizedCustomerDocumentNumber = customer.documentType
    ? normalizeDocumentNumber(customer.documentNumber, customer.documentType)
    : "";
  const hasValidDocumentLength =
    customer.documentType === "dni"
      ? normalizedCustomerDocumentNumber.length === 8
      : customer.documentType === "ruc"
        ? normalizedCustomerDocumentNumber.length === 11
        : customer.documentType === "ce" || customer.documentType === "passport"
          ? normalizedCustomerDocumentNumber.length >= 6
          : customer.documentType === "other_sunat"
            ? normalizedCustomerDocumentNumber.length >= 3
            : false;
  const documentCompleted = Boolean(
    customer.documentType &&
      hasValidDocumentLength &&
      (requiresDniLookup
        ? identityLookupStatus === "verified" || Boolean(matchedCustomer) || customer.fullName.trim()
        : customer.fullName.trim())
  );
  const locationCompleted = Boolean(
    address.departmentCode &&
      address.provinceCode &&
      address.districtCode &&
      address.line1.trim() &&
      (!provinceShalomPickup || address.agencyName.trim())
  );
  const contactCompleted = Boolean(customer.fullName.trim() && customer.phone.trim());
  const availableDepartments = useMemo(() => {
    return provinceShalomPickup
      ? departments
      : departments.filter((option) => isCheckoutStandardDeliveryDepartmentCode(option.code));
  }, [departments, provinceShalomPickup]);
  const availableProvinces = useMemo(() => {
    return provinceShalomPickup
      ? provinces
      : provinces.filter((option) => isCheckoutStandardDeliveryProvinceCode(option.code));
  }, [provinceShalomPickup, provinces]);
  const deliveryModeSummary = provinceShalomPickup ? "Shalom provincias" : "Delivery Lima y Callao";
  const fieldClassName =
    "w-full rounded-[20px] border border-[rgba(26,58,46,0.12)] bg-white px-4 py-3.5 text-[15px] text-[#173126] outline-none transition placeholder:text-[#94a39a] focus:border-[#61a740] focus:ring-4 focus:ring-[#61a740]/15";
  const labelClassName =
    "mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5f6f66]";
  const sectionCardClassName =
    "rounded-[28px] border border-[rgba(26,58,46,0.08)] bg-white/98 p-5 shadow-[0_18px_44px_rgba(16,33,24,0.05)] sm:p-6";
  const stepTwoPrimaryButtonClassName =
    "inline-flex items-center justify-center rounded-full bg-[#f15a29] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#da4d1e] disabled:cursor-not-allowed disabled:opacity-50";
  const canAdvanceFromDocument = documentCompleted;
  const canAdvanceFromLocation = locationCompleted;
  const canAdvanceFromContact = contactCompleted;
  const paymentWalletType = (() => {
    const configuredWalletType = siteSettings?.walletType?.trim();
    if (!configuredWalletType) {
      return "Billetera virtual";
    }

    return /^(yape|plin)$/i.test(configuredWalletType) ? "Billetera virtual" : configuredWalletType;
  })();
  const paymentWalletNumber = siteSettings?.yapeNumber?.trim() || "";
  const paymentWalletOwner = siteSettings?.walletOwnerName?.trim() || "";

  function canOpenStepTwoSection(section: StepTwoSection) {
    switch (section) {
      case 1:
        return true;
      case 2:
        return documentCompleted;
      case 3:
        return documentCompleted;
      case 4:
        return documentCompleted && locationCompleted;
      default:
        return false;
    }
  }

  function goToStepTwoSection(section: StepTwoSection) {
    if (canOpenStepTwoSection(section) || section <= stepTwoSection) {
      setStepTwoSection(section);
    }
  }

  function resolveStepTwoSectionFromValidation(message: string): StepTwoSection {
    const normalized = message.toLowerCase();

    if (
      normalized.includes("documento") ||
      normalized.includes("dni") ||
      normalized.includes("ruc") ||
      normalized.includes("nombre completo")
    ) {
      return 1;
    }

    if (
      normalized.includes("departamento") ||
      normalized.includes("provincia") ||
      normalized.includes("distrito") ||
      normalized.includes("dirección") ||
      normalized.includes("shalom")
    ) {
      return 3;
    }

    if (normalized.includes("whatsapp")) {
      return 4;
    }

    return 1;
  }

  function updateItem(slug: string, quantity: number) {
    const product = resolvedProducts.find((candidate) => candidate.slug === slug);
    const availableStock = getCheckoutAvailableStock(product);

    if (!isCheckoutProductPurchasable(product) || availableStock <= 0) {
      setQuoteError("Ese producto ya no tiene stock disponible.");
      removeItem(slug);
      return;
    }

    const nextQuantity = Number.isFinite(availableStock)
      ? Math.min(Math.max(1, quantity), availableStock)
      : Math.max(1, quantity);

    if (Number.isFinite(availableStock) && quantity > availableStock) {
      setQuoteError(`Solo quedan ${availableStock} ${availableStock === 1 ? "unidad" : "unidades"} disponibles.`);
    } else {
      setQuoteError(null);
    }

    setItems((current) => {
      const next = current.map((item) => (item.slug === slug ? { ...item, quantity: nextQuantity } : item));
      writeStoredCart(next);
      return next;
    });
  }

  function addItem(slug: string) {
    const product = resolvedProducts.find((candidate) => candidate.slug === slug);

    if (!isCheckoutProductPurchasable(product)) {
      setQuoteError("Ese producto no tiene stock disponible para comprar.");
      return;
    }

    const next = addStoredCartItem({ slug, quantity: 1 });
    setItems(next);
    setQuoteError(null);
  }

  function moveProductSlider(direction: "prev" | "next") {
    if (productSlideCount <= 1) {
      return;
    }

    setProductSlideIndex((current) => {
      if (direction === "next") {
        return Math.min(current + 1, productSlideCount - 1);
      }

      return Math.max(current - 1, 0);
    });
  }

  function removeItem(slug: string) {
    setItems((current) => {
      const next = current.filter((item) => item.slug !== slug);
      writeStoredCart(next);
      return next;
    });
  }

  function handleProvinceModeChange(nextValue: boolean) {
    setProvinceShalomPickup(nextValue);
    setAddress((current) => {
      const shouldResetDepartment = !nextValue && current.departmentCode && !isCheckoutStandardDeliveryDepartmentCode(current.departmentCode);
      const shouldResetProvince =
        !nextValue && current.provinceCode && !isCheckoutStandardDeliveryProvinceCode(current.provinceCode);
      const shouldResetUbigeo = shouldResetDepartment || shouldResetProvince;

      return {
        ...current,
        agencyName: nextValue ? current.agencyName : "",
        departmentCode: shouldResetDepartment ? "" : current.departmentCode,
        departmentName: shouldResetDepartment ? "" : current.departmentName,
        provinceCode: shouldResetUbigeo ? "" : current.provinceCode,
        provinceName: shouldResetUbigeo ? "" : current.provinceName,
        districtCode: shouldResetUbigeo ? "" : current.districtCode,
        districtName: shouldResetUbigeo ? "" : current.districtName,
        district: shouldResetUbigeo ? "" : current.district
      };
    });

    if (activeStep === 2 && stepTwoSection === 2) {
      setStepTwoSection(3);
    }
  }

  function handleDocumentTypeChange(nextValue: CheckoutDocumentType | "") {
    lastDocumentLookupRef.current = null;
    setIdentityLookupStatus(nextValue === "dni" ? "idle" : nextValue ? "manual" : "idle");
    setIdentityMessage(nextValue === "dni" ? "Puedes validar tu DNI para autocompletar el nombre o escribirlo manualmente." : null);
    setMatchedCustomer(null);
    setCustomer((current) => ({
      ...current,
      documentType: nextValue,
      documentNumber: ""
    }));
  }

  function handleDepartmentChange(nextValue: string) {
    const department = departments.find((option) => option.code === nextValue);

    setAddress((current) => ({
      ...current,
      departmentCode: nextValue,
      departmentName: department?.name ?? "",
      provinceCode: "",
      provinceName: "",
      districtCode: "",
      districtName: "",
      district: ""
    }));
  }

  function handleProvinceChange(nextValue: string) {
    const province = provinces.find((option) => option.code === nextValue);

    setAddress((current) => ({
      ...current,
      provinceCode: nextValue,
      provinceName: province?.name ?? "",
      districtCode: "",
      districtName: "",
      district: ""
    }));
  }

  function handleDistrictChange(nextValue: string) {
    const district = districts.find((option) => option.code === nextValue);

    setAddress((current) => ({
      ...current,
      districtCode: nextValue,
      districtName: district?.name ?? "",
      district: [district?.name, current.provinceName, current.departmentName].filter(Boolean).join(", ")
    }));
  }

  async function handleDocumentLookup() {
    if (!customer.documentType) {
      setIdentityLookupStatus("error");
      setIdentityMessage("Selecciona primero el tipo de documento.");
      return;
    }

    const normalizedDocumentNumber = normalizeDocumentNumber(customer.documentNumber, customer.documentType);
    const maxLength = getDocumentMaxLength(customer.documentType);

    if (
      (customer.documentType === "dni" && normalizedDocumentNumber.length !== 8) ||
      (customer.documentType === "ruc" && normalizedDocumentNumber.length !== 11) ||
      ((customer.documentType === "ce" || customer.documentType === "passport") && normalizedDocumentNumber.length < 6) ||
      (customer.documentType === "other_sunat" && normalizedDocumentNumber.length < 3)
    ) {
      setIdentityLookupStatus("error");
      setIdentityMessage(`Completa un ${selectedDocumentType?.label ?? "documento"} válido para continuar.`);
      return;
    }

    const lookupKey = `${customer.documentType}:${normalizedDocumentNumber.slice(0, maxLength)}`;
    if (lastDocumentLookupRef.current === lookupKey && identityLookupStatus !== "error") {
      return;
    }

    setIdentityLookupStatus("loading");
    setIdentityMessage(customer.documentType === "dni" ? "Validando DNI..." : "Buscando datos previos...");
    setMatchedCustomer(null);

    try {
      const response = await fetchCheckoutDocumentLookup({
        documentType: customer.documentType,
        documentNumber: normalizedDocumentNumber
      });
      const payload = response.data;
      lastDocumentLookupRef.current = lookupKey;

      setMatchedCustomer(payload.customer ?? null);
      setCustomer((current) => ({
        ...current,
        fullName: payload.officialIdentity?.fullName ?? payload.customer?.fullName ?? current.fullName,
        email: current.email || payload.customer?.email || "",
        phone: current.phone || payload.customer?.phone || ""
      }));

      if (payload.customer?.defaultAddress) {
        const customerAddress = payload.customer.defaultAddress;
        setAddress((current) => ({
          ...current,
          line1: current.line1 || customerAddress.line1 || "",
          departmentCode: current.departmentCode || customerAddress.departmentCode || "",
          departmentName: current.departmentName || customerAddress.departmentName || "",
          provinceCode: current.provinceCode || customerAddress.provinceCode || "",
          provinceName: current.provinceName || customerAddress.provinceName || "",
          districtCode: current.districtCode || customerAddress.districtCode || "",
          districtName: current.districtName || customerAddress.districtName || "",
          district:
            current.district ||
            [customerAddress.districtName, customerAddress.provinceName, customerAddress.departmentName].filter(Boolean).join(", ")
        }));
      }

      if (payload.officialIdentity) {
        setIdentityLookupStatus("verified");
        setIdentityMessage(
          payload.customer
            ? "DNI validado y datos previos recuperados. Revisa tu nombre antes de seguir."
            : "DNI validado. Completamos tu nombre aquí para que lo revises antes de seguir."
        );
        return;
      }

      if (payload.customer) {
        setIdentityLookupStatus("matched");
        setIdentityMessage("Encontramos una compra previa y precargamos tus datos. Revísalos antes de seguir.");
        return;
      }

      setIdentityLookupStatus("manual");
      setIdentityMessage(
        customer.documentType === "dni"
          ? "No pudimos autocompletar ese DNI. Revisa el número y completa tu nombre manualmente para continuar."
          : "No encontramos un registro previo. Completa tu nombre manualmente."
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "No pudimos validar el documento.";

      if (customer.documentType === "dni" && isDniLookupUnavailableMessage(message)) {
        setIdentityLookupStatus("manual");
        setIdentityMessage(
          "No pudimos validar el DNI automáticamente en este momento. Completa tu nombre manualmente para continuar."
        );
        return;
      }

      setIdentityLookupStatus("error");
      setIdentityMessage(message);
    }
  }

  function resolveCheckoutStockError() {
    for (const item of activeItems) {
      const product = resolvedProducts.find((candidate) => candidate.slug === item.slug);
      const availableStock = getCheckoutAvailableStock(product);

      if (!isCheckoutProductPurchasable(product)) {
        return `${product?.name ?? item.slug} no tiene stock disponible.`;
      }

      if (Number.isFinite(availableStock) && item.quantity > availableStock) {
        return `${product?.name ?? item.slug} solo tiene ${availableStock} ${availableStock === 1 ? "unidad" : "unidades"} disponibles.`;
      }
    }

    return null;
  }

  function validateCheckoutForm() {
    if (activeItems.length === 0) {
      return "Agrega al menos un producto para continuar.";
    }

    const stockError = resolveCheckoutStockError();
    if (stockError) {
      return stockError;
    }

    if (!customer.documentType) {
      return "Selecciona tu tipo de documento.";
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

    if (
      requiresDniLookup &&
      identityLookupStatus !== "verified" &&
      !matchedCustomer &&
      !customer.fullName.trim()
    ) {
      return "Valida tu DNI o completa tu nombre manualmente.";
    }

    if (!customer.fullName.trim()) {
      return "Ingresa tu nombre completo.";
    }

    if (!customer.phone.trim()) {
      return "Ingresa tu WhatsApp.";
    }

    if (!address.departmentCode || !address.provinceCode || !address.districtCode) {
      return "Selecciona departamento, provincia y distrito.";
    }

    if (!address.line1.trim()) {
      return provinceShalomPickup ? "Ingresa una dirección o referencia del cliente." : "Ingresa la dirección de entrega.";
    }

    if (provinceShalomPickup) {
      if (!address.agencyName.trim()) {
        return "Indica la sucursal de Shalom más cercana.";
      }
    }

    return null;
  }

  async function handleSubmit(evidenceImageUrl?: string) {
    if (!quote) {
      setQuoteError("Primero genera una cotización válida.");
      return;
    }

    const validationError = validateCheckoutForm();
    if (validationError) {
      setQuoteError(validationError);
      setActiveStep(resolveValidationStep(validationError));
      setStepTwoSection(resolveStepTwoSectionFromValidation(validationError));
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
        documentType: customer.documentType || undefined,
        documentNumber: customer.documentType ? normalizeDocumentNumber(customer.documentNumber, customer.documentType) : undefined
      },
      address: {
        recipientName: customer.fullName.trim(),
        line1: address.line1.trim(),
        city: address.districtName.trim() || address.district.trim(),
        region: address.provinceName.trim() || address.departmentName.trim(),
        postalCode: "",
        countryCode: "PE",
        deliveryMode: provinceShalomPickup ? "province_shalom_pickup" : "standard",
        carrier: provinceShalomPickup ? "shalom" : undefined,
        agencyName: provinceShalomPickup ? address.agencyName.trim() : undefined,
        payOnPickup: provinceShalomPickup ? true : undefined,
        departmentCode: address.departmentCode || undefined,
        departmentName: address.departmentName || undefined,
        provinceCode: address.provinceCode || undefined,
        provinceName: address.provinceName || undefined,
        districtCode: address.districtCode || undefined,
        districtName: address.districtName || undefined
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
      console.error("Checkout submit failed", submitError);
      setQuoteError(resolvePublicCheckoutErrorMessage(submitError, { evidenceUploaded: Boolean(evidenceImageUrl) }));
    } finally {
      setSubmitting(false);
    }
  }

  const shippingNote = useMemo(() => {
    if (provinceShalomPickup) {
      return "Envío exclusivo por Shalom. No pagas el flete ahora; lo cancelas al momento de recoger con tu documento.";
    }

    if (!siteSettings) {
      return "El costo de envío se calcula según el total de tu pedido.";
    }

    if (shippingThreshold > 0 && shippingFlatRate > 0) {
      if (summary.shipping <= 0) {
        return `Tu pedido ya califica para envío gratis desde ${formatCurrency(shippingThreshold)}.`;
      }

      return `Envío gratis desde ${formatCurrency(shippingThreshold)}. Tarifa base ${formatCurrency(shippingFlatRate)}.`;
    }

    if (shippingThreshold > 0) {
      return `Envío gratis desde ${formatCurrency(shippingThreshold)}.`;
    }

    if (shippingFlatRate > 0) {
      return `Tarifa base de envío: ${formatCurrency(shippingFlatRate)}.`;
    }

    return "El costo de envío se calcula según el total de tu pedido.";
  }, [provinceShalomPickup, shippingFlatRate, shippingThreshold, siteSettings, summary.shipping]);

  function handleContinueFromStepOne() {
    if (activeItems.length === 0) {
      setQuoteError("Agrega al menos un producto para continuar.");
      return;
    }

    const stockError = resolveCheckoutStockError();
    if (stockError) {
      setQuoteError(stockError);
      return;
    }

    setQuoteError(null);
    setActiveStep(2);
    setStepTwoSection(1);
  }

  function handleContinueFromStepTwo() {
    const validationError = validateCheckoutForm();

    if (validationError) {
      setQuoteError(validationError);
      setActiveStep(resolveValidationStep(validationError));
      setStepTwoSection(resolveStepTwoSectionFromValidation(validationError));
      return;
    }

    setQuoteError(null);
    setActiveStep(3);
  }

  function handleOpenPaymentModal() {
    const validationError = validateCheckoutForm();
    if (validationError) {
      setQuoteError(validationError);
      setActiveStep(resolveValidationStep(validationError));
      setStepTwoSection(resolveStepTwoSectionFromValidation(validationError));
      return;
    }

    setQuoteError(null);
    setShowYapeModal(true);
  }

  async function handleCopyPaymentNumber() {
    if (!paymentWalletNumber) {
      return;
    }

    try {
      await navigator.clipboard.writeText(paymentWalletNumber);
      setPaymentCopied(true);
      window.setTimeout(() => setPaymentCopied(false), 1800);
    } catch {
      setPaymentCopied(false);
    }
  }

  return (
    <div
      data-checkout-fullscreen="true"
      className="relative overflow-hidden bg-[hsl(var(--background))] lg:flex lg:h-full lg:min-h-0 lg:flex-col"
    >
      <div
        ref={shellRef}
        className="relative mx-auto flex max-w-[1440px] flex-1 flex-col px-4 py-6 sm:px-6 lg:min-h-0 lg:h-full lg:px-8 lg:py-4"
      >
        {result ? (
          <div ref={successCardRef} className="mx-auto max-w-[760px]">
            <div className="rounded-[36px] border border-[rgba(26,58,46,0.1)] bg-white/95 p-8 shadow-[0_28px_80px_rgba(16,33,24,0.10)] backdrop-blur sm:p-10">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#dff4e3] text-4xl">
                {result.order?.orderStatus === "payment_under_review" ? "📋" : "🎉"}
              </div>

              <div className="mt-6 text-center">
                <span className="inline-flex items-center rounded-full border border-[rgba(97,167,64,0.14)] bg-[#f4fbf6] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#61a740]">
                  {successOrderStatus === "payment_under_review"
                    ? "Pago en revisión"
                    : successHasCheckoutUrl
                      ? "Pago pendiente"
                      : "Compra registrada"}
                </span>
                <h2 className="mt-4 font-sans text-4xl font-extrabold tracking-[-0.03em] text-[#163126]">
                  {successOrderStatus === "payment_under_review"
                    ? "Tu comprobante ya está en revisión"
                    : successHasCheckoutUrl
                      ? "Tu pedido ya está listo para pagar"
                    : "Tu pedido quedó confirmado"}
                </h2>
                <p className="mx-auto mt-4 max-w-[520px] text-sm leading-7 text-[#5f6f66]">
                  {successOrderStatus === "payment_under_review"
                    ? provinceShalomPickup
                      ? "Ya recibimos tu comprobante. Si quieres agilizar la confirmación, escríbenos por WhatsApp con tu número de pedido y coordinamos el despacho por Shalom."
                      : "Ya recibimos tu comprobante. Si quieres agilizar la confirmación, escríbenos por WhatsApp con tu número de pedido."
                    : successHasCheckoutUrl
                      ? "Tu pedido ya quedó registrado. Completa el pago para dejarlo confirmado y, si quieres ayuda, escríbenos por WhatsApp con tu número de pedido."
                    : provinceShalomPickup
                      ? "Gracias por tu compra. Puedes escribirnos por WhatsApp para recalcar tu pedido y coordinar el envío por Shalom."
                      : "Gracias por tu compra. Puedes escribirnos por WhatsApp para recalcar tu pedido y coordinar la entrega."}
                </p>
              </div>

              {result.order?.orderNumber ? (
                <div className="mt-8 flex justify-center">
                  <div className="rounded-full bg-[#577e2f] px-6 py-3 font-mono text-base font-bold tracking-[0.16em] text-white">
                    #{result.order.orderNumber}
                  </div>
                </div>
              ) : null}

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-[rgba(26,58,46,0.08)] bg-[#fbfaf6] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5f6f66]">
                    {successPaymentTitle}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[#163126]">{successPaymentLabel}</p>
                  <p className="mt-2 text-sm leading-6 text-[#5f6f66]">{successPaymentSupport}</p>
                </div>

                <div className="rounded-[24px] border border-[rgba(26,58,46,0.08)] bg-[#fbfaf6] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5f6f66]">
                    {successNextStepTitle}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[#163126]">{successNextStepLabel}</p>
                  <p className="mt-2 text-sm leading-6 text-[#5f6f66]">{successNextStepSupport}</p>
                </div>
              </div>

              {successWhatsappHref ? (
                <div className="mt-6 rounded-[24px] border border-[rgba(97,167,64,0.14)] bg-[#f4fbf6] px-5 py-4 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#61a740]">
                    {successWhatsappTitle}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[#163126]/78">{successWhatsappSupport}</p>
                </div>
              ) : null}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
                {result.order?.checkoutUrl ? (
                  <a
                    href={result.order.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-full border border-[rgba(97,167,64,0.18)] bg-white px-6 py-3 text-sm font-semibold text-[#163126] transition hover:bg-[#f4fbf6]"
                  >
                    Completar pago online
                  </a>
                ) : null}

                {successWhatsappHref ? (
                  <a
                    href={successWhatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2.5 rounded-full bg-[#1f8f49] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#18763c]"
                  >
                    <WhatsAppFlatIcon className="h-[18px] w-[18px] flex-shrink-0" />
                    Confirmar mi pedido por WhatsApp
                  </a>
                ) : null}

                <a
                  href="/catalogo"
                  className="inline-flex items-center justify-center rounded-full border border-[rgba(97,167,64,0.18)] bg-white px-6 py-3 text-sm font-semibold text-[#163126] transition hover:bg-[#f4fbf6]"
                >
                  Seguir comprando
                </a>
              </div>
            </div>
          </div>
        ) : (
	          <div className="grid flex-1 gap-5 lg:min-h-0 lg:grid-cols-[minmax(0,1.7fr)_316px] xl:grid-cols-[minmax(0,1.84fr)_336px]">
            <div className="lg:flex lg:min-h-0 lg:flex-col">
              <section
                data-checkout-intro
                className="rounded-[30px] border border-[rgba(26,58,46,0.08)] bg-white/96 shadow-[0_24px_60px_rgba(16,33,24,0.06)] lg:flex lg:min-h-0 lg:flex-1 lg:flex-col"
              >
	                <div className="border-b border-[rgba(26,58,46,0.08)] px-5 py-3.5 sm:px-6 sm:py-4">
	                  <div className="space-y-3">
		                    <div className="grid gap-3 xl:grid-cols-[minmax(0,1.06fr)_minmax(340px,430px)] xl:items-start">
		                      <div>
		                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#61a740]">{currentStep.label}</p>
		                        <h2 className="mt-1 font-sans text-[2rem] font-semibold tracking-[-0.04em] text-[#163126] sm:text-[2.25rem]">
		                          {currentStep.title}
		                        </h2>
		                        <p className="mt-1 text-sm leading-6 text-[#5f6f66]">{currentStep.description}</p>
		                      </div>

	                      <div className="grid grid-cols-3 gap-2 rounded-[22px] border border-[rgba(26,58,46,0.08)] bg-[#fbfaf6] p-2 sm:hidden">
	                        {CHECKOUT_STEPS.map((step) => {
	                          const isActive = step.id === activeStep;
	                          const isComplete = step.id < activeStep;
	                          const isReachable = step.id <= activeStep;

                          return (
	                            <button
	                              key={step.id}
	                              type="button"
	                              disabled={!isReachable}
	                              onClick={() => setActiveStep(step.id)}
	                              className={`flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-[16px] px-2 py-2 text-center transition ${
	                                isActive
	                                  ? "bg-[#61a740] text-white shadow-[0_12px_24px_rgba(97,167,64,0.22)]"
	                                  : isComplete
	                                    ? "bg-[#eef7e7] text-[#163126]"
	                                    : "bg-white text-[#5f6f66] disabled:cursor-not-allowed"
	                              }`}
	                            >
	                              <span
	                                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
	                                  isActive
	                                    ? "bg-white text-[#163126]"
	                                    : isComplete
	                                      ? "bg-[#61a740] text-white"
	                                      : "bg-[#f4f7f0] text-[#5f6f66]"
	                                }`}
	                              >
	                                {isComplete ? "✓" : step.id}
	                              </span>
	                              <span className="text-[11px] font-semibold leading-[1.1]">
	                                {step.label}
	                              </span>
	                            </button>
                          );
                        })}
                      </div>

	                      <div className="hidden grid-cols-3 gap-2 sm:grid">
	                        {CHECKOUT_STEPS.map((step) => {
	                          const isActive = step.id === activeStep;
	                          const isComplete = step.id < activeStep;
	                          const isReachable = step.id <= activeStep;

                          return (
	                            <button
	                              key={step.id}
	                              type="button"
	                              disabled={!isReachable}
	                              onClick={() => setActiveStep(step.id)}
	                              className={`min-h-[96px] rounded-[18px] border px-3 py-3 text-left transition sm:min-h-[104px] sm:px-4 ${
	                                isActive
	                                  ? "border-[#61a740] bg-[#61a740] text-white shadow-[0_14px_30px_rgba(97,167,64,0.22)]"
	                                  : isComplete
	                                    ? "border-[rgba(97,167,64,0.14)] bg-[#f4fbf6] text-[#163126]"
	                                    : "border-[rgba(26,58,46,0.08)] bg-[#fbfaf6] text-[#5f6f66] disabled:cursor-not-allowed"
	                              }`}
	                            >
	                              <div className="flex items-start gap-2.5 sm:gap-3">
	                                <div
	                                  className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold sm:h-9 sm:w-9 ${
	                                    isActive
	                                      ? "bg-white text-[#163126]"
	                                      : isComplete
	                                        ? "bg-[#61a740] text-white"
	                                        : "bg-white text-[#5f6f66]"
	                                  }`}
	                                >
	                                  {isComplete ? "✓" : step.id}
	                                </div>
	                                <div className="min-w-0 flex-1">
	                                  <p className="block truncate text-[9px] font-semibold uppercase tracking-[0.12em] opacity-80 sm:text-[10px]">{step.label}</p>
	                                  <p className="mt-1 text-[12px] font-semibold leading-[1.15] sm:text-[13px] sm:leading-[1.2]">
	                                    {step.navTitle}
	                                  </p>
	                                </div>
	                              </div>
	                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>

	                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-2 flex-1 rounded-full bg-[#e5ece4]">
                      <div
                        ref={progressBarRef}
                        className="h-full rounded-full bg-[linear-gradient(90deg,#61a740_0%,#61a740_100%)]"
                        style={{ width: `${(activeStep / CHECKOUT_STEPS.length) * 100}%` }}
                      />
                    </div>
                    <span className="inline-flex items-center rounded-full bg-[#fbfaf6] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5f6f66]">
                      {activeStep}/{CHECKOUT_STEPS.length}
                    </span>
                  </div>
                </div>

	                <div className={`px-5 py-4 sm:px-6 sm:py-4 lg:min-h-0 lg:flex-1 ${activeStep === 1 ? "lg:overflow-hidden" : "lg:overflow-y-auto"}`}>
                  {quoteError ? (
                    <div className="mb-5 rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
                      {quoteError}
                    </div>
                  ) : null}

                  <div ref={stepPanelRef}>
                      {activeStep === 1 ? (
	                        <div className="space-y-2.5">
	                          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.1fr)_minmax(300px,350px)] xl:items-start">
	                            <div className="space-y-2.5">
                              {activeItems.length === 0 ? (
                                <div className="rounded-[28px] border border-dashed border-[rgba(26,58,46,0.14)] bg-white px-6 py-12 text-center">
                                  <p className="text-lg font-semibold text-[#163126]">Tu checkout todavía no tiene productos.</p>
                                  <p className="mt-2 text-sm leading-7 text-[#5f6f66]">
                                    Elige tus Huele Huele para continuar con la compra.
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {activeItems.map((item) => {
                                    const product = resolvedProducts.find((candidate) => candidate.slug === item.slug);
                                    const image = resolveCheckoutProductImage(product);
                                    const lineTotal = (product?.price ?? 0) * item.quantity;
                                    const availableStock = getCheckoutAvailableStock(product);
                                    const stockLabel = resolveCheckoutStockLabel(product);
                                    const canIncrease =
                                      isCheckoutProductPurchasable(product) &&
                                      (!Number.isFinite(availableStock) || item.quantity < availableStock);

                                    return (
	                                      <div
		                                        key={item.slug}
		                                        className="rounded-[22px] border border-[rgba(26,58,46,0.08)] bg-white px-4 py-3.5 shadow-[0_14px_34px_rgba(16,33,24,0.04)] sm:px-5"
	                                      >
	                                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
	                                          <div className="flex min-w-0 items-center gap-4">
	                                            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-[20px] border border-[rgba(97,167,64,0.08)] bg-[linear-gradient(180deg,#f9fcf7_0%,#eef4ea_100%)] sm:h-24 sm:w-24">
	                                              {image.src ? (
	                                                <Image
                                                  fill
                                                  src={image.src}
                                                  loader={image.remote ? cloudflareImageLoader : undefined}
                                                  alt={image.alt}
                                                  sizes="(min-width: 640px) 96px, 80px"
                                                  className="object-cover"
                                                />
                                              ) : (
                                                <div className="flex h-full w-full items-center justify-center text-2xl">
                                                  {item.slug.includes("negro")
                                                    ? "🖤"
                                                    : item.slug.includes("combo") || item.slug.includes("pack")
                                                      ? "✨"
                                                      : "🌿"}
                                                </div>
                                              )}
	                                            </div>

	                                            <div className="min-w-0">
	                                              <h3 className="font-sans text-[1.05rem] font-semibold leading-tight text-[#163126] sm:text-[1.18rem]">
	                                                {product?.name ?? item.slug}
	                                              </h3>
	                                              <p className="mt-1 text-sm text-[#5f6f66]">
	                                                {item.quantity === 1 ? "1 unidad en tu pedido" : `${item.quantity} unidades en tu pedido`}
	                                              </p>
                                                {stockLabel ? (
                                                  <span
                                                    className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                                      product?.stockStatus === "out_of_stock"
                                                        ? "bg-rose-50 text-rose-700"
                                                        : "bg-[#fff7e8] text-[#8c6331]"
                                                    }`}
                                                  >
                                                    {stockLabel}
                                                  </span>
                                                ) : null}
	                                            </div>
	                                          </div>

	                                          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
	                                            <div className="inline-flex items-center justify-center rounded-full border border-[rgba(26,58,46,0.1)] bg-[#f6f4ed] p-1">
	                                              <button
	                                                type="button"
	                                                onClick={() => updateItem(item.slug, item.quantity - 1)}
	                                                disabled={item.quantity <= 1}
	                                                className="flex h-8 w-8 items-center justify-center rounded-full text-base text-[#163126] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
	                                              >
	                                                −
	                                              </button>
	                                              <span className="min-w-[38px] text-center text-sm font-semibold text-[#163126]">
	                                                {item.quantity}
	                                              </span>
	                                              <button
	                                                type="button"
	                                                onClick={() => updateItem(item.slug, item.quantity + 1)}
	                                                disabled={!canIncrease}
	                                                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#61a740] text-base text-white transition hover:bg-[#577e2f] disabled:cursor-not-allowed disabled:bg-[#cbd5c0]"
	                                              >
	                                                +
	                                              </button>
	                                            </div>

	                                            <div className="text-left lg:min-w-[120px] lg:text-right">
	                                              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5f6f66]">Total</p>
	                                              <p className="mt-1 font-sans text-lg font-semibold tracking-[-0.03em] text-[#163126]">
	                                                {formatCurrency(lineTotal, product?.currencyCode ?? summary.currencyCode)}
	                                              </p>
	                                            </div>

	                                            <button
	                                              type="button"
	                                              onClick={() => removeItem(item.slug)}
	                                              className="rounded-full border border-[rgba(190,24,93,0.12)] px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
	                                            >
	                                              Quitar
	                                            </button>
	                                          </div>
	                                        </div>
	                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

		                            <div className="px-1 py-0.5">
		                              <div className="flex items-center justify-between gap-3">
		                                <div>
		                                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8c6331]">Extras</p>
		                                  <p className="mt-0.5 text-sm text-[#5f6f66]">Si quieres, suma otro formato.</p>
		                                </div>
	                                {availableToAdd.length === 0 ? (
	                                  <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8c6331]">
	                                    Todo agregado
	                                  </span>
	                                ) : null}
	                              </div>

		                              {activeProductSlide ? (
		                                <>
		                                  <div className="relative mt-2 px-8">
		                                    <button
		                                      type="button"
		                                      onClick={() => moveProductSlider("prev")}
		                                      disabled={productSlideIndex <= 0}
		                                      className="absolute left-0 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[rgba(26,58,46,0.08)] bg-white text-base text-[#163126] shadow-[0_8px_20px_rgba(16,33,24,0.08)] transition hover:border-[#61a740]/35 hover:bg-[#f7fbf5] disabled:cursor-not-allowed disabled:opacity-35"
		                                      aria-label="Ver productos anteriores"
		                                    >
		                                      ←
		                                    </button>
			                                    <div
			                                      ref={productSlideCardRef}
			                                      className="relative w-full px-1 py-1 text-left transition"
			                                    >
				                                      <div className="grid min-h-[116px] grid-cols-[72px_minmax(0,1fr)] gap-x-3 gap-y-2 sm:min-h-[124px] sm:grid-cols-[84px_minmax(0,1fr)] sm:items-center">
			                                        <div className="relative h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-[18px] border border-[rgba(97,167,64,0.08)] bg-[linear-gradient(180deg,#f9fcf7_0%,#eef4ea_100%)] sm:h-[84px] sm:w-[84px]">
			                                          {activeProductSlide.image.src ? (
			                                            <Image
		                                              fill
		                                              src={activeProductSlide.image.src}
		                                              loader={activeProductSlide.image.remote ? cloudflareImageLoader : undefined}
		                                              alt={activeProductSlide.image.alt}
		                                              sizes="(min-width: 640px) 84px, 72px"
		                                              className="object-cover"
		                                            />
	                                          ) : (
	                                            <div className="flex h-full w-full items-center justify-center text-xl">
	                                              {activeProductSlide.product.slug.includes("negro")
	                                                ? "🖤"
	                                                : activeProductSlide.product.slug.includes("combo") || activeProductSlide.product.slug.includes("pack")
	                                                  ? "✨"
	                                                  : "🌿"}
	                                            </div>
	                                          )}
	                                        </div>

			                                        <div className="min-w-0 self-start sm:self-center sm:pr-14">
			                                          <p
			                                            className="font-sans text-[0.98rem] font-semibold leading-tight text-[#163126] sm:text-[1.12rem]"
			                                            style={{
			                                              display: "-webkit-box",
			                                              WebkitLineClamp: 3,
			                                              WebkitBoxOrient: "vertical",
			                                              overflow: "hidden",
			                                              minHeight: "3.2em"
			                                            }}
			                                          >
			                                            {activeProductSlide.product.name}
			                                          </p>
			                                          <div className="mt-1 flex flex-wrap items-center gap-2">
		                                            <p className="text-sm text-[#5f6f66]">
		                                              {formatCurrency(
		                                                activeProductSlide.product.price ?? 0,
		                                                activeProductSlide.product.currencyCode ?? summary.currencyCode
		                                              )}
	                                            </p>
	                                            <span className="inline-flex items-center rounded-full bg-[#fff7e8] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8c6331]">
	                                              {productSlideIndex + 1} / {productSlideCount}
			                                            </span>
                                                {resolveCheckoutStockLabel(activeProductSlide.product) ? (
                                                  <span className="inline-flex items-center rounded-full bg-[#fff7e8] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8c6331]">
                                                    {resolveCheckoutStockLabel(activeProductSlide.product)}
                                                  </span>
                                                ) : null}
			                                          </div>
			                                        </div>
			                                      </div>

			                                      {!activeProductSlide.selected ? (
				                                        <button
				                                          type="button"
				                                          onClick={() => addItem(activeProductSlide.product.slug)}
				                                          aria-label={`Sumar ${activeProductSlide.product.name}`}
				                                          className="mt-2 inline-flex h-11 w-11 items-center justify-center self-center rounded-full bg-[#61a740] text-xl font-semibold text-white transition hover:bg-[#577e2f] sm:absolute sm:right-12 sm:top-1/2 sm:mt-0 sm:-translate-y-1/2"
				                                        >
				                                          +
				                                        </button>
				                                      ) : (
				                                        <div className="hidden sm:absolute sm:right-12 sm:top-1/2 sm:h-11 sm:w-11 sm:-translate-y-1/2 sm:rounded-full" aria-hidden="true" />
				                                      )}

		                                    </div>
		                                    <button
		                                      type="button"
		                                      onClick={() => moveProductSlider("next")}
		                                      disabled={productSlideIndex >= productSlideCount - 1}
		                                      className="absolute right-0 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[rgba(26,58,46,0.08)] bg-white text-base text-[#163126] shadow-[0_8px_20px_rgba(16,33,24,0.08)] transition hover:border-[#61a740]/35 hover:bg-[#f7fbf5] disabled:cursor-not-allowed disabled:opacity-35"
		                                      aria-label="Ver productos siguientes"
		                                    >
		                                      →
		                                    </button>
		                                  </div>

		                                  <div className="mt-1.5 flex items-center justify-center gap-2">
		                                    {productPickerItems.map((item, index) => (
	                                      <button
	                                        key={`${item.product.slug}-dot`}
	                                        type="button"
	                                        onClick={() => setProductSlideIndex(index)}
	                                        aria-label={`Ver ${item.product.name}`}
	                                        className={`h-2.5 rounded-full transition ${
	                                          index === productSlideIndex ? "w-8 bg-[#61a740]" : "w-2.5 bg-[#dce7db] hover:bg-[#bdd4b1]"
	                                        }`}
	                                      />
	                                    ))}
	                                  </div>
	                                </>
	                              ) : (
	                                <div className="mt-4 rounded-[20px] border border-dashed border-[rgba(26,58,46,0.10)] bg-white px-4 py-6 text-center text-sm text-[#5f6f66]">
	                                  No hay más productos disponibles para agregar.
	                                </div>
	                              )}
	                            </div>
	                          </div>

	                          <div className="flex flex-col gap-3 border-t border-[rgba(26,58,46,0.08)] pt-3 sm:flex-row sm:items-center sm:justify-between">
                            <a
                              href="/catalogo"
                              className="inline-flex items-center justify-center rounded-full border border-[rgba(97,167,64,0.16)] px-5 py-3 text-sm font-semibold text-[#163126] transition hover:bg-[#f4fbf6]"
                            >
                              Volver al catálogo
                            </a>
	                            <button
	                              type="button"
	                              onClick={handleContinueFromStepOne}
	                              disabled={activeItems.length === 0 || hasBlockedStock}
		                              className="inline-flex min-h-[58px] items-center justify-center rounded-full bg-[#f15a29] px-7 py-3 text-[15px] font-semibold text-white shadow-[0_14px_34px_rgba(241,90,41,0.28)] transition hover:-translate-y-0.5 hover:bg-[#da4d1e] hover:shadow-[0_18px_42px_rgba(241,90,41,0.34)] disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[300px]"
		                            >
		                              Seguir con mis datos
		                            </button>
                          </div>
                        </div>
                      ) : null}

                      {activeStep === 2 ? (
                        <div className="space-y-5">
                          <div ref={identityPanelRef} className="space-y-5">
                            {stepTwoSection === 1 ? (
                              <div data-step-two-card className={`${sectionCardClassName} bg-[#fbfaf6]`}>
                                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                  <div className="max-w-[760px]">
                                    <div className="flex flex-wrap items-center gap-3">
                                      <span className="rounded-full bg-[#61a740] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                                        Paso 1
                                      </span>
                                      <span className="rounded-full bg-rose-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-600">
                                        Obligatorio
                                      </span>
                                    </div>
                                    <h3 className="mt-3 font-sans text-2xl font-semibold text-[#163126] sm:text-[2.2rem]">
                                      ¿Quién compra?
                                    </h3>
                                    <p className="mt-2 text-sm leading-6 text-[#5f6f66]">
                                      Elige el documento y confirma el nombre.
                                    </p>
                                  </div>
                                  <div className="rounded-full border border-[rgba(26,58,46,0.08)] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#163126]">
                                    {customer.documentType ? customer.documentType.toUpperCase() : "Documento pendiente"}
                                  </div>
                                </div>

                                <div className="mt-6 grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)_180px]">
                                  <div>
                                    <label className={labelClassName}>Tipo de documento *</label>
                                    <div className="relative">
                                      <select
                                        className={`${fieldClassName} appearance-none pr-10`}
                                        value={customer.documentType}
                                        onChange={(event) => handleDocumentTypeChange(event.target.value as CheckoutDocumentType | "")}
                                      >
                                        <option value="">Selecciona tu documento</option>
                                        {CHECKOUT_DOCUMENT_TYPE_OPTIONS.map((option) => (
                                          <option key={option.value} value={option.value}>
                                            {option.label}
                                          </option>
                                        ))}
                                      </select>
                                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#5f6f66]">
                                        ▾
                                      </span>
                                    </div>
                                  </div>

                                  <div>
                                    <label className={labelClassName}>Número de documento *</label>
                                    <input
                                      className={`${fieldClassName} disabled:cursor-not-allowed disabled:bg-[#f2f4f1] disabled:text-[#94a39a]`}
                                      type="text"
                                      inputMode={selectedDocumentType?.inputMode ?? "text"}
                                      maxLength={getDocumentMaxLength(customer.documentType)}
                                      placeholder={selectedDocumentType?.placeholder ?? "Selecciona primero el tipo de documento"}
                                      value={customer.documentNumber}
                                      onChange={(event) => {
                                        lastDocumentLookupRef.current = null;
                                        setMatchedCustomer(null);
                                        setIdentityLookupStatus(customer.documentType === "dni" ? "idle" : customer.documentType ? "manual" : "idle");
                                        setIdentityMessage(
                                          customer.documentType === "dni"
                                            ? "Puedes validar tu DNI para autocompletar el nombre o escribirlo manualmente."
                                            : null
                                        );
                                        setCustomer((current) => ({
                                          ...current,
                                          documentNumber: normalizeDocumentNumber(event.target.value, current.documentType).slice(
                                            0,
                                            getDocumentMaxLength(current.documentType)
                                          )
                                        }));
                                      }}
                                      disabled={!customer.documentType}
                                    />
                                  </div>

                                  <div className="flex items-end">
                                    <button
                                      type="button"
                                      onClick={() => void handleDocumentLookup()}
                                      disabled={!customer.documentType || identityLookupStatus === "loading"}
                                      className="inline-flex min-h-[56px] w-full items-center justify-center rounded-[20px] bg-[#61a740] px-5 text-sm font-semibold text-white transition hover:bg-[#577e2f] disabled:cursor-not-allowed disabled:opacity-45"
                                    >
                                      {identityLookupStatus === "loading"
                                        ? "Consultando..."
                                        : customer.documentType === "dni"
                                          ? "Validar documento"
                                          : "Buscar datos"}
                                    </button>
                                  </div>
                                </div>

                                {identityMessage ? (
                                  <div
                                    className={`mt-5 rounded-[24px] border px-5 py-4 text-sm leading-7 ${
                                      identityLookupStatus === "error"
                                        ? "border-rose-200 bg-rose-50 text-rose-700"
                                        : identityLookupStatus === "verified"
                                          ? "border-[rgba(97,167,64,0.14)] bg-[#f4fbf6] text-[#61a740]"
                                          : "border-[rgba(26,58,46,0.08)] bg-white text-[#5f6f66]"
                                    }`}
                                  >
                                    {identityMessage}
                                  </div>
                                ) : null}

                                <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                                  <div>
                                    <label className={labelClassName}>Nombre completo *</label>
                                    <input
                                      className={`${fieldClassName} ${requiresDniLookup && identityLookupStatus === "verified" ? "cursor-not-allowed bg-[#f2f4f1] text-[#5f6f66]" : ""}`}
                                      type="text"
                                      placeholder={requiresDniLookup && identityLookupStatus === "verified" ? "Se completa con el DNI validado" : "Tu nombre y apellido"}
                                      value={customer.fullName}
                                      onChange={(event) => setCustomer((current) => ({ ...current, fullName: event.target.value }))}
                                      readOnly={requiresDniLookup && identityLookupStatus === "verified"}
                                    />
                                  </div>

                                  <div className="rounded-[24px] border border-[rgba(26,58,46,0.08)] bg-white px-5 py-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#61a740]">
                                      Estado
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-[#163126]">
                                      {requiresDniLookup
                                        ? identityLookupStatus === "verified"
                                          ? "Documento validado."
                                          : identityLookupStatus === "manual"
                                            ? "Validación automática no disponible. Completa el nombre manualmente."
                                            : "Valida el documento o completa el nombre manualmente."
                                        : "Si usas otro documento, ingresa tu nombre completo."}
                                    </p>
                                    {matchedCustomer ? (
                                      <p className="mt-2 text-sm leading-6 text-[#5f6f66]">
                                        Ya encontramos una compra previa de {matchedCustomer.fullName}.
                                      </p>
                                    ) : null}
                                  </div>
                                </div>

                                <div className="mt-6 flex flex-col gap-3 border-t border-[rgba(26,58,46,0.08)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                                  <button
                                    type="button"
                                    onClick={() => setActiveStep(1)}
                                    className="inline-flex items-center justify-center rounded-full border border-[rgba(97,167,64,0.16)] px-5 py-3 text-sm font-semibold text-[#163126] transition hover:bg-[#f4fbf6]"
                                  >
                                    Volver al pedido
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setStepTwoSection(2)}
                                    disabled={!canAdvanceFromDocument}
                                    className={stepTwoPrimaryButtonClassName}
                                  >
                                    Siguiente: entrega
                                  </button>
                                </div>
                              </div>
                            ) : null}

                            {stepTwoSection === 2 ? (
                              <div data-step-two-card className={sectionCardClassName}>
                                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                  <div className="max-w-[760px]">
                                    <span className="rounded-full bg-[#61a740] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                                      Paso 2
                                    </span>
                                    <h3 className="mt-3 font-sans text-2xl font-semibold text-[#163126] sm:text-[2.2rem]">
                                      ¿Cómo lo recibes?
                                    </h3>
                                    <p className="mt-2 text-sm leading-6 text-[#5f6f66]">
                                      Elige una sola opción.
                                    </p>
                                  </div>
                                  <div
                                    className={`rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                                      provinceShalomPickup
                                        ? "bg-[#fff7e8] text-[#7a5e1c]"
                                        : "bg-[#f4fbf6] text-[#61a740]"
                                    }`}
                                  >
                                    {provinceShalomPickup ? "Shalom provincias" : "Delivery Lima y Callao"}
                                  </div>
                                </div>

                                <div className="mt-6 grid gap-4 xl:grid-cols-2" role="radiogroup" aria-label="Tipo de entrega">
                                  <button
                                    type="button"
                                    role="radio"
                                    aria-checked={!provinceShalomPickup}
                                    onClick={() => handleProvinceModeChange(false)}
                                    className={`min-h-[164px] rounded-[24px] border p-5 text-left transition ${
                                      !provinceShalomPickup
                                        ? "border-[#61a740] bg-[#61a740] text-white shadow-[0_18px_34px_rgba(97,167,64,0.22)] ring-2 ring-[#61a740]/30"
                                        : "border-[rgba(26,58,46,0.08)] bg-[#fbfaf6] text-[#163126] hover:border-[#61a740]/30"
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-4">
                                      <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-80">
                                          Opción 1
                                        </p>
                                        <h4 className="mt-3 font-sans text-[1.75rem] font-semibold">
                                          Delivery Lima y Callao
                                        </h4>
                                        <p className="mt-2 max-w-[320px] text-sm leading-6 opacity-85">
                                          Solo para Lima y Callao. Lo llevamos a tu dirección.
                                        </p>
                                      </div>
                                      <span
                                        className={`mt-1 flex h-10 w-10 items-center justify-center rounded-full border text-base font-bold ${
                                          !provinceShalomPickup
                                            ? "border-white bg-white text-[#163126]"
                                            : "border-[rgba(26,58,46,0.14)] bg-white text-transparent"
                                        }`}
                                        aria-hidden="true"
                                      >
                                        ✓
                                      </span>
                                    </div>
                                  </button>

                                  <button
                                    type="button"
                                    role="radio"
                                    aria-checked={provinceShalomPickup}
                                    onClick={() => handleProvinceModeChange(true)}
                                    className={`min-h-[164px] rounded-[24px] border p-5 text-left transition ${
                                      provinceShalomPickup
                                        ? "border-[#61a740] bg-[#61a740] text-white shadow-[0_18px_34px_rgba(97,167,64,0.22)] ring-2 ring-[#61a740]/30"
                                        : "border-[rgba(26,58,46,0.08)] bg-[#fbfaf6] text-[#163126] hover:border-[#61a740]/30"
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-4">
                                      <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-80">
                                          Opción 2
                                        </p>
                                        <h4 className="mt-3 font-sans text-[1.75rem] font-semibold">
                                          Shalom provincias
                                        </h4>
                                        <p className="mt-2 max-w-[320px] text-sm leading-6 opacity-85">
                                          Para provincias. Lo recoges en agencia y el flete se paga al retirar.
                                        </p>
                                      </div>
                                      <span
                                        className={`mt-1 flex h-10 w-10 items-center justify-center rounded-full border text-base font-bold ${
                                          provinceShalomPickup
                                            ? "border-white bg-white text-[#163126]"
                                            : "border-[rgba(26,58,46,0.14)] bg-white text-transparent"
                                        }`}
                                        aria-hidden="true"
                                      >
                                        ✓
                                      </span>
                                    </div>
                                  </button>
                                </div>

                                <div
                                  className={`mt-5 rounded-[24px] px-5 py-4 text-sm leading-7 ${
                                    provinceShalomPickup
                                      ? "border border-[#c9a84c]/25 bg-[#fff7e8] text-[#7a5e1c]"
                                      : "border border-[rgba(97,167,64,0.10)] bg-[#f4fbf6] text-[#61a740]"
                                  }`}
                                >
                                  {provinceShalomPickup
                                    ? "Si estás en provincia, coordinamos por Shalom y el flete se paga al recoger."
                                    : "Si estás en Lima o Callao, te lo enviamos a la dirección que completes en el siguiente paso."}
                                </div>

                                <div className="mt-6 flex flex-col gap-3 border-t border-[rgba(26,58,46,0.08)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                                  <button
                                    type="button"
                                    onClick={() => setStepTwoSection(1)}
                                    className="inline-flex items-center justify-center rounded-full border border-[rgba(97,167,64,0.16)] px-5 py-3 text-sm font-semibold text-[#163126] transition hover:bg-[#f4fbf6]"
                                  >
                                    Volver al documento
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setStepTwoSection(3)}
                                    className={stepTwoPrimaryButtonClassName}
                                  >
                                    Siguiente: ubicación
                                  </button>
                                </div>
                              </div>
                            ) : null}

                            {stepTwoSection === 3 ? (
                              <div data-step-two-card className={sectionCardClassName}>
                                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                  <div className="max-w-[760px]">
                                    <span className="rounded-full bg-[#61a740] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                                      Paso 3
                                    </span>
                                    <h3 className="mt-3 font-sans text-2xl font-semibold text-[#163126] sm:text-[2.2rem]">
                                      {provinceShalomPickup ? "¿En qué ciudad y agencia lo recoges?" : "¿A dónde lo enviamos en Lima o Callao?"}
                                    </h3>
                                    <p className="mt-2 text-sm leading-6 text-[#5f6f66]">
                                      {provinceShalomPickup
                                        ? "Elige tu ubigeo y completa la referencia final."
                                        : "Elige tu ubigeo de Lima o Callao y completa la referencia final."}
                                    </p>
                                  </div>
                                  <div className="rounded-[22px] border border-[rgba(26,58,46,0.08)] bg-[#fbfaf6] px-4 py-3 text-sm font-medium text-[#163126]">
                                    {locationSummary || "Ubicación pendiente"}
                                  </div>
                                </div>

                                <div className="mt-6 grid gap-4 lg:grid-cols-3">
                                  <div>
                                    <label className={labelClassName}>Departamento *</label>
                                    <div className="relative">
                                      <select
                                        className={`${fieldClassName} appearance-none pr-10`}
                                        value={address.departmentCode}
                                        onChange={(event) => handleDepartmentChange(event.target.value)}
                                      >
                                        <option value="">
                                          {departmentsLoading
                                            ? "Cargando departamentos..."
                                            : provinceShalomPickup
                                              ? "Selecciona departamento"
                                              : "Selecciona Lima o Callao"}
                                        </option>
                                        {availableDepartments.map((option) => (
                                          <option key={option.code} value={option.code}>
                                            {option.name}
                                          </option>
                                        ))}
                                      </select>
                                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#5f6f66]">
                                        ▾
                                      </span>
                                    </div>
                                  </div>

                                  <div>
                                    <label className={labelClassName}>Provincia *</label>
                                    <div className="relative">
                                      <select
                                        className={`${fieldClassName} appearance-none pr-10 disabled:cursor-not-allowed disabled:bg-[#f2f4f1] disabled:text-[#94a39a]`}
                                        value={address.provinceCode}
                                        onChange={(event) => handleProvinceChange(event.target.value)}
                                        disabled={!address.departmentCode}
                                      >
                                        <option value="">
                                          {provincesLoading
                                            ? "Cargando provincias..."
                                            : address.departmentCode
                                              ? "Selecciona provincia"
                                              : "Elige antes un departamento"}
                                        </option>
                                        {availableProvinces.map((option) => (
                                          <option key={option.code} value={option.code}>
                                            {option.name}
                                          </option>
                                        ))}
                                      </select>
                                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#5f6f66]">
                                        ▾
                                      </span>
                                    </div>
                                  </div>

                                  <div>
                                    <label className={labelClassName}>Distrito *</label>
                                    <div className="relative">
                                      <select
                                        className={`${fieldClassName} appearance-none pr-10 disabled:cursor-not-allowed disabled:bg-[#f2f4f1] disabled:text-[#94a39a]`}
                                        value={address.districtCode}
                                        onChange={(event) => handleDistrictChange(event.target.value)}
                                        disabled={!address.provinceCode}
                                      >
                                        <option value="">
                                          {districtsLoading
                                            ? "Cargando distritos..."
                                            : address.provinceCode
                                              ? "Selecciona distrito"
                                              : "Elige antes una provincia"}
                                        </option>
                                        {districts.map((option) => (
                                          <option key={option.code} value={option.code}>
                                            {option.name}
                                          </option>
                                        ))}
                                      </select>
                                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#5f6f66]">
                                        ▾
                                      </span>
                                    </div>
                                  </div>

                                  <div className="lg:col-span-2">
                                    <label className={labelClassName}>
                                      {provinceShalomPickup ? "Dirección o referencia *" : "Dirección de entrega *"}
                                    </label>
                                    <input
                                      className={fieldClassName}
                                      type="text"
                                      placeholder={
                                        provinceShalomPickup
                                          ? "Calle, referencia o zona donde te encuentras"
                                          : "Calle, número, urbanización, referencia"
                                      }
                                      value={address.line1}
                                      onChange={(event) => setAddress((current) => ({ ...current, line1: event.target.value }))}
                                    />
                                  </div>

                                  {provinceShalomPickup ? (
                                    <div>
                                      <label className={labelClassName}>Sucursal Shalom *</label>
                                      <input
                                        className={fieldClassName}
                                        type="text"
                                        placeholder="Ej: Shalom Juliaca Centro"
                                        value={address.agencyName}
                                        onChange={(event) => setAddress((current) => ({ ...current, agencyName: event.target.value }))}
                                      />
                                    </div>
                                  ) : null}
                                </div>

                                <div className="mt-6 flex flex-col gap-3 border-t border-[rgba(26,58,46,0.08)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                                  <button
                                    type="button"
                                    onClick={() => setStepTwoSection(2)}
                                    className="inline-flex items-center justify-center rounded-full border border-[rgba(97,167,64,0.16)] px-5 py-3 text-sm font-semibold text-[#163126] transition hover:bg-[#f4fbf6]"
                                  >
                                    Volver a entrega
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setStepTwoSection(4)}
                                    disabled={!canAdvanceFromLocation}
                                    className={stepTwoPrimaryButtonClassName}
                                  >
                                    Siguiente: contacto
                                  </button>
                                </div>
                              </div>
                            ) : null}

                            {stepTwoSection === 4 ? (
                              <div data-step-two-card className={sectionCardClassName}>
                                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                  <div className="max-w-[760px]">
                                    <span className="rounded-full bg-[#61a740] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                                      Paso 4
                                    </span>
                                    <h3 className="mt-3 font-sans text-2xl font-semibold text-[#163126] sm:text-[2.2rem]">
                                      ¿Por dónde te avisamos?
                                    </h3>
                                    <p className="mt-2 text-sm leading-6 text-[#5f6f66]">
                                      Déjanos el canal principal para coordinar el pedido.
                                    </p>
                                  </div>
                                  <div className="rounded-full bg-[#f4fbf6] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#61a740]">
                                    WhatsApp obligatorio
                                  </div>
                                </div>

                                <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)]">
                                  <div>
                                    <label className={labelClassName}>WhatsApp *</label>
                                    <input
                                      className={fieldClassName}
                                      type="tel"
                                      placeholder="+51 999 000 000"
                                      value={customer.phone}
                                      onChange={(event) => setCustomer((current) => ({ ...current, phone: event.target.value }))}
                                    />
                                  </div>

                                  <div className="lg:col-span-2">
                                    <label className={labelClassName}>Email</label>
                                    <input
                                      className={fieldClassName}
                                      type="email"
                                      placeholder="tu@correo.com"
                                      value={customer.email}
                                      onChange={(event) => setCustomer((current) => ({ ...current, email: event.target.value }))}
                                    />
                                  </div>
                                </div>

                                <div className="mt-6 flex flex-col gap-3 border-t border-[rgba(26,58,46,0.08)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                                  <button
                                    type="button"
                                    onClick={() => setStepTwoSection(3)}
                                    className="inline-flex items-center justify-center rounded-full border border-[rgba(97,167,64,0.16)] px-5 py-3 text-sm font-semibold text-[#163126] transition hover:bg-[#f4fbf6]"
                                  >
                                    Volver a ubicación
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleContinueFromStepTwo}
                                    disabled={!canAdvanceFromContact}
                                    className={stepTwoPrimaryButtonClassName}
                                  >
                                    Continuar al pago
                                  </button>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ) : null}

                      {activeStep === 3 ? (
                        <div className="space-y-4">
                          <div className="grid gap-3 lg:grid-cols-2">
                            <div className="rounded-[24px] border border-[rgba(26,58,46,0.08)] bg-[#fbfaf6] p-4">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#61a740]">
                                Contacto
                              </p>
                              <h3 className="mt-2 font-sans text-[1.8rem] font-semibold leading-none tracking-[-0.03em] text-[#163126] sm:text-[2.15rem]">
                                {customer.fullName || "Nombre pendiente"}
                              </h3>
                              <div className="mt-3 space-y-1.5 text-sm leading-6 text-[#5f6f66]">
                                <p>WhatsApp: {customer.phone || "Pendiente"}</p>
                                <p>Email: {customer.email || "No ingresado"}</p>
                                {customer.documentType ? (
                                  <p>
                                    Documento: {customer.documentType.toUpperCase()} {customer.documentNumber || "Pendiente"}
                                  </p>
                                ) : null}
                              </div>
                            </div>

                            <div className="rounded-[24px] border border-[rgba(26,58,46,0.08)] bg-[#fbfaf6] p-4">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#61a740]">
                                Ubicación y entrega
                              </p>
                              <h3 className="mt-2 font-sans text-lg font-semibold text-[#163126]">
                                {provinceShalomPickup ? "Recojo en provincia" : "Entrega convencional"}
                              </h3>
                              <div className="mt-3 space-y-1.5 text-sm leading-6 text-[#5f6f66]">
                                <p>{address.line1 || "Dirección pendiente"}</p>
                                <p>{locationSummary || "Ubigeo pendiente"}</p>
                                {provinceShalomPickup ? (
                                  <p>Sucursal Shalom: {address.agencyName || "Pendiente"}</p>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <div className="rounded-[26px] bg-[#61a740] p-5 text-[#163126] shadow-[0_18px_34px_rgba(97,167,64,0.24)]">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#163126]/68">
                              Método de pago vigente
                            </p>
                            <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
                              <div>
                                <h3 className="font-sans text-xl font-semibold">Pago manual con billetera virtual</h3>
                                <p className="mt-1 max-w-[520px] text-sm leading-6 text-[#163126]/78">
                                  Toca pagar ahora, haz tu pago con billetera virtual y luego sube tu comprobante para confirmar el pedido.
                                </p>
                                <div className="mt-4 rounded-[22px] border border-[#163126]/10 bg-[#eef6e8] px-4 py-4">
                                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#163126]/62">
                                        {paymentWalletType}
                                      </p>
                                      {paymentWalletNumber ? (
                                        <p className="mt-2 font-mono text-[1.5rem] font-semibold tracking-[-0.02em] text-[#163126]">
                                          {paymentWalletNumber}
                                        </p>
                                      ) : (
                                        <p className="mt-2 text-sm text-[#163126]/72">
                                          Aún no hay un número configurado para recibir el pago.
                                        </p>
                                      )}
                                      {paymentWalletOwner ? (
                                        <p className="mt-2 text-sm text-[#163126]/78">Titular: {paymentWalletOwner}</p>
                                      ) : null}
                                      <p className="mt-3 text-xs font-medium leading-6 text-[#163126]/72">
                                        Paso 1: paga con tu billetera virtual. Paso 2: sube tu comprobante.
                                      </p>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                      <button
                                        type="button"
                                        onClick={handleOpenPaymentModal}
                                        disabled={submitting || activeItems.length === 0 || !paymentWalletNumber}
                                        className="inline-flex items-center justify-center gap-2.5 rounded-full bg-[#f15a29] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#d94f20] disabled:cursor-not-allowed disabled:opacity-45"
                                      >
                                        <PaymentFlatIcon className="h-[18px] w-[18px] flex-shrink-0" />
                                        {submitting ? "Abriendo pago..." : "Pagar ahora"}
                                      </button>
                                      <div className="flex flex-col gap-2 sm:flex-row">
                                        <button
                                          type="button"
                                          onClick={() => void handleCopyPaymentNumber()}
                                          disabled={!paymentWalletNumber}
                                          className="inline-flex items-center justify-center gap-2.5 rounded-full bg-[#577e2f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4f702a] disabled:cursor-not-allowed disabled:opacity-45"
                                        >
                                          <CopyFlatIcon className="h-[18px] w-[18px] flex-shrink-0" />
                                          {paymentCopied ? "Numero copiado" : "Copiar numero"}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={handleOpenPaymentModal}
                                          disabled={submitting || activeItems.length === 0}
                                          className="inline-flex items-center justify-center gap-2.5 rounded-full border border-[#163126]/12 bg-white px-4 py-2 text-sm font-semibold text-[#163126] transition hover:bg-[#f7f4ec] disabled:cursor-not-allowed disabled:opacity-45"
                                        >
                                          <ReceiptUploadFlatIcon className="h-[18px] w-[18px] flex-shrink-0" />
                                          {submitting ? "Abriendo..." : "Ya pagué, subir comprobante"}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="rounded-[22px] bg-[#577e2f] px-5 py-4 text-left text-white">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/68">
                                  Total a pagar ahora
                                </p>
                                <p className="mt-2 font-sans text-4xl font-extrabold tracking-[-0.03em]">
                                  {formatCurrency(summary.grandTotal, summary.currencyCode)}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-3 border-t border-[rgba(26,58,46,0.08)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveStep(2);
                                setStepTwoSection(4);
                              }}
                              className="inline-flex items-center justify-center rounded-full border border-[rgba(97,167,64,0.16)] px-5 py-3 text-sm font-semibold text-[#163126] transition hover:bg-[#f4fbf6]"
                            >
                              Volver a datos y envío
                            </button>
                            <span className="text-sm font-medium text-[#5f6f66]">
                              Primero paga con tu billetera virtual y luego sube tu comprobante para cerrar el pedido.
                            </span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </section>
              </div>

	              <aside data-checkout-intro className="lg:flex lg:min-h-0 lg:flex-col">
	                <div className="rounded-[30px] border border-[rgba(26,58,46,0.08)] bg-white/96 p-5 shadow-[0_24px_60px_rgba(16,33,24,0.06)] lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
	                  <div>
	                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#61a740]">
	                      Resumen
	                    </p>
	                    <h3 className="mt-1 font-sans text-xl font-semibold text-[#163126]">Tu pedido</h3>
	                  </div>

	                  <div className="mt-4 rounded-[22px] border border-[rgba(26,58,46,0.08)] bg-[#fbfaf6] p-4 lg:min-h-0 lg:flex-1">
	                    <div className="flex items-center justify-between gap-3">
	                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#61a740]">Productos</p>
	                      <span className="text-xs font-medium text-[#5f6f66]">{activeItemUnits} uds</span>
	                    </div>

	                    <div className="mt-3 space-y-2">
	                      {activeItems.length === 0 ? (
	                        <p className="text-sm leading-6 text-[#5f6f66]">Aún no agregas productos al checkout.</p>
	                      ) : (
	                        <>
	                          {summaryPreviewItems.map(({ item, product, lineTotal }) => (
	                            <div key={item.slug} className="flex items-start justify-between gap-3 rounded-[18px] bg-white px-3 py-3">
	                              <div className="min-w-0 flex-1">
	                                <p className="truncate text-sm font-semibold text-[#163126]">{product?.name ?? item.slug}</p>
	                                <p className="text-xs text-[#5f6f66]">x {item.quantity}</p>
	                              </div>
	                              <p className="text-sm font-semibold text-[#163126]">
	                                {formatCurrency(lineTotal, product?.currencyCode ?? summary.currencyCode)}
	                              </p>
	                            </div>
	                          ))}
	                          {summaryOverflowCount > 0 ? (
	                            <div className="flex items-start justify-between gap-3 rounded-[18px] border border-dashed border-[rgba(26,58,46,0.08)] bg-white/70 px-3 py-3">
	                              <div className="min-w-0 flex-1">
	                                <p className="text-sm font-semibold text-[#163126]">+{summaryOverflowCount} producto{summaryOverflowCount > 1 ? "s" : ""} más</p>
	                                <p className="text-xs text-[#5f6f66]">{summaryOverflowUnits} uds</p>
	                              </div>
	                              <p className="text-sm font-semibold text-[#163126]">
	                                {formatCurrency(summaryOverflowTotal, summary.currencyCode)}
	                              </p>
	                            </div>
	                          ) : null}
	                        </>
	                      )}
	                    </div>
	                  </div>

                  <div className="mt-4 space-y-3 border-t border-[rgba(26,58,46,0.08)] pt-4">
                    <SummaryLine label="Subtotal" value={formatCurrency(summary.subtotal, summary.currencyCode)} />
                    <SummaryLine
                      label={provinceShalomPickup ? "Envío Shalom" : "Envío"}
                      value={provinceShalomPickup ? "Pago al recoger" : formatCurrency(summary.shipping, summary.currencyCode)}
                    />
                    <SummaryLine
                      label={provinceShalomPickup ? "Total ahora" : "Total"}
                      value={formatCurrency(summary.grandTotal, summary.currencyCode)}
                      strong
                    />
                  </div>

                  <div className="mt-4 rounded-[22px] border border-[rgba(26,58,46,0.08)] bg-[#fbfaf6] p-4">
                    {activeItems.length === 0 ? (
                      <p className="text-sm leading-6 text-[#5f6f66]">Sin productos en el carrito.</p>
                    ) : (
                      <>
                        {provinceShalomPickup ? (
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#61a740]">Envío a provincia</p>
                            <p className="mt-2 text-sm leading-6 text-[#5f6f66]">{shippingNote}</p>
                          </div>
                        ) : shippingThreshold > 0 ? (
                          <div>
                            <div className="flex items-center justify-between gap-3 text-xs font-medium text-[#5f6f66]">
                              <span>{shippingRemaining > 0 ? "Progreso para envío gratis" : "Envío gratis desbloqueado"}</span>
                              <span>{Math.round(shippingProgress)}%</span>
                            </div>
                            <div className="mt-3 h-2 rounded-full bg-[#dce7db]">
                              <div
                                className="h-full rounded-full bg-[linear-gradient(90deg,#61a740_0%,#61a740_100%)]"
                                style={{ width: `${shippingProgress}%` }}
                              />
                            </div>
                            <p className="mt-2 text-sm leading-6 text-[#5f6f66]">
                              {shippingRemaining > 0
                                ? `Te faltan ${formatCurrency(shippingRemaining, summary.currencyCode)} para activar el envío gratis.`
                                : `Tu pedido ya alcanzó el umbral de ${formatCurrency(shippingThreshold, summary.currencyCode)} para envío gratis.`}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm leading-6 text-[#5f6f66]">{shippingNote}</p>
                        )}
                      </>
                    )}
                  </div>

                  {quoteLoading ? (
                    <p className="mt-4 text-sm text-[#5f6f66]">Calculando totales actualizados...</p>
                  ) : null}
                  {whatsappHref ? (
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#163126] transition hover:text-[#61a740]"
                    >
                      ¿Necesitas ayuda?
                      <span aria-hidden="true">↗</span>
                    </a>
                  ) : null}
                </div>
              </aside>
            </div>
        )}

        <YapePaymentModal
          open={showYapeModal}
          walletNumber={siteSettings?.yapeNumber ?? ""}
          walletType={siteSettings?.walletType ?? "Billetera virtual"}
          walletOwnerName={siteSettings?.walletOwnerName ?? ""}
          total={formatCurrency(summary.grandTotal, summary.currencyCode)}
          onConfirm={(evidenceImageUrl) => {
            setShowYapeModal(false);
            void handleSubmit(evidenceImageUrl);
          }}
          onClose={() => setShowYapeModal(false)}
        />
      </div>
    </div>
  );
}

function SummaryLine({
  label,
  value,
  strong
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 ${strong ? "text-base font-semibold text-[#163126]" : "text-sm text-[#5f6f66]"}`}>
      <span>{label}</span>
      <span className={strong ? "font-sans text-2xl font-extrabold tracking-[-0.03em]" : "font-semibold text-[#163126]"}>{value}</span>
    </div>
  );
}
