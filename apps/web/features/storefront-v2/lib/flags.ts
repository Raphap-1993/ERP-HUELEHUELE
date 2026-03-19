function isEnabled(value: string | undefined) {
  return /^(1|true|yes|on)$/i.test(value?.trim() ?? "");
}

export function isStorefrontV2Enabled() {
  return isEnabled(process.env.NEXT_PUBLIC_STOREFRONT_V2);
}
