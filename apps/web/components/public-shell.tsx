import type { ReactNode } from "react";
import { Badge, Button, Card, CardContent, CardDescription, CardTitle, cn } from "@huelegood/ui";

interface PublicMetric {
  label: string;
  value: string;
  detail?: string;
}

interface PublicAction {
  label: string;
  href: string;
  variant?: "primary" | "secondary" | "ghost";
}

export function PublicPageHero({
  eyebrow,
  title,
  description,
  actions,
  metrics,
  aside
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: PublicAction[];
  metrics?: PublicMetric[];
  aside?: ReactNode;
}) {
  return (
    <section className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="relative overflow-hidden rounded-[2rem] border border-black/6 bg-[linear-gradient(180deg,rgba(250,248,243,0.98)_0%,rgba(245,242,232,0.93)_100%)] px-6 py-7 shadow-[0_18px_44px_rgba(26,58,46,0.04)] md:px-10 md:py-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,168,76,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(82,183,136,0.12),transparent_32%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(26,58,46,0.12),transparent)]" />
        <div className="relative space-y-7">
          <div className="space-y-5">
            <Badge className="rounded-full bg-[#1a3a2e] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-white shadow-none">
              {eyebrow}
            </Badge>
            <div className="space-y-4">
              <h1 className="max-w-4xl font-serif text-[2.9rem] leading-[0.92] tracking-[-0.05em] text-[#1a3a2e] md:text-[4.25rem]">
                {title}
              </h1>
              <p className="max-w-2xl text-[1.02rem] leading-8 text-black/58 md:text-[1.08rem]">{description}</p>
            </div>
          </div>

          {actions?.length ? (
            <div className="flex flex-wrap gap-2.5">
              {actions.map((action, index) => (
                <Button key={`${action.href}-${index}`} href={action.href} variant={action.variant ?? (index === 0 ? "primary" : "secondary")}>
                  {action.label}
                </Button>
              ))}
            </div>
          ) : null}

          {metrics?.length ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-[1.35rem] border border-black/6 bg-white/74 px-4 py-4 shadow-[0_8px_24px_rgba(26,58,46,0.03)]">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-black/38">{metric.label}</p>
                  <p className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-[#1a3a2e]">{metric.value}</p>
                  {metric.detail ? <p className="mt-2 text-[0.92rem] leading-6 text-black/52">{metric.detail}</p> : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {aside ? aside : null}
    </section>
  );
}

export function PublicSectionHeading({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: PublicAction;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-3">
        {eyebrow ? <p className="text-[10px] uppercase tracking-[0.28em] text-black/42">{eyebrow}</p> : null}
        <h2 className="max-w-3xl font-serif text-[2.25rem] leading-[1] tracking-[-0.05em] text-[#1a3a2e] md:text-[3rem]">{title}</h2>
        {description ? <p className="max-w-2xl text-[1rem] leading-7 text-black/56">{description}</p> : null}
      </div>
      {action ? (
        <Button href={action.href} variant={action.variant ?? "secondary"}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}

export function PublicPanel({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] border border-black/6 bg-[rgba(250,248,243,0.85)] p-5 shadow-[0_12px_34px_rgba(26,58,46,0.04)] md:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PublicInfoCard({
  label,
  title,
  description,
  tone = "light"
}: {
  label: string;
  title: string;
  description: string;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";

  return (
    <Card
      className={cn(
        "rounded-[1.85rem] border-black/6",
        dark
          ? "bg-[linear-gradient(180deg,rgba(26,58,46,1)_0%,rgba(45,106,79,0.96)_100%)] text-white shadow-[0_18px_52px_rgba(26,58,46,0.18)]"
          : "bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,248,245,0.96)_100%)]"
      )}
    >
      <CardContent className="space-y-3.5">
        <p className={cn("text-[10px] uppercase tracking-[0.24em]", dark ? "text-white/45" : "text-black/38")}>{label}</p>
        <CardTitle className={cn("font-serif text-[1.5rem] tracking-[-0.04em]", dark ? "text-white" : "")}>{title}</CardTitle>
        <CardDescription className={cn("text-sm leading-6", dark ? "text-white/72" : "text-black/60")}>{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

export function PublicChecklist({
  items,
  tone = "light",
  className
}: {
  items: string[];
  tone?: "light" | "dark";
  className?: string;
}) {
  const dark = tone === "dark";

  return (
    <div className={cn("grid gap-2.5", className)}>
      {items.map((item) => (
        <div
          key={item}
          className={cn(
            "flex items-start gap-3 rounded-[1.2rem] border px-4 py-3.5 text-[0.95rem] leading-6",
            dark
              ? "border-white/12 bg-[rgba(255,255,255,0.07)] text-white/82"
              : "border-black/6 bg-white/72 text-black/62"
          )}
        >
          <span
            className={cn(
              "mt-1 h-2 w-2 rounded-full",
              dark ? "bg-[#d8f3dc]" : "bg-[#2d6a4f]"
            )}
          />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

export function PublicField({
  label,
  helper,
  children,
  className
}: {
  label: string;
  helper?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("grid gap-2", className)}>
      <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-black/42">{label}</span>
      {children}
      {helper ? <span className="text-xs leading-5 text-black/44">{helper}</span> : null}
    </label>
  );
}
