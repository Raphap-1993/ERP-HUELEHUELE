import "dotenv/config";
import { LifecycleStatus, Prisma, PrismaClient, VendorCodeStatus, VendorStatus } from "@prisma/client";
import { scryptSync } from "node:crypto";
import { RoleCode } from "@huelegood/shared";
import { localDemoCategories, localDemoCmsSnapshot, localDemoProducts } from "./demo-content";

const prisma = new PrismaClient();

if (process.env.NODE_ENV === "production" && process.env.HUELEGOOD_ALLOW_PRODUCTION_SEED !== "1") {
  throw new Error("prisma/seed.ts is for local/demo use only. Use scripts/migrate-bootstrap-users.sh for production bootstrap migration.");
}

function envValue(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function bootstrapEnv(name: string, fallback: string) {
  return envValue(name) ?? fallback;
}

function hashSeedPassword(email: string, password: string) {
  const salt = email.trim().toLowerCase();
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

async function ensureOperationalWarehouse(input: {
  code: string;
  name: string;
  priority: number;
  addressLine1: string;
  reference: string;
  departmentCode: string;
  departmentName: string;
  provinceCode: string;
  provinceName: string;
  districtCode: string;
  districtName: string;
}) {
  const existing = await prisma.warehouse.findUnique({
    where: { code: input.code }
  });

  if (existing) {
    return prisma.warehouse.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        status: LifecycleStatus.active,
        priority: input.priority,
        countryCode: "PE",
        addressLine1: input.addressLine1,
        reference: input.reference,
        departmentCode: input.departmentCode,
        departmentName: input.departmentName,
        provinceCode: input.provinceCode,
        provinceName: input.provinceName,
        districtCode: input.districtCode,
        districtName: input.districtName
      }
    });
  }

  return prisma.warehouse.create({
    data: {
      code: input.code,
      name: input.name,
      status: LifecycleStatus.active,
      priority: input.priority,
      countryCode: "PE",
      addressLine1: input.addressLine1,
      reference: input.reference,
      departmentCode: input.departmentCode,
      departmentName: input.departmentName,
      provinceCode: input.provinceCode,
      provinceName: input.provinceName,
      districtCode: input.districtCode,
      districtName: input.districtName
    }
  });
}

async function ensureOperationalWarehouses() {
  const legacyDefault = await prisma.warehouse.findUnique({
    where: { code: "WH-DEFAULT" }
  });

  const primary = await (async () => {
    const existingPrimary = await prisma.warehouse.findUnique({
      where: { code: "WH-LIMA-CENTRAL" }
    });

    if (!existingPrimary && legacyDefault) {
      return prisma.warehouse.update({
        where: { id: legacyDefault.id },
        data: {
          code: "WH-LIMA-CENTRAL",
          name: "Lima Central",
          status: LifecycleStatus.active,
          priority: 0,
          countryCode: "PE",
          addressLine1: "Av. Argentina 415, Cercado de Lima",
          reference: "Nodo principal para catálogo demo y despacho urbano.",
          departmentCode: "15",
          departmentName: "Lima",
          provinceCode: "1501",
          provinceName: "Lima",
          districtCode: "150101",
          districtName: "Lima"
        }
      });
    }

    return ensureOperationalWarehouse({
      code: "WH-LIMA-CENTRAL",
      name: "Lima Central",
      priority: 0,
      addressLine1: "Av. Argentina 415, Cercado de Lima",
      reference: "Nodo principal para catálogo demo y despacho urbano.",
      departmentCode: "15",
      departmentName: "Lima",
      provinceCode: "1501",
      provinceName: "Lima",
      districtCode: "150101",
      districtName: "Lima"
    });
  })();

  const secondary = await ensureOperationalWarehouse({
    code: "WH-AREQUIPA-SUR",
    name: "Arequipa Sur",
    priority: 1,
    addressLine1: "Av. Porongoche 510, José Luis Bustamante y Rivero",
    reference: "Nodo secundario para cobertura regional y rebalanceo demo.",
    departmentCode: "04",
    departmentName: "Arequipa",
    provinceCode: "0401",
    provinceName: "Arequipa",
    districtCode: "040129",
    districtName: "José Luis Bustamante y Rivero"
  });

  return {
    primary,
    secondary
  };
}

