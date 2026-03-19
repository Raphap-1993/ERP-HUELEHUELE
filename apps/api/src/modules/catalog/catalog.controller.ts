import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { CatalogService } from "./catalog.service";

@Controller("store")
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get("products")
  listProducts() {
    return this.catalogService.listProducts();
  }

  @Get("products/:slug")
  getProduct(@Param("slug") slug: string) {
    const product = this.catalogService.findProductBySlug(slug);

    if (!product) {
      throw new NotFoundException(`Producto no encontrado: ${slug}`);
    }

    return { data: product };
  }
}
