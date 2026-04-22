"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { addStoredCartItem } from "../lib/session";

type AddToCartLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick"> & {
  children: ReactNode;
  href?: string;
  productSlug: string;
  quantity?: number;
  variantId?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

export function AddToCartLink({
  children,
  href = "/checkout",
  productSlug,
  quantity = 1,
  variantId,
  onClick,
  ...props
}: AddToCartLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    addStoredCartItem({
      slug: productSlug,
      quantity,
      ...(variantId ? { variantId } : {})
    });
  }

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
