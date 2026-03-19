import { Injectable } from "@nestjs/common";
import { featuredProducts, type CatalogProduct } from "@huelegood/shared";
import { wrapResponse } from "../../common/response";

@Injectable()
export class CatalogService {
  listProducts() {
    return wrapResponse<CatalogProduct[]>(featuredProducts, {
      total: featuredProducts.length
    });
  }

  findProductBySlug(slug: string) {
    return featuredProducts.find((product) => product.slug === slug);
  }
}

