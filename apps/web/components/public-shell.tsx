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
      <div className="relative overflow-hidden rounded-[2rem] border border-[#d7ddd3] bg-white px-7 py-8 shadow-[0_18px_60px_rgba(18,34,20,0.06)] md:px-10 md:py-10">
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(19,32,22,0.18),transparent)]" />
        <div className="relative space-y-8">
          <div className="space-y-4">
            <Badge className="bg-[#132016] text-white shadow-none">{eyebrow}</Badge>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-[2.85rem] font-semibold leading-[0.96] tracking-[-0.04em] text-[#102114] md:text-[4.4rem]">
                {title}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-black/62 md:text-lg">{description}</p>
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
                  className="rounded-[1.4rem] border border-[#d7ddd3] bg-[#f7f8f4] px-4 py-4"
                >
                  <p className="text-[11px] uppercase tracking-[0.24em] text-black/40">{metric.label}</p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-[#132016]">{metric.value}</p>
                  {metric.detail ? <p className="mt-2 text-sm leading-6 text-black/54">{metric.detail}</p> : null}
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
      <div className="space-y-2">
        {eyebrow ? <p className="text-xs uppercase tracking-[0.28em] text-black/42">{eyebrow}</p> : null}
        <h2 className="max-w-3xl text-[2.1rem] font-semibold tracking-[-0.04em] text-[#132016] md:text-[2.9rem]">{title}</h2>
        {description ? <p className="max-w-2xl text-base leading-7 text-black/58">{description}</p> : null}
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
        "rounded-[1.85rem] border border-[#d7ddd3] bg-white p-5 shadow-[0_12px_36px_rgba(22,34,20,0.05)] md:p-6",
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
        dark ? "bg-[#132016] text-white shadow-[0_18px_52px_rgba(19,32,22,0.2)]" : "bg-white"
      )}
    >
      <CardContent className="space-y-4">
        <p className={cn("text-xs uppercase tracking-[0.24em]", dark ? "text-white/45" : "text-black/38")}>{label}</p>
        <CardTitle className={cn("text-[1.45rem]", dark ? "text-white" : "")}>{title}</CardTitle>
        <CardDescription className={cn("text-sm leading-6", dark ? "text-white/72" : "text-black/62")}>{description}</CardDescription>
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
              ? "border-white/12 bg-white/8 text-white/82"
              : "border-[#d7ddd3] bg-[#f7f8f4] text-black/64"
          )}
        >
          <span
            className={cn(
              "mt-1 h-2.5 w-2.5 rounded-full",
              dark ? "bg-[#d5e5bf]" : "bg-[#132016]"
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
      <span className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/40">{label}</span>
      {children}
      {helper ? <span className="text-xs leading-5 text-black/46">{helper}</span> : null}
    </label>
  );
}
