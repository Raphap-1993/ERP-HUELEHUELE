import type {
  AdminManualPaymentRequestSummary,
  AdminOrderDetail,
  AdminOrderSummary,
  AdminPaymentSummary,
  ManualReviewActionInput
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

export async function fetchOrders() {
  return requestJson<OrdersEnvelope>("/admin/orders");
}

export async function fetchOrder(orderNumber: string) {
  return requestJson<OrderEnvelope>(`/admin/orders/${encodeURIComponent(orderNumber)}`);
}

export async function fetchPayments() {
  return requestJson<PaymentsEnvelope>("/admin/payments");
}

export async function fetchManualPaymentRequests() {
  return requestJson<ManualRequestsEnvelope>("/admin/payments/manual-requests");
}

export async function approveManualPaymentRequest(id: string, body: ManualReviewActionInput) {
  return requestJson<ManualActionEnvelope>(`/admin/payments/manual-requests/${encodeURIComponent(id)}/approve`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function rejectManualPaymentRequest(id: string, body: ManualReviewActionInput) {
  return requestJson<ManualActionEnvelope>(`/admin/payments/manual-requests/${encodeURIComponent(id)}/reject`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export type OrdersEnvelope = {
  data: AdminOrderSummary[];
  meta?: Record<string, unknown>;
};

export type OrderEnvelope = {
  data: AdminOrderDetail;
  meta?: Record<string, unknown>;
};

export type PaymentsEnvelope = {
  data: AdminPaymentSummary[];
  meta?: Record<string, unknown>;
};

export type ManualRequestsEnvelope = {
  data: AdminManualPaymentRequestSummary[];
  meta?: Record<string, unknown>;
};

export type ManualActionEnvelope = {
  status: string;
  message: string;
  referenceId?: string;
  request?: AdminManualPaymentRequestSummary;
  order?: AdminOrderSummary;
};
