import type {
  CampaignRecipientStatus,
  CampaignRunStatus,
  CampaignStatus,
  CmsSocialPlatform,
  CmsTestimonialKind,
  CommissionPayoutStatus,
  CommissionStatus,
  InventoryMovementType,
  LoyaltyMovementStatus,
  ManualPaymentRequestStatus,
  NotificationStatus,
  OrderStatus,
  PaymentStatus,
  RedemptionStatus,
  RoleCode,
  VendorCollaborationType,
  VendorApplicationStatus,
  VendorStatus,
  WholesaleLeadStatus,
  WholesaleQuoteStatus
} from "./enums";

export interface Money {
  amount: number;
  currency: string;
}

export interface NavigationItem {
  label: string;
  href: string;
  external?: boolean;
  requiredRoles?: readonly RoleCode[];
}

export interface HeroCopy {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: NavigationItem;
  secondaryCta: NavigationItem;
}

export interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  categorySlug: string;
  tagline: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  badge: string;
  tone: "emerald" | "graphite" | "amber";
  benefits: string[];
  sku: string;
  imageUrl?: string;
  imageAlt?: string;
  defaultVariantId?: string;
  currencyCode?: string;
  variants?: {
    id: string;
    sku: string;
    name: string;
    price: number;
    compareAtPrice?: number;
    status: "active" | "inactive" | "out_of_stock";
  }[];
  images?: {
    id: string;
    url: string;
    altText?: string;
    sortOrder: number;
    isPrimary: boolean;
    variantId?: string;
  }[];
  bundleComponents?: BundleComponentSummary[];
}

