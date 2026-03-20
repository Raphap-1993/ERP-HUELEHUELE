import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  cmsTestimonials,
  faqItems,
  heroCopy as defaultHeroCopy,
  promoBanners,
  siteSetting as defaultSiteSetting,
  webNavigation as defaultWebNavigation,
  type CmsBanner,
  type CmsBannerInput,
  type CmsFaq,
  type CmsFaqInput,
  type CmsHeroCopyInput,
  type CmsNavigationInput,
  type CmsPage,
  type CmsPageBlock,
  type CmsPageBlockInput,
  type CmsPageInput,
  type CmsSeoMeta,
  type CmsSiteSettingsInput,
  type CmsSnapshotResponse,
  type CmsTestimonial,
  type CmsTestimonialInput,
  type HeroCopy,
  type PromoBanner,
  type SiteSetting,
  type WebNavigationGroup
} from "@huelegood/shared";
import { actionResponse, wrapResponse } from "../../common/response";
import { AuditService } from "../audit/audit.service";
import { ModuleStateService } from "../../persistence/module-state.service";
import { MediaService } from "../media/media.service";

interface PageBlockDraft {
  type: string;
  title: string;
  description: string;
  content: string;
  position: number;
  status?: CmsPageBlock["status"];
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeText(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeOptionalAssetUrl(value?: string) {
  const normalized = value?.trim();
  if (!normalized) {
    return undefined;
  }

  if (normalized.startsWith("/") || /^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  throw new BadRequestException("El logo del menú debe ser una ruta local o una URL pública válida.");
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cloneNavigation(groups: WebNavigationGroup[]) {
  return groups.map((group) => ({
    title: group.title,
    items: group.items.map((item) => ({
      label: item.label,
      href: item.href,
      external: item.external
    }))
  }));
}

function cloneHeroCopy(copy: HeroCopy) {
  return {
    ...copy,
    primaryCta: { ...copy.primaryCta },
    secondaryCta: { ...copy.secondaryCta }
  };
}

function normalizePageStatus(value?: string): CmsPage["status"] {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "draft" || normalized === "published" || normalized === "archived") {
    return normalized;
  }

  return "draft";
}

function normalizeAssetStatus(value?: string): CmsBanner["status"] {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "inactive") {
    return "inactive";
  }

  return "active";
}

function normalizeTone(value?: string): PromoBanner["tone"] {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "ink" || normalized === "amber") {
    return normalized;
  }

  return "olive";
}

function normalizeRating(value: number) {
  const parsed = Number.isFinite(value) ? Math.round(value) : 5;
  return Math.min(5, Math.max(1, parsed));
}

function buildBlockId(pageSlug: string, position: number) {
  return `blk-${normalizeSlug(pageSlug)}-${String(position).padStart(2, "0")}`;
}

function clonePage(page: CmsPage): CmsPage {
  return {
    slug: page.slug,
    title: page.title,
    description: page.description,
    status: page.status,
    blocks: page.blocks.map((block) => ({
      id: block.id,
      pageSlug: block.pageSlug,
      type: block.type,
      title: block.title,
      description: block.description,
      content: block.content,
      position: block.position,
      status: block.status,
      updatedAt: block.updatedAt
    })),
    seoMeta: {
      pageSlug: page.seoMeta.pageSlug,
      title: page.seoMeta.title,
      description: page.seoMeta.description,
      keywords: [...page.seoMeta.keywords],
      canonicalPath: page.seoMeta.canonicalPath,
      robots: page.seoMeta.robots,
      updatedAt: page.seoMeta.updatedAt
    },
    updatedAt: page.updatedAt
  };
}

function cloneBanner(banner: CmsBanner): CmsBanner {
  return { ...banner };
}

function cloneFaq(faq: CmsFaq): CmsFaq {
  return { ...faq };
}

function cloneTestimonial(testimonial: CmsTestimonial): CmsTestimonial {
  return { ...testimonial };
}

@Injectable()
export class CmsService implements OnModuleInit {
  private siteSettingData: SiteSetting = { ...defaultSiteSetting };

  private heroCopyData: HeroCopy = cloneHeroCopy(defaultHeroCopy);

  private webNavigationData: WebNavigationGroup[] = cloneNavigation(defaultWebNavigation);

  private readonly banners = new Map<string, CmsBanner>();

  private readonly faqs = new Map<string, CmsFaq>();

  private readonly pages = new Map<string, CmsPage>();

  private readonly testimonials = new Map<string, CmsTestimonial>();

  private bannerSequence = 1;

  private faqSequence = 1;

  private testimonialSequence = 1;

