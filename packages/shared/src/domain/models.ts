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
  availableStock?: number;
  lowStockThreshold?: number;
  stockStatus?: "available" | "low_stock" | "out_of_stock";
  stockLabel?: string;
  isPurchasable?: boolean;
  variants?: {
    id: string;
    sku: string;
    name: string;
    price: number;
    compareAtPrice?: number;
    status: "active" | "inactive" | "out_of_stock";
    availableStock?: number;
    lowStockThreshold?: number;
    stockStatus?: "available" | "low_stock" | "out_of_stock";
    stockLabel?: string;
    isPurchasable?: boolean;
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

export type WarehouseStatusValue = "active" | "inactive" | "suspended";

export type WarehouseServiceAreaScopeValue = "department" | "province" | "district" | "zone";

export type FulfillmentAssignmentStrategyValue =
  | "manual"
  | "warehouse_default"
  | "coverage_priority"
  | "stock_priority"
  | "fallback";

export type FulfillmentAssignmentStatusValue = "pending" | "assigned" | "skipped" | "cancelled";

export type FulfillmentSuggestionStatusValue = "suggested" | "blocked";

export interface WarehouseSummary {
  id: string;
  code: string;
  name: string;
  status: WarehouseStatusValue;
  priority: number;
  countryCode: string;
  addressLine1: string;
  addressLine2?: string;
  reference?: string;
  departmentCode: string;
  departmentName?: string;
  provinceCode: string;
  provinceName?: string;
  districtCode: string;
  districtName?: string;
  latitude?: number;
  longitude?: number;
  serviceAreas?: WarehouseServiceAreaSummary[];
}

export interface WarehouseServiceAreaSummary {
  id: string;
  warehouseId: string;
  scopeType: WarehouseServiceAreaScopeValue;
  scopeCode: string;
  scopeLabel?: string;
  priority: number;
  isActive: boolean;
}

export interface WarehouseInventoryBalanceSummary {
  warehouseId: string;
  variantId: string;
  stockOnHand: number;
  reservedQuantity: number;
  committedQuantity: number;
  availableStock: number;
  updatedAt: string;
}

export type WarehouseTransferStatusValue = "reserved" | "in_transit" | "partial_received" | "received" | "cancelled";
export type WarehouseTransferDocumentKindValue = "package_snapshot" | "gre" | "sticker";
export type WarehouseTransferIncidentStatusValue = "open" | "resolved";
export type WarehouseTransferIncidentKindValue = "missing" | "damage" | "loss" | "overage" | "mixed";

export interface WarehouseTransferLineInput {
  variantId: string;
  quantity: number;
}

export interface WarehouseTransferCreateInput {
  originWarehouseId: string;
  destinationWarehouseId: string;
  reason: string;
  notes?: string;
  requestedByUserId?: string;
  requestedAt?: string;
  lines: WarehouseTransferLineInput[];
}

export interface WarehouseTransferDispatchInput {
  notes?: string;
  dispatchedAt?: string;
  dispatchedByUserId?: string;
}

export interface WarehouseTransferReceiveInput {
  notes?: string;
  receivedAt?: string;
  receivedByUserId?: string;
  lines?: WarehouseTransferReceiveLineInput[];
  incidentKind?: WarehouseTransferIncidentKindValue;
  incidentNotes?: string;
}

export interface WarehouseTransferCancelInput {
  notes?: string;
  cancelledAt?: string;
  cancelledByUserId?: string;
}

export interface WarehouseTransferReconcileInput {
  notes?: string;
  resolvedAt?: string;
  resolvedByUserId?: string;
}

export interface WarehouseTransferLineSummary {
  variantId: string;
  sku: string;
  name: string;
  quantity: number;
  dispatchedQuantity: number;
  receivedQuantity: number;
  pendingQuantity: number;
}

export interface WarehouseTransferIncidentLineSummary {
  variantId: string;
  sku: string;
  name: string;
  expectedQuantity: number;
  receivedQuantity: number;
  differenceQuantity: number;
}

export interface WarehouseTransferIncidentSummary {
  id: string;
  transferId: string;
  transferNumber: string;
  status: WarehouseTransferIncidentStatusValue;
  kind: WarehouseTransferIncidentKindValue;
  notes?: string;
  openedByUserId?: string;
  resolvedByUserId?: string;
  openedAt: string;
  resolvedAt?: string;
  resolutionNote?: string;
  totalExpectedUnits: number;
  totalReceivedUnits: number;
  totalDifferenceUnits: number;
  lines: WarehouseTransferIncidentLineSummary[];
}

export interface WarehouseTransferHistorySummary {
  status: WarehouseTransferStatusValue;
  actorUserId?: string;
  note?: string;
  occurredAt: string;
}

export interface WarehouseTransferSnapshotBaseSummary {
  transferId: string;
  transferNumber: string;
  originWarehouseId: string;
  originWarehouseCode: string;
  originWarehouseName: string;
  destinationWarehouseId: string;
  destinationWarehouseCode: string;
  destinationWarehouseName: string;
  lineCount: number;
  totalUnits: number;
  lines: WarehouseTransferLineSummary[];
}

export interface WarehouseTransferPackageSnapshotInput {
  notes?: string;
  packedAt?: string;
  packedByUserId?: string;
  declaredWeight?: number;
  packageCount?: number;
  packageIndex?: number;
}

export interface WarehouseTransferPackageSnapshotSummary extends WarehouseTransferSnapshotBaseSummary {
  id: string;
  documentKind: "package_snapshot";
  templateVersion: "transfer-package-snapshot-v1";
  packageId: string;
  packageCount: number;
  packageIndex: number;
  packedAt: string;
  packedByUserId?: string;
  notes?: string;
  declaredWeight?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseTransferGuideInput {
  notes?: string;
  issuedAt?: string;
  issuedByUserId?: string;
  guideType?: "sunat_remitente" | "sunat_transportista" | "sunat_event";
  transportMode?: "private" | "public";
}

export interface WarehouseTransferGuideSummary extends WarehouseTransferSnapshotBaseSummary {
  id: string;
  documentKind: "gre";
  templateVersion: "transfer-gre-v1";
  guideType: "sunat_remitente" | "sunat_transportista" | "sunat_event";
  series: string;
  number: string;
  referenceCode: string;
  qrValue: string;
  motive: string;
  transportMode: "private" | "public";
  issuedAt: string;
  issuedByUserId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseTransferStickerInput {
  notes?: string;
  generatedAt?: string;
  generatedByUserId?: string;
  printedAt?: string;
  printedByUserId?: string;
}

export interface WarehouseTransferStickerSummary extends WarehouseTransferSnapshotBaseSummary {
  id: string;
  documentKind: "sticker";
  templateVersion: "transfer-sticker-v1";
  stickerCode: string;
  guideReference?: string;
  generatedAt: string;
  generatedByUserId?: string;
  printedAt?: string;
  printedByUserId?: string;
  printHint: {
    paperSize: "A6";
    orientation: "portrait";
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseTransferLogisticsSummary {
  packageSnapshot?: WarehouseTransferPackageSnapshotSummary;
  gre?: WarehouseTransferGuideSummary;
  sticker?: WarehouseTransferStickerSummary;
}

export interface WarehouseTransferSummary {
  id: string;
  transferNumber: string;
  status: WarehouseTransferStatusValue;
  reason: string;
  notes?: string;
  originWarehouseId: string;
  originWarehouseCode: string;
  originWarehouseName: string;
  destinationWarehouseId: string;
  destinationWarehouseCode: string;
  destinationWarehouseName: string;
  lineCount: number;
  totalUnits: number;
  dispatchedUnits: number;
  receivedUnits: number;
  pendingUnits: number;
  lines: WarehouseTransferLineSummary[];
  history: WarehouseTransferHistorySummary[];
  requestedByUserId?: string;
  dispatchedByUserId?: string;
  receivedByUserId?: string;
  cancelledByUserId?: string;
  partialReceivedByUserId?: string;
  logistics?: WarehouseTransferLogisticsSummary;
  incident?: WarehouseTransferIncidentSummary;
  createdAt: string;
  updatedAt: string;
  dispatchedAt?: string;
  partialReceivedAt?: string;
  receivedAt?: string;
  cancelledAt?: string;
}

export interface WarehouseTransferReceiveLineInput {
  variantId: string;
  quantity: number;
}

export interface FulfillmentMissingLineSummary {
  warehouseId: string;
  variantId: string;
  sku: string;
  name: string;
  requestedQuantity: number;
  availableQuantity: number;
}

export interface OrderFulfillmentAssignmentSummary {
  id: string;
  orderNumber: string;
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  status: FulfillmentAssignmentStatusValue;
  strategy: FulfillmentAssignmentStrategyValue;
  assignedAt: string;
  assignedByUserId?: string;
  notes?: string;
  countryCodeSnapshot: string;
  departmentCodeSnapshot: string;
  departmentNameSnapshot?: string;
  provinceCodeSnapshot: string;
  provinceNameSnapshot?: string;
  districtCodeSnapshot: string;
  districtNameSnapshot?: string;
  addressLine1Snapshot: string;
  addressLine2Snapshot?: string;
  referenceSnapshot?: string;
}

export interface OrderFulfillmentSuggestionSummary {
  id: string;
  orderNumber: string;
  status: FulfillmentSuggestionStatusValue;
  strategy?: FulfillmentAssignmentStrategyValue;
  suggestedAt: string;
  warehouseId?: string;
  warehouseCode?: string;
  warehouseName?: string;
  coverageScope?: WarehouseServiceAreaScopeValue;
  candidateCount: number;
  canAutoAssign: boolean;
  availableForAllLines: boolean;
  reason: string;
  blockingReason?: string;
  missingLines?: FulfillmentMissingLineSummary[];
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
  adminSidebarLogoUrl?: string;
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
