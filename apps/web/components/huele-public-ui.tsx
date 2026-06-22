import Link from "next/link";
import * as React from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type HueleTone = "cream" | "mint" | "green" | "sun" | "dark" | "coral" | "blue";

const panelToneClass: Record<Exclude<HueleTone, "coral" | "blue">, string> = {
  cream: "bg-[var(--hh-public-surface)] text-[var(--hh-public-ink)]",
  mint: "bg-[#e7f9d9] text-[var(--hh-public-ink)]",
  green: "bg-[linear-gradient(135deg,var(--hh-public-green-800),var(--hh-public-green-500))] text-white",
  sun: "bg-[linear-gradient(135deg,#fff37a,var(--hh-public-sun))] text-[var(--hh-public-green-950)]",
  dark: "bg-[var(--hh-public-green-950)] text-white"
};

const badgeToneClass: Record<HueleTone, string> = {
  cream: "bg-white/[0.82] text-[var(--hh-public-green-900)] ring-[var(--hh-public-line)]",
  mint: "bg-[#dff8ca] text-[var(--hh-public-green-900)] ring-[#b8e89c]",
  green: "bg-[var(--hh-public-green-600)] text-white ring-[var(--hh-public-green-300)]",
  sun: "bg-[var(--hh-public-sun)] text-[var(--hh-public-green-950)] ring-[#ffe783]",
  dark: "bg-[var(--hh-public-green-950)] text-white ring-[var(--hh-public-green-800)]",
  coral: "bg-[#ffe4db] text-[#9e321f] ring-[#ffc2b1]",
  blue: "bg-[#e0f4ff] text-[#15536b] ring-[#bce7f8]"
};

const buttonToneClass: Record<"primary" | "dark" | "ghost" | "secondary" | "disabled", string> = {
  primary:
    "bg-[linear-gradient(135deg,var(--hh-public-sun),#f5ff72_54%,var(--hh-public-green-300))] text-[var(--hh-public-green-950)] shadow-[0_14px_28px_rgba(255,199,70,0.22)]",
  dark:
    "bg-[linear-gradient(135deg,var(--hh-public-green-800),var(--hh-public-green-500))] text-white shadow-[0_14px_28px_rgba(16,82,43,0.22)]",
  ghost: "border border-white/22 bg-white/10 text-white shadow-none backdrop-blur",
  secondary:
    "border border-[var(--hh-public-line)] bg-white/[0.84] text-[var(--hh-public-green-900)] shadow-[0_12px_24px_rgba(4,24,12,0.08)]",
  disabled: "cursor-not-allowed bg-[#d9dfd2] text-[#6f7566] shadow-none"
};

export function HuelePublicPage({
  actions,
  children,
  className,
  description,
  eyebrow,
  title
}: {
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  title?: ReactNode;
}) {
  return (
    <div data-huele-public="true" className={cx("hh-public-page", className)}>
      <div className="hh-public-texture" aria-hidden="true" />
      {(eyebrow || title || description || actions) ? (
        <section className="hh-public-hero">
          <div>
            {eyebrow ? <span className="hh-public-kicker">{eyebrow}</span> : null}
            {title ? <h1>{title}</h1> : null}
            {description ? <p>{description}</p> : null}
          </div>
          {actions ? <div className="hh-public-hero-actions">{actions}</div> : null}
        </section>
      ) : null}
      {children}
    </div>
  );
}

export function HueleSection({
  actions,
  children,
  className,
  description,
  eyebrow,
  title
}: {
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  title?: ReactNode;
}) {
  return (
    <section className={cx("hh-public-section", className)}>
      {(eyebrow || title || description || actions) ? (
        <div className="hh-public-section-heading">
          <div>
            {eyebrow ? <span className="hh-public-kicker">{eyebrow}</span> : null}
            {title ? <h2>{title}</h2> : null}
            {description ? <p>{description}</p> : null}
          </div>
          {actions ? <div className="hh-public-section-actions">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function HuelePanel({
  children,
  className,
  tone = "cream"
}: {
  children: ReactNode;
  className?: string;
  tone?: Exclude<HueleTone, "coral" | "blue">;
}) {
  return (
    <div className={cx("hh-public-panel", panelToneClass[tone], className)}>
      {children}
    </div>
  );
}

export function HueleBadge({
  children,
  className,
  tone = "cream"
}: {
  children: ReactNode;
  className?: string;
  tone?: HueleTone;
}) {
  return (
    <span className={cx("hh-public-badge", badgeToneClass[tone], className)}>
      {children}
    </span>
  );
}

export function HueleButtonLink({
  children,
  className,
  href,
  tone = "primary"
}: {
  children: ReactNode;
  className?: string;
  href: string;
  tone?: keyof typeof buttonToneClass;
}) {
  return (
    <Link href={href} className={cx("hh-public-button", buttonToneClass[tone], className)}>
      {children}
    </Link>
  );
}

export function HueleButton({
  children,
  className,
  tone = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone?: keyof typeof buttonToneClass;
}) {
  return (
    <button {...props} className={cx("hh-public-button", buttonToneClass[tone], className)}>
      {children}
    </button>
  );
}

export function HueleMascot({
  alt = "Lorito mascota de Huele Huele",
  className,
  decorative = false,
  size = "md"
}: {
  alt?: string;
  className?: string;
  decorative?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = size === "lg" ? "hh-public-mascot-lg" : size === "sm" ? "hh-public-mascot-sm" : "hh-public-mascot-md";

  return (
    <img
      src="/brand/lorito-cutout.png"
      alt={decorative ? "" : alt}
      aria-hidden={decorative ? "true" : undefined}
      className={cx("hh-public-mascot", sizeClass, className)}
    />
  );
}

export function HueleFieldShell({
  children,
  className,
  error,
  helper,
  label
}: {
  children: ReactNode;
  className?: string;
  error?: ReactNode;
  helper?: ReactNode;
  label: ReactNode;
}) {
  return (
    <label className={cx("hh-public-field", className)}>
      <span>{label}</span>
      {children}
      {error ? <em>{error}</em> : helper ? <small>{helper}</small> : null}
    </label>
  );
}

export function HueleStatusCard({
  action,
  children,
  className,
  mascot = false,
  tone = "cream",
  title
}: {
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  mascot?: boolean;
  title: ReactNode;
  tone?: Exclude<HueleTone, "coral" | "blue">;
}) {
  return (
    <HuelePanel tone={tone} className={cx("hh-public-status", className)}>
      {mascot ? <HueleMascot decorative size="sm" /> : null}
      <div>
        <h3>{title}</h3>
        <div>{children}</div>
        {action ? <div className="hh-public-status-action">{action}</div> : null}
      </div>
    </HuelePanel>
  );
}