  constructor(
    private readonly auditService: AuditService,
    private readonly moduleStateService: ModuleStateService,
    private readonly mediaService: MediaService
  ) {
    this.seedData();
  }

  async onModuleInit() {
    const snapshot = await this.moduleStateService.load<CmsSnapshotResponse>("cms");
    if (snapshot) {
      this.restoreSnapshot(snapshot);
    } else {
      await this.persistState();
    }
  }

  private recordAdminAction(actionType: string, targetType: string, targetId: string, summary: string, metadata?: Prisma.InputJsonValue) {
    this.auditService.recordAdminAction({
      actionType,
      targetType,
      targetId,
      summary,
      metadata
    });
  }

  getSnapshot() {
    return wrapResponse<CmsSnapshotResponse>(this.buildSnapshot(true), this.buildMeta(true));
  }

  getAdminSnapshot() {
    return wrapResponse<CmsSnapshotResponse>(this.buildSnapshot(false), this.buildMeta(false));
  }

  getSiteSettings() {
    return wrapResponse({ ...this.siteSettingData });
  }

  getHeroCopy() {
    return wrapResponse(cloneHeroCopy(this.heroCopyData));
  }

  getNavigation() {
    return wrapResponse(cloneNavigation(this.webNavigationData));
  }

  getPages(publicView = false) {
    const pages = this.listPages(publicView);
    return wrapResponse(pages, {
      total: pages.length,
      published: pages.filter((page) => page.status === "published").length,
      draft: pages.filter((page) => page.status === "draft").length,
      archived: pages.filter((page) => page.status === "archived").length
    });
  }

  getPage(slug: string, publicView = true) {
    const page = this.pages.get(normalizeSlug(slug));
    if (!page || (publicView && page.status === "archived")) {
      return null;
    }

    return clonePage(page);
  }

  getBanners(publicView = false) {
    const banners = this.listBanners(publicView);
    return wrapResponse(banners, {
      total: banners.length,
      active: banners.filter((banner) => banner.status === "active").length,
      inactive: banners.filter((banner) => banner.status === "inactive").length
    });
  }

  getFaqs(publicView = false) {
    const faqs = this.listFaqs(publicView);
    return wrapResponse(faqs, {
      total: faqs.length,
      active: faqs.filter((faq) => faq.status === "active").length,
      inactive: faqs.filter((faq) => faq.status === "inactive").length
    });
  }

  getTestimonials(publicView = false) {
    const testimonials = this.listTestimonials(publicView);
    return wrapResponse(testimonials, {
      total: testimonials.length,
      active: testimonials.filter((testimonial) => testimonial.status === "active").length,
      inactive: testimonials.filter((testimonial) => testimonial.status === "inactive").length
    });
  }

  updateSiteSettings(body: CmsSiteSettingsInput) {
    const brandName = normalizeText(body.brandName);
    const tagline = normalizeText(body.tagline);
    const supportEmail = normalizeText(body.supportEmail);
    const whatsapp = normalizeText(body.whatsapp);
    const headerLogoUrl = normalizeOptionalAssetUrl(body.headerLogoUrl);

    if (!brandName || !tagline || !supportEmail || !whatsapp) {
      throw new BadRequestException("Marca, tagline, soporte y WhatsApp son obligatorios.");
    }

    this.siteSettingData = {
      brandName,
      tagline,
      supportEmail,
      whatsapp,
      headerLogoUrl
    };

    this.recordAdminAction("cms.site_settings.updated", "site_setting", "global", "La configuración base del storefront quedó actualizada.", {
      brandName: this.siteSettingData.brandName,
      supportEmail: this.siteSettingData.supportEmail,
      hasHeaderLogo: Boolean(this.siteSettingData.headerLogoUrl)
    });
    void this.persistState();

    return {
      ...actionResponse("ok", "Los parámetros base quedaron actualizados."),
      siteSetting: { ...this.siteSettingData }
    };
  }

  async uploadSiteLogo(file: { buffer: Buffer; mimetype?: string; originalname?: string } | undefined) {
    if (!file?.buffer) {
      throw new BadRequestException("Debes adjuntar un logo válido.");
    }

    const upload = await this.mediaService.uploadImage(file, {
      kind: "logo",
      slug: this.siteSettingData.brandName || "huelegood",
      preserveSvg: true
    });

    const previousLogo = this.siteSettingData.headerLogoUrl;
    this.siteSettingData = {
      ...this.siteSettingData,
      headerLogoUrl: upload.url
    };

    this.recordAdminAction("cms.site_settings.logo_updated", "site_setting", "global", "El logo del menú quedó actualizado.", {
      hasHeaderLogo: true
    });
    void this.persistState();

    if (previousLogo && previousLogo !== upload.url) {
      try {
        await this.mediaService.deleteByPublicUrl(previousLogo);
      } catch {
        // Non-blocking cleanup.
      }
    }

    return {
      ...actionResponse("ok", "Logo actualizado correctamente."),
      siteSetting: { ...this.siteSettingData }
    };
  }

