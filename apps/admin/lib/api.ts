import type {
  AuthCredentialsInput,
  AdminManualPaymentCreateInput,
  AdminRoleDashboardSummary,
  AdminOrderStatusTransitionInput,
  AdminVendorCreateInput,
  AuthSessionSummary,
  CmsActionEnvelope,
  CmsBannerInput,
  CmsBannersEnvelope,
  CmsFaqInput,
  CmsFaqsEnvelope,
  CmsHeroCopyInput,
  CmsNavigationInput,
  CmsPageBlockInput,
  CmsPageInput,
  CmsPagesEnvelope,
  CmsSiteSettingsInput,
  CmsSnapshotEnvelope,
  CmsTestimonialInput,
  CmsTestimonialsEnvelope,
  CommissionPayoutInput,
  CommissionPayoutSettleInput,
  CommissionPayoutSummary,
  CommissionRuleInput,
  CommissionRuleSummary,
  CommissionSummary,
  CouponInput,
  CouponSummary,
  LoyaltyMovementSummary,
  LoyaltyPointsInput,
  LoyaltyRedemptionInput,
  LoyaltyRedemptionStatusInput,
  LoyaltyRedemptionSummary,
  LoyaltyRuleSummary,
  MarketingCampaignInput,
  MarketingCampaignSummary,
  MarketingEventSummary,
  MarketingSegmentSummary,
  MarketingTemplateSummary,
  NotificationInput,
  NotificationLogSummary,
  NotificationSummary,
  AdminManualPaymentRequestSummary,
  InventoryReportEnvelope,
  ProductAdminDetail,
  ProductAdminSummary,
  ProductCategorySummary,
  ProductImageUploadInput,
  ProductImageUploadSummary,
  ProductUpsertInput,
  ObservabilityOverviewEnvelope,
  ObservabilityOverviewSummary,
  AdminOrderDetail,
  AdminOrderSummary,
  AdminPaymentSummary,
  ManualReviewActionInput,
  OperationalHealthSummary,
  SiteSetting,
  WholesaleLeadInput,
  WholesaleLeadStatusInput,
  WholesaleLeadSummary,
  WholesalePlan,
  WholesaleQuoteAdminSummary,
  WholesaleQuoteInput,
  VendorApplicationActionInput,
  VendorApplicationSummary,
  VendorCodeSummary,
  VendorSummary
} from "@huelegood/shared";
import { readStoredAdminSessionToken } from "./session";

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

export function getSessionHeaders(token?: string): HeadersInit | undefined {
  const resolvedToken = token ?? readStoredAdminSessionToken();
  return resolvedToken ? { authorization: `Bearer ${resolvedToken}` } : undefined;
}

