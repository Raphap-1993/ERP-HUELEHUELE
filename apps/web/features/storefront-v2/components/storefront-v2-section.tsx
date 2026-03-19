import type { ReactNode } from "react";
import { Button, cn } from "@huelegood/ui";
import { storefrontV2Tokens } from "../tokens/storefront-tokens";

interface StorefrontV2Action {
  label: string;
  href: string;
  variant?: "primary" | "secondary" | "ghost";
}

export function StorefrontV2SectionHeading({
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
  action?: StorefrontV2Action;
  align?: "left" | "center";
  className?: string;
}) {
  const centered = align === "center";

  return (
    <div className={cn("flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between", centered && "text-center lg:block", className)}>
      <div className={cn("space-y-3", centered && "mx-auto")}>
        {eyebrow ? <p className={storefrontV2Tokens.className.eyebrow}>{eyebrow}</p> : null}
        <h2 className={cn(storefrontV2Tokens.className.title, centered && "mx-auto max-w-4xl")}>{title}</h2>
        {description ? <p className={cn(storefrontV2Tokens.className.description, centered && "mx-auto")}>{description}</p> : null}
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

export function StorefrontV2Panel({
  children,
  tone = "light",
  className
}: {
  children: ReactNode;
  tone?: "light" | "muted" | "dark";
  className?: string;
}) {
  const surface =
    tone === "dark"
      ? storefrontV2Tokens.className.panelDark
      : tone === "muted"
        ? storefrontV2Tokens.className.panelMuted
        : storefrontV2Tokens.className.panel;

  return <div className={cn(surface, className)}>{children}</div>;
}