  updateHeroCopy(body: CmsHeroCopyInput) {
    const eyebrow = normalizeText(body.eyebrow);
    const title = normalizeText(body.title);
    const description = normalizeText(body.description);
    const primaryCtaLabel = normalizeText(body.primaryCta.label);
    const primaryCtaHref = normalizeText(body.primaryCta.href);
    const secondaryCtaLabel = normalizeText(body.secondaryCta.label);
    const secondaryCtaHref = normalizeText(body.secondaryCta.href);

    if (!eyebrow || !title || !description || !primaryCtaLabel || !primaryCtaHref || !secondaryCtaLabel || !secondaryCtaHref) {
      throw new BadRequestException("El hero copy requiere textos y CTAs completos.");
    }

    this.heroCopyData = {
      eyebrow,
      title,
      description,
      primaryCta: {
        label: primaryCtaLabel,
        href: primaryCtaHref
      },
      secondaryCta: {
        label: secondaryCtaLabel,
        href: secondaryCtaHref
      }
    };

    this.recordAdminAction("cms.hero_copy.updated", "hero_copy", "global", "El hero del storefront quedó actualizado.", {
      title: this.heroCopyData.title
    });
    void this.persistState();

    return {
      ...actionResponse("ok", "El hero del storefront quedó actualizado."),
      heroCopy: cloneHeroCopy(this.heroCopyData)
    };
  }

  updateNavigation(body: CmsNavigationInput) {
    if (!Array.isArray(body) || body.length === 0) {
      throw new BadRequestException("La navegación debe incluir al menos un grupo.");
    }

    const navigation = body.map((group) => {
      const title = normalizeText(group.title);
      if (!title || !Array.isArray(group.items) || group.items.length === 0) {
        throw new BadRequestException("Cada grupo de navegación necesita un título y elementos.");
      }

      return {
        title,
        items: group.items.map((item) => {
          const label = normalizeText(item.label);
          const href = normalizeText(item.href);
          if (!label || !href) {
            throw new BadRequestException("Cada elemento de navegación necesita etiqueta y ruta.");
          }

          return {
            label,
            href,
            external: item.external
          };
        })
      };
    });

    this.webNavigationData = navigation;

    this.recordAdminAction("cms.navigation.updated", "navigation", "global", "La navegación pública quedó actualizada.", {
      groups: this.webNavigationData.length,
      items: this.webNavigationData.reduce((sum, group) => sum + group.items.length, 0)
    });
    void this.persistState();

    return {
      ...actionResponse("ok", "La navegación quedó actualizada."),
      navigation: cloneNavigation(this.webNavigationData)
    };
  }

  listPages(publicView = false) {
    const pages = Array.from(this.pages.values())
      .filter((page) => (publicView ? page.status !== "archived" : true))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map((page) => clonePage(page));

    return pages;
  }

  upsertPage(slug: string, body: CmsPageInput) {
    const pageSlug = normalizeSlug(slug);
    const title = normalizeText(body.title);
    const description = normalizeText(body.description);
    const now = nowIso();

    if (!pageSlug || !title || !description) {
      throw new BadRequestException("Slug, título y descripción son obligatorios.");
    }

    const blocks = this.normalizeBlocks(pageSlug, body.blocks, now);
    const seoMeta = this.normalizeSeoMeta(pageSlug, body.seoMeta, now);
    const page: CmsPage = {
      slug: pageSlug,
      title,
      description,
      status: normalizePageStatus(body.status),
      blocks,
      seoMeta,
      updatedAt: now
    };

    this.pages.set(pageSlug, page);
    this.recordAdminAction("cms.page.updated", "page", pageSlug, `La página ${pageSlug} quedó actualizada.`, {
      status: page.status,
      blocks: page.blocks.length
    });
    void this.persistState();

    return {
      ...actionResponse("ok", `La página ${pageSlug} quedó actualizada.`, pageSlug),
      page: clonePage(page)
    };
  }

