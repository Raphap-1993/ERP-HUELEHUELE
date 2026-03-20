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
    <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
      <div className="relative overflow-hidden rounded-[2.15rem] border border-[#d9dfd4] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,248,243,0.94)_100%)] px-7 py-8 shadow-[0_18px_54px_rgba(18,34,20,0.05)] md:px-10 md:py-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(210,219,199,0.28),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(226,216,198,0.18),transparent_32%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(19,32,22,0.12),transparent)]" />
        <div className="relative space-y-8">
          <div className="space-y-4">
            <Badge className="bg-[#132016] text-white shadow-none">{eyebrow}</Badge>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-[2.85rem] font-semibold leading-[0.96] tracking-[-0.04em] text-[#102114] md:text-[4.4rem]">
                {title}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-black/60 md:text-lg">{description}</p>
            </div>
          </div>

          {actions?.length ? (
            <div className="flex flex-wrap gap-3">
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
                <div
                  key={metric.label}
                  className="rounded-[1.5rem] border border-[#d9dfd4] bg-white/72 px-4 py-4 backdrop-blur-sm"
                >
                  <p className="text-[11px] uppercase tracking-[0.24em] text-black/40">{metric.label}</p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-[#132016]">{metric.value}</p>
                  {metric.detail ? <p className="mt-2 text-sm leading-6 text-black/52">{metric.detail}</p> : null}
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
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-3">
        {eyebrow ? <p className="text-xs uppercase tracking-[0.28em] text-black/42">{eyebrow}</p> : null}
        <h2 className="max-w-3xl text-[2.1rem] font-semibold tracking-[-0.04em] text-[#132016] md:text-[2.9rem]">{title}</h2>
        {description ? <p className="max-w-2xl text-base leading-7 text-black/56">{description}</p> : null}
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
        "rounded-[1.95rem] border border-[#d9dfd4] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,248,243,0.96)_100%)] p-5 shadow-[0_14px_40px_rgba(22,34,20,0.05)] md:p-6",
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
        "rounded-[2rem] border-black/8",
        dark
          ? "bg-[linear-gradient(180deg,rgba(19,32,22,1)_0%,rgba(25,41,29,0.96)_100%)] text-white shadow-[0_18px_52px_rgba(19,32,22,0.18)]"
          : "bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,248,243,0.96)_100%)]"
      )}
    >
      <CardContent className="space-y-4">
        <p className={cn("text-xs uppercase tracking-[0.24em]", dark ? "text-white/45" : "text-black/38")}>{label}</p>
        <CardTitle className={cn("text-[1.45rem]", dark ? "text-white" : "")}>{title}</CardTitle>
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
    <div className={cn("grid gap-3", className)}>
      {items.map((item) => (
        <div
          key={item}
          className={cn(
            "flex items-start gap-3 rounded-[1.35rem] border px-4 py-3 text-sm leading-6",
            dark
              ? "border-white/12 bg-[rgba(255,255,255,0.07)] text-white/82"
              : "border-[#d9dfd4] bg-white/72 text-black/62"
          )}
        >
          <span
            className={cn(
              "mt-1 h-2.5 w-2.5 rounded-full",
              dark ? "bg-[#d5e5bf]" : "bg-[#274129]"
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
      <span className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42">{label}</span>
      {children}
      {helper ? <span className="text-xs leading-5 text-black/44">{helper}</span> : null}
    </label>
  );
}
