import { Body, Controller, Get, NotFoundException, Param, Patch, Post } from "@nestjs/common";
import {
  type CmsBannerInput,
  type CmsFaqInput,
  type CmsHeroCopyInput,
  type CmsNavigationInput,
  type CmsPageBlockInput,
  type CmsPageInput,
  type CmsSiteSettingsInput,
  type CmsTestimonialInput
} from "@huelegood/shared";
import { CmsService } from "./cms.service";

@Controller("admin/cms")
export class AdminCmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Get()
  getSnapshot() {
    return this.cmsService.getAdminSnapshot();
  }

  @Get("site-settings")
  getSiteSettings() {
    return this.cmsService.getSiteSettings();
  }

  @Patch("site-settings")
  updateSiteSettings(@Body() body: CmsSiteSettingsInput) {
    return this.cmsService.updateSiteSettings(body);
  }

  @Get("hero-copy")
  getHeroCopy() {
    return this.cmsService.getHeroCopy();
  }

  @Patch("hero-copy")
  updateHeroCopy(@Body() body: CmsHeroCopyInput) {
    return this.cmsService.updateHeroCopy(body);
  }

  @Get("navigation")
  getNavigation() {
    return this.cmsService.getNavigation();
  }

  @Patch("navigation")
  updateNavigation(@Body() body: CmsNavigationInput) {
    return this.cmsService.updateNavigation(body);
  }

  @Get("pages")
  getPages() {
    return this.cmsService.getPages();
  }

  @Get("pages/:slug")
  getPage(@Param("slug") slug: string) {
    const page = this.cmsService.getPage(slug, false);
    if (!page) {
      throw new NotFoundException(`Página no encontrada: ${slug}`);
    }

    return { data: page };
  }

  @Patch("pages/:slug")
  upsertPage(@Param("slug") slug: string, @Body() body: CmsPageInput) {
    return this.cmsService.upsertPage(slug, body);
  }

  @Patch("pages/:slug/blocks")
  updatePageBlocks(@Param("slug") slug: string, @Body() body: { blocks: CmsPageBlockInput[] }) {
    return this.cmsService.updatePageBlocks(slug, body.blocks ?? []);
  }

  @Get("banners")
  getBanners() {
    return this.cmsService.getBanners();
  }

  @Post("banners")
  createBanner(@Body() body: CmsBannerInput) {
    return this.cmsService.createBanner(body);
  }

  @Patch("banners/:id")
  updateBanner(@Param("id") id: string, @Body() body: CmsBannerInput) {
    return this.cmsService.updateBanner(id, body);
  }

  @Get("faqs")
  getFaqs() {
    return this.cmsService.getFaqs();
  }

  @Post("faqs")
  createFaq(@Body() body: CmsFaqInput) {
    return this.cmsService.createFaq(body);
  }

  @Patch("faqs/:id")
  updateFaq(@Param("id") id: string, @Body() body: CmsFaqInput) {
    return this.cmsService.updateFaq(id, body);
  }

  @Get("testimonials")
  getTestimonials() {
    return this.cmsService.getTestimonials();
  }

  @Post("testimonials")
  createTestimonial(@Body() body: CmsTestimonialInput) {
    return this.cmsService.createTestimonial(body);
  }

  @Patch("testimonials/:id")
  updateTestimonial(@Param("id") id: string, @Body() body: CmsTestimonialInput) {
    return this.cmsService.updateTestimonial(id, body);
  }
}