  updatePageBlocks(slug: string, blocks: CmsPageBlockInput[]) {
    const pageSlug = normalizeSlug(slug);
    if (!pageSlug) {
      throw new BadRequestException("El slug de la página es obligatorio.");
    }

    const page = this.pages.get(pageSlug);
    if (!page) {
      throw new NotFoundException(`No encontramos una página con slug ${slug}.`);
    }

    const updatedAt = nowIso();
    page.blocks = this.normalizeBlocks(pageSlug, blocks, updatedAt);
    page.updatedAt = updatedAt;
    page.seoMeta.updatedAt = updatedAt;
    this.pages.set(pageSlug, page);
    this.recordAdminAction("cms.page.blocks.updated", "page", pageSlug, `Los bloques de ${pageSlug} quedaron actualizados.`, {
      blocks: page.blocks.length
    });
    void this.persistState();

    return {
      ...actionResponse("ok", "Los bloques de la página quedaron actualizados.", pageSlug),
      page: clonePage(page)
    };
  }

  listBanners(publicView = false) {
    const banners = Array.from(this.banners.values())
      .filter((banner) => (publicView ? banner.status === "active" : true))
      .sort((left, right) => {
        if (right.position !== left.position) {
          return left.position - right.position;
        }

        return right.updatedAt.localeCompare(left.updatedAt);
      })
      .map((banner) => cloneBanner(banner));

    return banners;
  }

  createBanner(body: CmsBannerInput) {
    const now = nowIso();
    const title = normalizeText(body.title);
    const description = normalizeText(body.description);
    const ctaLabel = normalizeText(body.ctaLabel);
    const ctaHref = normalizeText(body.ctaHref);
    const note = normalizeText(body.note);

    if (!title || !description || !ctaLabel || !ctaHref || !note) {
      throw new BadRequestException("Título, descripción, CTA y nota son obligatorios.");
    }

    const id = `banner-${String(this.bannerSequence).padStart(3, "0")}`;
    this.bannerSequence += 1;
    const banner: CmsBanner = {
      id,
      title,
      description,
      ctaLabel,
      ctaHref,
      note,
      tone: normalizeTone(body.tone),
      status: normalizeAssetStatus(body.status),
      position: body.position ?? this.banners.size + 1,
      updatedAt: now
    };

    this.banners.set(id, banner);
    this.recordAdminAction("cms.banner.created", "banner", id, "El banner quedó registrado.", {
      position: banner.position,
      status: banner.status
    });
    void this.persistState();

    return {
      ...actionResponse("ok", "El banner quedó registrado.", id),
      banner: cloneBanner(banner)
    };
  }

  updateBanner(id: string, body: CmsBannerInput) {
    const banner = this.requireBanner(id);
    const now = nowIso();
    const title = normalizeText(body.title);
    const description = normalizeText(body.description);
    const ctaLabel = normalizeText(body.ctaLabel);
    const ctaHref = normalizeText(body.ctaHref);
    const note = normalizeText(body.note);

    if (!title || !description || !ctaLabel || !ctaHref || !note) {
      throw new BadRequestException("Título, descripción, CTA y nota son obligatorios.");
    }

    banner.title = title;
    banner.description = description;
    banner.ctaLabel = ctaLabel;
    banner.ctaHref = ctaHref;
    banner.note = note;
    banner.tone = normalizeTone(body.tone);
    banner.status = normalizeAssetStatus(body.status);
    banner.position = body.position ?? banner.position;
    banner.updatedAt = now;
    this.banners.set(banner.id, banner);
    this.recordAdminAction("cms.banner.updated", "banner", banner.id, "El banner quedó actualizado.", {
      position: banner.position,
      status: banner.status
    });
    void this.persistState();

    return {
      ...actionResponse("ok", "El banner quedó actualizado.", banner.id),
      banner: cloneBanner(banner)
    };
  }

  listFaqs(publicView = false) {
    const faqs = Array.from(this.faqs.values())
      .filter((faq) => (publicView ? faq.status === "active" : true))
      .sort((left, right) => {
        if (left.position !== right.position) {
          return left.position - right.position;
        }

        return right.updatedAt.localeCompare(left.updatedAt);
      })
      .map((faq) => cloneFaq(faq));

    return faqs;
  }

  createFaq(body: CmsFaqInput) {
    const question = normalizeText(body.question);
    const answer = normalizeText(body.answer);
    if (!question || !answer) {
      throw new BadRequestException("La pregunta y la respuesta son obligatorias.");
    }

    const now = nowIso();
    const id = `faq-${String(this.faqSequence).padStart(3, "0")}`;
    this.faqSequence += 1;
    const faq: CmsFaq = {
      id,
      question,
      answer,
      category: normalizeText(body.category),
      status: normalizeAssetStatus(body.status),
      position: body.position ?? this.faqs.size + 1,
      updatedAt: now
    };

    this.faqs.set(id, faq);
    this.recordAdminAction("cms.faq.created", "faq", id, "La FAQ quedó registrada.", {
      category: faq.category,
      status: faq.status
    });
    void this.persistState();

    return {
      ...actionResponse("ok", "La FAQ quedó registrada.", id),
      faq: cloneFaq(faq)
    };
  }

