import {
  Prisma,
  type ProductBundleComponent,
  type ProductImage,
  type ProductVariant
} from "@prisma/client";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import {
  type CatalogCategorySummary,
  type CatalogProduct,
  type CatalogSummaryResponse,
  type CheckoutItemInput,
  type InventoryAllocationSummary,
  type CheckoutQuoteItemSummary,
  type ProductAdminDetail,
  type ProductAdminSummary,
  type ProductCategorySummary,
  type ProductBundleComponentSummary,
  type ProductImageSummary,
  type ProductImageUploadInput,
  type ProductImageUploadSummary,
  type ProductStatusValue,
  type ProductUpsertInput,
  type ProductVariantSummary,
  type ProductVariantStatusValue,
} from "@huelegood/shared";
import { actionResponse, wrapResponse } from "../../common/response";
import { PrismaService } from "../../prisma/prisma.service";
import { MediaService } from "../media/media.service";

type AdminProductRecord = Prisma.ProductGetPayload<{
  include: {
    category: true;
    variants: true;
    images: true;
    bundleComponents: {
      include: {
        componentProduct: {
          include: {
            variants: true;
          };
        };
        componentVariant: true;
      };
    };
  };
}>;

type CatalogProductRecord = Prisma.ProductGetPayload<{
  include: {
    category: true;
    variants: true;
    images: true;
  };
}>;

type CheckoutProductRecord = Prisma.ProductGetPayload<{
  include: {
    category: true;
    variants: true;
    images: true;
    bundleComponents: {
      include: {
        componentProduct: {
          include: {
            category: true;
            variants: true;
            images: true;
          };
        };
        componentVariant: true;
      };
    };
  };
}>;

type ComponentProductRecord = Prisma.ProductGetPayload<{
  include: {
    variants: true;
  };
}>;

type CatalogQueryInput = {
  search?: string;
  category?: string;
  featuredOnly?: boolean;
};

const CATALOG_CURRENCY_CODE = "PEN";
const COMBO_CATEGORY_SLUG = "bundles";
const productStatuses = new Set<ProductStatusValue>(["draft", "active", "inactive", "archived"]);
const variantStatuses = new Set<ProductVariantStatusValue>(["active", "inactive", "out_of_stock"]);

const merchandisingBySlug: Record<
  string,
  {
    badge: string;
    tone: CatalogProduct["tone"];
    benefits: string[];
    tagline: string;
  }
> = {
  "clasico-verde": {
    badge: "Más vendido",
    tone: "emerald",
    benefits: ["Portátil", "Frescura herbal", "Uso diario"],
    tagline: "El favorito para el día a día."
  },
  "premium-negro": {
    badge: "Premium",
    tone: "graphite",
    benefits: ["Acabado premium", "Diseño discreto", "Viaje y altura"],
    tagline: "Más intenso y con una presencia más sobria."
  },
  "combo-duo-perfecto": {
    badge: "Combo",
    tone: "amber",
    benefits: ["Ahorro visible", "Doble formato", "Regalo o reposición"],
    tagline: "Dos formatos editados para tener una compra más completa."
  }
};

function toNumber(value?: Prisma.Decimal | null) {
  return value == null ? undefined : Number(value);
}

function normalizeText(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeVariantId(value?: string) {
  const normalized = normalizeText(value);
  return normalized ? normalized.toLowerCase() : undefined;
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function coerceBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "on";
  }

  return false;
}

function coerceNumber(value: unknown, field: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new BadRequestException(`Valor inválido para ${field}.`);
  }

  return parsed;
}

function selectDefaultVariant(variants: ProductVariant[]) {
  return variants
    .slice()
    .sort((left, right) => {
      if (left.status === "active" && right.status !== "active") {
        return -1;
      }

      if (left.status !== "active" && right.status === "active") {
        return 1;
      }

      return left.createdAt.getTime() - right.createdAt.getTime();
    })[0];
}

