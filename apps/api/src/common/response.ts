export function wrapResponse<T>(data: T, meta?: Record<string, unknown>) {
  return meta ? { data, meta } : { data };
}

export function actionResponse(status: "ok" | "queued" | "pending_review" | "rejected", message: string, referenceId?: string) {
  return { status, message, referenceId };
}

