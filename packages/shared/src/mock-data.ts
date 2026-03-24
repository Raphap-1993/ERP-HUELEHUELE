import {
  CampaignRecipientStatus,
  CampaignRunStatus,
  CampaignStatus,
  CommissionPayoutStatus,
  CommissionStatus,
  InventoryMovementType,
  LoyaltyMovementStatus,
  ManualPaymentRequestStatus,
  NotificationStatus,
  OrderStatus,
  PaymentStatus,
  RedemptionStatus,
  RoleCode,
  VendorApplicationStatus,
  VendorStatus,
  WholesaleLeadStatus,
  WholesaleQuoteStatus
} from "./domain/enums";
import { adminAccessRoles } from "./domain/admin-access";
import type {
  AdminMetric,
  AdminNavigationGroup,
  CatalogProduct,
  CommissionRow,
  DashboardSummary,
  FaqItem,
  HeroCopy,
  NavigationItem,
  OrderSummaryRow,
  PromoBanner,
  ReviewItem,
  SiteSetting,
  TimelineEntry,
  CmsTestimonial,
  VendorApplicationItem,
  VendorOverview,
  WebNavigationGroup,
  WholesaleLeadItem,
  WholesalePlan,
  WholesaleQuoteSummary
} from "./domain/models";

export const siteSetting: SiteSetting = {
  brandName: "Huelegood",
  tagline: "Frescura herbal portátil para acompañarte en tráfico, viajes, oficina y altura.",
  supportEmail: "hola@huelegood.com",
  whatsapp: "+52 000 000 0000",
  headerLogoUrl: undefined,
  heroProductImageUrl: undefined
};

export const heroCopy: HeroCopy = {
  eyebrow: "Inhalador herbal aromático • fresco y portable",
  title: "Huele Huele te da un reset fresco cuando el día no se detiene.",
  description:
    "Una experiencia herbal práctica para quienes buscan frescura inmediata en movimiento. Ideal para bolso, escritorio, carro y viaje.",
  primaryCta: { label: "Comprar ahora", href: "/catalogo" },
  secondaryCta: { label: "Ver productos", href: "/catalogo" }
};

export const webNavigation: WebNavigationGroup[] = [
  {
    title: "Explorar",
    items: [
      { label: "Inicio", href: "/" },
      { label: "Catálogo", href: "/catalogo" },
      { label: "Mayoristas", href: "/mayoristas" },
      { label: "Trabaja con nosotros", href: "/trabaja-con-nosotros" }
    ]
  },
  {
    title: "Cuenta",
    items: [
      { label: "Mi cuenta", href: "/cuenta" },
      { label: "Checkout", href: "/checkout" }
    ]
  }
];

export const adminNavigation: AdminNavigationGroup[] = [
  {
    title: "Operaciones",
    items: [
      { label: "Dashboard", href: "/", requiredRoles: adminAccessRoles.dashboard },
      { label: "Pedidos", href: "/pedidos", requiredRoles: adminAccessRoles.orders },
      { label: "Pagos", href: "/pagos", requiredRoles: adminAccessRoles.payments }
    ]
  },
  {
    title: "Catálogo",
    items: [
      { label: "Productos", href: "/productos", requiredRoles: adminAccessRoles.products },
      { label: "CMS", href: "/cms", requiredRoles: adminAccessRoles.cms }
    ]
  },
  {
    title: "Comercial",
    items: [
      { label: "Vendedores", href: "/vendedores", requiredRoles: adminAccessRoles.vendors },
      { label: "Comisiones", href: "/comisiones", requiredRoles: adminAccessRoles.commissions },
      { label: "Mayoristas", href: "/mayoristas", requiredRoles: adminAccessRoles.wholesale }
    ]
  },
  {
    title: "Clientes",
    items: [
      { label: "CRM", href: "/crm", requiredRoles: adminAccessRoles.crm },
      { label: "Fidelización", href: "/loyalty", requiredRoles: adminAccessRoles.loyalty },
      { label: "Marketing", href: "/marketing", requiredRoles: adminAccessRoles.marketing }
    ]
  },
  {
    title: "Sistema",
    items: [
      { label: "Notificaciones", href: "/notificaciones", requiredRoles: adminAccessRoles.notifications },
      { label: "Observabilidad", href: "/observabilidad", requiredRoles: adminAccessRoles.observability },
      { label: "Auditoría", href: "/auditoria", requiredRoles: adminAccessRoles.audit },
      { label: "Configuración", href: "/configuracion", requiredRoles: adminAccessRoles.configuration }
    ]
  }
];