function splitStockAcrossWarehouses(stockOnHand: number) {
  const normalizedStock = Math.max(0, Math.trunc(stockOnHand));
  const primaryStock = Math.ceil(normalizedStock / 2);
  return {
    primaryStock,
    secondaryStock: Math.max(0, normalizedStock - primaryStock)
  };
}

function inferVariantAttributes(productSlug: string) {
  if (productSlug === "clasico-verde") {
    return {
      flavorCode: "verde-herbal",
      flavorLabel: "Verde Herbal",
      presentationCode: "unitario",
      presentationLabel: "Unitario"
    };
  }

  if (productSlug === "premium-negro") {
    return {
      flavorCode: "negro-intenso",
      flavorLabel: "Negro Intenso",
      presentationCode: "unitario",
      presentationLabel: "Unitario"
    };
  }

  if (productSlug === "combo-duo-perfecto") {
    return {
      flavorCode: "duo",
      flavorLabel: "Dúo",
      presentationCode: "combo",
      presentationLabel: "Combo"
    };
  }

  return {
    flavorCode: null,
    flavorLabel: null,
    presentationCode: null,
    presentationLabel: null
  };
}

async function seedSiteSettings() {
  await prisma.siteSetting.upsert({
    where: { key: "brand" },
    update: {
      scope: "global",
      valueJson: localDemoCmsSnapshot.siteSetting as unknown as Prisma.InputJsonValue
    },
    create: {
      key: "brand",
      scope: "global",
      valueJson: localDemoCmsSnapshot.siteSetting as unknown as Prisma.InputJsonValue
    }
  });
}

async function seedRolesAndPermissions() {
  const roles = [
    { code: "super_admin", name: "Super Admin" },
    { code: "admin", name: "Admin" },
    { code: "operador_pagos", name: "Operador de pagos" },
    { code: "ventas", name: "Ventas" },
    { code: "marketing", name: "Marketing" },
    { code: "seller_manager", name: "Seller Manager" },
    { code: "vendedor", name: "Vendedor" },
    { code: "cliente", name: "Cliente" }
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name, isSystem: true },
      create: { code: role.code, name: role.name, isSystem: true }
    });
  }

  const permissions = [
    { code: "cms.read", name: "Leer CMS", module: "cms" },
    { code: "cms.write", name: "Editar CMS", module: "cms" },
    { code: "catalog.write", name: "Editar catálogo", module: "catalog" },
    { code: "orders.manage", name: "Gestionar pedidos", module: "orders" },
    { code: "payments.review", name: "Revisar pagos", module: "payments" },
    { code: "vendors.manage", name: "Gestionar vendedores", module: "vendors" },
    { code: "commissions.manage", name: "Gestionar comisiones", module: "commissions" },
    { code: "marketing.execute", name: "Ejecutar campañas", module: "marketing" }
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: { name: permission.name, module: permission.module },
      create: permission
    });
  }
}