  updateFaq(id: string, body: CmsFaqInput) {
    const faq = this.requireFaq(id);
    const question = normalizeText(body.question);
    const answer = normalizeText(body.answer);

    if (!question || !answer) {
      throw new BadRequestException("La pregunta y la respuesta son obligatorias.");
    }

    faq.question = question;
    faq.answer = answer;
    faq.category = normalizeText(body.category);
    faq.status = normalizeAssetStatus(body.status);
    faq.position = body.position ?? faq.position;
    faq.updatedAt = nowIso();
    this.faqs.set(faq.id, faq);
    this.recordAdminAction("cms.faq.updated", "faq", faq.id, "La FAQ quedó actualizada.", {
      category: faq.category,
      status: faq.status
    });
    void this.persistState();

    return {
      ...actionResponse("ok", "La FAQ quedó actualizada.", faq.id),
      faq: cloneFaq(faq)
    };
  }

  listTestimonials(publicView = false) {
    const testimonials = Array.from(this.testimonials.values())
      .filter((testimonial) => (publicView ? testimonial.status === "active" : true))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map((testimonial) => cloneTestimonial(testimonial));

    return testimonials;
  }

  createTestimonial(body: CmsTestimonialInput) {
    const name = normalizeText(body.name);
    const role = normalizeText(body.role);
    const quote = normalizeText(body.quote);
    if (!name || !role || !quote) {
      throw new BadRequestException("Nombre, rol y cita son obligatorios.");
    }

    const now = nowIso();
    const id = `tst-${String(this.testimonialSequence).padStart(3, "0")}`;
    this.testimonialSequence += 1;
    const testimonial: CmsTestimonial = {
      id,
      name,
      role,
      quote,
      rating: normalizeRating(body.rating),
      status: body.status === "inactive" ? "inactive" : "active",
      updatedAt: now
    };

    this.testimonials.set(id, testimonial);
    this.recordAdminAction("cms.testimonial.created", "testimonial", id, "El testimonio quedó registrado.", {
      rating: testimonial.rating,
      status: testimonial.status
    });
    void this.persistState();

    return {
      ...actionResponse("ok", "El testimonio quedó registrado.", id),
      testimonial: cloneTestimonial(testimonial)
    };
  }

  updateTestimonial(id: string, body: CmsTestimonialInput) {
    const testimonial = this.requireTestimonial(id);
    const name = normalizeText(body.name);
    const role = normalizeText(body.role);
    const quote = normalizeText(body.quote);

    if (!name || !role || !quote) {
      throw new BadRequestException("Nombre, rol y cita son obligatorios.");
    }

    testimonial.name = name;
    testimonial.role = role;
    testimonial.quote = quote;
    testimonial.rating = normalizeRating(body.rating);
    testimonial.status = body.status === "inactive" ? "inactive" : "active";
    testimonial.updatedAt = nowIso();
    this.testimonials.set(testimonial.id, testimonial);
    this.recordAdminAction("cms.testimonial.updated", "testimonial", testimonial.id, "El testimonio quedó actualizado.", {
      rating: testimonial.rating,
      status: testimonial.status
    });
    void this.persistState();

    return {
      ...actionResponse("ok", "El testimonio quedó actualizado.", testimonial.id),
      testimonial: cloneTestimonial(testimonial)
    };
  }

  private restoreSnapshot(snapshot: CmsSnapshotResponse) {
    this.siteSettingData = { ...snapshot.siteSetting };
    this.heroCopyData = cloneHeroCopy(snapshot.heroCopy);
    this.webNavigationData = cloneNavigation(snapshot.webNavigation);

    this.banners.clear();
    this.faqs.clear();
    this.pages.clear();
    this.testimonials.clear();

    for (const banner of snapshot.banners ?? []) {
      this.banners.set(banner.id, cloneBanner(banner));
    }

    for (const faq of snapshot.faqs ?? []) {
      this.faqs.set(faq.id, cloneFaq(faq));
    }

    for (const page of snapshot.pages ?? []) {
      this.pages.set(page.slug, clonePage(page));
    }

    for (const testimonial of snapshot.testimonials ?? []) {
      this.testimonials.set(testimonial.id, cloneTestimonial(testimonial));
    }

    this.syncSequences();
  }