export const featuredProducts: CatalogProduct[] = [
  {
    id: "prod-classic-green",
    name: "Clásico Verde",
    slug: "clasico-verde",
    categorySlug: "productos",
    tagline: "El favorito para una sensación fresca y directa.",
    description:
      "Nuestro formato más versátil para el día a día. Ligero, práctico y fácil de llevar cuando quieres una pausa fresca en cualquier momento.",
    price: 249,
    compareAtPrice: 299,
    badge: "Más vendido",
    tone: "emerald",
    benefits: ["Portátil", "Frescura herbal", "Uso diario"],
    sku: "HG-CV-001"
  },
  {
    id: "prod-premium-black",
    name: "Premium Negro",
    slug: "premium-negro",
    categorySlug: "productos",
    tagline: "Diseño sobrio para quien quiere frescura con look premium.",
    description:
      "Acabado elegante y presencia más premium para quienes buscan un formato discreto, limpio y listo para acompañar trayectos largos o jornadas intensas.",
    price: 349,
    compareAtPrice: 399,
    badge: "Nuevo",
    tone: "graphite",
    benefits: ["Acabado premium", "Diseño discreto", "Listo para llevar"],
    sku: "HG-PN-001"
  },
  {
    id: "prod-duo-perfect",
    name: "Combo Dúo Perfecto",
    slug: "combo-duo-perfecto",
    categorySlug: "bundles",
    tagline: "Dos unidades para tener una contigo y otra siempre a la mano.",
    description:
      "La mejor opción para quienes ya usan Huele Huele seguido o quieren compartirlo. Más valor por compra y una reserva lista para oficina, carro o viaje.",
    price: 449,
    compareAtPrice: 549,
    badge: "Combo",
    tone: "amber",
    benefits: ["Ahorro visible", "Doble formato", "Ideal para viaje"],
    sku: "HG-CDP-001"
  }
];

export const promoBanners: PromoBanner[] = [
  {
    title: "Compra tu favorito con promo activa",
    description: "Aprovecha descuentos y llévate Huele Huele en el formato que mejor se adapte a tu rutina.",
    ctaLabel: "Comprar ahora",
    ctaHref: "/catalogo",
    note: "Oferta por tiempo limitado",
    tone: "olive"
  },
  {
    title: "No es vape. No es pomada. Es Huele Huele.",
    description: "Una alternativa práctica, limpia y portable para quienes prefieren una sensación herbal fresca sin complicarse.",
    ctaLabel: "Ver productos",
    ctaHref: "/catalogo",
    note: "Formato práctico",
    tone: "amber"
  }
];

export const wholesalePlans: WholesalePlan[] = [
  {
    tier: "Mayorista Inicial",
    minimumUnits: 20,
    savingsLabel: "hasta 15%",
    description: "Ideal para primeros distribuidores y compras recurrentes.",
    perks: ["Cotización rápida", "Seguimiento comercial", "Condiciones visibles"],
    ctaLabel: "Solicitar cotización",
    ctaHref: "/mayoristas"
  },
  {
    tier: "Distribuidor",
    minimumUnits: 50,
    savingsLabel: "hasta 25%",
    description: "Pensado para volumen estable y acuerdos de continuidad.",
    perks: ["Precio preferente", "Acompañamiento comercial", "Historial de pedidos"],
    ctaLabel: "Hablar con ventas",
    ctaHref: "/trabaja-con-nosotros"
  }
];

