export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    {
      status: "ok",
      service: "huelegood-web",
      timestamp: new Date().toISOString(),
      release: process.env.APP_RELEASE_SHA || "dev"
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate"
      }
    }
  );
}
