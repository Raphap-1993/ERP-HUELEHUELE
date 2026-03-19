import type {
  AuthCredentialsInput,
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
  CommissionRuleSummary,
  CommissionSummary,
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
  ObservabilityOverviewEnvelope,
  ObservabilityOverviewSummary,
  AdminOrderDetail,
  AdminOrderSummary,
  AdminPaymentSummary,
  ManualReviewActionInput,
  OperationalHealthSummary,
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

function normalizeBaseUrl(value: string | undefined) {
  return value?.replace(/\/$/, "") || "http://localhost:4000/api/v1";
}

export function getApiBaseUrl() {
  return normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL);
}

export function getSessionHeaders(token?: string): HeadersInit | undefined {
  const resolvedToken = token ?? readStoredAdminSessionToken();
  return resolvedToken ? { authorization: `Bearer ${resolvedToken}` } : undefined;
}

async function requestJson<T>(path: string, init: RequestInit = {}) {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const sessionHeaders = getSessionHeaders();
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(sessionHeaders ?? {}),
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

export async function updateCmsSiteSettings(body: CmsSiteSettingsInput) {
  return requestJson<CmsActionEnvelope>("/admin/cms/site-settings", {
    method: "PATCH",
    body: JSON.stringify(body)
  });
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