export interface BundleComponentInput {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface BundleComponentSummary extends BundleComponentInput {
  id: string;
  sortOrder: number;
  productName: string;
  productSlug: string;
  productSku: string;
  variantName?: string;
  variantSku?: string;
}

export interface PromoBanner {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  note: string;
  tone: "olive" | "ink" | "amber";
}

export interface WholesalePlan {
  tier: string;
  minimumUnits: number;
  savingsLabel: string;
  description: string;
  perks: string[];
  ctaLabel: string;
  ctaHref: string;
}

export interface FaqItem {
  question: string;
  answer: string;
  category?: string;
}

export interface AdminMetric {
  label: string;
  value: string;
  detail: string;
  trend?: string;
}

export interface OrderSummaryRow {
  number: string;
  customer: string;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  vendorCode?: string;
  updatedAt: string;
}

export interface CommissionRow {
  vendor: string;
  code: string;
  totalSales: number;
  commission: number;
  status: CommissionStatus;
  period: string;
}

export interface TimelineEntry {
  status: OrderStatus;
  label: string;
  actor: string;
  occurredAt: string;
  note: string;
}

export interface ReviewItem {
  id: string;
  orderNumber: string;
  customer: string;
  amount: number;
  provider: string;
  evidence: string;
  status: ManualPaymentRequestStatus;
  submittedAt: string;
}

export interface VendorApplicationItem {
  id: string;
  name: string;
  email: string;
  status: VendorApplicationStatus;
  city: string;
  source: string;
}

export interface WholesaleLeadItem {
  id: string;
  company: string;
  contact: string;
  status: WholesaleLeadStatus;
  city: string;
  source: string;
}

export interface SiteSetting {
  brandName: string;
  tagline: string;
  supportEmail: string;
  whatsapp: string;
  shippingFlatRate: number;
  freeShippingThreshold: number;
  yapeNumber?: string;
  walletType?: string;
  walletOwnerName?: string;
  headerLogoUrl?: string;
  heroProductImageUrl?: string;
  loadingImageUrl?: string;
  faviconUrl?: string;
}

export type AuditSeverity = "info" | "warning" | "error" | "critical";

export interface AuditLogSummary {
  id: string;
  module: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  severity: AuditSeverity;
  actorUserId?: string;
  actorName?: string;
  payloadSummary?: string;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminActionSummary {
  id: string;
  actionType: string;
  targetType: string;
  targetId: string;
  summary: string;
  actorUserId?: string;
  actorName?: string;
  metadataSummary?: string;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditOverviewSummary {
  logs: AuditLogSummary[];
  actions: AdminActionSummary[];
  totalLogs: number;
  totalActions: number;
  severityCounts: Record<AuditSeverity, number>;
  modules: string[];
}

export interface SecurityHeaderSummary {
  name: string;
  value: string;
  purpose: string;
}

export interface SecurityRateLimitSummary {
  profile: string;
  routePrefix: string;
  limit: number;
  windowMs: number;
  blockedRequests: number;
  totalRequests: number;
  lastSeenAt?: string;
}

export interface SecurityPostureSummary {
  service: string;
  cors: {
    enabled: boolean;
    credentials: boolean;
    originMode: "reflective" | "restricted";
    exposedHeaders: string[];
  };
  trustProxy: boolean;
  requestIdHeader: string;
  headers: SecurityHeaderSummary[];
  rateLimits: SecurityRateLimitSummary[];
  authPolicy: {
    sessionTtlHours: number;
    passwordMinLength: number;
    demoAccounts: boolean;
    bearerTokens: boolean;
  };
  auditPolicy: {
    persistence: "memory" | "prisma";
    lastAuditAt?: string;
    lastActionAt?: string;
  };
  telemetry: {
    totalRequests: number;
    blockedRequests: number;
    lastRequestAt?: string;
    lastBlockedAt?: string;
  };
  updatedAt: string;
}

export interface HealthDependencySummary {
  name: string;
  status: "healthy" | "degraded" | "missing";
  detail: string;
  latencyMs?: number;
  checkedAt: string;
}

export interface OperationalHealthSummary {
  service: string;
  status: "ok" | "degraded";
  timestamp: string;
  uptimeSeconds: number;
  pid: number;
  nodeVersion: string;
  platform: string;
  environment: string;
  port: number;
  memory: {
    rssMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
    externalMb: number;
  };
  dependencies: HealthDependencySummary[];
}

export interface ObservabilityRequestSummary {
  id: string;
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  occurredAt: string;
  actorUserId?: string;
  actorName?: string;
}

export interface ObservabilityRouteMetricSummary {
  key: string;
  method: string;
  path: string;
  totalRequests: number;
  clientErrorRequests: number;
  serverErrorRequests: number;
  averageDurationMs: number;
  p95DurationMs: number;
  maxDurationMs: number;
  lastRequestAt?: string;
}

export interface ObservabilityEventSummary {
  id: string;
  category: "http" | "checkout" | "payment" | "notification" | "queue" | "system" | "orders";
  action: string;
  severity: AuditSeverity;
  detail: string;
  relatedType?: string;
  relatedId?: string;
  occurredAt: string;
}

export interface ObservabilityQueueSummary {
  queueName: string;
  status: "healthy" | "degraded" | "missing";
  waiting: number;
  active: number;
  delayed: number;
  completed: number;
  failed: number;
  checkedAt: string;
  detail?: string;
}

export interface ObservabilityOverviewSummary {
  service: string;
  generatedAt: string;
  requestIdHeader: string;
  requests: {
    totalRequests: number;
    successRequests: number;
    clientErrorRequests: number;
    serverErrorRequests: number;
    blockedRequests: number;
    averageDurationMs: number;
    p95DurationMs: number;
    lastRequestAt?: string;
  };
  recentRequests: ObservabilityRequestSummary[];
  topRoutes: ObservabilityRouteMetricSummary[];
  events: ObservabilityEventSummary[];
  queues: ObservabilityQueueSummary[];
}

export interface CmsSeoMeta {
  pageSlug: string;
  title: string;
  description: string;
  keywords: string[];
  canonicalPath?: string;
  robots: "index,follow" | "noindex,nofollow";
  updatedAt: string;
}

export interface CmsPageBlock {
  id: string;
  pageSlug: string;
  type: string;
  title: string;
  description: string;
  content: string;
  position: number;
  status: "active" | "inactive";
  updatedAt: string;
}

export interface CmsPage {
  slug: string;
  title: string;
  description: string;
  status: "draft" | "published" | "archived";
  blocks: CmsPageBlock[];
  seoMeta: CmsSeoMeta;
  updatedAt: string;
}

export interface CmsBanner {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  note: string;
  tone: PromoBanner["tone"];
  status: "active" | "inactive";
  position: number;
  updatedAt: string;
}

export interface CmsFaq {
  id: string;
  question: string;
  answer: string;
  category?: string;
  status: "active" | "inactive";
  position: number;
  updatedAt: string;
}

export interface CmsTestimonial {
  id: string;
  name: string;
  role: string;
  quote?: string;
  rating: number;
  kind?: CmsTestimonialKind;
  position?: number;
  audioUrl?: string;
  socialUrl?: string;
  socialPlatform?: CmsSocialPlatform;
  coverImageUrl?: string;
  status: "active" | "inactive";
  updatedAt: string;
}

export interface DashboardSummary {
  metrics: AdminMetric[];
  recentOrders: OrderSummaryRow[];
  reviewQueue: ReviewItem[];
  commissionRows: CommissionRow[];
}

export interface WebNavigationGroup {
  title: string;
  items: NavigationItem[];
}

export interface AdminNavigationGroup {
  title: string;
  items: NavigationItem[];
}

export interface InventorySnapshot {
  sku: string;
  name: string;
  movements: number;
  movementType: InventoryMovementType;
}

export interface CampaignSummary {
  name: string;
  status: CampaignStatus;
  runStatus: CampaignRunStatus;
  recipients: CampaignRecipientStatus[];
}

export interface LoyaltyAccountSummary {
  customer: string;
  availablePoints: number;
  pendingPoints: number;
  redeemedPoints: number;
  recentMovement: LoyaltyMovementStatus;
  redemptionStatus: RedemptionStatus;
}

export interface VendorOverview {
  name: string;
  code: string;
  status: VendorStatus;
  sales: number;
  commissions: number;
  collaborationType?: VendorCollaborationType;
}

export interface RoleSummary {
  code: RoleCode;
  label: string;
}

export interface WholesaleQuoteSummary {
  company: string;
  status: WholesaleQuoteStatus;
  amount: number;
}

export interface PaymentReviewSummary {
  orderNumber: string;
  status: PaymentStatus;
  amount: number;
  provider: string;
  manualStatus: ManualPaymentRequestStatus;
  notificationStatus: NotificationStatus;
}