export const faqItems: FaqItem[] = [
  {
    question: "¿Qué es Huele Huele?",
    answer:
      "Es un inhalador herbal aromático pensado para acompañarte con una sensación fresca en tráfico, oficina, viajes o cambios de ritmo."
  },
  {
    question: "¿En qué momentos suele usarse?",
    answer:
      "Muchas personas lo llevan en la bolsa, el carro o el escritorio para tenerlo a mano durante trayectos largos, jornadas intensas o viajes."
  },
  {
    question: "¿Cuál debería elegir?",
    answer:
      "Clásico Verde es la opción más versátil, Premium Negro prioriza un look más sobrio y Combo Dúo Perfecto te da mejor valor si quieres más de una unidad."
  }
];

export const cmsTestimonials: CmsTestimonial[] = [
  {
    id: "tst-001",
    name: "Rutina de oficina",
    role: "Uso diario",
    quote: "Ideal para tener frescura a la mano durante jornadas largas, reuniones y traslados diarios.",
    rating: 5,
    status: "active",
    updatedAt: "2026-03-18T10:15:00.000Z"
  },
  {
    id: "tst-002",
    name: "Ruta y carretera",
    role: "Ruta y carretera",
    quote: "Práctico para trayectos largos porque cabe fácil en carro, mochila o bolsa y siempre queda a mano.",
    rating: 5,
    status: "active",
    updatedAt: "2026-03-18T10:20:00.000Z"
  },
  {
    id: "tst-003",
    name: "Viajes y altura",
    role: "Viajes y altura",
    quote: "Su formato ligero y su sensación fresca lo hacen cómodo para viajar y moverse entre ciudades.",
    rating: 5,
    status: "active",
    updatedAt: "2026-03-18T10:30:00.000Z"
  }
];

export const adminMetrics: AdminMetric[] = [
  { label: "Pedidos hoy", value: "128", detail: "12 en revisión de pago", trend: "+18%" },
  { label: "Ventas brutas", value: "S/ 48,900", detail: "7 días", trend: "+12%" },
  { label: "Comisiones pagables", value: "S/ 9,240", detail: "Pendientes de liquidación", trend: "+6%" },
  { label: "Vendedores activos", value: "34", detail: "Seller-first operativo", trend: "+4%" }
];

export const recentOrders: OrderSummaryRow[] = [
  {
    number: "HG-10042",
    customer: "Laura M.",
    total: 749,
    status: OrderStatus.Paid,
    paymentStatus: PaymentStatus.Paid,
    vendorCode: "VEND-014",
    updatedAt: "Hace 12 min"
  },
  {
    number: "HG-10041",
    customer: "Carlos G.",
    total: 449,
    status: OrderStatus.PaymentUnderReview,
    paymentStatus: PaymentStatus.Pending,
    vendorCode: "VEND-007",
    updatedAt: "Hace 26 min"
  },
  {
    number: "HG-10040",
    customer: "Sofía R.",
    total: 349,
    status: OrderStatus.Confirmed,
    paymentStatus: PaymentStatus.Paid,
    vendorCode: "VEND-021",
    updatedAt: "Hace 48 min"
  }
];

export const reviewQueue: ReviewItem[] = [
  {
    id: "rev-001",
    orderNumber: "HG-10041",
    customer: "Carlos G.",
    amount: 449,
    provider: "Pago manual",
    evidence: "comprobante-hg-10041.jpg",
    status: ManualPaymentRequestStatus.UnderReview,
    submittedAt: "Hace 18 min"
  },
  {
    id: "rev-002",
    orderNumber: "HG-10039",
    customer: "Ricardo P.",
    amount: 299,
    provider: "Openpay",
    evidence: "webhook-pendiente",
    status: ManualPaymentRequestStatus.Submitted,
    submittedAt: "Hace 1 h"
  }
];

export const commissionRows: CommissionRow[] = [
  {
    vendor: "Mónica Herrera",
    code: "VEND-014",
    totalSales: 12600,
    commission: 1890,
    status: CommissionStatus.Payable,
    period: "Marzo 2026"
  },
  {
    vendor: "Jorge Salas",
    code: "VEND-007",
    totalSales: 9800,
    commission: 1470,
    status: CommissionStatus.ScheduledForPayout,
    period: "Marzo 2026"
  },
  {
    vendor: "Ana Torres",
    code: "VEND-021",
    totalSales: 16800,
    commission: 2520,
    status: CommissionStatus.Paid,
    period: "Febrero 2026"
  }
];

