import type {
  ActionEnvelope,
  AuthCredentialsInput,
  AuthRegisterInput,
  AuthSessionSummary,
  SellerPanelOverviewSummary,
  SiteSetting,
  CmsSnapshotEnvelope,
  CatalogProduct,
  CatalogSummaryResponse,
  CheckoutActionSummary,
  CheckoutDocumentLookupInput,
  CheckoutDocumentLookupSummary,
  CheckoutQuoteInput,
  CheckoutQuoteSummary,
  CheckoutRequestInput,
  LoyaltySummaryEnvelope,
  PeruDepartmentSummary,
  PeruDistrictSummary,
  PeruProvinceSummary,
  VendorApplicationInput,
  VendorApplicationSummary,
  WholesaleLeadInput,
  WholesalePlan,
  WholesaleLeadSummary
} from "@huelegood/shared";

const localApiBaseUrl = "http://localhost:4000/api/v1";

function normalizeBaseUrl(value: string | undefined) {
  const normalized = value?.replace(/\/$/, "");
  return normalized || undefined;
}

function inferHostedApiBaseUrl() {
  if (typeof window === "undefined") {
    return undefined;
  }

  const { protocol, hostname } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return undefined;
  }

  const hostParts = hostname.split(".");
  if (hostParts.length < 2) {
    return undefined;
  }

  const rootDomain = hostParts.slice(-2).join(".");
  return `${protocol}//api.${rootDomain}/api/v1`;
}

export function getApiBaseUrl() {
  return normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL) ?? inferHostedApiBaseUrl() ?? localApiBaseUrl;
}

async function requestJson<T>(path: string, init: RequestInit = {}) {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {})
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No pudimos conectar con el API.";
    throw new Error(`No pudimos conectar con el API (${url}). ${message}`);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.message ?? payload?.error ?? `HTTP ${response.status}`;
    throw new Error(Array.isArray(message) ? message.join(", ") : String(message));
  }

  return payload as T;
}

export function getSessionHeaders(token?: string): HeadersInit | undefined {
  return token ? { authorization: `Bearer ${token}` } : undefined;
}

export async function fetchCatalogSummary() {
  return requestJson<CatalogSummaryResponseEnvelope>("/store/catalog", {
    cache: "no-store"
  });
}

export async function fetchCatalogProducts() {
  return requestJson<CatalogProductsEnvelope>("/store/products", {
    cache: "no-store"
  });
}

export async function fetchProductBySlug(slug: string) {
  return requestJson<CatalogProductEnvelope>(`/store/products/${slug}`, {
    cache: "no-store"
  });
}

