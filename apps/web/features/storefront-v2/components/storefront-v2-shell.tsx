import type { ReactNode } from "react";
import { storefrontV2Tokens } from "../tokens/storefront-tokens";

export function StorefrontV2Shell({
  children,
  preview = false
}: {
  children: ReactNode;
  preview?: boolean;
}) {
  return (
    <div className={`${storefrontV2Tokens.spacing.page} ${storefrontV2Tokens.gradient.canvas}`}>
      {preview ? null : null}
      {children}
    </div>
  );
}
