export function getPort(defaultPort = 4000): number {
  const parsed = Number(process.env.PORT ?? defaultPort);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultPort;
}

export function isConfigured(value: string | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

function normalizeFlag(value: string | undefined) {
  return value?.trim().toLowerCase();
}

export function isProductionRuntime(): boolean {
  return normalizeFlag(process.env.NODE_ENV) === "production";
}

export function allowDemoData(): boolean {
  const explicit = normalizeFlag(process.env.HUELEGOOD_ENABLE_DEMO_DATA);
  if (explicit === "1" || explicit === "true" || explicit === "yes" || explicit === "on") {
    return true;
  }

  if (explicit === "0" || explicit === "false" || explicit === "no" || explicit === "off") {
    return false;
  }

  return !isProductionRuntime();
}
