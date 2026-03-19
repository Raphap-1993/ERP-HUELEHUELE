import type {
  CampaignRunStatus,
  CampaignStatus,
  CampaignRecipientStatus,
  CommissionPayoutStatus,
  CommissionStatus,
  LoyaltyMovementStatus,
  ManualPaymentRequestStatus,
  OrderStatus,
  NotificationChannel,
  NotificationStatus,
  PaymentStatus,
  RoleCode,
  RedemptionStatus,
  VendorApplicationStatus,
  VendorStatus,
  WholesaleLeadStatus,
  WholesaleQuoteStatus
} from "../domain/enums";
import type {
  AdminMetric,
  CommissionRow,
  CatalogProduct,
  CmsBanner,
  CmsFaq,
  CmsPage,
  CmsPageBlock,
  CmsSeoMeta,
  CmsTestimonial,
  FaqItem,
  HeroCopy,
  LoyaltyAccountSummary,
  PromoBanner,
  SiteSetting,
  AdminActionSummary,
  AuditLogSummary,
  AuditOverviewSummary,
  HealthDependencySummary,
  ObservabilityEventSummary,
  ObservabilityOverviewSummary,
  ObservabilityQueueSummary,
  ObservabilityRequestSummary,
  ObservabilityRouteMetricSummary,
  OperationalHealthSummary,
  SecurityPostureSummary,
  WebNavigationGroup,
  WholesalePlan
} from "../domain/models";

export interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface PaginatedEnvelope<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ActionEnvelope {
  status: "ok" | "queued" | "pending_review" | "rejected";
  message: string;
  referenceId?: string;
}

export interface AuthRoleSummary {
  code: RoleCode;
  label: string;
}

export interface AuthUserSummary {
  id: string;
  name: string;
  email: string;
  roles: AuthRoleSummary[];
  accountType: "admin" | "seller" | "customer" | "operator";
  vendorCode?: string;
}

export interface AuthSessionSummary {
  token: string;
  expiresAt: string;
  user: AuthUserSummary;
}

export type AdminDashboardFocus = "executive" | "payments" | "sales" | "marketing";

export interface AdminRoleDashboardSummary {
  focus: AdminDashboardFocus;
  title: string;
  description: string;
  metrics: AdminMetric[];
  recentOrders: AdminOrderSummary[];
  paymentRows: AdminPaymentSummary[];
  reviewQueue: AdminManualPaymentRequestSummary[];
  commissionRows: CommissionRow[];
  payouts: CommissionPayoutSummary[];
  vendorRows: VendorSummary[];
  wholesaleLeads: WholesaleLeadSummary[];
  campaigns: MarketingCampaignSummary[];
  notifications: NotificationSummary[];
  loyaltyAccounts: LoyaltyAccountSummary[];
}

export interface SellerPanelOverviewSummary {
  seller: VendorSummary;
  metrics: AdminMetric[];
  recentOrders: AdminOrderSummary[];
  commissions: CommissionSummary[];
  payouts: CommissionPayoutSummary[];
}

export interface AuthCredentialsInput {
  email: string;
  password: string;
}

export interface AuthRegisterInput extends AuthCredentialsInput {
  name: string;
  accountType?: "customer" | "seller";
  phone?: string;
}

export interface VendorApplicationInput {
  name: string;
  email: string;
  city: string;
  source?: string;
  message?: string;
  phone?: string;
}

