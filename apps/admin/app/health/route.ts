export function GET() {
  return Response.json({
    status: "ok",
    service: "huelegood-admin",
    timestamp: new Date().toISOString(),
    release: process.env.APP_RELEASE_SHA || "dev"
  });
}