export async function fetchCheckoutQuote(body: CheckoutQuoteInput) {
  return requestJson<CheckoutQuoteEnvelope>("/store/checkout/quote", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function fetchCheckoutDocumentLookup(body: CheckoutDocumentLookupInput) {
  return requestJson<CheckoutDocumentLookupEnvelope>("/store/checkout/document-lookup", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function fetchPeruDepartments() {
  return requestJson<PeruDepartmentsEnvelope>("/store/checkout/ubigeo/departments", {
    cache: "no-store"
  });
}

export async function fetchPeruProvinces(departmentCode: string) {
  return requestJson<PeruProvincesEnvelope>(`/store/checkout/ubigeo/provinces/${departmentCode}`, {
    cache: "no-store"
  });
}

export async function fetchPeruDistricts(provinceCode: string) {
  return requestJson<PeruDistrictsEnvelope>(`/store/checkout/ubigeo/districts/${provinceCode}`, {
    cache: "no-store"
  });
}

export async function createOpenpayCheckout(body: CheckoutRequestInput) {
  return requestJson<CheckoutActionEnvelope>("/store/checkout/openpay", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function createManualCheckout(body: CheckoutRequestInput) {
  return requestJson<CheckoutActionEnvelope>("/store/checkout/manual", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function uploadPaymentEvidence(file: File): Promise<{ url: string }> {
  const url = `${getApiBaseUrl()}/store/checkout/evidence`;
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      body: formData,
      mode: "cors"
    });
  } catch (error) {
    console.error("Payment evidence upload failed", {
      url,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      error
    });

    const rawMessage = error instanceof Error ? error.message : "";
    if (rawMessage.toLowerCase().includes("failed to fetch")) {
      throw new Error("No pudimos conectar con el servicio para subir el comprobante. Revisa tu conexión e inténtalo otra vez.");
    }

    throw new Error(`No pudimos subir el comprobante. ${rawMessage}`.trim());
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.message ?? payload?.error ?? `HTTP ${response.status}`;
    const normalizedMessage = Array.isArray(message) ? message.join(", ") : String(message);

    if (response.status === 413 || normalizedMessage.toLowerCase().includes("file too large")) {
      throw new Error("El comprobante supera el máximo de 5 MB. Súbelo más liviano o vuelve a exportarlo.");
    }

    throw new Error(normalizedMessage);
  }

  return payload as { url: string };
}

export async function submitWholesaleLead(body: WholesaleLeadInput) {
  return requestJson<WholesaleLeadActionEnvelope>("/store/wholesale-leads", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function fetchWholesaleTiers() {
  return requestJson<WholesaleTiersEnvelope>("/store/wholesale-tiers");
}

export async function fetchCmsSnapshot() {
  return requestJson<CmsSnapshotEnvelope>("/store/cms", {
    cache: "no-store"
  });
}

export async function fetchCmsSiteSettings() {
  return requestJson<CmsSiteSettingsEnvelope>("/store/site-settings", {
    cache: "no-store"
  });
}

export async function fetchLoyaltySummary(token?: string) {
  return requestJson<LoyaltySummaryEnvelope>("/store/me/loyalty", {
    headers: getSessionHeaders(token)
  });
}

export async function submitVendorApplication(body: VendorApplicationInput) {
  return requestJson<VendorApplicationActionEnvelope>("/store/vendor-applications", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function login(body: AuthCredentialsInput) {
  return requestJson<AuthSessionEnvelope>("/auth/login", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function register(body: AuthRegisterInput) {
  return requestJson<AuthSessionEnvelope>("/auth/register", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function fetchSession(token?: string) {
  return requestJson<AuthSessionEnvelope>("/auth/me", {
    headers: getSessionHeaders(token)
  });
}

export async function fetchSellerPanelOverview(token?: string) {
  return requestJson<SellerPanelOverviewEnvelope>("/seller/panel/overview", {
    headers: getSessionHeaders(token),
    cache: "no-store"
  });
}

export async function logout(token?: string) {
  return requestJson<{ status: string; message: string }>("/auth/logout", {
    method: "POST",
    headers: getSessionHeaders(token)
  });
}

export type AuthSessionEnvelope = {
  data: AuthSessionSummary | null;
  meta?: Record<string, unknown>;
};

export type CatalogSummaryResponseEnvelope = {
  data: CatalogSummaryResponse;
  meta?: Record<string, unknown>;
};

export type CatalogProductsEnvelope = {
  data: CatalogProduct[];
  meta?: Record<string, unknown>;
};

export type CatalogProductEnvelope = {
  data: CatalogProduct;
  meta?: Record<string, unknown>;
};

export type SellerPanelOverviewEnvelope = {
  data: SellerPanelOverviewSummary;
  meta?: Record<string, unknown>;
};

export type CheckoutQuoteEnvelope = {
  data: CheckoutQuoteSummary;
  meta?: Record<string, unknown>;
};

export type CheckoutDocumentLookupEnvelope = {
  data: CheckoutDocumentLookupSummary;
  meta?: Record<string, unknown>;
};

export type CheckoutActionEnvelope = {
  status: string;
  message: string;
  referenceId?: string;
  order?: CheckoutActionSummary;
  quote?: CheckoutQuoteSummary;
};

export type PeruDepartmentsEnvelope = {
  data: PeruDepartmentSummary[];
  meta?: Record<string, unknown>;
};

export type PeruProvincesEnvelope = {
  data: PeruProvinceSummary[];
  meta?: Record<string, unknown>;
};

export type PeruDistrictsEnvelope = {
  data: PeruDistrictSummary[];
  meta?: Record<string, unknown>;
};

export type WholesaleLeadActionEnvelope = {
  status: string;
  message: string;
  referenceId?: string;
  lead?: WholesaleLeadSummary;
  nextStep?: string;
};

export type VendorApplicationActionEnvelope = ActionEnvelope & {
  application?: VendorApplicationSummary;
};

export type WholesaleTiersEnvelope = {
  data: WholesalePlan[];
  meta?: Record<string, unknown>;
};

export type CmsSiteSettingsEnvelope = {
  data: SiteSetting;
  meta?: Record<string, unknown>;
};
