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
  VendorApplicationItem,
  VendorOverview,
  WebNavigationGroup,
  WholesaleLeadItem,
  WholesalePlan,
  WholesaleQuoteSummary
} from "./domain/models";

export const siteSetting: SiteSetting = {
  brandName: "Huelegood",
  tagline: "Plataforma comercial modular para vender, administrar y escalar.",
  supportEmail: "hola@huelegood.com",
  whatsapp: "+52 000 000 0000"
};

export const heroCopy: HeroCopy = {
  eyebrow: "Seller-first, premium y administrable",
  title: "Una plataforma comercial propia para Huelegood.",
  description:
    "Storefront, backoffice, pagos Openpay, pagos manuales, vendedores con código, mayoristas, CRM básico y fidelización en un monolito modular.",
  primaryCta: { label: "Ver catálogo", href: "/catalogo" },
  secondaryCta: { label: "Explorar mayoristas", href: "/mayoristas" }
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
    title: "Operación",
    items: [
      { label: "Dashboard", href: "/" },
      { label: "Pedidos", href: "/pedidos" },
      { label: "Pagos", href: "/pagos" },
      { label: "Vendedores", href: "/vendedores" },
      { label: "Comisiones", href: "/comisiones" }
    ]
  },
  {
    title: "Gestión",
    items: [
      { label: "CMS", href: "/cms" },
      { label: "Mayoristas", href: "/mayoristas" },
      { label: "Loyalty", href: "/loyalty" },
      { label: "Marketing", href: "/marketing" },
      { label: "Configuración", href: "/configuracion" }
    ]
  }
];

export const featuredProducts: CatalogProduct[] = [
  {
    id: "prod-classic-green",
    name: "Clásico Verde",
    slug: "clasico-verde",
    categorySlug: "productos",
    tagline: "Fresco, directo y portable.",
    description:
      "La referencia base para una experiencia limpia y práctica, pensada para la narrativa de reset y movimiento.",
    price: 249,
    compareAtPrice: 299,
    badge: "Más vendido",
    tone: "emerald",
    benefits: ["Portabilidad", "Frescura", "Uso diario"],
    sku: "HG-CV-001"
  },
  {
    id: "prod-premium-black",
    name: "Premium Negro",
    slug: "premium-negro",
    categorySlug: "productos",
    tagline: "Más sobrio, más premium.",
    description:
      "La línea con percepción más elegante para reforzar la narrativa de marca y conversión aspiracional.",
    price: 349,
    compareAtPrice: 399,
    badge: "Nuevo",
    tone: "graphite",
    benefits: ["Percepción premium", "Look sobrio", "Embalaje limpio"],
    sku: "HG-PN-001"
  },
  {
    id: "prod-duo-perfect",
    name: "Combo Dúo Perfecto",
    slug: "combo-duo-perfecto",
    categorySlug: "bundles",
    tagline: "La compra ideal para rotación y bundle.",
    description:
      "Bundle pensado para elevar ticket promedio y facilitar campañas, códigos de vendedor y promociones.",
    price: 449,
    compareAtPrice: 549,
    badge: "Combo",
    tone: "amber",
    benefits: ["Mejor ticket", "Bundle", "Ahorro visible"],
    sku: "HG-CDP-001"
  }
];

export const promoBanners: PromoBanner[] = [
  {
    title: "Oferta activa con código promocional",
    description: "Aprovecha la combinación de promo + atribución de vendedor con reglas controladas.",
    ctaLabel: "Comprar ahora",
    ctaHref: "/checkout",
    note: "Vigencia limitada",
    tone: "olive"
  },
  {
    title: "Bloque mayorista y distribuidores",
    description: "Condiciones por volumen para leads calificados y seguimiento comercial.",
    ctaLabel: "Cotizar volumen",
    ctaHref: "/mayoristas",
    note: "Atención interna",
    tone: "ink"
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
    perks: ["Precio preferente", "Soporte interno", "Historial de compras"],
    ctaLabel: "Hablar con ventas",
    ctaHref: "/trabaja-con-nosotros"
  }
];

export const faqItems: FaqItem[] = [
  {
    question: "¿Puedo pagar con Openpay?",
    answer: "Sí. El checkout contempla cobro online con Openpay y conciliación de estado."
  },
  {
    question: "¿Se aceptan pagos manuales?",
    answer: "Sí. El cliente puede subir comprobante y el equipo interno revisa la solicitud."
  },
  {
    question: "¿Hay vendedor con código y comisión?",
    answer: "Sí. La venta puede atribuirse a un vendedor y liquidarse por comisiones."
  }
];

export const adminMetrics: AdminMetric[] = [
  { label: "Pedidos hoy", value: "128", detail: "12 en revisión de pago", trend: "+18%" },
  { label: "Ventas brutas", value: "$48,900", detail: "7 días", trend: "+12%" },
  { label: "Comisiones pagables", value: "$9,240", detail: "Pendientes de liquidación", trend: "+6%" },
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