  private syncSequences() {
    const bannerSequence = Array.from(this.banners.keys()).reduce((max, id) => {
      const numeric = Number(id.replace(/[^\d]/g, ""));
      return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
    }, 0);
    const faqSequence = Array.from(this.faqs.keys()).reduce((max, id) => {
      const numeric = Number(id.replace(/[^\d]/g, ""));
      return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
    }, 0);
    const testimonialSequence = Array.from(this.testimonials.keys()).reduce((max, id) => {
      const numeric = Number(id.replace(/[^\d]/g, ""));
      return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
    }, 0);

    this.bannerSequence = Math.max(bannerSequence + 1, 1);
    this.faqSequence = Math.max(faqSequence + 1, 1);
    this.testimonialSequence = Math.max(testimonialSequence + 1, 1);
  }

  private async persistState() {
    await this.moduleStateService.save<CmsSnapshotResponse>("cms", this.buildSnapshot(false));
  }

  private buildSnapshot(publicView: boolean): CmsSnapshotResponse {
    const banners = this.listBanners(publicView);
    const faqs = this.listFaqs(publicView);
    const pages = this.listPages(publicView);
    const testimonials = this.listTestimonials(publicView);

    return {
      siteSetting: { ...this.siteSettingData },
      heroCopy: cloneHeroCopy(this.heroCopyData),
      webNavigation: cloneNavigation(this.webNavigationData),
      banners,
      faqs,
      pages,
      testimonials,
      seoMeta: pages.map((page) => ({
        pageSlug: page.slug,
        title: page.seoMeta.title,
        description: page.seoMeta.description,
        keywords: [...page.seoMeta.keywords],
        canonicalPath: page.seoMeta.canonicalPath,
        robots: page.seoMeta.robots,
        updatedAt: page.seoMeta.updatedAt
      }))
    };
  }

  private buildMeta(publicView: boolean) {
    const pages = this.listPages(publicView);
    const banners = this.listBanners(publicView);
    const faqs = this.listFaqs(publicView);
    const testimonials = this.listTestimonials(publicView);

    return {
      totalPages: pages.length,
      totalBanners: banners.length,
      totalFaqs: faqs.length,
      totalTestimonials: testimonials.length
    };
  }

  private normalizeBlocks(pageSlug: string, blocks: CmsPageBlockInput[], updatedAt: string) {
    return blocks.map((block) => {
      const type = normalizeText(block.type);
      const title = normalizeText(block.title);
      const description = normalizeText(block.description);
      const content = normalizeText(block.content);
      const position = Number(block.position);

      if (!type || !title || !description || !content || !Number.isFinite(position)) {
        throw new BadRequestException(`Los bloques de ${pageSlug} requieren tipo, título, descripción, contenido y posición.`);
      }

      return {
        id: buildBlockId(pageSlug, position),
        pageSlug,
        type,
        title,
        description,
        content,
        position,
        status: block.status ?? "active",
        updatedAt
      };
    });
  }

  private normalizeSeoMeta(pageSlug: string, meta: CmsPageInput["seoMeta"], updatedAt: string): CmsSeoMeta {
    const title = normalizeText(meta.title);
    const description = normalizeText(meta.description);

    if (!title || !description) {
      throw new BadRequestException(`La SEO meta de ${pageSlug} requiere título y descripción.`);
    }

    return {
      pageSlug,
      title,
      description,
      keywords: (meta.keywords ?? []).map((keyword) => keyword.trim()).filter(Boolean),
      canonicalPath: normalizeText(meta.canonicalPath),
      robots: meta.robots ?? "index,follow",
      updatedAt
    };
  }

  private requireBanner(id: string) {
    const banner = this.banners.get(id.trim());
    if (!banner) {
      throw new NotFoundException(`No encontramos un banner con id ${id}.`);
    }

    return banner;
  }

  private requireFaq(id: string) {
    const faq = this.faqs.get(id.trim());
    if (!faq) {
      throw new NotFoundException(`No encontramos una FAQ con id ${id}.`);
    }

    return faq;
  }

  private requireTestimonial(id: string) {
    const testimonial = this.testimonials.get(id.trim());
    if (!testimonial) {
      throw new NotFoundException(`No encontramos un testimonio con id ${id}.`);
    }

    return testimonial;
  }

  private seedData() {
    this.seedBanners();
    this.seedFaqs();
    this.seedTestimonials();
    this.seedPages();
  }