function sortImages(images: ProductImage[]) {
  return images.slice().sort((left, right) => {
    if (left.isPrimary && !right.isPrimary) {
      return -1;
    }

    if (!left.isPrimary && right.isPrimary) {
      return 1;
    }

    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.createdAt.getTime() - right.createdAt.getTime();
  });
}

function sortBundleComponents<T extends { sortOrder: number; createdAt: Date }>(components: T[]) {
  return components.slice().sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.createdAt.getTime() - right.createdAt.getTime();
  });
}

function resolveBundleAllocations(product: CheckoutProductRecord, quantity: number) {
  const allocations: InventoryAllocationSummary[] = [];

  for (const component of sortBundleComponents(product.bundleComponents)) {
    const componentProduct = component.componentProduct;
    const componentVariant = component.componentVariant ?? selectDefaultVariant(componentProduct.variants);

    if (!componentVariant || componentVariant.status !== "active") {
      throw new BadRequestException(`El bundle ${product.slug} depende de un componente sin variante activa.`);
    }

    allocations.push({
      variantId: componentVariant.id,
      sku: componentVariant.sku,
      name: componentVariant.name,
      quantity: component.quantity * quantity
    });
  }

  return allocations;
}

function mapVariant(variant: ProductVariant): ProductVariantSummary {
  return {
    id: variant.id,
    sku: variant.sku,
    name: variant.name,
    price: Number(variant.price),
    compareAtPrice: toNumber(variant.compareAtPrice),
    stockOnHand: variant.stockOnHand,
    status: variant.status
  };
}

function mapImage(image: ProductImage): ProductImageSummary {
  return {
    id: image.id,
    url: image.url,
    altText: image.altText ?? undefined,
    sortOrder: image.sortOrder,
    isPrimary: image.isPrimary,
    variantId: image.variantId ?? undefined
  };
}

