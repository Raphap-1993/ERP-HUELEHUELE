import { Injectable } from "@nestjs/common";
import { faqItems, heroCopy, promoBanners, siteSetting, webNavigation } from "@huelegood/shared";
import { wrapResponse } from "../../common/response";

@Injectable()
export class CmsService {
  private readonly pages = {
    home: {
      slug: "home",
      title: heroCopy.title,
      blocks: ["hero", "promo-banner", "featured-products", "wholesale-plans", "faq"]
    },
    catalogo: {
      slug: "catalogo",
      title: "Catálogo Huelegood",
      blocks: ["hero", "product-grid"]
    },
    mayoristas: {
      slug: "mayoristas",
      title: "Mayoristas y distribuidores",
      blocks: ["wholesale-plans", "lead-form"]
    },
    "trabaja-con-nosotros": {
      slug: "trabaja-con-nosotros",
      title: "Trabaja con nosotros",
      blocks: ["vendor-application-form"]
    }
  } as const;

  getSiteSettings() {
    return wrapResponse(siteSetting);
  }

  getNavigation() {
    return wrapResponse(webNavigation);
  }

  getPage(slug: string) {
    return this.pages[slug as keyof typeof this.pages] ?? null;
  }

  getFaqs() {
    return wrapResponse(faqItems);
  }

  getBanners() {
    return wrapResponse(promoBanners);
  }
}