  private seedBanners() {
    const seedBanners: CmsBanner[] = promoBanners.map((banner, index) => ({
      id: `banner-${String(index + 1).padStart(3, "0")}`,
      title: banner.title,
      description: banner.description,
      ctaLabel: banner.ctaLabel,
      ctaHref: banner.ctaHref,
      note: banner.note,
      tone: banner.tone,
      status: "active",
      position: index + 1,
      updatedAt: `2026-03-18T09:${String(index).padStart(2, "0")}:00.000Z`
    }));

    for (const banner of seedBanners) {
      this.banners.set(banner.id, banner);
    }

    this.bannerSequence = seedBanners.length + 1;
  }

  private seedFaqs() {
    const seedFaqs: CmsFaq[] = faqItems.map((faq, index) => ({
      id: `faq-${String(index + 1).padStart(3, "0")}`,
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      status: "active",
      position: index + 1,
      updatedAt: `2026-03-18T09:${String(10 + index).padStart(2, "0")}:00.000Z`
    }));

    for (const faq of seedFaqs) {
      this.faqs.set(faq.id, faq);
    }

    this.faqSequence = seedFaqs.length + 1;
  }

  private seedTestimonials() {
    for (const testimonial of cmsTestimonials) {
      this.testimonials.set(testimonial.id, { ...testimonial });
    }

    const highest = Array.from(this.testimonials.keys()).reduce((max, id) => {
      const numeric = Number(id.replace(/[^\d]/g, ""));
      return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
    }, 0);
    this.testimonialSequence = highest + 1;
  }

