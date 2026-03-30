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
  for (const category of localDemoCategories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, description: category.description, isActive: true },
      create: category
    });
  }

  const seededProducts = new Map<string, { id: string; variantId: string }>();

  for (const product of localDemoProducts) {
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
        status: "active",
        isFeatured: true
      },
      create: {
        slug: product.slug,
        name: product.name,
        shortDescription: product.shortDescription,
        longDescription: product.longDescription,
        categoryId: category.id,
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
        stockOnHand: 120,
        status: "active",
        productId: record.id
      },
      create: {
        productId: record.id,
        sku: product.sku,
        name: product.name,
        price: new Prisma.Decimal(product.price),
        compareAtPrice: product.compareAtPrice != null ? new Prisma.Decimal(product.compareAtPrice) : null,
        stockOnHand: 120,
        status: "active"
      }
    });

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
