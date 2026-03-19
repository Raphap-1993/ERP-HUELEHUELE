import type {
  CommissionPayoutInput,
  CommissionPayoutSettleInput,
  CommissionPayoutSummary,
  CommissionRuleSummary,
  CommissionSummary,
  AdminManualPaymentRequestSummary,
  AdminOrderDetail,
  AdminOrderSummary,
  AdminPaymentSummary,
  ManualReviewActionInput,
  VendorApplicationActionInput,
  VendorApplicationSummary,
  VendorCodeSummary,
  VendorSummary
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

export async function fetchVendorApplications() {
  return requestJson<VendorApplicationsEnvelope>("/admin/vendor-applications");
}

export async function approveVendorApplication(id: string, body: VendorApplicationActionInput) {
  return requestJson<VendorActionEnvelope>(`/admin/vendor-applications/${encodeURIComponent(id)}/approve`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function rejectVendorApplication(id: string, body: VendorApplicationActionInput) {
  return requestJson<VendorActionEnvelope>(`/admin/vendor-applications/${encodeURIComponent(id)}/reject`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function fetchVendors() {
  return requestJson<VendorsEnvelope>("/admin/vendors");
}

export async function fetchVendorCodes() {
  return requestJson<VendorCodesEnvelope>("/admin/vendors/codes");
}

export async function fetchCommissions() {
  return requestJson<CommissionsEnvelope>("/admin/commissions");
}

export async function fetchCommissionRules() {
  return requestJson<CommissionRulesEnvelope>("/admin/commissions/rules");
}

export async function fetchCommissionPayouts() {
  return requestJson<CommissionPayoutsEnvelope>("/admin/commissions/payouts");
}

export async function createCommissionPayout(body: CommissionPayoutInput) {
  return requestJson<CommissionPayoutActionEnvelope>("/admin/commissions/payouts", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function settleCommissionPayout(id: string, body: CommissionPayoutSettleInput) {
  return requestJson<CommissionPayoutActionEnvelope>(`/admin/commissions/payouts/${encodeURIComponent(id)}/settle`, {
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

export type VendorApplicationsEnvelope = {
  data: VendorApplicationSummary[];
  meta?: Record<string, unknown>;
};

export type VendorActionEnvelope = {
  status: string;
  message: string;
  referenceId?: string;
  application?: VendorApplicationSummary;
  vendor?: VendorSummary;
};

export type VendorsEnvelope = {
  data: VendorSummary[];
  meta?: Record<string, unknown>;
};

export type VendorCodesEnvelope = {
  data: VendorCodeSummary[];
  meta?: Record<string, unknown>;
};

export type CommissionsEnvelope = {
  data: CommissionSummary[];
  meta?: Record<string, unknown>;
};

export type CommissionRulesEnvelope = {
  data: CommissionRuleSummary[];
  meta?: Record<string, unknown>;
};

export type CommissionPayoutsEnvelope = {
  data: CommissionPayoutSummary[];
  meta?: Record<string, unknown>;
};

export type CommissionPayoutActionEnvelope = {
  status: string;
  message: string;
  referenceId?: string;
  payout?: CommissionPayoutSummary;
};
