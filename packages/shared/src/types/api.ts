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

