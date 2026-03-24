import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.siteSetting.upsert({
    where: { key: "brand" },
    update: {
      scope: "global",
      valueJson: {
        brandName: "Huelegood",
        tagline: "Plataforma comercial modular para vender, administrar y escalar.",
        supportEmail: "hola@huelegood.com",
        whatsapp: "+52 000 000 0000"
      }
    },
    create: {
      key: "brand",
      scope: "global",
      valueJson: {
        brandName: "Huelegood",
        tagline: "Plataforma comercial modular para vender, administrar y escalar.",
        supportEmail: "hola@huelegood.com",
        whatsapp: "+52 000 000 0000"
      }
    }
  });

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

  const categories = [
    { slug: "productos", name: "Productos", description: "Referencias principales de Huelegood" },
    { slug: "bundles", name: "Bundles", description: "Combos y ofertas activas" }
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, description: category.description, isActive: true },
      create: category
    });
  }

  const products = [
    {
      slug: "clasico-verde",
      name: "Clásico Verde",
      shortDescription: "Fresco, directo y portable.",
      longDescription: "La referencia base para una experiencia limpia y práctica.",
      categorySlug: "productos",
      sku: "HG-CV-001",
      price: new Prisma.Decimal(249),
      compareAtPrice: new Prisma.Decimal(299)
    },
    {
      slug: "premium-negro",
      name: "Premium Negro",
      shortDescription: "Más sobrio, más premium.",
      longDescription: "La línea con percepción más elegante para reforzar la narrativa de marca.",
      categorySlug: "productos",
      sku: "HG-PN-001",
      price: new Prisma.Decimal(349),
      compareAtPrice: new Prisma.Decimal(399)
    },
    {
      slug: "combo-duo-perfecto",
      name: "Combo Dúo Perfecto",
      shortDescription: "Bundle pensado para ticket promedio.",
      longDescription: "Bundle para promociones, códigos y bundles de campaña.",
      categorySlug: "bundles",
      sku: "HG-CDP-001",
      price: new Prisma.Decimal(449),
      compareAtPrice: new Prisma.Decimal(549),
      bundleComponents: [
        { productSlug: "clasico-verde", quantity: 1 },
        { productSlug: "premium-negro", quantity: 1 }
      ]
    }
  ];

  const seededProducts = new Map<string, { id: string }>();

  for (const product of products) {
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

    await prisma.productVariant.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        stockOnHand: 120,
        status: "active",
        productId: record.id
      },
      create: {
        productId: record.id,
        sku: product.sku,
        name: product.name,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        stockOnHand: 120,
        status: "active"
      }
    });

    seededProducts.set(product.slug, { id: record.id });
  }

  for (const product of products) {
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

  const pages = [
    { slug: "home", title: "Home Huelegood", status: "published" },
    { slug: "catalogo", title: "Catálogo", status: "published" },
    { slug: "mayoristas", title: "Mayoristas", status: "published" },
    { slug: "trabaja-con-nosotros", title: "Trabaja con nosotros", status: "published" }
  ] as const;

  for (const page of pages) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      update: { title: page.title, status: page.status },
      create: { slug: page.slug, title: page.title, status: page.status }
    });
  }

  const homePage = await prisma.page.findUnique({ where: { slug: "home" } });
  if (homePage) {
    await prisma.pageBlock.deleteMany({ where: { pageId: homePage.id } });
    await prisma.pageBlock.createMany({
      data: [
        {
          pageId: homePage.id,
          type: "hero",
          sortOrder: 1,
          contentJson: {
            eyebrow: "Seller-first, premium y administrable",
            title: "Huelegood",
            description: "Plataforma comercial modular."
          },
          isActive: true
        },
        {
          pageId: homePage.id,
          type: "product-grid",
          sortOrder: 2,
          contentJson: { source: "featuredProducts" },
          isActive: true
        }
      ]
    });
  }

  const banners = [
    {
      title: "Oferta activa con código promocional",
      placement: "home",
      ctaLabel: "Comprar ahora",
      ctaUrl: "/checkout"
    },
    {
      title: "Bloque mayorista y distribuidores",
      placement: "home",
      ctaLabel: "Cotizar volumen",
      ctaUrl: "/mayoristas"
    }
  ];

  await prisma.banner.deleteMany();
  await prisma.banner.createMany({
    data: banners.map((banner) => ({
      title: banner.title,
      placement: banner.placement,
      ctaLabel: banner.ctaLabel,
      ctaUrl: banner.ctaUrl,
      isActive: true
    }))
  });

  const faqs = [
    {
      question: "¿Puedo pagar con Openpay?",
      answer: "Sí. El checkout contempla cobro online y conciliación de estado.",
      category: "Pagos"
    },
    {
      question: "¿Se aceptan pagos manuales?",
      answer: "Sí. El cliente puede subir comprobante y el equipo interno revisa la solicitud.",
      category: "Pagos"
    },
    {
      question: "¿Hay vendedor con código y comisión?",
      answer: "Sí. La venta puede atribuirse a un vendedor y liquidarse por comisiones.",
      category: "Seller-first"
    }
  ];

  await prisma.faq.deleteMany();
  await prisma.faq.createMany({
    data: faqs.map((faq) => ({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      isPublished: true
    }))
  });
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