function mapBundleComponent(component: ProductBundleComponent & {
  componentProduct: ComponentProductRecord;
  componentVariant?: ProductVariant | null;
}): ProductBundleComponentSummary {
  const resolvedVariant = component.componentVariant ?? selectDefaultVariant(component.componentProduct.variants);

  return {
    id: component.id,
    productId: component.componentProductId,
    variantId: resolvedVariant?.id,
    quantity: component.quantity,
    sortOrder: component.sortOrder,
    productName: component.componentProduct.name,
    productSlug: component.componentProduct.slug,
    productSku: resolvedVariant?.sku ?? "SIN-SKU",
    variantName: resolvedVariant?.name,
    variantSku: resolvedVariant?.sku
  };
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService
  ) {}

  async listAdminCategories() {
    const categories = await this.prisma.category.findMany({
      include: {
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    });

    return wrapResponse<ProductCategorySummary[]>(
      categories.map((category) => ({
        id: category.id,
        slug: category.slug,
        name: category.slug === COMBO_CATEGORY_SLUG ? "Combos" : category.name,
        description:
          category.slug === COMBO_CATEGORY_SLUG
            ? "Combos, packs y promociones activas."
            : category.description ?? undefined,
        isActive: category.isActive,
        productCount: category._count.products
      })),
      { total: categories.length }
    );
  }

  async listAdminProducts() {
    const products = await this.prisma.product.findMany({
      include: {
        category: true,
        variants: true,
        images: true,
        bundleComponents: {
          include: {
            componentProduct: {
              include: {
                variants: true
              }
            },
            componentVariant: true
          }
        }
      },
      orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }]
    });

    const mapped = products.map((product) => this.mapAdminSummary(product));
    return wrapResponse<ProductAdminSummary[]>(mapped, {
      total: mapped.length,
      featured: mapped.filter((product) => product.isFeatured).length
    });
  }

  async getAdminProduct(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: true,
        images: true,
        bundleComponents: {
          include: {
            componentProduct: {
              include: {
                variants: true
              }
            },
            componentVariant: true
          }
        }
      }
    });

    return product ? this.mapAdminDetail(product) : null;
  }

  async createProduct(body: ProductUpsertInput) {
    const input = await this.normalizeUpsertInput(body);

    try {
      const product = await this.prisma.$transaction(async (tx) => {
        const created = await tx.product.create({
          data: {
            categoryId: input.categoryId ?? null,
            name: input.name,
            slug: input.slug,
            shortDescription: input.shortDescription ?? null,
            longDescription: input.longDescription ?? null,
            status: input.status,
            isFeatured: input.isFeatured
          }
        });

        await this.syncVariants(tx, created.id, input.variants, []);
        await this.syncBundleComponents(tx, created.id, input.bundleComponents);

        return tx.product.findUniqueOrThrow({
          where: { id: created.id },
          include: {
            category: true,
            variants: true,
            images: true,
            bundleComponents: {
              include: {
                componentProduct: {
                  include: {
                    variants: true
                  }
                },
                componentVariant: true
              }
            }
          }
        });
      });

      return {
        ...actionResponse("ok", "Producto creado correctamente.", product.id),
        product: this.mapAdminDetail(product)
      };
    } catch (error) {
      return this.rethrowPrismaConflict(error, "No pudimos crear el producto.");
    }
  }

  async updateProduct(id: string, body: ProductUpsertInput) {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      include: {
        variants: true
      }
    });

    if (!existing) {
      throw new NotFoundException(`Producto no encontrado: ${id}`);
    }

    const input = await this.normalizeUpsertInput(body, existing.id);

    try {
      const product = await this.prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: { id },
          data: {
            categoryId: input.categoryId ?? null,
            name: input.name,
            slug: input.slug,
            shortDescription: input.shortDescription ?? null,
            longDescription: input.longDescription ?? null,
            status: input.status,
            isFeatured: input.isFeatured
          }
        });

        await this.syncVariants(tx, id, input.variants, existing.variants);
        await this.syncBundleComponents(tx, id, input.bundleComponents);

        return tx.product.findUniqueOrThrow({
          where: { id },
          include: {
            category: true,
            variants: true,
            images: true,
            bundleComponents: {
              include: {
                componentProduct: {
                  include: {
                    variants: true
                  }
                },
                componentVariant: true
              }
            }
          }
        });
      });

      return {
        ...actionResponse("ok", "Producto actualizado correctamente.", product.id),
        product: this.mapAdminDetail(product)
      };
    } catch (error) {
      return this.rethrowPrismaConflict(error, "No pudimos actualizar el producto.");
    }
  }

  async uploadProductImage(
    productId: string,
    file: { buffer: Buffer; mimetype?: string; originalname?: string } | undefined,
    body: ProductImageUploadInput
  ) {
    if (!file?.buffer) {
      throw new BadRequestException("Debes adjuntar una imagen.");
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: true,
        images: true
      }
    });

    if (!product) {
      throw new NotFoundException(`Producto no encontrado: ${productId}`);
    }

    if (body.variantId && !product.variants.some((variant) => variant.id === body.variantId)) {
      throw new BadRequestException("La variante indicada no pertenece al producto.");
    }

    const upload = await this.mediaService.uploadImage(file, {
      kind: "product",
      slug: product.slug
    });

    const sortOrder =
      body.sortOrder != null
        ? coerceNumber(body.sortOrder, "sortOrder")
        : sortImages(product.images).at(-1)?.sortOrder != null
          ? sortImages(product.images).at(-1)!.sortOrder + 1
          : 0;

    const isPrimary = coerceBoolean(body.isPrimary) || product.images.length === 0;
    const altText = normalizeText(body.altText) ?? `${product.name} - vista principal`;

    const image = await this.prisma.$transaction(async (tx) => {
      if (isPrimary) {
        await tx.productImage.updateMany({
          where: { productId: product.id, isPrimary: true },
          data: { isPrimary: false }
        });
      }

      return tx.productImage.create({
        data: {
          productId: product.id,
          variantId: body.variantId ?? null,
          url: upload.url,
          altText,
          sortOrder,
          isPrimary
        }
      });
    });

    return wrapResponse<ProductImageUploadSummary>({
      image: mapImage(image),
      media: upload
    });
  }

  async deleteProductImage(productId: string, imageId: string) {
    const image = await this.prisma.productImage.findFirst({
      where: {
        id: imageId,
        productId
      }
    });

    if (!image) {
      throw new NotFoundException("Imagen no encontrada para este producto.");
    }

    await this.prisma.productImage.delete({
      where: { id: image.id }
    });
    await this.mediaService.deleteByPublicUrl(image.url);

    return actionResponse("ok", "Imagen eliminada.", image.id);
  }

  async getCatalogSummary(query: CatalogQueryInput = {}) {
    const products = await this.findCatalogProducts(query);
    const categories = this.buildCatalogCategories(products);

    return wrapResponse<CatalogSummaryResponse>(
      {
        products,
        categories,
        currencyCode: CATALOG_CURRENCY_CODE,
        filters: {
          search: normalizeText(query.search),
          category: normalizeText(query.category),
          featuredOnly: query.featuredOnly
        }
      },
      {
        total: products.length,
        categories: categories.length
      }
    );
  }

  async listCatalogProducts(query: CatalogQueryInput = {}) {
    const products = await this.findCatalogProducts(query);

    return wrapResponse<CatalogProduct[]>(products, {
      total: products.length,
      filters: {
        search: normalizeText(query.search),
        category: normalizeText(query.category),
        featuredOnly: query.featuredOnly
      }
    });
  }

  async listCatalogCategories() {
    const products = await this.findCatalogProducts();
    const categories = this.buildCatalogCategories(products);

    return wrapResponse<CatalogCategorySummary[]>(categories, {
      total: categories.length
    });
  }

  async findCatalogProductBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        variants: true,
        images: true
      }
    });

    if (!product || product.status !== "active") {
      return null;
    }

    return this.mapCatalogProductDetail(product);
  }

  async resolveCheckoutItems(items: CheckoutItemInput[]) {
    const records = await this.prisma.product.findMany({
      where: {
        slug: {
          in: items.map((item) => item.slug)
        }
      },
      include: {
        category: true,
        variants: true,
        images: true,
        bundleComponents: {
          include: {
            componentProduct: {
              include: {
                category: true,
                variants: true,
                images: true
              }
            },
            componentVariant: true
          },
          orderBy: [{ sortOrder: "asc" }]
        }
      }
    });

    const productMap = new Map<string, CheckoutProductRecord>();
    for (const record of records) {
      if (record.status !== "active") {
        continue;
      }

      productMap.set(record.slug, record as CheckoutProductRecord);
    }

    const resolvedItems = items.map((item) => {
      const product = productMap.get(item.slug);
      if (!product) {
        throw new NotFoundException(`Producto no encontrado: ${item.slug}`);
      }

      const requestedVariantId = normalizeVariantId(item.variantId);
      const variant =
        requestedVariantId == null
          ? selectDefaultVariant(product.variants)
          : product.variants.find((candidate) => candidate.id === requestedVariantId);

      if (!variant || variant.status !== "active") {
        throw new BadRequestException(`La variante indicada para ${item.slug} no está disponible.`);
      }

      const quantity = Math.trunc(Number(item.quantity));
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new BadRequestException(`Cantidad inválida para ${item.slug}.`);
      }

      const inventoryAllocations =
        product.bundleComponents.length > 0
          ? resolveBundleAllocations(product, quantity)
          : [
              {
                variantId: variant.id,
                sku: variant.sku,
                name: variant.name,
                quantity
              }
            ];

      const unitPrice = Number(variant.price);
      const lineTotal = Math.round(unitPrice * quantity * 100) / 100;

      return {
        slug: product.slug,
        name: product.name,
        sku: variant.sku,
        variantId: variant.id,
        quantity,
        unitPrice,
        lineTotal,
        imageUrl: sortImages(product.images)[0]?.url,
        inventoryAllocations
      } satisfies CheckoutQuoteItemSummary;
    });

    return {
      items: resolvedItems,
      currencyCode: CATALOG_CURRENCY_CODE
    };
  }

  private async findCatalogProducts(query: CatalogQueryInput = {}) {
    const search = normalizeText(query.search)?.toLowerCase();
    const products = await this.prisma.product.findMany({
      where: {
        status: "active"
      },
      include: {
        category: true,
        variants: true,
        images: true
      },
      orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }]
    });

    return products
      .map((product) => this.mapCatalogProductSummary(product))
      .filter((product): product is CatalogProduct => Boolean(product))
      .filter((product) => {
        if (query.featuredOnly && !product.badge) {
          return false;
        }

        if (query.category && product.categorySlug !== query.category) {
          return false;
        }

        if (!search) {
          return true;
        }

        const searchableText = [
          product.name,
          product.tagline,
          product.description,
          product.sku,
          product.badge
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(search);
      });
  }

  private buildCatalogCategories(products: CatalogProduct[]): CatalogCategorySummary[] {
    const grouped = new Map<
      string,
      {
        slug: string;
        name: string;
        description: string;
        productCount: number;
      }
    >();

    for (const product of products) {
      const current = grouped.get(product.categorySlug);
      if (current) {
        current.productCount += 1;
        continue;
      }

      grouped.set(product.categorySlug, {
        slug: product.categorySlug,
        name: product.categorySlug === COMBO_CATEGORY_SLUG ? "Combos" : "Productos",
        description:
          product.categorySlug === COMBO_CATEGORY_SLUG
            ? "Combos, ofertas y promociones activas."
            : "Referencias principales para venta directa.",
        productCount: 1
      });
    }

    return Array.from(grouped.values());
  }

  private async normalizeUpsertInput(body: ProductUpsertInput, productId?: string) {
    const name = normalizeText(body.name);
    const slug = normalizeSlug(body.slug);

    if (!name || !slug) {
      throw new BadRequestException("Nombre y slug son obligatorios.");
    }

    if (!productStatuses.has(body.status)) {
      throw new BadRequestException("Estado de producto inválido.");
    }

    if (!Array.isArray(body.variants) || body.variants.length === 0) {
      throw new BadRequestException("Debes registrar al menos una variante.");
    }

    if (!Array.isArray(body.bundleComponents)) {
      throw new BadRequestException("Los componentes del combo deben enviarse como una lista.");
    }

    const categoryId = normalizeText(body.categoryId);
    if (categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: categoryId }
      });

      if (!category) {
        throw new BadRequestException("La categoría indicada no existe.");
      }
    }

    const variants = body.variants.map((variant, index) => {
      const sku = normalizeText(variant.sku);
      const variantName = normalizeText(variant.name);
      if (!sku || !variantName) {
        throw new BadRequestException(`La variante ${index + 1} necesita nombre y SKU.`);
      }

      if (!variantStatuses.has(variant.status)) {
        throw new BadRequestException(`Estado inválido para la variante ${sku}.`);
      }

      return {
        id: normalizeText(variant.id),
        sku,
        name: variantName,
        price: coerceNumber(variant.price, `price:${sku}`),
        compareAtPrice:
          variant.compareAtPrice == null
            ? undefined
            : coerceNumber(variant.compareAtPrice, `compareAtPrice:${sku}`),
        stockOnHand: Math.max(0, Math.trunc(coerceNumber(variant.stockOnHand, `stockOnHand:${sku}`))),
        status: variant.status
      };
    });

    const bundleComponentsInput = body.bundleComponents.map((component, index) => {
      const componentProductId = normalizeText(component.productId);
      if (!componentProductId) {
        throw new BadRequestException(`El componente ${index + 1} necesita un producto base.`);
      }

      if (productId && componentProductId === productId) {
        throw new BadRequestException("El combo no puede incluir el producto principal como componente.");
      }

      const quantity = Math.trunc(coerceNumber(component.quantity, `quantity:${componentProductId}`));
      if (quantity <= 0) {
        throw new BadRequestException(`La cantidad del componente ${componentProductId} debe ser mayor a cero.`);
      }

      return {
        productId: componentProductId,
        variantId: normalizeText(component.variantId),
        quantity
      };
    });

    const duplicateSku = variants.find(
      (variant, index) => variants.findIndex((candidate) => candidate.sku === variant.sku) !== index
    );

    if (duplicateSku) {
      throw new BadRequestException(`SKU duplicado en la misma solicitud: ${duplicateSku.sku}.`);
    }

    const duplicateBundleComponent = bundleComponentsInput.find(
      (component, index) =>
        bundleComponentsInput.findIndex(
          (candidate) =>
            candidate.productId === component.productId && candidate.variantId === component.variantId
        ) !== index
    );

    if (duplicateBundleComponent) {
      throw new BadRequestException(
        `El componente ${duplicateBundleComponent.productId} está repetido en el combo.`
      );
    }

    const componentProductIds = Array.from(
      new Set(bundleComponentsInput.map((component) => component.productId))
    );
    const componentProducts = await this.prisma.product.findMany({
      where: {
        id: {
          in: componentProductIds
        }
      },
      include: {
        variants: true
      }
    });
    const componentProductMap = new Map(componentProducts.map((record) => [record.id, record]));

    const bundleComponents = bundleComponentsInput.map((component) => {
      const record = componentProductMap.get(component.productId);
      if (!record) {
        throw new BadRequestException(`No existe el producto componente ${component.productId}.`);
      }

      const resolvedVariant = component.variantId
        ? record.variants.find((variant) => variant.id === component.variantId)
        : selectDefaultVariant(record.variants);

      if (!resolvedVariant) {
        throw new BadRequestException(
          `El producto componente ${record.slug} no tiene variantes disponibles.`
        );
      }

      return {
        productId: record.id,
        variantId: resolvedVariant.id,
        quantity: component.quantity
      };
    });

    const existingSlug = await this.prisma.product.findUnique({
      where: { slug }
    });

    if (existingSlug && existingSlug.id !== productId) {
      throw new ConflictException(`Ya existe un producto con slug ${slug}.`);
    }

    for (const variant of variants) {
      const existingSku = await this.prisma.productVariant.findUnique({
        where: { sku: variant.sku }
      });

      if (existingSku && existingSku.productId !== productId && existingSku.id !== variant.id) {
        throw new ConflictException(`Ya existe una variante con SKU ${variant.sku}.`);
      }
    }

    return {
      categoryId,
      name,
      slug,
      shortDescription: normalizeText(body.shortDescription),
      longDescription: normalizeText(body.longDescription),
      status: body.status,
      isFeatured: Boolean(body.isFeatured),
      variants,
      bundleComponents
    };
  }

  private async syncVariants(
    tx: Prisma.TransactionClient,
    productId: string,
    variants: Awaited<ReturnType<ProductsService["normalizeUpsertInput"]>>["variants"],
    existingVariants: ProductVariant[]
  ) {
    for (const [index, variant] of variants.entries()) {
      const current =
        existingVariants.find((item) => item.id === variant.id) ??
        (existingVariants.length === variants.length ? existingVariants[index] : undefined);

      if (current) {
        await tx.productVariant.update({
          where: { id: current.id },
          data: {
            sku: variant.sku,
            name: variant.name,
            price: new Prisma.Decimal(variant.price),
            compareAtPrice:
              variant.compareAtPrice == null ? null : new Prisma.Decimal(variant.compareAtPrice),
            stockOnHand: variant.stockOnHand,
            status: variant.status
          }
        });
        continue;
      }

      await tx.productVariant.create({
        data: {
          productId,
          sku: variant.sku,
          name: variant.name,
          price: new Prisma.Decimal(variant.price),
          compareAtPrice:
            variant.compareAtPrice == null ? null : new Prisma.Decimal(variant.compareAtPrice),
          stockOnHand: variant.stockOnHand,
          status: variant.status
        }
      });
    }
  }

  private async syncBundleComponents(
    tx: Prisma.TransactionClient,
    productId: string,
    bundleComponents: Awaited<ReturnType<ProductsService["normalizeUpsertInput"]>>["bundleComponents"]
  ) {
    await tx.productBundleComponent.deleteMany({
      where: { productId }
    });

    if (!bundleComponents.length) {
      return;
    }

    await tx.productBundleComponent.createMany({
      data: bundleComponents.map((component, index) => ({
        productId,
        componentProductId: component.productId,
        componentVariantId: component.variantId,
        quantity: component.quantity,
        sortOrder: index
      }))
    });
  }

  private mapAdminSummary(product: AdminProductRecord): ProductAdminSummary {
    const defaultVariant = selectDefaultVariant(product.variants);
    const primaryImage = sortImages(product.images)[0];

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription ?? undefined,
      categoryId: product.categoryId ?? undefined,
      categorySlug: product.category?.slug ?? undefined,
      categoryName: product.category?.name ?? undefined,
      status: product.status,
      isFeatured: product.isFeatured,
      price: defaultVariant ? Number(defaultVariant.price) : 0,
      compareAtPrice: defaultVariant ? toNumber(defaultVariant.compareAtPrice) : undefined,
      sku: defaultVariant?.sku ?? "SIN-SKU",
      defaultVariantId: defaultVariant?.id,
      currencyCode: CATALOG_CURRENCY_CODE,
      primaryImageUrl: primaryImage?.url,
      updatedAt: product.updatedAt.toISOString()
    };
  }

  private mapAdminDetail(product: AdminProductRecord): ProductAdminDetail {
    return {
      ...this.mapAdminSummary(product),
      longDescription: product.longDescription ?? undefined,
      variants: product.variants.map(mapVariant),
      bundleComponents: sortBundleComponents(product.bundleComponents).map(mapBundleComponent),
      images: sortImages(product.images).map(mapImage)
    };
  }

  private mapCatalogProductSummary(product: CatalogProductRecord): CatalogProduct | null {
    const variant = selectDefaultVariant(product.variants);
    if (!variant) {
      return null;
    }

    const merchandising = merchandisingBySlug[product.slug] ?? {
      badge: product.isFeatured ? "Destacado" : "Disponible",
      tone: "emerald" as const,
      benefits: ["Frescura herbal", "Portátil", "Compra directa"],
      tagline: product.shortDescription ?? "Formato listo para compra directa."
    };
    const primaryImage = sortImages(product.images)[0];

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      categorySlug: product.category?.slug ?? "productos",
      tagline: product.shortDescription ?? merchandising.tagline,
      description: product.longDescription ?? product.shortDescription ?? merchandising.tagline,
      price: Number(variant.price),
      compareAtPrice: toNumber(variant.compareAtPrice),
      badge: merchandising.badge,
      tone: merchandising.tone,
      benefits: merchandising.benefits,
      sku: variant.sku,
      imageUrl: primaryImage?.url,
      imageAlt: primaryImage?.altText ?? `${product.name} - imagen del producto`
    };
  }

  private mapCatalogProductDetail(product: CatalogProductRecord): CatalogProduct | null {
    const summary = this.mapCatalogProductSummary(product);
    if (!summary) {
      return null;
    }

    const variants = product.variants
      .slice()
      .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())
      .map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        name: variant.name,
        price: Number(variant.price),
        compareAtPrice: toNumber(variant.compareAtPrice),
        status: variant.status
      }));

    const images = sortImages(product.images).map((image) => ({
      id: image.id,
      url: image.url,
      altText: image.altText ?? undefined,
      sortOrder: image.sortOrder,
      isPrimary: image.isPrimary,
      variantId: image.variantId ?? undefined
    }));

    return {
      ...summary,
      defaultVariantId: summary.defaultVariantId ?? selectDefaultVariant(product.variants)?.id,
      currencyCode: CATALOG_CURRENCY_CODE,
      variants,
      images
    };
  }

  private rethrowPrismaConflict(error: unknown, fallbackMessage: string): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictException("Ya existe un registro con un identificador único duplicado.");
    }

    if (error instanceof Error) {
      throw new BadRequestException(`${fallbackMessage} ${error.message}`);
    }

    throw new BadRequestException(fallbackMessage);
  }
}
