import type { ReactNode } from "react";
import { Badge } from "@huelegood/ui";
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
      {preview ? (
        <section className="rounded-[1.75rem] border border-[#17211a]/8 bg-white/78 px-5 py-4 shadow-[0_18px_50px_rgba(23,33,26,0.06)] backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <Badge className="bg-[#17211a] text-white">Preview segura</Badge>
              <p className="text-sm leading-6 text-black/62">
                Esta vista vive en <span className="font-semibold text-[#17211a]">`/storefront-v2`</span> y no reemplaza la home productiva
                mientras `NEXT_PUBLIC_STOREFRONT_V2` siga apagado.
              </p>
            </div>
          </div>
        </section>
      ) : null}
      {children}
    </div>
  );
}
