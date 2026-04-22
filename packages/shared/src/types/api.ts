import type {
  CampaignRunStatus,
  CampaignStatus,
  CampaignRecipientStatus,
  CmsSocialPlatform,
  CmsTestimonialKind,
  CommissionPayoutStatus,
  CommissionStatus,
  CrmStage,
  LoyaltyMovementStatus,
  ManualPaymentRequestStatus,
  OrderStatus,
  NotificationChannel,
  NotificationStatus,
  PaymentStatus,
  ProductSalesChannel,
  RoleCode,
  RedemptionStatus,
  VendorCollaborationType,
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
  BundleComponentInput,
  BundleComponentSummary,
  FulfillmentAssignmentStatusValue,
  FulfillmentAssignmentStrategyValue,
  HealthDependencySummary,
  ObservabilityEventSummary,
  ObservabilityOverviewSummary,
  ObservabilityQueueSummary,
  ObservabilityRequestSummary,
  ObservabilityRouteMetricSummary,
  OrderFulfillmentAssignmentSummary,
  OrderFulfillmentSuggestionSummary,
  OperationalHealthSummary,
  SecurityPostureSummary,
  WebNavigationGroup,
  WarehouseInventoryBalanceSummary,
  WarehouseTransferSummary,
  WarehouseServiceAreaScopeValue,
  WarehouseSummary,
  WarehouseStatusValue,
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
  accountType: "admin" | "seller" | "wholesale" | "customer" | "operator";
  vendorCode?: string;
  wholesaleLeadId?: string;
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

export type CommercialAccessAccountType = "seller" | "wholesale";

export type CommercialAccessStatus = "active" | "inactive" | "suspended";

export interface CommercialAccessSummary {
  id: string;
  name: string;
  email: string;
  phone?: string;
  accountType: CommercialAccessAccountType;
  status: CommercialAccessStatus;
  roles: AuthRoleSummary[];
  vendorCode?: string;
  wholesaleLeadId?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CommercialAccessCreateInput {
  name: string;
  email: string;
  accountType: CommercialAccessAccountType;
  phone?: string;
  password?: string;
  vendorCode?: string;
  wholesaleLeadId?: string;
}

export interface CommercialAccessUpdateInput {
  name?: string;
  phone?: string;
  vendorCode?: string;
  wholesaleLeadId?: string;
}

export interface CommercialAccessStatusInput {
  status: CommercialAccessStatus;
}

export interface CommercialAccessResetPasswordInput {
  password?: string;
}

export interface CommercialAccessActionEnvelope extends ActionEnvelope {
  access?: CommercialAccessSummary;
  temporaryPassword?: string;
}

export type VendorApplicationIntent = "affiliate" | "seller" | "content_creator" | "other";

export interface VendorApplicationInput {
  name: string;
  email: string;
  city: string;
  phone: string;
  applicationIntent: VendorApplicationIntent;
  source?: string;
  message?: string;
}

export interface VendorApplicationSummary {
  id: string;
  name: string;
  email: string;
  city: string;
  phone?: string;
  applicationIntent: VendorApplicationIntent;
  source: string;
  status: VendorApplicationStatus;
  message?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  vendorCode?: string;
  resolvedCollaborationType?: VendorCollaborationType;
  createdAt: string;
  updatedAt: string;
}

export interface VendorSummary {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  code: string;
  collaborationType?: VendorCollaborationType;
  city?: string;
  source?: string;
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

export type CustomerStatusValue = "pending" | "active" | "inactive" | "suspended";

export interface CustomerAddressSummary {
  id: string;
  label: string;
  recipientName: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode: string;
  departmentCode?: string;
  departmentName?: string;
  provinceCode?: string;
  provinceName?: string;
  districtCode?: string;
  districtName?: string;
  isDefault: boolean;
}

export interface CustomerAddressInput {
  id?: string;
  label: string;
  recipientName: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode?: string;
  departmentCode?: string;
  departmentName?: string;
  provinceCode?: string;
  provinceName?: string;
  districtCode?: string;
  districtName?: string;
  isDefault?: boolean;
}

export interface CustomerSummary {
  id: string;
  userId: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  documentType?: CheckoutDocumentType;
  documentNumber?: string;
  marketingOptIn: boolean;
  status: CustomerStatusValue;
  addressesCount: number;
  defaultAddressSummary?: string;
  ordersCount: number;
  lastOrderAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerDetail extends CustomerSummary {
  addresses: CustomerAddressSummary[];
  recentOrders: AdminOrderSummary[];
}

export type CustomerIdentityConflictStatus = "open" | "resolved" | "ignored" | "merged";

export interface CustomerConflictCandidateSummary {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  documentType?: CheckoutDocumentType;
  documentNumber?: string;
  ordersCount: number;
}

export interface CustomerIdentityConflictSummary {
  id: string;
  orderNumber: string;
  status: CustomerIdentityConflictStatus;
  reason: string;
  customerName: string;
  email?: string;
  phone?: string;
  documentType?: CheckoutDocumentType;
  documentNumber?: string;
  candidateCustomers: CustomerConflictCandidateSummary[];
  createdAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  resolvedCustomerId?: string;
  resolutionType?: "assign_existing" | "merge" | "ignore";
}

export interface CustomerConflictResolveInput {
  action: "assign_existing" | "merge" | "ignore";
  winnerCustomerId?: string;
  mergeSourceCustomerId?: string;
  actor?: string;
  notes?: string;
}

export interface CustomerMergeInput {
  sourceCustomerId: string;
  targetCustomerId: string;
  actor?: string;
  notes?: string;
  conflictId?: string;
}

export interface CustomerUpsertInput {
  email: string;
  phone?: string;
  password?: string;
  firstName: string;
  lastName: string;
  documentType?: CheckoutDocumentType;
  documentNumber?: string;
  marketingOptIn?: boolean;
  status?: CustomerStatusValue;
  addresses?: CustomerAddressInput[];
}

export interface VendorCodeSummary {
  code: string;
  name: string;
  collaborationType?: VendorCollaborationType;
  status: VendorStatus;
  approvedAt?: string;
  updatedAt: string;
}

export interface WholesaleLeadInput {
  company: string;
  contact: string;
  email: string;
  city: string;
  interestType?: "wholesale" | "distributor";
  estimatedVolume?: number;
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
  interestType?: "wholesale" | "distributor";
  estimatedVolume?: number;
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
  quote?: string;
  rating?: number;
  kind?: CmsTestimonialKind;
  position?: number;
  audioUrl?: string;
  socialUrl?: string;
  socialPlatform?: CmsSocialPlatform;
  coverImageUrl?: string;
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
  scope: "seller_code" | "vendor" | "order_total" | "payment_method" | "wholesale";
  rate: number;
  paymentMethod?: "openpay" | "manual" | "any";
  appliesToVendorCode?: string;
  appliesToCollaborationType?: VendorCollaborationType;
  minOrderTotal?: number;
  maxOrderTotal?: number;
  payoutDelayDays: number;
  notes?: string;
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
  ruleName: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  payoutId?: string;
  eligibleAt?: string;
  blockedReason?: string;
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
  bonusAmount: number;
  deductionAmount: number;
  netAmount: number;
  referenceId?: string;
  bonusReason?: string;
  deductionReason?: string;
  notes?: string;
  createdAt: string;
  paidAt?: string;
  updatedAt: string;
}

export interface VendorApplicationActionInput {
  reviewer?: string;
  notes?: string;
  resolvedCollaborationType?: VendorCollaborationType;
  preferredCode?: string;
}

export interface CommissionPayoutInput {
  vendorCode?: string;
  period?: string;
  referenceId?: string;
  bonusAmount?: number;
  bonusReason?: string;
  deductionAmount?: number;
  deductionReason?: string;
  notes?: string;
}

export interface CommissionPayoutSettleInput {
  reviewer?: string;
  notes?: string;
  referenceId?: string;
}

export interface CommissionRuleInput {
  name: string;
  description: string;
  scope: CommissionRuleSummary["scope"];
  rate: number;
  paymentMethod?: CommissionRuleSummary["paymentMethod"];
  appliesToVendorCode?: string;
  appliesToCollaborationType?: VendorCollaborationType;
  minOrderTotal?: number;
  maxOrderTotal?: number;
  payoutDelayDays?: number;
  notes?: string;
  priority?: number;
  status?: CommissionRuleSummary["status"];
}

export interface CouponSummary {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  description: string;
  conditions?: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

export interface CouponInput {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  description: string;
  conditions?: string;
  isActive?: boolean;
}

export interface CatalogCategorySummary {
  id?: string;
  slug: string;
  name: string;
  description: string;
  productCount: number;
}

export interface CatalogSummaryResponse {
  products: CatalogProduct[];
  categories: CatalogCategorySummary[];
  currencyCode: string;
  filters: {
    search?: string;
    category?: string;
    featuredOnly?: boolean;
  };
}

export type ProductStatusValue = "draft" | "active" | "inactive" | "archived";
export type ProductKindValue = "single" | "bundle";
export type ProductVariantStatusValue = "active" | "inactive" | "out_of_stock";

export interface ProductVariantSummary {
  id: string;
  sku: string;
  name: string;
  flavorCode?: string;
  flavorLabel?: string;
  presentationCode?: string;
  presentationLabel?: string;
  price: number;
  compareAtPrice?: number;
  stockOnHand: number;
  lowStockThreshold?: number;
  status: ProductVariantStatusValue;
  defaultWarehouseId?: string;
  defaultWarehouseCode?: string;
  defaultWarehouseName?: string;
}

export interface ProductImageSummary {
  id: string;
  url: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
  variantId?: string;
}

export interface ProductCategorySummary {
  id: string;
  slug: string;
  name: string;
  description?: string;
  isActive: boolean;
  productCount: number;
}

export interface ProductAdminSummary {
  id: string;
  name: string;
  slug: string;
  productKind: ProductKindValue;
  shortDescription?: string;
  categoryId?: string;
  categorySlug?: string;
  categoryName?: string;
  status: ProductStatusValue;
  isFeatured: boolean;
  price: number;
  compareAtPrice?: number;
  sku: string;
  defaultVariantId?: string;
  defaultWarehouseId?: string;
  defaultWarehouseCode?: string;
  defaultWarehouseName?: string;
  salesChannel?: ProductSalesChannel;
  reportingGroup?: string;
  currencyCode: string;
  primaryImageUrl?: string;
  updatedAt: string;
}

export interface ProductAdminDetail extends ProductAdminSummary {
  longDescription?: string;
  variants: ProductVariantSummary[];
  bundleComponents: ProductBundleComponentSummary[];
  images: ProductImageSummary[];
}

export interface ProductVariantInput {
  id?: string;
  sku: string;
  name: string;
  flavorCode?: string;
  flavorLabel?: string;
  presentationCode?: string;
  presentationLabel?: string;
  price: number;
  compareAtPrice?: number;
  stockOnHand: number;
  lowStockThreshold?: number;
  status: ProductVariantStatusValue;
  defaultWarehouseId?: string;
}

export interface ProductBundleComponentInput extends BundleComponentInput {}

export interface ProductBundleComponentSummary extends BundleComponentSummary {}

export interface ProductUpsertInput {
  categoryId?: string;
  productKind?: ProductKindValue;
  name: string;
  slug: string;
  shortDescription?: string;
  longDescription?: string;
  status: ProductStatusValue;
  isFeatured: boolean;
  salesChannel?: ProductSalesChannel;
  reportingGroup?: string;
  variants: ProductVariantInput[];
  bundleComponents: ProductBundleComponentInput[];
}

export interface WarehouseServiceAreaInput {
  scopeType: WarehouseServiceAreaScopeValue;
  scopeCode: string;
  priority?: number;
  isActive?: boolean;
}

export interface WarehouseUpsertInput {
  code?: string;
  name: string;
  status: WarehouseStatusValue;
  priority?: number;
  countryCode?: string;
  addressLine1: string;
  addressLine2?: string;
  reference?: string;
  departmentCode: string;
  departmentName?: string;
  provinceCode: string;
  provinceName?: string;
  districtCode: string;
  districtName?: string;
  latitude?: number | null;
  longitude?: number | null;
  serviceAreas?: WarehouseServiceAreaInput[];
}

export interface OrderFulfillmentAssignmentInput {
  warehouseId: string;
  status?: FulfillmentAssignmentStatusValue;
  strategy?: FulfillmentAssignmentStrategyValue;
  assignedByUserId?: string;
  assignedAt?: string;
  notes?: string;
}

export interface ProductImageUploadInput {
  altText?: string;
  isPrimary?: boolean;
  sortOrder?: number;
  variantId?: string;
}

export type MediaAssetKindValue = "product" | "hero" | "banner" | "logo" | "evidence";

export interface MediaAssetSummary {
  kind?: MediaAssetKindValue;
  filename?: string;
  objectKey: string;
  url: string;
  contentType: string;
  width?: number;
  height?: number;
  sizeBytes: number;
  uploadedAt?: string;
}

export interface ProductImageUploadSummary {
  image: ProductImageSummary;
  media: MediaAssetSummary;
}

export interface CheckoutItemInput {
  slug: string;
  quantity: number;
  variantId?: string;
}

export interface InventoryAllocationSummary {
  variantId: string;
  sku: string;
  name: string;
  quantity: number;
  warehouseId?: string;
}

export interface CheckoutCustomerInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documentType?: CheckoutDocumentType;
  documentNumber?: string;
}

export type CheckoutDocumentType = "dni" | "ce" | "ruc" | "passport" | "other_sunat";

export const CHECKOUT_DOCUMENT_TYPE_OPTIONS: Array<{
  value: CheckoutDocumentType;
  label: string;
  placeholder: string;
  inputMode: "text" | "numeric";
}> = [
  { value: "dni", label: "DNI", placeholder: "8 dígitos", inputMode: "numeric" },
  { value: "ce", label: "Carné de extranjería", placeholder: "Tu número de CE", inputMode: "text" },
  { value: "ruc", label: "RUC", placeholder: "11 dígitos", inputMode: "numeric" },
  { value: "passport", label: "Pasaporte", placeholder: "Tu número de pasaporte", inputMode: "text" },
  { value: "other_sunat", label: "Otro documento SUNAT", placeholder: "Tu número de documento", inputMode: "text" }
];

export type CheckoutDeliveryMode = "standard" | "province_shalom_pickup";

export type CheckoutCarrier = "olva_courier" | "shalom";

export const CHECKOUT_STANDARD_DELIVERY_DEPARTMENT_CODES = ["07", "15"] as const;
export const CHECKOUT_STANDARD_DELIVERY_PROVINCE_CODES = ["0701", "1501"] as const;

export function isCheckoutStandardDeliveryDepartmentCode(code?: string | null) {
  const normalized = code?.trim();
  return normalized
    ? CHECKOUT_STANDARD_DELIVERY_DEPARTMENT_CODES.includes(
        normalized as (typeof CHECKOUT_STANDARD_DELIVERY_DEPARTMENT_CODES)[number]
      )
    : false;
}

export function isCheckoutStandardDeliveryProvinceCode(code?: string | null) {
  const normalized = code?.trim();
  return normalized
    ? CHECKOUT_STANDARD_DELIVERY_PROVINCE_CODES.includes(
        normalized as (typeof CHECKOUT_STANDARD_DELIVERY_PROVINCE_CODES)[number]
      )
    : false;
}

export interface CheckoutShippingInput {
  deliveryMode?: CheckoutDeliveryMode;
  carrier?: CheckoutCarrier;
  agencyName?: string;
  payOnPickup?: boolean;
}

export interface CheckoutAddressInput extends CheckoutShippingInput {
  label?: string;
  recipientName: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode?: string;
  departmentCode?: string;
  departmentName?: string;
  provinceCode?: string;
  provinceName?: string;
  districtCode?: string;
  districtName?: string;
}

export interface CheckoutCustomerPrefillAddressSummary {
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode: string;
  departmentCode?: string;
  departmentName?: string;
  provinceCode?: string;
  provinceName?: string;
  districtCode?: string;
  districtName?: string;
}

export interface CheckoutCustomerPrefillSummary {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone?: string;
  documentType?: CheckoutDocumentType;
  documentNumber?: string;
  defaultAddress?: CheckoutCustomerPrefillAddressSummary;
}

export interface CheckoutDocumentLookupInput {
  documentType: CheckoutDocumentType;
  documentNumber: string;
}

export interface CheckoutDocumentIdentitySummary {
  documentType: CheckoutDocumentType;
  documentNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  verificationDigit?: string;
  source: "apiperu";
}

export interface CheckoutDocumentLookupSummary {
  documentType: CheckoutDocumentType;
  documentNumber: string;
  officialIdentity?: CheckoutDocumentIdentitySummary;
  customer?: CheckoutCustomerPrefillSummary;
}

export interface PeruDepartmentSummary {
  code: string;
  name: string;
}

export interface PeruProvinceSummary {
  code: string;
  name: string;
  departmentCode: string;
}

export interface PeruDistrictSummary {
  code: string;
  name: string;
  departmentCode: string;
  provinceCode: string;
}

export interface CheckoutQuoteItemSummary {
  slug: string;
  name: string;
  sku: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  imageUrl?: string;
  inventoryAllocations?: InventoryAllocationSummary[];
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
  evidenceImageUrl?: string;
  clientRequestId?: string;
}

export interface CheckoutQuoteInput {
  items: CheckoutItemInput[];
  paymentMethod?: "openpay" | "manual";
  vendorCode?: string;
  couponCode?: string;
  shipping?: CheckoutShippingInput;
}

export interface CheckoutActionSummary {
  orderNumber: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: "openpay" | "manual";
  salesChannel: SalesChannelValue;
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
  variantId?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  inventoryAllocations?: InventoryAllocationSummary[];
}

export interface OrderCustomerSummary {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documentType?: CheckoutDocumentType;
  documentNumber?: string;
}

export interface OrderAddressSummary extends CheckoutShippingInput {
  label?: string;
  recipientName: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode: string;
  departmentCode?: string;
  departmentName?: string;
  provinceCode?: string;
  provinceName?: string;
  districtCode?: string;
  districtName?: string;
}

export interface OrderStatusHistorySummary {
  status: OrderStatus;
  label: string;
  actor: string;
  occurredAt: string;
  note: string;
}

export type SalesChannelValue = "web" | "manual";

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

export interface AdminManualPaymentCreateInput {
  reviewer?: string;
  reference?: string;
  notes?: string;
  amount?: number;
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
  evidenceImageUrl?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewer?: string;
  notes?: string;
}

export type OrderCommercialTraceRoute = "manual_direct" | "manual_request" | "openpay_backoffice" | "openpay_provider";

export type OrderCommercialTraceStatus = "pending" | "confirmed" | "rejected";

export interface OrderCommercialTraceSummary {
  route: OrderCommercialTraceRoute;
  status: OrderCommercialTraceStatus;
  actor?: string;
  reference?: string;
  note?: string;
  evidenceReference?: string;
  evidenceNotes?: string;
  evidenceImageUrl?: string;
  occurredAt?: string;
}

export interface AdminDispatchLabelAvailabilitySummary {
  available: boolean;
  actionLabel: "Imprimir etiqueta" | "Reimprimir etiqueta";
  blockReason?: string;
}

export interface AdminOrderSummary {
  orderNumber: string;
  customerName: string;
  customerId?: string;
  customerConflictId?: string;
  total: number;
  currencyCode: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: "openpay" | "manual";
  salesChannel: SalesChannelValue;
  vendorId?: string;
  vendorCode?: string;
  vendorName?: string;
  manualStatus?: ManualPaymentRequestStatus;
  crmStage?: CrmStage;
  providerReference: string;
  confirmedAt?: string;
  updatedAt: string;
  createdAt: string;
  itemCount: number;
  dispatchLabel?: AdminDispatchLabelAvailabilitySummary;
}

export interface AdminOrderVendorOption {
  code: string;
  name: string;
  email?: string;
  city?: string;
  collaborationType?: VendorCollaborationType;
  status: VendorStatus;
  updatedAt: string;
}

export interface AdminOrderDetail {
  orderNumber: string;
  customerId?: string;
  customerConflictId?: string;
  customer: OrderCustomerSummary;
  address: OrderAddressSummary;
  items: OrderItemSummary[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  currencyCode: string;
  paymentMethod: "openpay" | "manual";
  salesChannel: SalesChannelValue;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  vendorId?: string;
  vendorCode?: string;
  vendorName?: string;
  fulfillmentSuggestion?: OrderFulfillmentSuggestionSummary;
  fulfillmentAssignment?: OrderFulfillmentAssignmentSummary;
  couponCode?: string;
  notes?: string;
  providerReference: string;
  checkoutUrl?: string;
  manualStatus?: ManualPaymentRequestStatus;
  manualRequestId?: string;
  manualEvidenceReference?: string;
  manualEvidenceNotes?: string;
  evidenceImageUrl?: string;
  crmStage?: CrmStage;
  statusHistory: OrderStatusHistorySummary[];
  payment: AdminPaymentSummary;
  manualRequest?: AdminManualPaymentRequestSummary;
  commercialTrace?: OrderCommercialTraceSummary;
  confirmedAt?: string;
  dispatchLabel?: AdminDispatchLabelAvailabilitySummary;
  createdAt: string;
  updatedAt: string;
}

export interface AdminDispatchLabelItemSummary {
  name: string;
  sku: string;
  quantity: number;
}

export interface AdminDispatchLabelRecipientSummary {
  name: string;
  phone: string;
}

export interface AdminDispatchLabelDestinationSummary {
  line1: string;
  line2?: string | null;
  city: string;
  region: string;
  postalCode?: string | null;
  countryCode: string;
  deliveryMode: CheckoutDeliveryMode;
  carrier?: CheckoutCarrier;
  agencyName?: string | null;
  payOnPickup?: boolean | null;
}

export interface AdminDispatchLabelOrderSummary {
  reference: string;
  salesChannel: SalesChannelValue;
  vendorCode?: string;
  vendorName?: string;
  totalItems: number;
  totalUnits: number;
  items: AdminDispatchLabelItemSummary[];
}

export interface AdminDispatchLabelSummary {
  orderNumber: string;
  templateVersion: "dispatch-label-v1";
  generatedAt: string;
  recipient: AdminDispatchLabelRecipientSummary;
  destination: AdminDispatchLabelDestinationSummary;
  order: AdminDispatchLabelOrderSummary;
  barcode: {
    type: "code128";
    value: string;
  };
  printHint: {
    paperSize: "A6";
    orientation: "portrait";
  };
}

export interface AdminDispatchOrderSummary {
  orderNumber: string;
  customerName: string;
  recipientName: string;
  phone: string;
  city: string;
  region: string;
  countryCode: string;
  deliveryMode: CheckoutDeliveryMode;
  carrier?: CheckoutCarrier;
  agencyName?: string;
  orderStatus: OrderStatus;
  salesChannel: SalesChannelValue;
  providerReference: string;
  vendorCode?: string;
  vendorName?: string;
  fulfillmentSuggestion?: OrderFulfillmentSuggestionSummary;
  fulfillmentAssignment?: OrderFulfillmentAssignmentSummary;
  totalItems: number;
  totalUnits: number;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminDispatchLabelPrintInput {
  templateVersion?: "dispatch-label-v1";
  format?: "html" | "pdf";
  channel?: "single" | "batch";
}

export interface AdminOrderVendorAssignmentInput {
  vendorCode?: string;
  actor?: string;
}

export interface AdminOrderStatusTransitionInput {
  status: OrderStatus;
  actor?: string;
  note?: string;
}

export interface ManualReviewActionInput {
  reviewer?: string;
  notes?: string;
  sendEmailNow?: boolean;
}

export interface AdminVendorCreateInput {
  name: string;
  email: string;
  city: string;
  collaborationType?: VendorCollaborationType;
  phone: string;
  preferredCode?: string;
  source?: string;
  notes?: string;
  enableCommission?: boolean;
}

export interface AdminVendorUpdateInput {
  name: string;
  email: string;
  city: string;
  collaborationType?: VendorCollaborationType;
  status: VendorStatus;
  phone: string;
  preferredCode?: string;
  source?: string;
  notes?: string;
}

export interface InventoryReportRow {
  reportingGroup: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImageUrl?: string;
  productImageAlt?: string;
  salesChannel: ProductSalesChannel;
  variantId: string;
  variantName: string;
  sku: string;
  warehouseId: string;
  warehouseCode?: string;
  warehouseName?: string;
  isDefaultWarehouse: boolean;
  unitsSold: number;
  stockOnHand: number;
  reservedQuantity: number;
  committedQuantity: number;
  availableStock: number;
  variantUnitsSold: number;
  variantStockOnHand: number;
  variantReservedQuantity: number;
  variantCommittedQuantity: number;
  variantAvailableStock: number;
  lowStockThreshold: number;
  lowStock: boolean;
  defaultWarehouseId?: string;
  defaultWarehouseCode?: string;
  defaultWarehouseName?: string;
  warehouseBalances: WarehouseInventoryBalanceSummary[];
}

export interface InventoryReportSummary {
  rows: InventoryReportRow[];
  generatedAt: string;
}

export interface InventoryStockAdjustmentInput {
  variantId: string;
  warehouseId: string;
  stockOnHand: number;
  reason: string;
}

export interface InventoryStockAdjustmentEnvelope {
  status: "ok" | "queued" | "pending_review" | "rejected";
  message: string;
  referenceId?: string;
  balance: WarehouseInventoryBalanceSummary;
  previousStockOnHand: number;
  nextStockOnHand: number;
  delta: number;
}

export interface AdminReportFiltersInput {
  salesChannel?: SalesChannelValue;
  vendorCode?: string;
  productSlug?: string;
  sku?: string;
}

export interface VendorSalesReportRow {
  vendorId?: string;
  vendorCode?: string;
  vendorName: string;
  salesCount: number;
  totalRevenue: number;
  avgOrderValue: number;
  lastSaleAt?: string;
  webSalesCount: number;
  manualSalesCount: number;
}

export interface ProductSalesReportRow {
  productSlug: string;
  productName: string;
  sku: string;
  unitsSold: number;
  totalRevenue: number;
  lastSoldAt?: string;
  webUnitsSold: number;
  manualUnitsSold: number;
}

export interface SalesDetailReportRow {
  orderNumber: string;
  confirmedAt: string;
  salesChannel: SalesChannelValue;
  vendorId?: string;
  vendorCode?: string;
  vendorName?: string;
  productSlug: string;
  productName: string;
  sku: string;
  quantity: number;
  lineTotal: number;
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

export interface InventoryReportEnvelope {
  data: InventoryReportSummary;
  meta?: Record<string, unknown>;
}

export interface WarehousesEnvelope {
  data: WarehouseSummary[];
  meta?: Record<string, unknown>;
}

export interface WarehouseEnvelope {
  data: WarehouseSummary;
  meta?: Record<string, unknown>;
}

export interface WarehouseActionEnvelope {
  status: "ok" | "queued" | "pending_review" | "rejected";
  message: string;
  referenceId?: string;
  warehouse?: WarehouseSummary;
}

export interface OrderFulfillmentActionEnvelope {
  status: "ok" | "queued" | "pending_review" | "rejected";
  message: string;
  referenceId?: string;
  suggestion?: OrderFulfillmentSuggestionSummary;
  assignment?: OrderFulfillmentAssignmentSummary;
  order?: AdminOrderDetail;
}

export interface WarehouseTransfersEnvelope {
  data: WarehouseTransferSummary[];
  meta?: Record<string, unknown>;
}

export interface WarehouseTransferEnvelope {
  data: WarehouseTransferSummary;
  meta?: Record<string, unknown>;
}

export interface WarehouseTransferActionEnvelope {
  status: "ok" | "queued" | "pending_review" | "rejected";
  message: string;
  referenceId?: string;
  transfer?: WarehouseTransferSummary;
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
