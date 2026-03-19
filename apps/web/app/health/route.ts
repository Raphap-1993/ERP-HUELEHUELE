export function GET() {
  return Response.json({
    status: "ok",
    service: "huelegood-web",
    timestamp: new Date().toISOString(),
    release: process.env.APP_RELEASE_SHA || "dev"
  });
}
