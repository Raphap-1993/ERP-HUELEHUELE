export function isConfigured(value: string | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}