export interface VendorApplicationSummary {
  id: string;
  name: string;
  email: string;
  city: string;
  source: string;
  status: VendorApplicationStatus;
  phone?: string;
  message?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  vendorCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorSummary {
  id: string;
  name: string;
  email?: string;
  code: string;
  city?: string;
  status: VendorStatus;
  sales: number;
  commissions: number;
  pendingCommissions: number;
  paidCommissions: number;
  ordersCount: number;
  applicationsCount: number;
  approvedAt?: string;
  updatedAt: string;
}

export interface VendorCodeSummary {
  code: string;
  name: string;
  status: VendorStatus;
  approvedAt?: string;
  updatedAt: string;
}

export interface WholesaleLeadInput {
  company: string;
  contact: string;
  email: string;
  city: string;
  phone?: string;
  notes?: string;
  source?: string;
}

export interface WholesaleLeadSummary {
  id: string;
  company: string;
  contact: string;
  email: string;
  city: string;
  source: string;
  status: WholesaleLeadStatus;
  phone?: string;
  notes?: string;
  reviewer?: string;
  reviewedAt?: string;
  quoteCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WholesaleLeadStatusInput {
  status: WholesaleLeadStatus;
  reviewer?: string;
  notes?: string;
}

export interface WholesaleQuoteItemSummary {
  label: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface WholesaleQuoteInput {
  leadId: string;
  amount: number;
  status?: WholesaleQuoteStatus;
  notes?: string;
  expiresAt?: string;
  items?: WholesaleQuoteItemSummary[];
}

export interface WholesaleQuoteAdminSummary {
  id: string;
  leadId: string;
  company: string;
  contact: string;
  email: string;
  status: WholesaleQuoteStatus;
  amount: number;
  currencyCode: string;
  itemsCount: number;
  notes?: string;
  reviewer?: string;
  sentAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketingSegmentSummary {
  id: string;
  name: string;
  definition: string;
  audienceSize: number;
  status: "active" | "inactive";
  updatedAt: string;
}

export interface MarketingTemplateSummary {
  id: string;
  name: string;
  channel: "email" | "sms" | "whatsapp";
  subject: string;
  status: "draft" | "active" | "archived";
  updatedAt: string;
}

export interface MarketingCampaignSummary {
  id: string;
  name: string;
  segmentId: string;
  segmentName: string;
  templateId: string;
  templateName: string;
  channel: "email" | "sms" | "whatsapp";
  status: CampaignStatus;
  runStatus: CampaignRunStatus;
  recipients: number;
  goal: string;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketingEventSummary {
  id: string;
  eventName: string;
  source: string;
  subject: string;
  payloadSummary: string;
  occurredAt: string;
}

export interface MarketingCampaignInput {
  name: string;
  segmentId: string;
  templateId: string;
  channel: "email" | "sms" | "whatsapp";
  goal: string;
  scheduledAt?: string;
}

export interface CmsSiteSettingsInput extends SiteSetting {}

export interface CmsHeroCopyInput extends HeroCopy {}

export type CmsNavigationInput = WebNavigationGroup[];

export interface CmsPageBlockInput {
  type: string;
  title: string;
  description: string;
  content: string;
  position: number;
  status?: CmsPageBlock["status"];
}

export interface CmsSeoMetaInput {
  title: string;
  description: string;
  keywords: string[];
  canonicalPath?: string;
  robots?: CmsSeoMeta["robots"];
}

export interface CmsPageInput {
  title: string;
  description: string;
  status?: CmsPage["status"];
  blocks: CmsPageBlockInput[];
  seoMeta: CmsSeoMetaInput;
}

export interface CmsBannerInput {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  note: string;
  tone: CmsBanner["tone"];
  status?: CmsBanner["status"];
  position?: number;
}

export interface CmsFaqInput {
  question: string;
  answer: string;
  category?: string;
  status?: CmsFaq["status"];
  position?: number;
}

export interface CmsTestimonialInput {
  name: string;
  role: string;
  quote: string;
  rating: number;
  status?: CmsTestimonial["status"];
}

export interface LoyaltyRuleSummary {
  id: string;
  name: string;
  description: string;
  trigger: string;
  pointsPerUnit: number;
  status: "active" | "inactive";
  updatedAt: string;
}

export interface LoyaltyMovementSummary {
  id: string;
  customer: string;
  orderNumber?: string;
  kind: "earn" | "redeem" | "adjustment" | "bonus";
  points: number;
  balanceAfter: number;
  status: LoyaltyMovementStatus;
  reason: string;
  reviewer?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyRedemptionSummary {
  id: string;
  customer: string;
  reward: string;
  points: number;
  status: RedemptionStatus;
  notes?: string;
  reviewer?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyPointsInput {
  customer: string;
  points: number;
  reason: string;
  orderNumber?: string;
  kind?: "earn" | "adjustment" | "bonus";
  status?: LoyaltyMovementStatus;
  reviewer?: string;
}

export interface LoyaltyRedemptionInput {
  customer: string;
  reward: string;
  points: number;
  notes?: string;
  reviewer?: string;
}

export interface LoyaltyRedemptionStatusInput {
  status: RedemptionStatus.Applied | RedemptionStatus.Cancelled;
  reviewer?: string;
  notes?: string;
}

export interface NotificationSummary {
  id: string;
  channel: NotificationChannel;
  audience: string;
  subject: string;
  body: string;
  status: NotificationStatus;
  source: string;
  relatedType?: string;
  relatedId?: string;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationLogSummary {
  id: string;
  eventName: string;
  source: string;
  subject: string;
  detail: string;
  notificationId?: string;
  relatedType?: string;
  relatedId?: string;
  occurredAt: string;
}

export interface NotificationInput {
  channel: NotificationChannel;
  audience: string;
  subject: string;
  body: string;
  source?: string;
  relatedType?: string;
  relatedId?: string;
  scheduledAt?: string;
  status?: NotificationStatus;
}

export interface CommissionRuleSummary {
  id: string;
  name: string;
  description: string;
  scope: string;
  rate: number;
  priority: number;
  status: "active" | "inactive";
}

export interface CommissionSummary {
  id: string;
  orderNumber: string;
  vendorName: string;
  vendorCode: string;
  orderTotal: number;
  commissionRate: number;
  commissionAmount: number;
  status: CommissionStatus;
  period: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  payoutId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionPayoutSummary {
  id: string;
  vendorName: string;
  vendorCode: string;
  period: string;
  status: CommissionPayoutStatus;
  commissionIds: string[];
  grossAmount: number;
  netAmount: number;
  referenceId?: string;
  notes?: string;
  createdAt: string;
  paidAt?: string;
  updatedAt: string;
}

export interface VendorApplicationActionInput {
  reviewer?: string;
  notes?: string;
}

export interface CommissionPayoutInput {
  vendorCode?: string;
  period?: string;
  referenceId?: string;
  notes?: string;
}

export interface CommissionPayoutSettleInput {
  reviewer?: string;
  notes?: string;
  referenceId?: string;
}

export interface CatalogCategorySummary {
  slug: string;
  name: string;
  description: string;
  productCount: number;
}

export interface CatalogSummaryResponse {
  products: CatalogProduct[];
  categories: CatalogCategorySummary[];
  filters: {
    search?: string;
    category?: string;
    featuredOnly?: boolean;
  };
}

export interface CheckoutItemInput {
  slug: string;
  quantity: number;
}

export interface CheckoutCustomerInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface CheckoutAddressInput {
  label?: string;
  recipientName: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode?: string;
}

export interface CheckoutQuoteItemSummary {
  slug: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CheckoutQuoteSummary {
  items: CheckoutQuoteItemSummary[];
  subtotal: number;
  discount: number;
  shipping: number;
  grandTotal: number;
  currencyCode: string;
  vendorCode?: string;
  couponCode?: string;
  paymentMethod: "openpay" | "manual";
  estimatedPoints: number;
}

export interface CheckoutRequestInput {
  items: CheckoutItemInput[];
  customer: CheckoutCustomerInput;
  address: CheckoutAddressInput;
  paymentMethod: "openpay" | "manual";
  vendorCode?: string;
  couponCode?: string;
  notes?: string;
  manualEvidenceReference?: string;
  manualEvidenceNotes?: string;
  clientRequestId?: string;
}

export interface CheckoutQuoteInput {
  items: CheckoutItemInput[];
  paymentMethod?: "openpay" | "manual";
  vendorCode?: string;
  couponCode?: string;
}

export interface CheckoutActionSummary {
  orderNumber: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: "openpay" | "manual";
  manualStatus?: ManualPaymentRequestStatus;
  manualRequestId?: string;
  manualEvidenceReference?: string;
  manualEvidenceNotes?: string;
  providerReference: string;
  nextStep: string;
  checkoutUrl?: string;
  evidenceRequired?: boolean;
}

export interface OrderItemSummary {
  slug: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderCustomerSummary {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface OrderAddressSummary {
  label?: string;
  recipientName: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode: string;
}

export interface OrderStatusHistorySummary {
  status: OrderStatus;
  label: string;
  actor: string;
  occurredAt: string;
  note: string;
}

export interface AdminPaymentSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  provider: "openpay" | "manual";
  status: PaymentStatus;
  amount: number;
  currencyCode: string;
  manualStatus?: ManualPaymentRequestStatus;
  notificationStatus: NotificationStatus;
  evidenceReference?: string;
  updatedAt: string;
}

export interface AdminManualPaymentRequestSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  currencyCode: string;
  status: ManualPaymentRequestStatus;
  evidenceReference?: string;
  evidenceNotes?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewer?: string;
  notes?: string;
}

export interface AdminOrderSummary {
  orderNumber: string;
  customerName: string;
  total: number;
  currencyCode: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: "openpay" | "manual";
  vendorCode?: string;
  manualStatus?: ManualPaymentRequestStatus;
  providerReference: string;
  updatedAt: string;
  createdAt: string;
  itemCount: number;
}

export interface AdminOrderDetail {
  orderNumber: string;
  customer: OrderCustomerSummary;
  address: OrderAddressSummary;
  items: OrderItemSummary[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  currencyCode: string;
  paymentMethod: "openpay" | "manual";
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  vendorCode?: string;
  couponCode?: string;
  notes?: string;
  providerReference: string;
  checkoutUrl?: string;
  manualStatus?: ManualPaymentRequestStatus;
  manualRequestId?: string;
  manualEvidenceReference?: string;
  manualEvidenceNotes?: string;
  statusHistory: OrderStatusHistorySummary[];
  payment: AdminPaymentSummary;
  manualRequest?: AdminManualPaymentRequestSummary;
  createdAt: string;
  updatedAt: string;
}

export interface ManualReviewActionInput {
  reviewer?: string;
  notes?: string;
}

export interface LoyaltySummaryEnvelope {
  data: LoyaltyAccountSummary | null;
  meta?: Record<string, unknown>;
}

export interface CmsSnapshotResponse {
  siteSetting: SiteSetting;
  heroCopy: HeroCopy;
  webNavigation: WebNavigationGroup[];
  banners: CmsBanner[];
  faqs: CmsFaq[];
  pages: CmsPage[];
  testimonials: CmsTestimonial[];
  seoMeta: CmsSeoMeta[];
}

export interface CmsSnapshotEnvelope {
  data: CmsSnapshotResponse;
  meta?: Record<string, unknown>;
}

export interface CmsPagesEnvelope {
  data: CmsPage[];
  meta?: Record<string, unknown>;
}

export interface CmsBannersEnvelope {
  data: CmsBanner[];
  meta?: Record<string, unknown>;
}

export interface CmsFaqsEnvelope {
  data: CmsFaq[];
  meta?: Record<string, unknown>;
}

export interface CmsTestimonialsEnvelope {
  data: CmsTestimonial[];
  meta?: Record<string, unknown>;
}

export interface CmsActionEnvelope {
  status: "ok" | "queued" | "pending_review" | "rejected";
  message: string;
  referenceId?: string;
  siteSetting?: SiteSetting;
  heroCopy?: HeroCopy;
  navigation?: WebNavigationGroup[];
  page?: CmsPage;
  banner?: CmsBanner;
  faq?: CmsFaq;
  testimonial?: CmsTestimonial;
}

export interface AuditOverviewEnvelope {
  data: AuditOverviewSummary;
  meta?: Record<string, unknown>;
}

export interface AuditLogsEnvelope {
  data: AuditLogSummary[];
  meta?: Record<string, unknown>;
}

export interface AdminActionsEnvelope {
  data: AdminActionSummary[];
  meta?: Record<string, unknown>;
}

export interface SecurityPostureEnvelope {
  data: SecurityPostureSummary;
  meta?: Record<string, unknown>;
}

export interface OperationalHealthEnvelope {
  data: OperationalHealthSummary;
  meta?: Record<string, unknown>;
}

export interface ObservabilityOverviewEnvelope {
  data: ObservabilityOverviewSummary;
  meta?: Record<string, unknown>;
}

export interface StorefrontPagePayload {
  siteSetting: SiteSetting;
  heroCopy: HeroCopy;
  promoBanners: PromoBanner[];
  wholesalePlans: WholesalePlan[];
  faqItems: FaqItem[];
  catalog: CatalogSummaryResponse;
  campaignChannels?: CampaignRecipientStatus[];
}