async function seedOperationalUsers() {
  const accounts = [
    {
      name: bootstrapEnv("BOOTSTRAP_ADMIN_NAME", "Admin Huelegood"),
      email: bootstrapEnv("BOOTSTRAP_ADMIN_EMAIL", "admin@huelegood.com"),
      password: bootstrapEnv("BOOTSTRAP_ADMIN_PASSWORD", "huelegood123"),
      accountType: "admin" as const,
      roles: [RoleCode.SuperAdmin, RoleCode.Admin],
      adminJobTitle: "Super Admin"
    },
    {
      name: bootstrapEnv("BOOTSTRAP_SELLER_NAME", "Mónica Herrera"),
      email: bootstrapEnv("BOOTSTRAP_SELLER_EMAIL", "monica@seller.com"),
      password: bootstrapEnv("BOOTSTRAP_SELLER_PASSWORD", "huelegood123"),
      accountType: "seller" as const,
      roles: [RoleCode.SellerManager, RoleCode.Vendedor],
      vendorCode: bootstrapEnv("BOOTSTRAP_SELLER_VENDOR_CODE", "VEND-014")
    },
    {
      name: bootstrapEnv("BOOTSTRAP_PAYMENTS_NAME", "Operador de Pagos"),
      email: bootstrapEnv("BOOTSTRAP_PAYMENTS_EMAIL", "pagos@huelegood.com"),
      password: bootstrapEnv("BOOTSTRAP_PAYMENTS_PASSWORD", "huelegood123"),
      accountType: "operator" as const,
      roles: [RoleCode.OperadorPagos],
      adminJobTitle: "Operador de Pagos"
    },
    {
      name: bootstrapEnv("BOOTSTRAP_CUSTOMER_NAME", "Cliente Huelegood"),
      email: bootstrapEnv("BOOTSTRAP_CUSTOMER_EMAIL", "cliente@huelegood.com"),
      password: bootstrapEnv("BOOTSTRAP_CUSTOMER_PASSWORD", "huelegood123"),
      accountType: "customer" as const,
      roles: [RoleCode.Cliente]
    }
  ];

  const requiredRoles = await prisma.role.findMany({
    where: {
      code: {
        in: Array.from(new Set(accounts.flatMap((account) => account.roles)))
      }
    }
  });
  const roleIdByCode = new Map(requiredRoles.map((role) => [role.code, role.id]));

  for (const account of accounts) {
    const user = await prisma.user.upsert({
      where: { email: account.email.trim().toLowerCase() },
      update: {
        phone: null,
        passwordHash: hashSeedPassword(account.email, account.password),
        status: LifecycleStatus.active
      },
      create: {
        email: account.email.trim().toLowerCase(),
        phone: null,
        passwordHash: hashSeedPassword(account.email, account.password),
        status: LifecycleStatus.active
      }
    });

    await prisma.userRole.deleteMany({
      where: { userId: user.id }
    });

    await prisma.userRole.createMany({
      data: account.roles
        .map((code) => roleIdByCode.get(code))
        .filter((roleId): roleId is string => Boolean(roleId))
        .map((roleId) => ({
          userId: user.id,
          roleId
        }))
    });

    if (account.accountType === "admin" || account.accountType === "operator") {
      await prisma.admin.upsert({
        where: { userId: user.id },
        update: {
          displayName: account.name,
          jobTitle: account.adminJobTitle,
          status: LifecycleStatus.active,
          isActive: true
        },
        create: {
          userId: user.id,
          displayName: account.name,
          jobTitle: account.adminJobTitle,
          status: LifecycleStatus.active,
          isActive: true
        }
      });
    }

    if (account.accountType === "customer") {
      const [firstName, ...lastNameParts] = account.name.trim().split(/\s+/);
      await prisma.customer.upsert({
        where: { userId: user.id },
        update: {
          firstName: firstName || "Cliente",
          lastName: lastNameParts.join(" ") || "Huelegood",
          status: LifecycleStatus.active
        },
        create: {
          userId: user.id,
          firstName: firstName || "Cliente",
          lastName: lastNameParts.join(" ") || "Huelegood",
          status: LifecycleStatus.active
        }
      });
    }

    if (account.accountType === "seller") {
      const vendor = await prisma.vendor.upsert({
        where: { userId: user.id },
        update: {
          codePrefix: "VEND",
          status: VendorStatus.active
        },
        create: {
          userId: user.id,
          codePrefix: "VEND",
          status: VendorStatus.active
        }
      });

      await prisma.vendorProfile.upsert({
        where: { vendorId: vendor.id },
        update: {
          displayName: account.name
        },
        create: {
          vendorId: vendor.id,
          displayName: account.name
        }
      });

      if (account.vendorCode) {
        await prisma.vendorCode.upsert({
          where: { code: account.vendorCode },
          update: {
            vendorId: vendor.id,
            status: VendorCodeStatus.active
          },
          create: {
            vendorId: vendor.id,
            code: account.vendorCode,
            status: VendorCodeStatus.active
          }
        });
      }
    }
  }
}

