import { Injectable } from "@nestjs/common";
import { ProductsService } from "../products/products.service";

export interface CatalogQueryInput {
  search?: string;
  category?: string;
  featuredOnly?: boolean;
}

@Injectable()
export class CatalogService {
  constructor(private readonly productsService: ProductsService) {}

  listCatalog(query: CatalogQueryInput = {}) {
    return this.productsService.getCatalogSummary(query);
  }

  listProducts(query: CatalogQueryInput = {}) {
    return this.productsService.listCatalogProducts(query);
  }

  listCategories() {
    return this.productsService.listCatalogCategories();
  }

  findProductBySlug(slug: string) {
    return this.productsService.findCatalogProductBySlug(slug);
  }
}
