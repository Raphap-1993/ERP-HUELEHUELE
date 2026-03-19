import type {
  CampaignRecipientStatus,
  ManualPaymentRequestStatus,
  OrderStatus,
  PaymentStatus,
  RoleCode
} from "../domain/enums";
import type { CatalogProduct, FaqItem, HeroCopy, PromoBanner, SiteSetting, WholesalePlan } from "../domain/models";

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
}

export interface AuthSessionSummary {
  token: string;
  expiresAt: string;
  user: AuthUserSummary;
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
  manualStatus?: ManualPaymentRequestStatus;
  providerReference: string;
  nextStep: string;
  checkoutUrl?: string;
  evidenceRequired?: boolean;
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
