import type { ReactNode } from "react";
import { Badge } from "@huelegood/ui";
import { storefrontV2PremiumTokens } from "../tokens/storefront-v2-premium-tokens";

export function StorefrontV2PremiumShell({
  children,
  preview = false
}: {
  children: ReactNode;
  preview?: boolean;
}) {
  return (
    <div className={`${storefrontV2PremiumTokens.spacing.page} ${storefrontV2PremiumTokens.className.canvas}`}>
      {preview ? (
        <section className="rounded-[1.8rem] border border-[#112017]/8 bg-white/78 px-5 py-4 shadow-[0_18px_50px_rgba(17,32,23,0.06)] backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <Badge className="bg-[#112017] text-white">Preview oficial</Badge>
              <p className="text-sm leading-6 text-black/62">
                Esta vista vive en <span className="font-semibold text-[#112017]">`/storefront-v2-premium`</span> como ruta de QA y preview,
                pero la home productiva ya usa esta misma experiencia como fuente de verdad.
              </p>
            </div>
          </div>
        </section>
      ) : null}
      {children}
    </div>
  );
}
