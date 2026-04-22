import { OrderStatus, PaymentStatus } from "./enums";

const commerciallyConfirmedStatuses = new Set<OrderStatus>([
  OrderStatus.Paid,
  OrderStatus.Confirmed,
  OrderStatus.Preparing,
  OrderStatus.Shipped,
  OrderStatus.Delivered,
  OrderStatus.Completed
]);

const inventoryReservableStatuses = new Set<OrderStatus>([
  OrderStatus.PendingPayment,
  OrderStatus.PaymentUnderReview
]);

const terminalCancellationStatuses = new Set<OrderStatus>([
  OrderStatus.Cancelled,
  OrderStatus.Refunded,
  OrderStatus.Expired
]);

export type OrderInventoryLifecycleState = "reserved" | "confirmed" | "released";

export interface OrderStatusHistoryLike {
  status: OrderStatus;
  occurredAt?: string;
}

export interface OrderCommercialStateLike {
  confirmedAt?: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  statusHistory: OrderStatusHistoryLike[];
  updatedAt?: string;
  createdAt: string;
}

export interface OrderCommercialReportLike {
  orderStatus: OrderStatus;
  confirmedAt?: string;
}

export function isOrderStatusCommerciallyConfirmed(status: OrderStatus) {
  return commerciallyConfirmedStatuses.has(status);
}

export function isOrderCommerciallySettled(order: Pick<OrderCommercialStateLike, "orderStatus" | "paymentStatus">) {
  return order.paymentStatus === PaymentStatus.Paid || isOrderStatusCommerciallyConfirmed(order.orderStatus);
}

export function inferOrderCommercialConfirmationAt(order: OrderCommercialStateLike) {
  if (order.confirmedAt) {
    return order.confirmedAt;
  }

  const historyEntry = order.statusHistory.find((entry) => isOrderStatusCommerciallyConfirmed(entry.status));
  if (historyEntry?.occurredAt) {
    return historyEntry.occurredAt;
  }

  if (isOrderCommerciallySettled(order)) {
    return order.updatedAt || order.createdAt;
  }

  return undefined;
}

export function isOrderCommerciallyReportable(order: OrderCommercialReportLike) {
  return Boolean(order.confirmedAt) && isOrderStatusCommerciallyConfirmed(order.orderStatus);
}

export function isOrderStatusInventoryReservable(status: OrderStatus) {
  return inventoryReservableStatuses.has(status);
}

export function isOrderStatusTerminalCancellation(status: OrderStatus) {
  return terminalCancellationStatuses.has(status);
}

export function resolveOrderInventoryLifecycleState(status: OrderStatus): OrderInventoryLifecycleState | undefined {
  if (isOrderStatusCommerciallyConfirmed(status)) {
    return "confirmed";
  }

  if (isOrderStatusInventoryReservable(status)) {
    return "reserved";
  }

  if (isOrderStatusTerminalCancellation(status)) {
    return "released";
  }

  return undefined;
}