export const orderTimeline: TimelineEntry[] = [
  {
    status: OrderStatus.Draft,
    label: "Pedido creado",
    actor: "Sistema",
    occurredAt: "10:42",
    note: "Carrito convertido a pedido"
  },
  {
    status: OrderStatus.PendingPayment,
    label: "Pendiente de pago",
    actor: "Cliente",
    occurredAt: "10:43",
    note: "Checkout enviado a Openpay"
  },
  {
    status: OrderStatus.Paid,
    label: "Pago confirmado",
    actor: "Openpay",
    occurredAt: "10:46",
    note: "Transacción autorizada"
  },
  {
    status: OrderStatus.Confirmed,
    label: "Confirmado por operación",
    actor: "Admin",
    occurredAt: "10:52",
    note: "Listo para preparación"
  }
];

export const vendorApplications: VendorApplicationItem[] = [
  {
    id: "va-001",
    name: "Mónica Herrera",
    email: "monica@seller.com",
    status: VendorApplicationStatus.Screening,
    city: "Lima",
    source: "Formulario web"
  },
  {
    id: "va-002",
    name: "Jorge Salas",
    email: "jorge@seller.com",
    status: VendorApplicationStatus.Approved,
    city: "Arequipa",
    source: "Campaña"
  }
];

export const wholesaleLeads: WholesaleLeadItem[] = [
  {
    id: "wl-001",
    company: "Distribuidora Andina",
    contact: "Paola Méndez",
    status: WholesaleLeadStatus.Qualified,
    city: "Lima",
    source: "Landing mayorista"
  },
  {
    id: "wl-002",
    company: "Ruta Norte",
    contact: "Carlos Fuentes",
    status: WholesaleLeadStatus.Negotiating,
    city: "Trujillo",
    source: "Referencia comercial"
  }
];

export const adminDashboard: DashboardSummary = {
  metrics: adminMetrics,
  recentOrders,
  reviewQueue,
  commissionRows
};

export const inventorySnapshot = [
  {
    sku: "HG-CV-001",
    name: "Clásico Verde",
    movements: 120,
    movementType: InventoryMovementType.Outbound
  },
  {
    sku: "HG-PN-001",
    name: "Premium Negro",
    movements: 84,
    movementType: InventoryMovementType.Outbound
  }
];

export const campaignSummary = [
  {
    name: "Reset de marzo",
    status: CampaignStatus.Running,
    runStatus: CampaignRunStatus.Running,
    recipients: [CampaignRecipientStatus.Sent, CampaignRecipientStatus.Delivered]
  }
];

export const loyaltyOverview = [
  {
    customer: "Laura M.",
    availablePoints: 120,
    pendingPoints: 40,
    redeemedPoints: 60,
    recentMovement: LoyaltyMovementStatus.Available,
    redemptionStatus: RedemptionStatus.Applied
  }
];

export const vendorOverview: VendorOverview[] = [
  {
    name: "Mónica Herrera",
    code: "VEND-014",
    status: VendorStatus.Active,
    sales: 12600,
    commissions: 1890
  },
  {
    name: "Jorge Salas",
    code: "VEND-007",
    status: VendorStatus.Active,
    sales: 9800,
    commissions: 1470
  }
];

export const wholesaleQuotes: WholesaleQuoteSummary[] = [
  {
    company: "Distribuidora Andina",
    status: WholesaleQuoteStatus.Sent,
    amount: 9850
  },
  {
    company: "Ruta Norte",
    status: WholesaleQuoteStatus.Accepted,
    amount: 14500
  }
];

export const paymentReviews = [
  {
    orderNumber: "HG-10041",
    status: PaymentStatus.Pending,
    amount: 449,
    provider: "Pago manual",
    manualStatus: ManualPaymentRequestStatus.UnderReview,
    notificationStatus: NotificationStatus.Pending
  },
  {
    orderNumber: "HG-10042",
    status: PaymentStatus.Paid,
    amount: 749,
    provider: "Openpay",
    manualStatus: ManualPaymentRequestStatus.Approved,
    notificationStatus: NotificationStatus.Sent
  }
];

export const webRoles: RoleCode[] = [RoleCode.Cliente, RoleCode.Vendedor];
