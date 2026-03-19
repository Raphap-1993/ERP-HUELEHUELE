export function getPort(defaultPort = 4000): number {
  const parsed = Number(process.env.PORT ?? defaultPort);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultPort;
}

export function isConfigured(value: string | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

