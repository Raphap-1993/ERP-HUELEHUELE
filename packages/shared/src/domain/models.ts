import type {
  CampaignRecipientStatus,
  CampaignRunStatus,
  CampaignStatus,
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
  quote: string;
  rating: number;
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
