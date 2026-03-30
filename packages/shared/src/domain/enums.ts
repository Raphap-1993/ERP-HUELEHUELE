export enum RoleCode {
  SuperAdmin = "super_admin",
  Admin = "admin",
  OperadorPagos = "operador_pagos",
  Ventas = "ventas",
  Marketing = "marketing",
  SellerManager = "seller_manager",
  Vendedor = "vendedor",
  Cliente = "cliente"
}

export enum OrderStatus {
  Draft = "draft",
  PendingPayment = "pending_payment",
  PaymentUnderReview = "payment_under_review",
  Paid = "paid",
  Confirmed = "confirmed",
  Preparing = "preparing",
  Shipped = "shipped",
  Delivered = "delivered",
  Completed = "completed",
  Cancelled = "cancelled",
  Refunded = "refunded",
  Expired = "expired"
}

export enum PaymentStatus {
  Initiated = "initiated",
  Pending = "pending",
  Authorized = "authorized",
  Paid = "paid",
  Failed = "failed",
  Expired = "expired"
}

export enum ManualPaymentRequestStatus {
  Submitted = "submitted",
  UnderReview = "under_review",
  Approved = "approved",
  Rejected = "rejected",
  Expired = "expired"
}

export enum CrmStage {
  ReadyForFollowUp = "ready_for_followup",
  FollowUp = "followup",
  Closed = "closed"
}

export enum VendorApplicationStatus {
  Submitted = "submitted",
  Screening = "screening",
  Approved = "approved",
  Rejected = "rejected",
  Onboarded = "onboarded"
}

export enum VendorStatus {
  Active = "active",
  Inactive = "inactive",
  Suspended = "suspended"
}

export enum VendorCollaborationType {
  Seller = "seller",
  Affiliate = "affiliate"
}

export enum CommissionStatus {
  PendingAttribution = "pending_attribution",
  Attributed = "attributed",
  Approved = "approved",
  Blocked = "blocked",
  Payable = "payable",
  ScheduledForPayout = "scheduled_for_payout",
  Paid = "paid",
  Reversed = "reversed",
  Cancelled = "cancelled"
}

export enum CommissionPayoutStatus {
  Draft = "draft",
  Approved = "approved",
  Paid = "paid",
  Cancelled = "cancelled"
}

export enum WholesaleLeadStatus {
  New = "new",
  Qualified = "qualified",
  Quoted = "quoted",
  Negotiating = "negotiating",
  Won = "won",
  Lost = "lost"
}

export enum WholesaleQuoteStatus {
  Draft = "draft",
  Sent = "sent",
  Accepted = "accepted",
  Rejected = "rejected",
  Expired = "expired"
}

export enum CmsTestimonialKind {
  Text = "text",
  Audio = "audio",
  Social = "social"
}

export enum CmsSocialPlatform {
  Instagram = "instagram",
  Tiktok = "tiktok"
}

export enum LoyaltyMovementStatus {
  Pending = "pending",
  Available = "available",
  Reversed = "reversed",
  Expired = "expired"
}

export enum RedemptionStatus {
  Pending = "pending",
  Applied = "applied",
  Cancelled = "cancelled"
}

export enum CampaignStatus {
  Draft = "draft",
  Scheduled = "scheduled",
  Running = "running",
  Completed = "completed",
  Cancelled = "cancelled"
}

export enum CampaignRunStatus {
  Queued = "queued",
  Running = "running",
  Completed = "completed",
  Failed = "failed"
}

export enum CampaignRecipientStatus {
  Pending = "pending",
  Sent = "sent",
  Delivered = "delivered",
  Failed = "failed",
  Skipped = "skipped"
}

export enum NotificationStatus {
  Pending = "pending",
  Sent = "sent",
  Delivered = "delivered",
  Failed = "failed"
}

export enum NotificationChannel {
  Email = "email",
  Sms = "sms",
  Whatsapp = "whatsapp",
  Internal = "internal"
}

export enum InventoryMovementType {
  Inbound = "inbound",
  Outbound = "outbound",
  Adjustment = "adjustment"
}

export enum ProductSalesChannel {
  Public = "public",
  Internal = "internal"
}

export enum QueueName {
  Payments = "payments",
  Orders = "orders",
  Commissions = "commissions",
  Loyalty = "loyalty",
  Marketing = "marketing",
  Notifications = "notifications"
}
