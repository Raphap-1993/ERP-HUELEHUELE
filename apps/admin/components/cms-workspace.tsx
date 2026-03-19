"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AdminDataTable,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  MetricCard,
  SectionHeader,
  StatusBadge,
  Textarea
} from "@huelegood/ui";
import {
  cmsTestimonials,
  faqItems,
  heroCopy,
  promoBanners,
  siteSetting,
  webNavigation,
  type CmsBanner,
  type CmsBannerInput,
  type CmsFaq,
  type CmsFaqInput,
  type CmsPage,
  type CmsPageBlockInput,
  type CmsSnapshotResponse,
  type CmsTestimonial,
  type CmsTestimonialInput
} from "@huelegood/shared";
import {
  createCmsBanner,
  createCmsFaq,
  createCmsTestimonial,
  fetchCmsOverview,
  upsertCmsPage,
  updateCmsBanner,
  updateCmsFaq,
  updateCmsTestimonial
} from "../lib/api";

function formatDate(value?: string) {
  if (!value) {
    return "Sin dato";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function pageTone(status: CmsPage["status"]): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === "published") {
    return "success";
  }

  if (status === "draft") {
    return "warning";
  }

  return "neutral";
}

function assetTone(status: "active" | "inactive"): "neutral" | "success" | "warning" | "danger" | "info" {
  return status === "active" ? "success" : "neutral";
}

function bannerToneLabel(tone: CmsBanner["tone"]) {
  const labels: Record<CmsBanner["tone"], string> = {
    olive: "Oliva",
    ink: "Tinta",
    amber: "Ámbar"
  };

  return labels[tone];
}

function pageStatusLabel(status: CmsPage["status"]) {
  const labels: Record<CmsPage["status"], string> = {
    draft: "Borrador",
    published: "Publicado",
    archived: "Archivado"
  };

  return labels[status];
}

function assetStatusLabel(status: "active" | "inactive") {
  return status === "active" ? "Activo" : "Inactivo";
}

function ratingLabel(rating: number) {
  return `${Math.max(1, Math.min(5, rating))}/5`;
}

function siteSummaryMetric(snapshot: CmsSnapshotResponse) {
  const totalLinks = snapshot.webNavigation.reduce((sum, group) => sum + group.items.length, 0);
  return [
    {
      label: "Páginas",
      value: String(snapshot.pages.length),
      detail: "Blueprints de contenido y SEO."
    },
    {
      label: "Banners",
      value: String(snapshot.banners.length),
      detail: "Promociones y CTA activos."
    },
    {
      label: "FAQs",
      value: String(snapshot.faqs.length),
      detail: "Respuestas controladas desde CMS."
    },
    {
      label: "Navegación",
      value: String(totalLinks),
      detail: "Enlaces visibles en storefront."
    }
  ];
}

function toBannerInput(banner: CmsBanner): CmsBannerInput {
  return {
    title: banner.title,
    description: banner.description,
    ctaLabel: banner.ctaLabel,
    ctaHref: banner.ctaHref,
    note: banner.note,
    tone: banner.tone,
    status: banner.status,
    position: banner.position
  };
}

function toFaqInput(faq: CmsFaq): CmsFaqInput {
  return {
    question: faq.question,
    answer: faq.answer,
    category: faq.category,
    status: faq.status,
    position: faq.position
  };
}

function toTestimonialInput(testimonial: CmsTestimonial): CmsTestimonialInput {
  return {
    name: testimonial.name,
    role: testimonial.role,
    quote: testimonial.quote,
    rating: testimonial.rating,
    status: testimonial.status
  };
}

function toPageBlocksInput(blocks: CmsPage["blocks"]): CmsPageBlockInput[] {
  return blocks.map((block) => ({
    type: block.type,
    title: block.title,
    description: block.description,
    content: block.content,
    position: block.position,
    status: block.status
  }));
}

function toPageBlocksJson(blocks: CmsPage["blocks"]) {
  return JSON.stringify(toPageBlocksInput(blocks), null, 2);
}

