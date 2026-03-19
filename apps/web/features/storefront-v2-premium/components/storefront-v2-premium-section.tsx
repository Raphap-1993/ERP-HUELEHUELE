import type { HTMLAttributes, ReactNode } from "react";
import { Button, cn } from "@huelegood/ui";
import { storefrontV2PremiumTokens } from "../tokens/storefront-v2-premium-tokens";

interface StorefrontPremiumAction {
  label: string;
  href: string;
  variant?: "primary" | "secondary" | "ghost";
}

export function StorefrontV2PremiumSectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  className
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: StorefrontPremiumAction;
  align?: "left" | "center";
  className?: string;
}) {
  const centered = align === "center";

  return (
    <div className={cn("flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between", centered && "text-center lg:block", className)}>
      <div className={cn("space-y-3", centered && "mx-auto")}>
        {eyebrow ? <p className={storefrontV2PremiumTokens.className.eyebrow}>{eyebrow}</p> : null}
        <h2 className={cn(storefrontV2PremiumTokens.className.title, centered && "mx-auto max-w-4xl")}>{title}</h2>
        {description ? <p className={cn(storefrontV2PremiumTokens.className.description, centered && "mx-auto")}>{description}</p> : null}
      </div>
      {action ? (
        <div className={cn(centered && "mt-2 flex justify-center")}>
          <Button href={action.href} variant={action.variant ?? "secondary"}>
            {action.label}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function StorefrontV2PremiumPanel({
  children,
  tone = "light",
  className,
  ...props
}: {
  children: ReactNode;
  tone?: "light" | "muted" | "dark";
  className?: string;
} & HTMLAttributes<HTMLDivElement>) {
  const surface =
    tone === "dark"
      ? storefrontV2PremiumTokens.className.panelDark
      : tone === "muted"
        ? storefrontV2PremiumTokens.className.panelMuted
        : storefrontV2PremiumTokens.className.panel;

  return (
    <div className={cn(surface, className)} {...props}>
      {children}
    </div>
  );
}