async function seedCatalog() {
  const { primary: defaultWarehouse, secondary: secondaryWarehouse } = await ensureOperationalWarehouses();

  for (const category of localDemoCategories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, description: category.description, isActive: true },
      create: category
    });
  }

  const seededProducts = new Map<string, { id: string; variantId: string }>();

  for (const product of localDemoProducts) {
    const isBundle = (product.bundleComponents?.length ?? 0) > 0;
    const variantAttributes = inferVariantAttributes(product.slug);
    const category = await prisma.category.findUnique({
      where: { slug: product.categorySlug }
    });

    if (!category) {
      continue;
    }

    const record = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        shortDescription: product.shortDescription,
        longDescription: product.longDescription,
        categoryId: category.id,
        productKind: isBundle ? "bundle" : "single",
        status: "active",
        isFeatured: true
      },
      create: {
        slug: product.slug,
        name: product.name,
        shortDescription: product.shortDescription,
        longDescription: product.longDescription,
        categoryId: category.id,
        productKind: isBundle ? "bundle" : "single",
        status: "active",
        isFeatured: true
      }
    });

    const variant = await prisma.productVariant.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        price: new Prisma.Decimal(product.price),
        compareAtPrice: product.compareAtPrice != null ? new Prisma.Decimal(product.compareAtPrice) : null,
        stockOnHand: isBundle ? 0 : 120,
        status: "active",
        productId: record.id,
        defaultWarehouseId: isBundle ? null : defaultWarehouse.id,
        flavorCode: variantAttributes.flavorCode,
        flavorLabel: variantAttributes.flavorLabel,
        presentationCode: variantAttributes.presentationCode,
        presentationLabel: variantAttributes.presentationLabel
      },
      create: {
        productId: record.id,
        sku: product.sku,
        name: product.name,
        price: new Prisma.Decimal(product.price),
        compareAtPrice: product.compareAtPrice != null ? new Prisma.Decimal(product.compareAtPrice) : null,
        stockOnHand: isBundle ? 0 : 120,
        status: "active",
        defaultWarehouseId: isBundle ? null : defaultWarehouse.id,
        flavorCode: variantAttributes.flavorCode,
        flavorLabel: variantAttributes.flavorLabel,
        presentationCode: variantAttributes.presentationCode,
        presentationLabel: variantAttributes.presentationLabel
      }
    });

    if (isBundle) {
      await prisma.warehouseInventoryBalance.deleteMany({
        where: { variantId: variant.id }
      });
    } else {
      const stockSplit = splitStockAcrossWarehouses(120);

      await prisma.warehouseInventoryBalance.upsert({
        where: {
          warehouseId_variantId: {
            warehouseId: defaultWarehouse.id,
            variantId: variant.id
          }
        },
        update: {
          stockOnHand: stockSplit.primaryStock
        },
        create: {
          warehouseId: defaultWarehouse.id,
          variantId: variant.id,
          stockOnHand: stockSplit.primaryStock,
          reservedQuantity: 0,
          committedQuantity: 0
        }
      });

      await prisma.warehouseInventoryBalance.upsert({
        where: {
          warehouseId_variantId: {
            warehouseId: secondaryWarehouse.id,
            variantId: variant.id
          }
        },
        update: {
          stockOnHand: stockSplit.secondaryStock
        },
        create: {
          warehouseId: secondaryWarehouse.id,
          variantId: variant.id,
          stockOnHand: stockSplit.secondaryStock,
          reservedQuantity: 0,
          committedQuantity: 0
        }
      });
    }

    await prisma.productImage.deleteMany({
      where: { productId: record.id }
    });

    await prisma.productImage.create({
      data: {
        productId: record.id,
        variantId: variant.id,
        url: product.imageUrl,
        altText: product.imageAlt,
        sortOrder: 1,
        isPrimary: true
      }
    });

    seededProducts.set(product.slug, { id: record.id, variantId: variant.id });
  }

  for (const product of localDemoProducts) {
    const bundleComponents = product.bundleComponents ?? [];
    if (!bundleComponents.length) {
      continue;
    }

    const bundleProduct = seededProducts.get(product.slug);
    if (!bundleProduct) {
      continue;
    }

    await prisma.productBundleComponent.deleteMany({
      where: { productId: bundleProduct.id }
    });

    await prisma.productBundleComponent.createMany({
      data: await Promise.all(
        bundleComponents.map(async (component, index) => {
          const componentProduct = await prisma.product.findUnique({
            where: { slug: component.productSlug }
          });

          if (!componentProduct) {
            throw new Error(`No existe el producto componente ${component.productSlug}.`);
          }

          const componentVariant = await prisma.productVariant.findFirst({
            where: { productId: componentProduct.id },
            orderBy: [{ status: "asc" }, { createdAt: "asc" }]
          });

          if (!componentVariant) {
            throw new Error(`No existe una variante para el componente ${component.productSlug}.`);
          }

          return {
            productId: bundleProduct.id,
            componentProductId: componentProduct.id,
            componentVariantId: componentVariant.id,
            quantity: component.quantity,
            sortOrder: index
          };
        })
      )
    });
  }
}