async function requestJson<T>(path: string, init: RequestInit = {}) {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const sessionHeaders = getSessionHeaders();
  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(sessionHeaders ?? {}),
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

async function requestFormData<T>(path: string, formData: FormData, init: RequestInit = {}) {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const sessionHeaders = getSessionHeaders();
  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      method: init.method ?? "POST",
      body: formData,
      headers: {
        ...(sessionHeaders ?? {}),
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

export async function loginAdmin(body: AuthCredentialsInput) {
  return requestJson<AuthSessionEnvelope>("/auth/login", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function fetchAdminSession(token?: string) {
  return requestJson<AuthSessionEnvelope>("/auth/me", {
    headers: getSessionHeaders(token)
  });
}

export async function fetchDashboardOverview() {
  return requestJson<DashboardOverviewEnvelope>("/admin/dashboard/overview");
}

export async function fetchAdminReport(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const query = params.toString();
  return requestJson<AdminReportEnvelope>(`/admin/reports${query ? `?${query}` : ""}`);
}

export async function fetchCoupons() {
  return requestJson<{ data: CouponSummary[]; meta: { total: number } }>("/admin/coupons");
}

export async function createCoupon(input: CouponInput) {
  return requestJson<{ data: CouponSummary }>("/admin/coupons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
}

export async function updateCoupon(code: string, input: Partial<CouponInput>) {
  return requestJson<{ data: CouponSummary }>(`/admin/coupons/${encodeURIComponent(code)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
}

export async function deleteCoupon(code: string) {
  return requestJson<{ status: string; message: string }>(`/admin/coupons/${encodeURIComponent(code)}`, {
    method: "DELETE"
  });
}

export async function downloadAdminReportCsv(from: string, to: string): Promise<void> {
  const params = new URLSearchParams({ from, to });
  const url = `${getApiBaseUrl()}/admin/reports/export?${params.toString()}`;
  const headers = getSessionHeaders();
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Error al exportar: ${res.status}`);
  const blob = await res.blob();
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = `reporte-${from}-${to}.csv`;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

export async function logoutAdmin(token?: string) {
  return requestJson<{ status: string; message: string }>("/auth/logout", {
    method: "POST",
    headers: getSessionHeaders(token)
  });
}

export async function fetchOrders() {
  return requestJson<OrdersEnvelope>("/admin/orders");
}

export async function fetchOrder(orderNumber: string) {
  return requestJson<OrderEnvelope>(`/admin/orders/${encodeURIComponent(orderNumber)}`);
}

export async function resendOrderApprovalEmail(orderNumber: string) {
  return requestJson<OrderNotificationActionEnvelope>(`/admin/orders/${encodeURIComponent(orderNumber)}/resend-approval-email`, {
    method: "POST"
  });
}

export async function createBackofficeOrder(body: {
  customer: { firstName: string; lastName: string; email: string; phone: string };
  address: { line1: string; city: string; region?: string };
  items: Array<{ slug: string; name: string; sku: string; variantId?: string; quantity: number; unitPrice: number }>;
  initialStatus: "paid" | "pending_payment";
  notes?: string;
  vendorCode?: string;
}) {
  return requestJson<{ status: string; message: string; orderNumber: string }>("/admin/orders", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function deleteOrder(orderNumber: string) {
  return requestJson<{ status: string; orderNumber: string }>(`/admin/orders/${encodeURIComponent(orderNumber)}`, {
    method: "DELETE"
  });
}

export async function transitionOrderStatus(orderNumber: string, body: AdminOrderStatusTransitionInput) {
  return requestJson<OrderEnvelope>(`/admin/orders/${encodeURIComponent(orderNumber)}/status`, {
    method: "POST",
    body: JSON.stringify(body)
  });
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

export async function registerAdminManualPayment(orderNumber: string, body: AdminManualPaymentCreateInput) {
  return requestJson<OrderEnvelope>(`/admin/payments/${encodeURIComponent(orderNumber)}/register-manual`, {
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

export async function createVendor(body: AdminVendorCreateInput) {
  return requestJson<VendorActionEnvelope>("/admin/vendors", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function fetchVendorCodes() {
  return requestJson<VendorCodesEnvelope>("/admin/vendors/codes");
}

export async function fetchWholesaleLeads() {
  return requestJson<WholesaleLeadsEnvelope>("/admin/wholesale-leads");
}

export async function updateWholesaleLeadStatus(id: string, body: WholesaleLeadStatusInput) {
  return requestJson<WholesaleLeadActionEnvelope>(`/admin/wholesale-leads/${encodeURIComponent(id)}/status`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function fetchWholesaleQuotes() {
  return requestJson<WholesaleQuotesEnvelope>("/admin/wholesale-quotes");
}

export async function createWholesaleQuote(body: WholesaleQuoteInput) {
  return requestJson<WholesaleQuoteActionEnvelope>("/admin/wholesale-quotes", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function fetchWholesaleTiers() {
  return requestJson<WholesaleTiersEnvelope>("/admin/wholesale-tiers");
}

export async function fetchCampaigns() {
  return requestJson<MarketingCampaignsEnvelope>("/admin/campaigns");
}

export async function createCampaign(body: MarketingCampaignInput) {
  return requestJson<MarketingCampaignActionEnvelope>("/admin/campaigns", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function fetchCampaignSegments() {
  return requestJson<MarketingSegmentsEnvelope>("/admin/campaigns/segments");
}

export async function fetchCampaignTemplates() {
  return requestJson<MarketingTemplatesEnvelope>("/admin/campaigns/templates");
}

export async function fetchCampaignEvents() {
  return requestJson<MarketingEventsEnvelope>("/admin/campaigns/events");
}

export async function fetchCmsOverview() {
  return requestJson<CmsSnapshotEnvelope>("/admin/cms");
}

export type CmsSiteSettingsEnvelope = {
  data: SiteSetting;
  meta?: Record<string, unknown>;
};

export async function fetchCmsSiteSettings() {
  return requestJson<CmsSiteSettingsEnvelope>("/store/site-settings", {
    cache: "no-store"
  });
}

export async function updateCmsSiteSettings(body: CmsSiteSettingsInput) {
  return requestJson<CmsActionEnvelope>("/admin/cms/site-settings", {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

export async function uploadCmsHeaderLogo(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return requestFormData<CmsActionEnvelope>("/admin/cms/site-settings/logo", formData);
}

export async function uploadCmsHeroProductImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return requestFormData<CmsActionEnvelope>("/admin/cms/site-settings/hero-image", formData);
}

export async function uploadCmsLoadingImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return requestFormData<CmsActionEnvelope>("/admin/cms/site-settings/loading-image", formData);
}

export async function uploadCmsFavicon(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return requestFormData<CmsActionEnvelope>("/admin/cms/site-settings/favicon", formData);
}

export async function updateCmsHeroCopy(body: CmsHeroCopyInput) {
  return requestJson<CmsActionEnvelope>("/admin/cms/hero-copy", {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

export async function updateCmsNavigation(body: CmsNavigationInput) {
  return requestJson<CmsActionEnvelope>("/admin/cms/navigation", {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

export async function fetchCmsPages() {
  return requestJson<CmsPagesEnvelope>("/admin/cms/pages");
}

export async function upsertCmsPage(slug: string, body: CmsPageInput) {
  return requestJson<CmsActionEnvelope>(`/admin/cms/pages/${encodeURIComponent(slug)}`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

export async function updateCmsPageBlocks(slug: string, blocks: CmsPageBlockInput[]) {
  return requestJson<CmsActionEnvelope>(`/admin/cms/pages/${encodeURIComponent(slug)}/blocks`, {
    method: "PATCH",
    body: JSON.stringify({ blocks })
  });
}

export async function fetchCmsBanners() {
  return requestJson<CmsBannersEnvelope>("/admin/cms/banners");
}

export async function createCmsBanner(body: CmsBannerInput) {
  return requestJson<CmsActionEnvelope>("/admin/cms/banners", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function updateCmsBanner(id: string, body: CmsBannerInput) {
  return requestJson<CmsActionEnvelope>(`/admin/cms/banners/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

export async function fetchCmsFaqs() {
  return requestJson<CmsFaqsEnvelope>("/admin/cms/faqs");
}

export async function createCmsFaq(body: CmsFaqInput) {
  return requestJson<CmsActionEnvelope>("/admin/cms/faqs", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function updateCmsFaq(id: string, body: CmsFaqInput) {
  return requestJson<CmsActionEnvelope>(`/admin/cms/faqs/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

export async function fetchCmsTestimonials() {
  return requestJson<CmsTestimonialsEnvelope>("/admin/cms/testimonials");
}

export async function createCmsTestimonial(body: CmsTestimonialInput) {
  return requestJson<CmsActionEnvelope>("/admin/cms/testimonials", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function updateCmsTestimonial(id: string, body: CmsTestimonialInput) {
  return requestJson<CmsActionEnvelope>(`/admin/cms/testimonials/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

export async function fetchAuditOverview() {
  return requestJson<AuditOverviewEnvelope>("/admin/audit", {
    cache: "no-store"
  });
}

export async function fetchAdminProducts() {
  return requestJson<AdminProductsEnvelope>("/admin/products");
}

export async function fetchAdminProduct(id: string) {
  return requestJson<AdminProductEnvelope>(`/admin/products/${encodeURIComponent(id)}`);
}

export async function fetchAdminProductCategories() {
  return requestJson<AdminProductCategoriesEnvelope>("/admin/products/categories");
}

export async function fetchInventoryReport() {
  return requestJson<InventoryReportEnvelope>("/admin/inventory/report");
}

export async function createAdminProduct(body: ProductUpsertInput) {
  return requestJson<AdminProductActionEnvelope>("/admin/products", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function updateAdminProduct(id: string, body: ProductUpsertInput) {
  return requestJson<AdminProductActionEnvelope>(`/admin/products/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

export async function uploadAdminProductImage(
  id: string,
  body: ProductImageUploadInput & { file: File }
) {
  const formData = new FormData();
  formData.append("file", body.file);
  if (body.altText) {
    formData.append("altText", body.altText);
  }
  if (body.isPrimary !== undefined) {
    formData.append("isPrimary", String(body.isPrimary));
  }
  if (body.sortOrder !== undefined) {
    formData.append("sortOrder", String(body.sortOrder));
  }
  if (body.variantId) {
    formData.append("variantId", body.variantId);
  }

  return requestFormData<ProductImageUploadEnvelope>(
    `/admin/products/${encodeURIComponent(id)}/images`,
    formData
  );
}

export async function deleteAdminProductImage(productId: string, imageId: string) {
  return requestJson<{ status: string; message: string; referenceId?: string }>(
    `/admin/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}`,
    { method: "DELETE" }
  );
}

export async function fetchAuditLogs() {
  return requestJson<AuditLogsEnvelope>("/admin/audit/logs", {
    cache: "no-store"
  });
}

export async function fetchAuditActions() {
  return requestJson<AdminActionsEnvelope>("/admin/audit/actions", {
    cache: "no-store"
  });
}

export async function fetchSecurityPosture() {
  return requestJson<SecurityPostureEnvelope>("/admin/security", {
    cache: "no-store"
  });
}

export async function fetchObservabilityOverview() {
  return requestJson<ObservabilityOverviewEnvelope>("/admin/observability", {
    cache: "no-store"
  });
}

export async function fetchOperationalHealth() {
  return requestJson<OperationalHealthSummary>("/health/operational", {
    cache: "no-store"
  });
}

export async function fetchLoyaltyAccounts() {
  return requestJson<LoyaltyAccountsEnvelope>("/admin/loyalty/accounts");
}

export async function fetchLoyaltyMovements() {
  return requestJson<LoyaltyMovementsEnvelope>("/admin/loyalty/movements");
}

export async function assignLoyaltyPoints(body: LoyaltyPointsInput) {
  return requestJson<LoyaltyActionEnvelope>("/admin/loyalty/movements", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function fetchLoyaltyRedemptions() {
  return requestJson<LoyaltyRedemptionsEnvelope>("/admin/loyalty/redemptions");
}

export async function createLoyaltyRedemption(body: LoyaltyRedemptionInput) {
  return requestJson<LoyaltyActionEnvelope>("/admin/loyalty/redemptions", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function updateLoyaltyRedemptionStatus(id: string, body: LoyaltyRedemptionStatusInput) {
  return requestJson<LoyaltyActionEnvelope>(`/admin/loyalty/redemptions/${encodeURIComponent(id)}/status`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function fetchLoyaltyRules() {
  return requestJson<LoyaltyRulesEnvelope>("/admin/loyalty/rules");
}

export async function fetchNotifications() {
  return requestJson<NotificationsEnvelope>("/admin/notifications");
}

export async function createNotification(body: NotificationInput) {
  return requestJson<NotificationActionEnvelope>("/admin/notifications", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function fetchNotificationLogs() {
  return requestJson<NotificationLogsEnvelope>("/admin/notifications/logs");
}

export async function fetchCommissions() {
  return requestJson<CommissionsEnvelope>("/admin/commissions");
}

export async function fetchCommissionRules() {
  return requestJson<CommissionRulesEnvelope>("/admin/commissions/rules");
}

export async function createCommissionRule(body: CommissionRuleInput) {
  return requestJson<CommissionRuleActionEnvelope>("/admin/commissions/rules", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function updateCommissionRule(id: string, body: CommissionRuleInput) {
  return requestJson<CommissionRuleActionEnvelope>(`/admin/commissions/rules/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
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

export type OrderNotificationActionEnvelope = {
  status: string;
  message: string;
  referenceId?: string;
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

export type WholesaleLeadsEnvelope = {
  data: WholesaleLeadSummary[];
  meta?: Record<string, unknown>;
};

export type WholesaleLeadActionEnvelope = {
  status: string;
  message: string;
  referenceId?: string;
  lead?: WholesaleLeadSummary;
  nextStep?: string;
};

export type WholesaleQuotesEnvelope = {
  data: WholesaleQuoteAdminSummary[];
  meta?: Record<string, unknown>;
};

export type WholesaleQuoteActionEnvelope = {
  status: string;
  message: string;
  referenceId?: string;
  quote?: WholesaleQuoteAdminSummary;
  lead?: WholesaleLeadSummary;
};

export type WholesaleTiersEnvelope = {
  data: WholesalePlan[];
  meta?: Record<string, unknown>;
};

export type MarketingCampaignsEnvelope = {
  data: MarketingCampaignSummary[];
  meta?: Record<string, unknown>;
};

export type MarketingCampaignActionEnvelope = {
  status: string;
  message: string;
  referenceId?: string;
  campaign?: MarketingCampaignSummary;
};

export type MarketingSegmentsEnvelope = {
  data: MarketingSegmentSummary[];
  meta?: Record<string, unknown>;
};

export type MarketingTemplatesEnvelope = {
  data: MarketingTemplateSummary[];
  meta?: Record<string, unknown>;
};

export type MarketingEventsEnvelope = {
  data: MarketingEventSummary[];
  meta?: Record<string, unknown>;
};

export type LoyaltyAccountsEnvelope = {
  data: import("@huelegood/shared").LoyaltyAccountSummary[];
  meta?: Record<string, unknown>;
};

export type LoyaltyMovementsEnvelope = {
  data: LoyaltyMovementSummary[];
  meta?: Record<string, unknown>;
};

export type LoyaltyRedemptionsEnvelope = {
  data: LoyaltyRedemptionSummary[];
  meta?: Record<string, unknown>;
};

export type LoyaltyRulesEnvelope = {
  data: LoyaltyRuleSummary[];
  meta?: Record<string, unknown>;
};

export type LoyaltyActionEnvelope = {
  status: string;
  message: string;
  referenceId?: string;
  account?: import("@huelegood/shared").LoyaltyAccountSummary;
  movement?: LoyaltyMovementSummary;
  redemption?: LoyaltyRedemptionSummary;
};

export type NotificationsEnvelope = {
  data: NotificationSummary[];
  meta?: Record<string, unknown>;
};

export type AuthSessionEnvelope = {
  data: AuthSessionSummary | null;
  meta?: Record<string, unknown>;
};

export type DashboardOverviewEnvelope = {
  data: AdminRoleDashboardSummary;
  meta?: Record<string, unknown>;
};

export type NotificationLogsEnvelope = {
  data: NotificationLogSummary[];
  meta?: Record<string, unknown>;
};

export type AuditOverviewEnvelope = {
  data: import("@huelegood/shared").AuditOverviewSummary;
  meta?: Record<string, unknown>;
};

export type AuditLogsEnvelope = {
  data: import("@huelegood/shared").AuditLogSummary[];
  meta?: Record<string, unknown>;
};

export type AdminActionsEnvelope = {
  data: import("@huelegood/shared").AdminActionSummary[];
  meta?: Record<string, unknown>;
};

export type SecurityPostureEnvelope = {
  data: import("@huelegood/shared").SecurityPostureSummary;
  meta?: Record<string, unknown>;
};

export type AdminReportPeriodData = {
  period: { from: string; to: string };
  orders: {
    total: number;
    revenue: number;
    paidRevenue: number;
    paid: number;
    pending: number;
    cancelled: number;
    conversionRate: number;
    avgOrderValue: number;
    byPaymentMethod: Record<string, number>;
    byStatus: Record<string, number>;
    byDay: Array<{ date: string; count: number; revenue: number; paid: number }>;
    recent: AdminOrderSummary[];
  };
  commissions: {
    total: number;
    totalAmount: number;
    payable: number;
    payableAmount: number;
    paid: number;
    paidAmount: number;
  };
};

export type AdminReportEnvelope = {
  data: AdminReportPeriodData;
  meta?: Record<string, unknown>;
};

export type NotificationActionEnvelope = {
  status: string;
  message: string;
  referenceId?: string;
  notification?: NotificationSummary;
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

export type CommissionRuleActionEnvelope = {
  status: string;
  message: string;
  referenceId?: string;
};

export type AdminProductsEnvelope = {
  data: ProductAdminSummary[];
  meta?: Record<string, unknown>;
};

export type AdminProductEnvelope = {
  data: ProductAdminDetail;
  meta?: Record<string, unknown>;
};

export type AdminProductCategoriesEnvelope = {
  data: ProductCategorySummary[];
  meta?: Record<string, unknown>;
};

export type AdminProductActionEnvelope = {
  status: string;
  message: string;
  referenceId?: string;
  product?: ProductAdminDetail;
};

export type ProductImageUploadEnvelope = {
  data: ProductImageUploadSummary;
  meta?: Record<string, unknown>;
};
