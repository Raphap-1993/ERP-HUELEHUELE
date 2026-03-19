import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { CmsService } from "./cms.service";

@Controller("store")
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Get("cms")
  getSnapshot() {
    return this.cmsService.getSnapshot();
  }

  @Get("site-settings")
  getSiteSettings() {
    return this.cmsService.getSiteSettings();
  }

  @Get("navigation")
  getNavigation() {
    return this.cmsService.getNavigation();
  }

  @Get("pages/:slug")
  getPage(@Param("slug") slug: string) {
    const page = this.cmsService.getPage(slug);

    if (!page) {
      throw new NotFoundException(`Página no encontrada: ${slug}`);
    }

    return { data: page };
  }

  @Get("faqs")
  getFaqs() {
    return this.cmsService.getFaqs();
  }

  @Get("banners")
  getBanners() {
    return this.cmsService.getBanners(true);
  }

  @Get("testimonials")
  getTestimonials() {
    return this.cmsService.getTestimonials(true);
  }
}