async function seedCmsTables() {
  const pageSlugs = localDemoCmsSnapshot.pages.map((page) => page.slug);

  await prisma.page.deleteMany({
    where: {
      slug: {
        notIn: pageSlugs
      }
    }
  });

  for (const page of localDemoCmsSnapshot.pages) {
    const pageRecord = await prisma.page.upsert({
      where: { slug: page.slug },
      update: {
        title: page.title,
        status: page.status,
        publishedAt: page.status === "published" ? new Date(page.updatedAt) : null
      },
      create: {
        slug: page.slug,
        title: page.title,
        status: page.status,
        publishedAt: page.status === "published" ? new Date(page.updatedAt) : null
      }
    });

    await prisma.pageBlock.deleteMany({
      where: { pageId: pageRecord.id }
    });

    await prisma.pageBlock.createMany({
      data: page.blocks.map((block) => ({
        pageId: pageRecord.id,
        type: block.type,
        sortOrder: block.position,
        contentJson: {
          title: block.title,
          description: block.description,
          content: block.content,
          status: block.status
        },
        isActive: block.status === "active"
      }))
    });
  }

  await prisma.banner.deleteMany();
  await prisma.banner.createMany({
    data: localDemoCmsSnapshot.banners.map((banner) => ({
      title: banner.title,
      placement: "home",
      ctaLabel: banner.ctaLabel,
      ctaUrl: banner.ctaHref,
      isActive: banner.status === "active"
    }))
  });

  await prisma.faq.deleteMany();
  await prisma.faq.createMany({
    data: localDemoCmsSnapshot.faqs.map((faq) => ({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      sortOrder: faq.position,
      isPublished: faq.status === "active"
    }))
  });

  await prisma.testimonial.deleteMany();
  await prisma.testimonial.createMany({
    data: localDemoCmsSnapshot.testimonials
      .filter((testimonial) => Boolean(testimonial.quote?.trim()))
      .map((testimonial) => ({
        authorName: testimonial.name,
        headline: testimonial.role,
        content: testimonial.quote!,
        rating: testimonial.rating,
        isPublished: testimonial.status === "active"
      }))
  });
}

async function seedCmsSnapshot() {
  await prisma.moduleSnapshot.upsert({
    where: {
      moduleName: "cms"
    },
    update: {
      snapshot: localDemoCmsSnapshot as unknown as Prisma.InputJsonValue,
      version: 1
    },
    create: {
      moduleName: "cms",
      snapshot: localDemoCmsSnapshot as unknown as Prisma.InputJsonValue,
      version: 1
    }
  });
}

async function main() {
  await seedSiteSettings();
  await seedRolesAndPermissions();
  await seedOperationalUsers();
  await seedCatalog();
  await seedCmsTables();
  await seedCmsSnapshot();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
