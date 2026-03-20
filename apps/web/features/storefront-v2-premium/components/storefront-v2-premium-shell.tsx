import type { ReactNode } from "react";
import { storefrontV2PremiumTokens } from "../tokens/storefront-v2-premium-tokens";

export function StorefrontV2PremiumShell({
  children,
  preview = false
}: {
  children: ReactNode;
  preview?: boolean;
}) {
  return (
    <div className={`relative isolate ${storefrontV2PremiumTokens.className.canvas}`}>
      <div className={`${storefrontV2PremiumTokens.spacing.page} relative z-10`}>
        {preview ? <div className="hidden" aria-hidden="true" /> : null}
        {children}
      </div>
    </div>
  );
}
