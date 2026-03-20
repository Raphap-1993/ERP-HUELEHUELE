import { Controller, Get, NotFoundException, Param, Query } from "@nestjs/common";
import { CatalogService } from "./catalog.service";
import { wrapResponse } from "../../common/response";

@Controller("store")
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get("catalog")
  getCatalog(@Query("search") search?: string, @Query("category") category?: string, @Query("featuredOnly") featuredOnly?: string) {
    return this.catalogService.listCatalog({
      search,
      category,
      featuredOnly: featuredOnly === "true"
    });
  }

  @Get("products")
  listProducts(@Query("search") search?: string, @Query("category") category?: string, @Query("featuredOnly") featuredOnly?: string) {
    return this.catalogService.listProducts({
      search,
      category,
      featuredOnly: featuredOnly === "true"
    });
  }

  @Get("categories")
  listCategories() {
    return this.catalogService.listCategories();
  }

  @Get("products/:slug")
  async getProduct(@Param("slug") slug: string) {
    const product = await this.catalogService.findProductBySlug(slug);

    if (!product) {
      throw new NotFoundException(`Producto no encontrado: ${slug}`);
    }

    return wrapResponse(product);
  }
}
