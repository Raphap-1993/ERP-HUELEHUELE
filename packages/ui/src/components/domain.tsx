import {
  adminMetrics,
  adminNavigation,
  adminDashboard,
  filterNavigationGroupsByRoles,
  commissionRows,
  faqItems,
  featuredProducts,
  heroCopy,
  orderTimeline,
  promoBanners,
  reviewQueue,
  wholesalePlans,
  type AdminMetric,
  type CatalogProduct,
  type CommissionRow,
  type FaqItem,
  type HeroCopy,
  type RoleCode,
  type NavigationItem,
  type OrderSummaryRow,
  type PromoBanner,
  type ReviewItem,
  type TimelineEntry,
  type WholesalePlan
} from "@huelegood/shared";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "./primitives";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 0
  }).format(value);
}

export function HeroSection({ copy = heroCopy }: { copy?: HeroCopy }) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-black/10 bg-[radial-gradient(circle_at_top_right,_rgba(17,24,39,0.08),_transparent_35%),linear-gradient(180deg,#ffffff_0%,#f7f6f2_100%)] px-6 py-10 shadow-soft md:px-10 md:py-14">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="max-w-3xl space-y-6">
          <Badge tone="info" className="bg-[#577e2f] text-white">
            {copy.eyebrow}
          </Badge>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-[#132016] md:text-6xl">
              {copy.title}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-black/70 md:text-lg">{copy.description}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href={copy.primaryCta.href}>{copy.primaryCta.label}</Button>
            <Button href={copy.secondaryCta.href} variant="secondary">
              {copy.secondaryCta.label}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.22em] text-black/45">
            <span>Frescura</span>
            <span>·</span>
            <span>Portabilidad</span>
            <span>·</span>
            <span>Viajes</span>
            <span>·</span>
            <span>Tráfico</span>
            <span>·</span>
            <span>Altura</span>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
          <Card className="border-[#132016]/10 bg-white/80">
            <CardContent className="space-y-2">
              <Badge tone="success">Uso diario</Badge>
              <CardTitle>Siempre a la mano</CardTitle>
              <CardDescription>Guárdalo en bolso, carro, escritorio o mochila para tener frescura donde más lo usas.</CardDescription>
            </CardContent>
          </Card>
          <Card className="border-[#132016]/10 bg-white/80">
            <CardContent className="space-y-2">
              <Badge tone="warning">Diferencial</Badge>
              <CardTitle>No es vape ni pomada</CardTitle>
              <CardDescription>Una experiencia más simple, limpia y portable para quienes prefieren practicidad real.</CardDescription>
            </CardContent>
          </Card>
          <Card className="border-[#132016]/10 bg-[#577e2f] text-white">
            <CardContent className="space-y-3">
              <Badge className="bg-white/15 text-white">Favoritos</Badge>
              <div className="space-y-2 text-sm text-white/78">
                {featuredProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/8 px-3 py-2">
                    <span>{product.name}</span>
                    <span className="font-semibold text-white">{formatCurrency(product.price)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

export function PromoBannerCard({ banner }: { banner: PromoBanner }) {
  const toneClass =
    banner.tone === "olive"
      ? "bg-[#577e2f] text-white"
      : banner.tone === "amber"
        ? "bg-amber-500 text-white"
        : "bg-slate-900 text-white";

  return (
    <Card className={cn("overflow-hidden", toneClass)}>
      <CardContent className="space-y-4">
        <Badge className="bg-white/15 text-white">{banner.note}</Badge>
        <div className="space-y-2">
          <CardTitle className="text-white">{banner.title}</CardTitle>
          <CardDescription className="text-white/75">{banner.description}</CardDescription>
        </div>
        <Button href={banner.ctaHref} variant="secondary">
          {banner.ctaLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

export function ProductCard({ product }: { product: CatalogProduct }) {
  return (
    <Card className="group h-full transition-transform duration-200 hover:-translate-y-1">
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge tone={product.tone === "emerald" ? "success" : product.tone === "amber" ? "warning" : "neutral"}>
              {product.badge}
            </Badge>
            <CardTitle>{product.name}</CardTitle>
            <CardDescription>{product.tagline}</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold text-[#132016]">{formatCurrency(product.price)}</div>
            {product.compareAtPrice ? (
              <div className="text-sm text-black/40 line-through">{formatCurrency(product.compareAtPrice)}</div>
            ) : null}
          </div>
        </div>
        <p className="text-sm leading-6 text-black/70">{product.description}</p>
        <div className="flex flex-wrap gap-2">
          {product.benefits.map((benefit) => (
            <Badge key={benefit} tone="neutral">
              {benefit}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.18em] text-black/45">{product.sku}</span>
        <Button href={`/producto/${product.slug}`} size="sm">
          Ver detalle
        </Button>
      </CardFooter>
    </Card>
  );
}

export function ProductGrid({ products = featuredProducts }: { products?: CatalogProduct[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export function SellerCodeInput() {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <CardTitle>Ingresa tu código de vendedor</CardTitle>
          <CardDescription>Aplica tu código antes de pagar para conservar tu descuento o recomendación.</CardDescription>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <Input placeholder="VEND-014" aria-label="Código de vendedor" />
          <Button type="button" variant="secondary">
            Aplicar
          </Button>
        </div>
        <p className="text-xs text-black/45">Compatible con promociones activas autorizadas.</p>
      </CardContent>
    </Card>
  );
}

export function CheckoutSummary({
  subtotal,
  discount,
  shipping,
  total,
  vendorCode
}: {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  vendorCode?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen de checkout</CardTitle>
        <CardDescription>Totales estimados al momento de tu compra.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Row label="Subtotal" value={subtotal} />
        <Row label="Descuento" value={discount} muted />
        <Row label="Envío" value={shipping} />
        <Separator className="my-2" />
        <Row label="Total" value={total} strong />
        {vendorCode ? (
          <div className="rounded-2xl bg-black/5 px-4 py-3 text-sm text-[#132016]">Vendedor aplicado: {vendorCode}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  muted,
  strong
}: {
  label: string;
  value: number;
  muted?: boolean;
  strong?: boolean;
}) {
  return (
    <div className={cn("flex items-center justify-between text-sm", strong && "text-base font-semibold")}>
      <span className={muted ? "text-black/55" : "text-[#132016]"}>{label}</span>
      <span className={muted ? "text-black/55" : "text-[#132016]"}>{formatCurrency(value)}</span>
    </div>
  );
}

export function StatusBadge({ tone, label }: { tone: "neutral" | "success" | "warning" | "danger" | "info"; label: string }) {
  return <Badge tone={tone}>{label}</Badge>;
}

export function MetricCard({ metric }: { metric: AdminMetric }) {
  return (
    <Card className="rounded-[1.5rem] border-black/8 bg-white shadow-[0_12px_34px_rgba(18,34,20,0.05)]">
      <CardContent className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-black/42">{metric.label}</p>
            <div className="text-3xl font-semibold text-[#132016]">{metric.value}</div>
          </div>
          {metric.trend ? <Badge tone="success">{metric.trend}</Badge> : null}
        </div>
        <p className="text-sm leading-6 text-black/56">{metric.detail}</p>
      </CardContent>
    </Card>
  );
}


export function ReviewDrawer({
  title,
  items = reviewQueue
}: {
  title: string;
  items?: ReviewItem[];
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Panel de revisión contextual para pagos manuales.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-black/10 bg-black/[0.02] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-semibold text-[#132016]">{item.orderNumber}</div>
                <p className="text-sm text-black/55">{item.customer}</p>
              </div>
              <Badge tone={item.status === "approved" ? "success" : item.status === "rejected" ? "danger" : "warning"}>
                {item.status}
              </Badge>
            </div>
            <div className="mt-3 grid gap-2 text-sm text-black/65">
              <p>Importe: {formatCurrency(item.amount)}</p>
              <p>Proveedor: {item.provider}</p>
              <p>Evidencia: {item.evidence}</p>
              <p>Enviado: {item.submittedAt}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function TimelinePedido({ items = orderTimeline }: { items?: TimelineEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline del pedido</CardTitle>
        <CardDescription>Historial de cambios con trazabilidad operativa.</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {items.map((item, index) => (
            <li key={`${item.status}-${index}`} className="flex gap-4">
              <div className="mt-1 h-3 w-3 rounded-full bg-[#577e2f]" />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-4">
                  <div className="font-semibold text-[#132016]">{item.label}</div>
                  <Badge tone="neutral">{item.occurredAt}</Badge>
                </div>
                <p className="text-sm text-black/60">
                  {item.actor} · {item.note}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}


export function FAQAccordion({ items = faqItems }: { items?: FaqItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <details key={item.question} className="rounded-3xl border border-black/10 bg-white px-6 py-4 shadow-soft">
          <summary className="cursor-pointer list-none text-base font-semibold text-[#132016]">{item.question}</summary>
          <p className="mt-3 text-sm leading-6 text-black/65">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}

export function WholesalePlanCard({ plan }: { plan: WholesalePlan }) {
  return (
    <Card className="h-full">
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{plan.tier}</CardTitle>
            <CardDescription>Desde {plan.minimumUnits} unidades</CardDescription>
          </div>
          <Badge tone="info">{plan.savingsLabel}</Badge>
        </div>
        <p className="text-sm leading-6 text-black/65">{plan.description}</p>
        <ul className="space-y-2 text-sm text-black/70">
          {plan.perks.map((perk) => (
            <li key={perk} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#577e2f]" />
              {perk}
            </li>
          ))}
        </ul>
        <Button href={plan.ctaHref} variant="secondary">
          {plan.ctaLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

export function SectionHeader({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: NavigationItem;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight text-[#132016] md:text-3xl">{title}</h2>
        {description ? <p className="max-w-2xl text-sm leading-6 text-black/60">{description}</p> : null}
      </div>
      {action ? (
        <Button href={action.href} variant="secondary">
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}

export function PublicBrandStrip() {
  return (
    <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.22em] text-black/45">
      <span>Herbal</span>
      <span>·</span>
      <span>Fresco</span>
      <span>·</span>
      <span>Portable</span>
    </div>
  );
}

export function AdminSidebarLinkGroup({
  roles,
  currentPath,
  variant = "light",
  onNavigate
}: {
  roles?: readonly RoleCode[];
  currentPath?: string;
  variant?: "light" | "dark";
  onNavigate?: () => void;
}) {
  const groups = filterNavigationGroupsByRoles(adminNavigation, roles);

  if (!groups.length) {
    return null;
  }

  const groupLabelClass = variant === "dark" ? "text-white/45" : "text-black/40";
  const linkBaseClass =
    variant === "dark"
      ? "text-white/85 hover:bg-white/10 hover:text-white"
      : "text-[#132016] hover:bg-black/5";
  const activeClass = variant === "dark" ? "bg-white/10 text-white" : "bg-black/5 text-[#132016]";

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.title} className="space-y-3">
          <p className={cn("text-xs uppercase tracking-[0.22em]", groupLabelClass)}>{group.title}</p>
          <div className="space-y-2">
            {group.items.map((item) => {
              const isActive = currentPath === item.href || (item.href !== "/" && currentPath?.startsWith(`${item.href}/`));
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noreferrer" : undefined}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  className={cn("block rounded-2xl px-4 py-2 text-sm transition", linkBaseClass, isActive && activeClass)}
                >
                  {item.label}
                </a>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