function normalizeKeywords(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function CmsWorkspace() {
  const [snapshot, setSnapshot] = useState<CmsSnapshotResponse>({
    siteSetting,
    heroCopy,
    webNavigation,
    banners: promoBanners.map((banner, index) => ({
      id: `banner-local-${index + 1}`,
      title: banner.title,
      description: banner.description,
      ctaLabel: banner.ctaLabel,
      ctaHref: banner.ctaHref,
      note: banner.note,
      tone: banner.tone,
      status: "active",
      position: index + 1,
      updatedAt: new Date().toISOString()
    })),
    faqs: faqItems.map((faq, index) => ({
      id: `faq-local-${index + 1}`,
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      status: "active",
      position: index + 1,
      updatedAt: new Date().toISOString()
    })),
    pages: [],
    testimonials: cmsTestimonials,
    seoMeta: []
  });
  const [pageSlug, setPageSlug] = useState("home");
  const [pageTitle, setPageTitle] = useState("Inicio Huelegood");
  const [pageDescription, setPageDescription] = useState("Hero, promos, catálogo visible y mayoristas.");
  const [pageStatus, setPageStatus] = useState<CmsPage["status"]>("draft");
  const [pageBlocksJson, setPageBlocksJson] = useState("[]");
  const [seoTitle, setSeoTitle] = useState("Huelegood");
  const [seoDescription, setSeoDescription] = useState("Plataforma comercial modular para vender, administrar y escalar.");
  const [seoKeywords, setSeoKeywords] = useState("huelegood, storefront, seller-first");
  const [seoCanonicalPath, setSeoCanonicalPath] = useState("/");
  const [seoRobots, setSeoRobots] = useState<"index,follow" | "noindex,nofollow">("index,follow");
  const [bannerTitle, setBannerTitle] = useState("Oferta activa con código promocional");
  const [bannerDescription, setBannerDescription] = useState("Aprovecha la combinación de promo + atribución de vendedor.");
  const [bannerCtaLabel, setBannerCtaLabel] = useState("Comprar ahora");
  const [bannerCtaHref, setBannerCtaHref] = useState("/checkout");
  const [bannerNote, setBannerNote] = useState("Vigencia limitada");
  const [bannerTone, setBannerTone] = useState<CmsBanner["tone"]>("olive");
  const [bannerStatus, setBannerStatus] = useState<"active" | "inactive">("active");
  const [faqQuestion, setFaqQuestion] = useState("¿Puedo pagar con Openpay?");
  const [faqAnswer, setFaqAnswer] = useState("Sí. El checkout contempla cobro online con Openpay y conciliación de estado.");
  const [faqCategory, setFaqCategory] = useState("Pagos");
  const [faqStatus, setFaqStatus] = useState<"active" | "inactive">("active");
  const [testimonialName, setTestimonialName] = useState("Nuevo cliente");
  const [testimonialRole, setTestimonialRole] = useState("Cliente");
  const [testimonialQuote, setTestimonialQuote] = useState("Huelegood me permite vender y operar con claridad.");
  const [testimonialRating, setTestimonialRating] = useState("5");
  const [testimonialStatus, setTestimonialStatus] = useState<"active" | "inactive">("active");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);

      try {
        const response = await fetchCmsOverview();
        if (!active) {
          return;
        }

        setSnapshot(response.data);
        setError(null);
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : "No pudimos cargar el CMS.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    const page = snapshot.pages.find((item) => item.slug === pageSlug);
    if (!page) {
      return;
    }

    setPageTitle(page.title);
    setPageDescription(page.description);
    setPageStatus(page.status);
    setPageBlocksJson(toPageBlocksJson(page.blocks));
    setSeoTitle(page.seoMeta.title);
    setSeoDescription(page.seoMeta.description);
    setSeoKeywords(page.seoMeta.keywords.join(", "));
    setSeoCanonicalPath(page.seoMeta.canonicalPath ?? "");
    setSeoRobots(page.seoMeta.robots);
  }, [pageSlug, snapshot.pages]);

  const metrics = useMemo(() => siteSummaryMetric(snapshot), [snapshot]);

  function refresh() {
    setRefreshKey((current) => current + 1);
  }

  async function handleSavePage() {
    setActionLoading(true);
    setError(null);

    try {
      const parsedBlocks = JSON.parse(pageBlocksJson) as CmsPageBlockInput[];
      await upsertCmsPage(pageSlug.trim(), {
        title: pageTitle.trim(),
        description: pageDescription.trim(),
        status: pageStatus,
        blocks: parsedBlocks,
        seoMeta: {
          title: seoTitle.trim(),
          description: seoDescription.trim(),
          keywords: normalizeKeywords(seoKeywords),
          canonicalPath: seoCanonicalPath.trim() || undefined,
          robots: seoRobots
        }
      });
      refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos guardar la página.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCreateBanner() {
    setActionLoading(true);
    setError(null);

    try {
      await createCmsBanner({
        title: bannerTitle.trim(),
        description: bannerDescription.trim(),
        ctaLabel: bannerCtaLabel.trim(),
        ctaHref: bannerCtaHref.trim(),
        note: bannerNote.trim(),
        tone: bannerTone,
        status: bannerStatus,
        position: snapshot.banners.length + 1
      });
      refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos crear el banner.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleToggleBanner(banner: CmsBanner) {
    setActionLoading(true);
    setError(null);

    try {
      await updateCmsBanner(banner.id, {
        ...toBannerInput(banner),
        status: banner.status === "active" ? "inactive" : "active"
      });
      refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos actualizar el banner.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCreateFaq() {
    setActionLoading(true);
    setError(null);

    try {
      await createCmsFaq({
        question: faqQuestion.trim(),
        answer: faqAnswer.trim(),
        category: faqCategory.trim() || undefined,
        status: faqStatus,
        position: snapshot.faqs.length + 1
      });
      refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos crear la FAQ.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleToggleFaq(faq: CmsFaq) {
    setActionLoading(true);
    setError(null);

    try {
      await updateCmsFaq(faq.id, {
        ...toFaqInput(faq),
        status: faq.status === "active" ? "inactive" : "active"
      });
      refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos actualizar la FAQ.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCreateTestimonial() {
    setActionLoading(true);
    setError(null);

    try {
      await createCmsTestimonial({
        name: testimonialName.trim(),
        role: testimonialRole.trim(),
        quote: testimonialQuote.trim(),
        rating: Number(testimonialRating),
        status: testimonialStatus
      });
      refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos crear el testimonio.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleToggleTestimonial(testimonial: CmsTestimonial) {
    setActionLoading(true);
    setError(null);

    try {
      await updateCmsTestimonial(testimonial.id, {
        ...toTestimonialInput(testimonial),
        status: testimonial.status === "active" ? "inactive" : "active"
      });
      refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos actualizar el testimonio.");
    } finally {
      setActionLoading(false);
    }
  }

  function loadPageIntoEditor(page: CmsPage) {
    setPageSlug(page.slug);
    setPageTitle(page.title);
    setPageDescription(page.description);
    setPageStatus(page.status);
    setPageBlocksJson(toPageBlocksJson(page.blocks));
    setSeoTitle(page.seoMeta.title);
    setSeoDescription(page.seoMeta.description);
    setSeoKeywords(page.seoMeta.keywords.join(", "));
    setSeoCanonicalPath(page.seoMeta.canonicalPath ?? "");
    setSeoRobots(page.seoMeta.robots);
  }

  return (
    <div className="space-y-6 pb-8">
      <SectionHeader title="CMS interno" description="Páginas, bloques, banners, FAQs y testimonios editables desde el backoffice." />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editor de página</CardTitle>
          <CardDescription>Actualiza una página, sus bloques y sus metadatos SEO en un solo flujo.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#132016]" htmlFor="page-slug">
              Slug
            </label>
            <Input id="page-slug" value={pageSlug} onChange={(event) => setPageSlug(event.target.value)} placeholder="home" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#132016]" htmlFor="page-status">
              Estado
            </label>
            <select
              id="page-status"
              className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/25"
              value={pageStatus}
              onChange={(event) => setPageStatus(event.target.value as CmsPage["status"])}
            >
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
              <option value="archived">Archivado</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#132016]" htmlFor="page-title">
              Título
            </label>
            <Input id="page-title" value={pageTitle} onChange={(event) => setPageTitle(event.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#132016]" htmlFor="page-description">
              Descripción
            </label>
            <Input id="page-description" value={pageDescription} onChange={(event) => setPageDescription(event.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#132016]" htmlFor="seo-title">
              SEO title
            </label>
            <Input id="seo-title" value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#132016]" htmlFor="seo-canonical">
              Canonical
            </label>
            <Input id="seo-canonical" value={seoCanonicalPath} onChange={(event) => setSeoCanonicalPath(event.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-[#132016]" htmlFor="seo-description">
              SEO description
            </label>
            <Textarea id="seo-description" value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-[#132016]" htmlFor="seo-keywords">
              Keywords
            </label>
            <Input
              id="seo-keywords"
              value={seoKeywords}
              onChange={(event) => setSeoKeywords(event.target.value)}
              placeholder="huelegood, storefront, seller-first"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#132016]" htmlFor="seo-robots">
              Robots
            </label>
            <select
              id="seo-robots"
              className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/25"
              value={seoRobots}
              onChange={(event) => setSeoRobots(event.target.value as "index,follow" | "noindex,nofollow")}
            >
              <option value="index,follow">Index, follow</option>
              <option value="noindex,nofollow">No index, nofollow</option>
            </select>
          </div>
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[#132016]" htmlFor="page-blocks-json">
                Bloques JSON
              </label>
              <span className="text-xs text-black/45">Se guardan con la estructura de bloque del CMS.</span>
            </div>
            <Textarea
              id="page-blocks-json"
              value={pageBlocksJson}
              onChange={(event) => setPageBlocksJson(event.target.value)}
              className="min-h-44 font-mono text-xs"
            />
          </div>
          <div className="md:col-span-2">
            <Button onClick={handleSavePage} disabled={actionLoading}>
              {actionLoading ? "Guardando..." : "Guardar página"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Nuevo banner</CardTitle>
            <CardDescription>Promociones y CTAs editables para la home y las campañas.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="banner-title">
                Título
              </label>
              <Input id="banner-title" value={bannerTitle} onChange={(event) => setBannerTitle(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="banner-tone">
                Tono
              </label>
              <select
                id="banner-tone"
                className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/25"
                value={bannerTone}
                onChange={(event) => setBannerTone(event.target.value as CmsBanner["tone"])}
              >
                <option value="olive">Oliva</option>
                <option value="ink">Tinta</option>
                <option value="amber">Ámbar</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="banner-description">
                Descripción
              </label>
              <Textarea id="banner-description" value={bannerDescription} onChange={(event) => setBannerDescription(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="banner-cta-label">
                CTA
              </label>
              <Input id="banner-cta-label" value={bannerCtaLabel} onChange={(event) => setBannerCtaLabel(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="banner-cta-href">
                Ruta CTA
              </label>
              <Input id="banner-cta-href" value={bannerCtaHref} onChange={(event) => setBannerCtaHref(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="banner-status">
                Estado
              </label>
              <select
                id="banner-status"
                className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/25"
                value={bannerStatus}
                onChange={(event) => setBannerStatus(event.target.value as "active" | "inactive")}
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="banner-note">
                Nota
              </label>
              <Input id="banner-note" value={bannerNote} onChange={(event) => setBannerNote(event.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Button onClick={handleCreateBanner} disabled={actionLoading}>
                {actionLoading ? "Guardando..." : "Crear banner"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nueva FAQ</CardTitle>
            <CardDescription>Preguntas frecuentes visibles en storefront y soporte.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="faq-question">
                Pregunta
              </label>
              <Input id="faq-question" value={faqQuestion} onChange={(event) => setFaqQuestion(event.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="faq-answer">
                Respuesta
              </label>
              <Textarea id="faq-answer" value={faqAnswer} onChange={(event) => setFaqAnswer(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="faq-category">
                Categoría
              </label>
              <Input id="faq-category" value={faqCategory} onChange={(event) => setFaqCategory(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="faq-status">
                Estado
              </label>
              <select
                id="faq-status"
                className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/25"
                value={faqStatus}
                onChange={(event) => setFaqStatus(event.target.value as "active" | "inactive")}
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <Button onClick={handleCreateFaq} disabled={actionLoading}>
                {actionLoading ? "Guardando..." : "Crear FAQ"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo testimonio</CardTitle>
          <CardDescription>Prueba social editable para reforzar conversión.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#132016]" htmlFor="testimonial-name">
              Nombre
            </label>
            <Input id="testimonial-name" value={testimonialName} onChange={(event) => setTestimonialName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#132016]" htmlFor="testimonial-role">
              Rol
            </label>
            <Input id="testimonial-role" value={testimonialRole} onChange={(event) => setTestimonialRole(event.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-[#132016]" htmlFor="testimonial-quote">
              Cita
            </label>
            <Textarea id="testimonial-quote" value={testimonialQuote} onChange={(event) => setTestimonialQuote(event.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#132016]" htmlFor="testimonial-rating">
              Rating
            </label>
            <Input
              id="testimonial-rating"
              type="number"
              min="1"
              max="5"
              step="1"
              value={testimonialRating}
              onChange={(event) => setTestimonialRating(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#132016]" htmlFor="testimonial-status">
              Estado
            </label>
            <select
              id="testimonial-status"
              className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/25"
              value={testimonialStatus}
              onChange={(event) => setTestimonialStatus(event.target.value as "active" | "inactive")}
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <Button onClick={handleCreateTestimonial} disabled={actionLoading}>
              {actionLoading ? "Guardando..." : "Crear testimonio"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AdminDataTable
        title="Páginas"
        description="Blueprints de contenido y SEO."
        headers={["Slug", "Título", "Estado", "Bloques", "SEO", "Actualizado", "Acciones"]}
        rows={snapshot.pages.map((page) => [
          page.slug,
          page.title,
          <StatusBadge key={`${page.slug}-status`} label={pageStatusLabel(page.status)} tone={pageTone(page.status)} />,
          String(page.blocks.length),
          page.seoMeta.title,
          formatDate(page.updatedAt),
          <Button key={`${page.slug}-action`} size="sm" variant="secondary" onClick={() => loadPageIntoEditor(page)}>
            Editar
          </Button>
        ])}
      />

      <AdminDataTable
        title="Banners"
        description="Promociones y CTAs del storefront."
        headers={["Título", "Tono", "Estado", "CTA", "Actualizado", "Acciones"]}
        rows={snapshot.banners.map((banner) => [
          banner.title,
          bannerToneLabel(banner.tone),
          <StatusBadge key={`${banner.id}-status`} label={assetStatusLabel(banner.status)} tone={assetTone(banner.status)} />,
          banner.ctaLabel,
          formatDate(banner.updatedAt),
          <Button key={`${banner.id}-action`} size="sm" variant="secondary" onClick={() => void handleToggleBanner(banner)} disabled={actionLoading}>
            {banner.status === "active" ? "Desactivar" : "Activar"}
          </Button>
        ])}
      />

      <AdminDataTable
        title="FAQs"
        description="Preguntas frecuentes editables."
        headers={["Pregunta", "Categoría", "Estado", "Actualizado", "Acciones"]}
        rows={snapshot.faqs.map((faq) => [
          faq.question,
          faq.category ?? "-",
          <StatusBadge key={`${faq.id}-status`} label={assetStatusLabel(faq.status)} tone={assetTone(faq.status)} />,
          formatDate(faq.updatedAt),
          <Button key={`${faq.id}-action`} size="sm" variant="secondary" onClick={() => void handleToggleFaq(faq)} disabled={actionLoading}>
            {faq.status === "active" ? "Desactivar" : "Activar"}
          </Button>
        ])}
      />

      <AdminDataTable
        title="Testimonios"
        description="Prueba social configurable."
        headers={["Nombre", "Rol", "Rating", "Estado", "Actualizado", "Acciones"]}
        rows={snapshot.testimonials.map((testimonial) => [
          testimonial.name,
          testimonial.role,
          ratingLabel(testimonial.rating),
          <StatusBadge key={`${testimonial.id}-status`} label={assetStatusLabel(testimonial.status)} tone={assetTone(testimonial.status)} />,
          formatDate(testimonial.updatedAt),
          <Button
            key={`${testimonial.id}-action`}
            size="sm"
            variant="secondary"
            onClick={() => void handleToggleTestimonial(testimonial)}
            disabled={actionLoading}
          >
            {testimonial.status === "active" ? "Desactivar" : "Activar"}
          </Button>
        ])}
      />

      <AdminDataTable
        title="SEO y navegación"
        description="Visibilidad de rutas, enlaces y metadatos del storefront."
        headers={["Página", "Canonical", "Robots", "Actualizado"]}
        rows={snapshot.seoMeta.map((meta) => [meta.pageSlug, meta.canonicalPath ?? "-", meta.robots, formatDate(meta.updatedAt)])}
      />

      <AdminDataTable
        title="Navegación"
        description="Rutas visibles en storefront."
        headers={["Grupo", "Etiqueta", "Ruta", "Externa"]}
        rows={snapshot.webNavigation.flatMap((group) =>
          group.items.map((item) => [group.title, item.label, item.href, item.external ? "Sí" : "No"])
        )}
      />

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {loading ? <p className="text-sm text-black/55">Cargando CMS...</p> : null}
    </div>
  );
}
