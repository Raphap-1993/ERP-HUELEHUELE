import { Injectable } from "@nestjs/common";
import {
  featuredProducts,
  type CatalogCategorySummary,
  type CatalogProduct,
  type CatalogSummaryResponse
} from "@huelegood/shared";
import { wrapResponse } from "../../common/response";

export interface CatalogQueryInput {
  search?: string;
  category?: string;
  featuredOnly?: boolean;
}

const catalogCategories = [
  {
    slug: "productos",
    name: "Productos",
    description: "Referencias principales para venta directa."
  },
  {
    slug: "bundles",
    name: "Bundles",
    description: "Combos, ofertas y promociones activas."
  }
] as const;

@Injectable()
export class CatalogService {
  listCatalog(query: CatalogQueryInput = {}) {
    const products = this.filterProducts(query);
    const categories = this.buildCategories(products);

    return wrapResponse<CatalogSummaryResponse>(
      {
        products,
        categories,
        filters: {
          search: query.search?.trim() || undefined,
          category: query.category?.trim() || undefined,
          featuredOnly: query.featuredOnly
        }
      },
      {
        total: products.length,
        categories: categories.length
      }
    );
  }

  listProducts(query: CatalogQueryInput = {}) {
    const products = this.filterProducts(query);

    return wrapResponse<CatalogProduct[]>(products, {
      total: products.length,
      filters: {
        search: query.search?.trim() || undefined,
        category: query.category?.trim() || undefined,
        featuredOnly: query.featuredOnly
      }
    });
  }

  listCategories() {
    return wrapResponse<CatalogCategorySummary[]>(this.buildCategories(featuredProducts), {
      total: catalogCategories.length
    });
  }

  findProductBySlug(slug: string) {
    return featuredProducts.find((product) => product.slug === slug) ?? null;
  }

  private filterProducts(query: CatalogQueryInput) {
    const search = query.search?.trim().toLowerCase();

    return featuredProducts.filter((product) => {
      if (query.featuredOnly && !product.badge) {
        return false;
      }

      if (query.category && product.categorySlug !== query.category) {
        return false;
      }

      if (!search) {
        return true;
      }

      const searchableText = [product.name, product.tagline, product.description, product.sku, product.badge]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    });
  }

  private buildCategories(products: CatalogProduct[]) {
    return catalogCategories
      .map((category) => ({
        slug: category.slug,
        name: category.name,
        description: category.description,
        productCount: products.filter((product) => product.categorySlug === category.slug).length
      }))
      .filter((category) => category.productCount > 0);
  }
}