  private seedPages() {
    const createdAt = "2026-03-18T09:00:00.000Z";

    const seeds: Array<{
      slug: string;
      title: string;
      description: string;
      status: CmsPage["status"];
      blocks: PageBlockDraft[];
      seoMeta: Omit<CmsSeoMeta, "pageSlug" | "updatedAt">;
      updatedAt?: string;
    }> = [
      {
        slug: "home",
        title: "Inicio Huele Huele",
        description: "Hero comercial, formatos destacados, beneficios de uso y preguntas frecuentes del producto.",
        status: "published",
        blocks: [
          {
            type: "hero",
            title: "Hero principal",
            description: "Narrativa comercial enfocada en el producto final.",
            content: defaultHeroCopy.title,
            position: 1,
            status: "active"
          },
          {
            type: "promo-banner",
            title: "Promociones y diferenciales",
            description: "Bloques comerciales del producto.",
            content: promoBanners.map((banner) => banner.title).join(" | "),
            position: 2,
            status: "active"
          },
          {
            type: "featured-products",
            title: "Productos destacados",
            description: "Clásico Verde, Premium Negro y Combo Dúo Perfecto.",
            content: "Formatos principales para rutina diaria, look premium y compra en combo.",
            position: 3,
            status: "active"
          },
          {
            type: "benefits",
            title: "Momentos de uso",
            description: "Tráfico, oficina, viajes y altura.",
            content: "Frescura portable y diferenciación frente a vape o pomadas.",
            position: 4,
            status: "active"
          },
          {
            type: "faq",
            title: "FAQ producto",
            description: "Preguntas del consumidor final.",
            content: faqItems.map((item) => item.question).join(" | "),
            position: 5,
            status: "active"
          }
        ],
        seoMeta: {
          title: "Huele Huele | Frescura herbal portátil",
          description: defaultSiteSetting.tagline,
          keywords: ["huele huele", "inhalador herbal aromático", "frescura portátil"],
          canonicalPath: "/",
          robots: "index,follow"
        }
      },
      {
        slug: "catalogo",
        title: "Catálogo",
        description: "Productos, combos y ofertas activas de Huele Huele.",
        status: "published",
        blocks: [
          {
            type: "hero",
            title: "Hero catálogo",
            description: "Presentación visible de productos.",
            content: "Visibilidad de productos y filtros.",
            position: 1,
            status: "active"
          },
          {
            type: "product-grid",
            title: "Grid de productos",
            description: "Producto visible y bundle.",
            content: "Clásico Verde, Premium Negro, Combo Dúo Perfecto.",
            position: 2,
            status: "active"
          }
        ],
        seoMeta: {
          title: "Catálogo Huele Huele",
          description: "Explora Clásico Verde, Premium Negro y Combo Dúo Perfecto.",
          keywords: ["catálogo huele huele", "inhalador herbal", "combos"],
          canonicalPath: "/catalogo",
          robots: "index,follow"
        }
      },
      {
        slug: "mayoristas",
        title: "Mayoristas y distribuidores",
        description: "Cotización por volumen y seguimiento comercial.",
        status: "published",
        blocks: [
          {
            type: "hero",
            title: "Mayoristas hero",
            description: "Captación de leads B2B.",
            content: "Condiciones por volumen y seguimiento comercial.",
            position: 1,
            status: "active"
          },
          {
            type: "wholesale-plans",
            title: "Planes mayoristas",
            description: "Tiers de volumen y ahorro.",
            content: "Mayorista Inicial y Distribuidor.",
            position: 2,
            status: "active"
          },
          {
            type: "lead-form",
            title: "Formulario mayorista",
            description: "Lead calificado para operación comercial.",
            content: "Nombre de empresa, contacto, ciudad y notas.",
            position: 3,
            status: "active"
          }
        ],
        seoMeta: {
          title: "Mayoristas Huelegood",
          description: "Leads y cotización por volumen.",
          keywords: ["mayoristas", "distribuidores", "b2b"],
          canonicalPath: "/mayoristas",
          robots: "index,follow"
        }
      },
      {
        slug: "trabaja-con-nosotros",
        title: "Trabaja con nosotros",
        description: "Postulación de vendedores y aliados comerciales.",
        status: "published",
        blocks: [
          {
            type: "hero",
            title: "Recruitment hero",
            description: "Atracción de vendedores y aliados.",
            content: "Perfil seller-first y oportunidades comerciales.",
            position: 1,
            status: "active"
          },
          {
            type: "vendor-application-form",
            title: "Formulario vendedor",
            description: "Postulación con código y seguimiento.",
            content: "Nombre, correo, ciudad y fuente.",
            position: 2,
            status: "active"
          }
        ],
        seoMeta: {
          title: "Trabaja con Huelegood",
          description: "Postulación de vendedores y aliados.",
          keywords: ["vendedores", "seller", "postulacion"],
          canonicalPath: "/trabaja-con-nosotros",
          robots: "index,follow"
        }
      },
      {
        slug: "cuenta",
        title: "Mi cuenta",
        description: "Acceso, sesión y fidelización.",
        status: "published",
        blocks: [
          {
            type: "auth",
            title: "Acceso",
            description: "Ingreso y creación de cuenta.",
            content: "Accede a tu cuenta para revisar pedidos, datos y beneficios.",
            position: 1,
            status: "active"
          },
          {
            type: "loyalty",
            title: "Fidelización",
            description: "Saldo y movimientos de puntos.",
            content: "Puntos disponibles, pendientes y canjes.",
            position: 2,
            status: "active"
          }
        ],
        seoMeta: {
          title: "Mi cuenta Huelegood",
          description: "Acceso de usuario y fidelización.",
          keywords: ["cuenta", "loyalty", "sesion"],
          canonicalPath: "/cuenta",
          robots: "noindex,nofollow"
        }
      },
      {
        slug: "checkout",
        title: "Checkout",
        description: "Paga online o comparte tu comprobante.",
        status: "published",
        blocks: [
          {
            type: "checkout-summary",
            title: "Resumen",
            description: "Totales y vendedor aplicado.",
            content: "Subtotal, descuento, envío y total.",
            position: 1,
            status: "active"
          },
          {
            type: "payment-methods",
            title: "Pagos",
            description: "Pago online o comprobante manual.",
            content: "Elige tu método de pago y finaliza tu compra con claridad.",
            position: 2,
            status: "active"
          }
        ],
        seoMeta: {
          title: "Checkout Huelegood",
          description: "Paga online o comparte tu comprobante.",
          keywords: ["checkout", "openpay", "pagos"],
          canonicalPath: "/checkout",
          robots: "noindex,nofollow"
        }
      }
    ];

    for (const seed of seeds) {
      const updatedAt = seed.updatedAt ?? createdAt;
      const pageBlocks = seed.blocks.map((block) => ({
        id: buildBlockId(seed.slug, block.position),
        pageSlug: seed.slug,
        type: block.type,
        title: block.title,
        description: block.description,
        content: block.content,
        position: block.position,
        status: block.status ?? "active",
        updatedAt
      }));

      const page: CmsPage = {
        slug: seed.slug,
        title: seed.title,
        description: seed.description,
        status: seed.status,
        blocks: pageBlocks,
        seoMeta: {
          pageSlug: seed.slug,
          title: seed.seoMeta.title,
          description: seed.seoMeta.description,
          keywords: [...seed.seoMeta.keywords],
          canonicalPath: seed.seoMeta.canonicalPath,
          robots: seed.seoMeta.robots,
          updatedAt
        },
        updatedAt
      };

      this.pages.set(page.slug, page);
    }
  }
}
