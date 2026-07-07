import { StorefrontV2GameProductPage } from "../../../../features/storefront-v2-game/layouts/storefront-v2-game-product-page";

export default async function StorefrontV2GameProductRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <StorefrontV2GameProductPage slug={slug} />;
}
