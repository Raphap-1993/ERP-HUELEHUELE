import type { VendorApplicationInput, VendorApplicationIntent } from "@huelegood/shared";
import { submitVendorApplication } from "../../../lib/api";

export interface VendorApplicationDraft {
  name: string;
  email: string;
  city: string;
  phone: string;
  applicationIntent: VendorApplicationIntent;
  message: string;
}

export type VendorApplicationErrors = Partial<Record<keyof VendorApplicationDraft, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export function validateVendorApplicationDraft(draft: VendorApplicationDraft) {
  const errors: VendorApplicationErrors = {};

  if (!draft.name.trim()) {
    errors.name = "Nombre obligatorio.";
  }

  if (!draft.email.trim()) {
    errors.email = "Email obligatorio.";
  } else if (!emailPattern.test(draft.email.trim())) {
    errors.email = "Email inválido.";
  }

  if (!draft.city.trim()) {
    errors.city = "Ciudad obligatoria.";
  }

  if (!draft.phone.trim()) {
    errors.phone = "WhatsApp obligatorio.";
  }

  return errors;
}

export function toVendorApplicationInput(draft: VendorApplicationDraft, source: string): VendorApplicationInput {
  return {
    name: draft.name.trim(),
    email: draft.email.trim(),
    city: draft.city.trim(),
    phone: draft.phone.trim(),
    applicationIntent: draft.applicationIntent,
    message: draft.message.trim() || undefined,
    source
  };
}

export async function submitVendorApplicationDraft(draft: VendorApplicationDraft, source: string) {
  return submitVendorApplication(toVendorApplicationInput(draft, source));
}
