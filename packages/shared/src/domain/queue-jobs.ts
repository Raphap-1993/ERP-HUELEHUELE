export interface NotificationDispatchJobData {
  notificationId: string;
  requestedAt: string;
  reason?: string;
  actor?: string;
}

export interface ManualPaymentReviewJobData {
  manualRequestId: string;
  decision: "approve" | "reject";
  reviewer?: string;
  notes?: string;
  requestedAt: string;
}

export interface CommissionPayoutCreateJobData {
  vendorCode: string;
  period?: string;
  referenceId?: string;
  notes?: string;
  requestedAt: string;
}

export interface CommissionPayoutSettleJobData {
  payoutId: string;
  reviewer?: string;
  notes?: string;
  referenceId?: string;
  requestedAt: string;
}
