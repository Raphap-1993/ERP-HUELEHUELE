import * as React from "react";
import type { ReactNode } from "react";
import { AddToCartLink } from "./add-to-cart-link";
import { HueleButtonLink } from "./huele-public-ui";
import type { StorefrontPrimaryAction } from "../lib/storefront-purchase";

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function HueleCommerceAction({
  action,
  children,
  className,
  productSlug
}: {
  action: StorefrontPrimaryAction | { mode: "catalog"; label: string; href: string };
  children?: ReactNode;
  className?: string;
  productSlug: string;
}) {
  const label = children ?? action.label;

  if (action.mode === "direct") {
    return (
      <AddToCartLink
        className={cx("hh-public-button bg-[linear-gradient(135deg,var(--hh-public-green-800),var(--hh-public-green-500))] text-white shadow-[0_14px_28px_rgba(16,82,43,0.22)]", className)}
        productSlug={productSlug}
        variantId={action.variantId}
      >
        {label}
      </AddToCartLink>
    );
  }

  if (action.mode === "select_variant" || action.mode === "catalog") {
    return (
      <HueleButtonLink href={action.href} tone="dark" className={className}>
        {label}
      </HueleButtonLink>
    );
  }

  return (
    <span
      aria-disabled="true"
      className={cx("hh-public-button cursor-not-allowed bg-[#d9dfd2] text-[#6f7566] shadow-none", className)}
    >
      {label}
    </span>
  );
}
