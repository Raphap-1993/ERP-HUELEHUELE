import type {
  AuthCredentialsInput,
  AuthRegisterInput,
  AuthSessionSummary,
  CatalogProduct,
  CatalogSummaryResponse,
  CheckoutActionSummary,
  CheckoutQuoteInput,
  CheckoutQuoteSummary,
  CheckoutRequestInput,
  WholesaleLeadInput,
  WholesalePlan,
  WholesaleLeadSummary
} from "@huelegood/shared";

function normalizeBaseUrl(value: string | undefined) {
  return value?.replace(/\/$/, "") || "http://localhost:4000/api/v1";
}

export function getApiBaseUrl() {
  return normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL);
}

async function requestJson<T>(path: string, init: RequestInit = {}) {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    }
  });

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
  return requestJson<CatalogSummaryResponseEnvelope>("/store/catalog");
}

export async function fetchCatalogProducts() {
  return requestJson<CatalogProductsEnvelope>("/store/products");
}

export async function fetchProductBySlug(slug: string) {
  return requestJson<CatalogProductEnvelope>(`/store/products/${slug}`);
}

export async function fetchCheckoutQuote(body: CheckoutQuoteInput) {
  return requestJson<CheckoutQuoteEnvelope>("/store/checkout/quote", {
    method: "POST",
    body: JSON.stringify(body)
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

export async function submitWholesaleLead(body: WholesaleLeadInput) {
  return requestJson<WholesaleLeadActionEnvelope>("/store/wholesale-leads", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function fetchWholesaleTiers() {
  return requestJson<WholesaleTiersEnvelope>("/store/wholesale-tiers");
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

export type CheckoutQuoteEnvelope = {
  data: CheckoutQuoteSummary;
  meta?: Record<string, unknown>;
};

export type CheckoutActionEnvelope = {
  status: string;
  message: string;
  referenceId?: string;
  order?: CheckoutActionSummary;
  quote?: CheckoutQuoteSummary;
};

export type WholesaleLeadActionEnvelope = {
  status: string;
  message: string;
  referenceId?: string;
  lead?: WholesaleLeadSummary;
  nextStep?: string;
};

export type WholesaleTiersEnvelope = {
  data: WholesalePlan[];
  meta?: Record<string, unknown>;
};
