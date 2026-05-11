import type {
  AdminBackofficeOrderInput,
  AdminBackofficeOrderItemInput,
  AdminOrderVendorOption,
  PeruDepartmentSummary,
  PeruDistrictSummary,
  PeruProvinceSummary,
  PeruUbigeoCatalog,
  ProductAdminSummary
} from "@huelegood/shared";

export interface BulkOrderImportIssue {
  row: number;
  clientReference?: string;
  message: string;
}

export interface ParsedBulkOrderBatch {
  delimiter: string;
  headers: string[];
  rowCount: number;
  itemCount: number;
  orders: AdminBackofficeOrderInput[];
  issues: BulkOrderImportIssue[];
}

export interface BulkOrdersTemplateOptions {
  products?: ProductAdminSummary[];
  vendors?: AdminOrderVendorOption[];
  peruUbigeo?: PeruUbigeoCatalog;
}

type CanonicalField =
  | "orderRef"
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "line1"
  | "line2"
  | "city"
  | "region"
  | "countryCode"
  | "departmentCode"
  | "departmentName"
  | "provinceCode"
  | "provinceName"
  | "districtCode"
  | "districtName"
  | "initialStatus"
  | "vendorCode"
  | "notes"
  | "sku"
  | "slug"
  | "name"
  | "variantId"
  | "quantity"
  | "unitPrice";

const headerAliases: Record<CanonicalField, string[]> = {
  orderRef: ["pedido_ref", "pedido", "order_ref", "order_key", "client_reference", "referencia"],
  firstName: ["cliente_nombre", "nombres", "first_name", "nombre"],
  lastName: ["cliente_apellido", "apellidos", "last_name", "apellido"],
  email: ["cliente_email", "email", "correo"],
  phone: ["cliente_telefono", "telefono", "phone", "celular", "whatsapp"],
  line1: ["direccion_1", "direccion", "address_1", "line1", "line_1"],
  line2: ["direccion_2", "address_2", "line2", "line_2", "referencia_direccion"],
  city: ["ciudad", "city"],
  region: ["region", "departamento_fallback", "state"],
  countryCode: ["pais", "country_code", "country"],
  departmentCode: ["departamento_codigo", "department_code"],
  departmentName: ["departamento", "department"],
  provinceCode: ["provincia_codigo", "province_code"],
  provinceName: ["provincia", "province"],
  districtCode: ["distrito_codigo", "district_code"],
  districtName: ["distrito", "district"],
  initialStatus: ["estado_pago", "initial_status", "payment_status", "estado", "estado_selector"],
  vendorCode: ["vendedor_codigo", "vendor_code", "seller_code", "vendedor_selector"],
  notes: ["notas", "notes", "observaciones"],
  sku: ["producto_sku", "sku", "producto_selector", "producto_referencia"],
  slug: ["producto_slug", "slug"],
  name: ["producto_nombre", "product_name", "name"],
  variantId: ["variant_id", "producto_variant_id", "variantid"],
  quantity: ["cantidad", "qty", "quantity"],
  unitPrice: ["precio_unitario", "unit_price", "precio", "price"]
};

const templateHeaders = [
  "pedido_ref",
  "cliente_nombre",
  "cliente_apellido",
  "cliente_email",
  "cliente_telefono",
  "direccion_1",
  "departamento",
  "provincia",
  "distrito",
  "estado_pago",
  "vendedor_codigo",
  "notas",
  "producto_sku",
  "cantidad"
] as const;

const templateRows = [
  [
    "WSP-001",
    "Laura",
    "Mendoza",
    "laura@example.com",
    "999111222",
    "Av. Principal 123",
    "Lima",
    "Lima",
    "Miraflores",
    "paid",
    "VEND-001",
    "Pedido por WhatsApp",
    "HG-PN-001",
    "2"
  ],
  [
    "WSP-001",
    "Laura",
    "Mendoza",
    "laura@example.com",
    "999111222",
    "Av. Principal 123",
    "Lima",
    "Lima",
    "Miraflores",
    "paid",
    "VEND-001",
    "Pedido por WhatsApp",
    "HG-CV-001",
    "1"
  ],
  [
    "WSP-002",
    "Carlos",
    "Rojas",
    "",
    "999333444",
    "Jr. Comercio 456",
    "Lima",
    "Lima",
    "San Isidro",
    "pending_payment",
    "",
    "Pendiente de transferencia",
    "HG-PN-001",
    "1"
  ]
] as const;

const xlsxMimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const xlsxFileName = "pedidos-masivos-template.xlsx";
const csvFileName = "pedidos-masivos-template.csv";
const statusDropdownOptions = [
  "pending_payment | Pendiente de cobro",
  "paid | Cobrado confirmado"
] as const;

const templateProductGuideLimit = 200;
const templateVendorGuideLimit = 200;
type UbigeoScope = "department" | "province" | "district";

function normalizeHeader(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeText(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function extractSelectableCode(value?: string) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return undefined;
  }

  const [firstSegment] = normalized.split("|");
  return normalizeText(firstSegment) ?? normalized;
}

function selectorSegments(value?: string) {
  return normalizeText(value)
    ?.split("|")
    .map((segment) => segment.trim())
    .filter(Boolean) ?? [];
}

function buildDepartmentSelectorLabel(department: PeruDepartmentSummary) {
  return [department.code, department.name].join(" | ");
}

function buildProvinceSelectorLabel(province: PeruProvinceSummary, departmentsByCode: Map<string, string>) {
  return [province.code, province.name, departmentsByCode.get(province.departmentCode) ?? province.departmentCode].join(" | ");
}

function buildDistrictSelectorLabel(
  district: PeruDistrictSummary,
  provincesByCode: Map<string, string>,
  departmentsByCode: Map<string, string>
) {
  return [
    district.code,
    district.name,
    provincesByCode.get(district.provinceCode) ?? district.provinceCode,
    departmentsByCode.get(district.departmentCode) ?? district.departmentCode
  ].join(" | ");
}

function parseLocationSelection(value: string | undefined, scope: UbigeoScope) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return { code: undefined, name: undefined };
  }

  const segments = selectorSegments(normalized);
  const firstSegment = segments[0];
  const validCode =
    scope === "department"
      ? /^\d{2}$/.test(firstSegment ?? "")
      : scope === "province"
        ? /^\d{4}$/.test(firstSegment ?? "")
        : /^\d{6}$/.test(firstSegment ?? "");

  if (validCode) {
    return {
      code: firstSegment,
      name: normalizeText(segments[1])
    };
  }

  return {
    code: undefined,
    name: normalized
  };
}

function detectDelimiter(headerLine: string) {
  const candidates = [",", ";", "\t"];
  const counts = candidates.map((delimiter) => ({
    delimiter,
    count: splitDelimitedLine(headerLine, delimiter).length
  }));

  return counts.sort((left, right) => right.count - left.count)[0]?.delimiter ?? ",";
}

function splitDelimitedLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === "\"") {
      if (inQuotes && line[index + 1] === "\"") {
        current += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === delimiter && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  cells.push(current);
  return cells;
}

function serializeCsvCell(value: string) {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }

  return value;
}

function parseStatus(value?: string): AdminBackofficeOrderInput["initialStatus"] | undefined {
  const normalized = normalizeHeader(extractSelectableCode(value) ?? "");
  if (!normalized) {
    return "pending_payment";
  }

  if (["paid", "pagado", "cobrado", "pagada"].includes(normalized)) {
    return "paid";
  }

  if (["pending_payment", "pendiente_pago", "pendiente", "por_cobrar"].includes(normalized)) {
    return "pending_payment";
  }

  return undefined;
}

function parseInteger(value?: string) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return Math.trunc(parsed);
}

function parseCurrency(value?: string) {
  const normalized = normalizeText(value)?.replace(/\s+/g, "");
  if (!normalized) {
    return undefined;
  }

  if (normalized.includes(",") && normalized.includes(".")) {
    if (normalized.lastIndexOf(",") > normalized.lastIndexOf(".")) {
      const european = normalized.replace(/\./g, "").replace(",", ".");
      const parsedEuropean = Number(european);
      return Number.isFinite(parsedEuropean) ? parsedEuropean : undefined;
    }

    const us = normalized.replace(/,/g, "");
    const parsedUs = Number(us);
    return Number.isFinite(parsedUs) ? parsedUs : undefined;
  }

  const parsed = Number(normalized.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function mergeOrderItems(items: AdminBackofficeOrderItemInput[]) {
  const merged = new Map<string, AdminBackofficeOrderItemInput>();

  for (const item of items) {
    const key = [item.variantId ?? "", item.sku ?? "", item.slug ?? "", item.unitPrice].join("::");
    const existing = merged.get(key);

    if (existing) {
      existing.quantity += item.quantity;
      continue;
    }

    merged.set(key, { ...item });
  }

  return Array.from(merged.values());
}

function sameOrderShape(left: AdminBackofficeOrderInput, right: AdminBackofficeOrderInput) {
  return JSON.stringify({
    customer: left.customer,
    address: left.address,
    initialStatus: left.initialStatus,
    notes: left.notes,
    vendorCode: left.vendorCode
  }) === JSON.stringify({
    customer: right.customer,
    address: right.address,
    initialStatus: right.initialStatus,
    notes: right.notes,
    vendorCode: right.vendorCode
  });
}

function downloadBlob(blob: Blob, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

function downloadBulkOrdersCsvTemplate() {
  const csv = [templateHeaders.join(","), ...templateRows.map((row) => row.map(serializeCsvCell).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, csvFileName);
}

function productKindLabel(productKind?: ProductAdminSummary["productKind"]) {
  return productKind === "bundle" ? "combo virtual" : "producto simple";
}

function formatTemplatePrice(price: number, currencyCode = "PEN") {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0
  }).format(price);
}

type ProductVariantTemplateOption = {
  product: ProductAdminSummary;
  variant: ProductAdminSummary["variants"][number];
};

function buildProductSelectorLabel(option: ProductVariantTemplateOption) {
  const { product, variant } = option;
  return [
    variant.sku,
    product.name,
    variant.name !== product.name ? variant.name : undefined,
    variant.flavorLabel ? `sabor ${variant.flavorLabel}` : undefined,
    variant.presentationLabel ? `presentación ${variant.presentationLabel}` : undefined,
    productKindLabel(product.productKind),
    formatTemplatePrice(variant.price, product.currencyCode)
  ]
    .filter(Boolean)
    .join(" | ");
}

function buildVendorSelectorLabel(vendor: AdminOrderVendorOption) {
  const fragments = [vendor.code, vendor.name];
  if (vendor.city) {
    fragments.push(vendor.city);
  }

  return fragments.join(" | ");
}

async function loadExcelJs() {
  return import("exceljs");
}

function cellValueToText(value: unknown): string {
  if (value == null) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") {
      return value.text;
    }

    if ("result" in value && value.result != null) {
      return String(value.result);
    }

    if ("hyperlink" in value && typeof value.hyperlink === "string" && "text" in value && typeof value.text === "string") {
      return value.text;
    }

    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText
        .map((entry) => (entry && typeof entry === "object" && "text" in entry ? String(entry.text ?? "") : ""))
        .join("");
    }
  }

  return String(value);
}

function worksheetToCsvSource(worksheet: { rowCount: number; actualColumnCount: number; getRow: (rowNumber: number) => { getCell: (columnNumber: number) => { value: unknown } } }) {
  const columnCount = Math.max(worksheet.actualColumnCount, templateHeaders.length);
  const lines: string[] = [];

  for (let rowNumber = 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const values = Array.from({ length: columnCount }, (_, index) => {
      const text = cellValueToText(row.getCell(index + 1).value).trim();
      return serializeCsvCell(text);
    });

    if (!values.some((value) => value.replace(/^"|"$/g, "").trim().length > 0)) {
      continue;
    }

    lines.push(values.join(","));
  }

  return lines.join("\n");
}

async function parseBulkOrdersSpreadsheet(file: File) {
  const ExcelJS = await loadExcelJs();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());

  const worksheet =
    workbook.getWorksheet("Pedidos") ??
    workbook.worksheets.find((sheet) => sheet.state !== "hidden") ??
    workbook.worksheets[0];

  if (!worksheet) {
    throw new Error("No encontramos una hoja válida en el archivo XLSX.");
  }

  return worksheetToCsvSource(worksheet);
}

export async function readBulkOrdersFile(file: File) {
  const lowerName = file.name.toLowerCase();
  const isSpreadsheet =
    lowerName.endsWith(".xlsx") ||
    file.type === xlsxMimeType;

  if (isSpreadsheet) {
    return parseBulkOrdersSpreadsheet(file);
  }

  return file.text();
}

export async function downloadBulkOrdersTemplate(options: BulkOrdersTemplateOptions = {}) {
  const productOptions = (options.products ?? [])
    .filter((product) => product.status === "active" || product.status === "draft")
    .sort((left, right) => left.name.localeCompare(right.name, "es"))
    .flatMap((product) =>
      (product.variants ?? [])
        .filter((variant) => variant.status === "active")
        .map((variant) => ({
          product,
          variant
        }))
    )
    .slice(0, templateProductGuideLimit);
  const vendorOptions = (options.vendors ?? [])
    .filter((vendor) => vendor.status === "active")
    .sort((left, right) => left.name.localeCompare(right.name, "es"))
    .slice(0, templateVendorGuideLimit);
  const departmentOptions = [...(options.peruUbigeo?.departments ?? [])].sort((left, right) => left.name.localeCompare(right.name, "es"));
  const departmentsByCode = new Map(departmentOptions.map((department) => [department.code, department.name] as const));
  const provinceOptions = [...(options.peruUbigeo?.provinces ?? [])].sort((left, right) => {
    const departmentRank = (departmentsByCode.get(left.departmentCode) ?? "").localeCompare(departmentsByCode.get(right.departmentCode) ?? "", "es");
    if (departmentRank !== 0) {
      return departmentRank;
    }

    return left.name.localeCompare(right.name, "es");
  });
  const provincesByCode = new Map(provinceOptions.map((province) => [province.code, province.name] as const));
  const districtOptions = [...(options.peruUbigeo?.districts ?? [])].sort((left, right) => {
    const departmentRank = (departmentsByCode.get(left.departmentCode) ?? "").localeCompare(departmentsByCode.get(right.departmentCode) ?? "", "es");
    if (departmentRank !== 0) {
      return departmentRank;
    }

    const provinceRank = (provincesByCode.get(left.provinceCode) ?? "").localeCompare(provincesByCode.get(right.provinceCode) ?? "", "es");
    if (provinceRank !== 0) {
      return provinceRank;
    }

    return left.name.localeCompare(right.name, "es");
  });
  const departmentLabels = departmentOptions.map(buildDepartmentSelectorLabel);
  const provinceLabels = provinceOptions.map((province) => buildProvinceSelectorLabel(province, departmentsByCode));
  const districtLabels = districtOptions.map((district) => buildDistrictSelectorLabel(district, provincesByCode, departmentsByCode));

  if (!productOptions.length) {
    downloadBulkOrdersCsvTemplate();
    return;
  }

  const ExcelJS = await loadExcelJs();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Huelegood Admin";
  workbook.lastModifiedBy = "Huelegood Admin";
  workbook.created = new Date();
  workbook.modified = new Date();

  const ordersSheet = workbook.addWorksheet("Pedidos");
  const helpSheet = workbook.addWorksheet("Ayuda");
  const productsSheet = workbook.addWorksheet("Catalogo");
  const vendorsSheet = workbook.addWorksheet("Vendedores");
  const ubigeoSheet = workbook.addWorksheet("Ubigeo");
  const listsSheet = workbook.addWorksheet("Listas");

  const sampleDepartment =
    departmentOptions.find((department) => department.name === "Lima") ??
    departmentOptions[0];
  const sampleProvince =
    provinceOptions.find((province) => province.departmentCode === sampleDepartment?.code && province.name === "Lima") ??
    provinceOptions.find((province) => province.departmentCode === sampleDepartment?.code) ??
    provinceOptions[0];
  const sampleDistrictPrimary =
    districtOptions.find((district) => district.provinceCode === sampleProvince?.code && district.name === "Miraflores") ??
    districtOptions.find((district) => district.provinceCode === sampleProvince?.code && district.name === "Lima") ??
    districtOptions.find((district) => district.provinceCode === sampleProvince?.code) ??
    districtOptions[0];
  const sampleDistrictSecondary =
    districtOptions.find((district) => district.provinceCode === sampleProvince?.code && district.name === "San Isidro") ??
    districtOptions.find((district) => district.provinceCode === sampleProvince?.code && district.code !== sampleDistrictPrimary?.code) ??
    sampleDistrictPrimary;

  const sampleDepartmentLabel = sampleDepartment ? buildDepartmentSelectorLabel(sampleDepartment) : "Lima";
  const sampleProvinceLabel = sampleProvince ? buildProvinceSelectorLabel(sampleProvince, departmentsByCode) : "Lima";
  const sampleDistrictPrimaryLabel =
    sampleDistrictPrimary ? buildDistrictSelectorLabel(sampleDistrictPrimary, provincesByCode, departmentsByCode) : "Lima";
  const sampleDistrictSecondaryLabel =
    sampleDistrictSecondary ? buildDistrictSelectorLabel(sampleDistrictSecondary, provincesByCode, departmentsByCode) : sampleDistrictPrimaryLabel;
  const sampleVendorLabel = vendorOptions[0] ? buildVendorSelectorLabel(vendorOptions[0]) : "";
  const sampleProductPrimaryLabel = buildProductSelectorLabel(productOptions[0]!);
  const sampleProductSecondaryLabel = buildProductSelectorLabel(productOptions[1] ?? productOptions[0]!);
  const sampleRows = [
    [
      "WSP-001",
      "Laura",
      "Mendoza",
      "laura@example.com",
      "999111222",
      "Av. Principal 123",
      sampleDepartmentLabel,
      sampleProvinceLabel,
      sampleDistrictPrimaryLabel,
      statusDropdownOptions[1],
      sampleVendorLabel,
      "Pedido por WhatsApp",
      sampleProductPrimaryLabel,
      "2"
    ],
    [
      "WSP-001",
      "Laura",
      "Mendoza",
      "laura@example.com",
      "999111222",
      "Av. Principal 123",
      sampleDepartmentLabel,
      sampleProvinceLabel,
      sampleDistrictPrimaryLabel,
      statusDropdownOptions[1],
      sampleVendorLabel,
      "Pedido por WhatsApp",
      sampleProductSecondaryLabel,
      "1"
    ],
    [
      "WSP-002",
      "Carlos",
      "Rojas",
      "",
      "999333444",
      "Jr. Comercio 456",
      sampleDepartmentLabel,
      sampleProvinceLabel,
      sampleDistrictSecondaryLabel,
      statusDropdownOptions[0],
      "",
      "Pendiente de transferencia",
      sampleProductPrimaryLabel,
      "1"
    ]
  ];

  ordersSheet.columns = [
    { header: "pedido_ref", key: "pedido_ref", width: 18 },
    { header: "cliente_nombre", key: "cliente_nombre", width: 18 },
    { header: "cliente_apellido", key: "cliente_apellido", width: 18 },
    { header: "cliente_email", key: "cliente_email", width: 24 },
    { header: "cliente_telefono", key: "cliente_telefono", width: 18 },
    { header: "direccion_1", key: "direccion_1", width: 26 },
    { header: "departamento", key: "departamento", width: 24 },
    { header: "provincia", key: "provincia", width: 28 },
    { header: "distrito", key: "distrito", width: 34 },
    { header: "estado_pago", key: "estado_pago", width: 24 },
    { header: "vendedor_codigo", key: "vendedor_codigo", width: 32 },
    { header: "notas", key: "notas", width: 28 },
    { header: "producto_sku", key: "producto_sku", width: 42 },
    { header: "cantidad", key: "cantidad", width: 12 }
  ];

  sampleRows.forEach((row) => {
    ordersSheet.addRow(row);
  });

  ordersSheet.views = [{ state: "frozen", ySplit: 1 }];
  ordersSheet.autoFilter = {
    from: "A1",
    to: "N1"
  };

  ordersSheet.getRow(1).font = { bold: true };
  ordersSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE7EFE8" }
  };

  helpSheet.columns = [
    { header: "columna", key: "columna", width: 20 },
    { header: "como_usarla", key: "como_usarla", width: 42 },
    { header: "nota_operativa", key: "nota_operativa", width: 52 }
  ];
  helpSheet.addRows([
    ["pedido_ref", "Identificador del pedido", "Repite el mismo pedido_ref si el pedido tiene varias lineas/productos."],
    ["estado_pago", "Usa el combo desplegable", "pending_payment crea el pedido pendiente; paid lo registra ya cobrado."],
    ["vendedor_codigo", "Usa el combo desplegable o deja vacio", "La lista trae vendedores activos con codigo y nombre para seleccion rapida."],
    ["producto_sku", "Usa el combo desplegable del catalogo", "Cada opcion representa una variante fisica vendible: sabor/presentacion + SKU. El importador toma ese SKU y resuelve el precio actual."],
    ["cantidad", "Numero entero mayor a cero", "Una fila = una linea del pedido."],
    ["departamento / provincia / distrito", "Usa los combos desplegables", "La plantilla guarda codigo y nombre en el selector. El importador toma el ubigeo correcto sin que lo escribas a mano."],
    ["precio_unitario (opcional)", "No viene en la plantilla", "Si algun caso excepcional requiere precio manual, puedes agregar esa columna en un CSV legado. Si no la envias, el sistema usa el precio del catalogo activo."]
  ]);
  helpSheet.views = [{ state: "frozen", ySplit: 1 }];
  helpSheet.getRow(1).font = { bold: true };

  productsSheet.columns = [
    { header: "selector", key: "selector", width: 42 },
    { header: "sku", key: "sku", width: 18 },
    { header: "nombre", key: "nombre", width: 26 },
    { header: "variante", key: "variante", width: 26 },
    { header: "sabor", key: "sabor", width: 18 },
    { header: "presentacion", key: "presentacion", width: 18 },
    { header: "tipo", key: "tipo", width: 18 },
    { header: "precio_sugerido", key: "precio_sugerido", width: 16 },
    { header: "variant_id", key: "variant_id", width: 22 },
    { header: "estado", key: "estado", width: 12 },
    { header: "categoria", key: "categoria", width: 18 }
  ];
  productOptions.forEach((option) => {
    productsSheet.addRow([
      buildProductSelectorLabel(option),
      option.variant.sku,
      option.product.name,
      option.variant.name,
      option.variant.flavorLabel ?? "",
      option.variant.presentationLabel ?? "",
      productKindLabel(option.product.productKind),
      option.variant.price,
      option.variant.id,
      option.variant.status,
      option.product.categoryName ?? ""
    ]);
  });
  productsSheet.views = [{ state: "frozen", ySplit: 1 }];
  productsSheet.getRow(1).font = { bold: true };

  vendorsSheet.columns = [
    { header: "selector", key: "selector", width: 32 },
    { header: "codigo", key: "codigo", width: 18 },
    { header: "nombre", key: "nombre", width: 24 },
    { header: "ciudad", key: "ciudad", width: 18 },
    { header: "estado", key: "estado", width: 12 }
  ];
  vendorOptions.forEach((vendor) => {
    vendorsSheet.addRow([
      buildVendorSelectorLabel(vendor),
      vendor.code,
      vendor.name,
      vendor.city ?? "",
      vendor.status
    ]);
  });
  vendorsSheet.views = [{ state: "frozen", ySplit: 1 }];
  vendorsSheet.getRow(1).font = { bold: true };

  ubigeoSheet.columns = [
    { header: "nivel", key: "nivel", width: 14 },
    { header: "selector", key: "selector", width: 40 },
    { header: "codigo", key: "codigo", width: 14 },
    { header: "nombre", key: "nombre", width: 22 },
    { header: "referencia", key: "referencia", width: 28 }
  ];
  departmentOptions.forEach((department) => {
    ubigeoSheet.addRow([
      "departamento",
      buildDepartmentSelectorLabel(department),
      department.code,
      department.name,
      "Perú"
    ]);
  });
  provinceOptions.forEach((province) => {
    ubigeoSheet.addRow([
      "provincia",
      buildProvinceSelectorLabel(province, departmentsByCode),
      province.code,
      province.name,
      departmentsByCode.get(province.departmentCode) ?? province.departmentCode
    ]);
  });
  districtOptions.forEach((district) => {
    ubigeoSheet.addRow([
      "distrito",
      buildDistrictSelectorLabel(district, provincesByCode, departmentsByCode),
      district.code,
      district.name,
      [
        provincesByCode.get(district.provinceCode) ?? district.provinceCode,
        departmentsByCode.get(district.departmentCode) ?? district.departmentCode
      ].join(" / ")
    ]);
  });
  ubigeoSheet.views = [{ state: "frozen", ySplit: 1 }];
  ubigeoSheet.getRow(1).font = { bold: true };

  listsSheet.getColumn(1).values = ["estado_pago", ...statusDropdownOptions];
  listsSheet.getColumn(3).values = ["vendedor_codigo", ...vendorOptions.map(buildVendorSelectorLabel)];
  listsSheet.getColumn(5).values = ["producto_sku", ...productOptions.map(buildProductSelectorLabel)];
  listsSheet.getColumn(7).values = ["departamento", ...departmentLabels];
  listsSheet.getColumn(9).values = ["provincia", ...provinceLabels];
  listsSheet.getColumn(11).values = ["distrito", ...districtLabels];
  listsSheet.state = "hidden";

  for (let rowNumber = 2; rowNumber <= 250; rowNumber += 1) {
    if (departmentLabels.length > 0) {
      ordersSheet.getCell(`G${rowNumber}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`'Listas'!$G$2:$G$${departmentLabels.length + 1}`],
        showErrorMessage: true,
        errorTitle: "Departamento inválido",
        error: "Selecciona un departamento de la lista sugerida."
      };
    }

    if (provinceLabels.length > 0) {
      ordersSheet.getCell(`H${rowNumber}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`'Listas'!$I$2:$I$${provinceLabels.length + 1}`],
        showErrorMessage: true,
        errorTitle: "Provincia inválida",
        error: "Selecciona una provincia de la lista sugerida."
      };
    }

    if (districtLabels.length > 0) {
      ordersSheet.getCell(`I${rowNumber}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`'Listas'!$K$2:$K$${districtLabels.length + 1}`],
        showErrorMessage: true,
        errorTitle: "Distrito inválido",
        error: "Selecciona un distrito de la lista sugerida."
      };
    }

    ordersSheet.getCell(`J${rowNumber}`).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: [`'Listas'!$A$2:$A$${statusDropdownOptions.length + 1}`],
      showErrorMessage: true,
      errorTitle: "Estado inválido",
      error: "Selecciona un estado de pago permitido."
    };

    ordersSheet.getCell(`K${rowNumber}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`'Listas'!$C$2:$C$${Math.max(vendorOptions.length + 1, 2)}`],
      showErrorMessage: true,
      errorTitle: "Vendedor inválido",
      error: "Selecciona un vendedor de la lista o deja la celda vacía."
    };

    ordersSheet.getCell(`M${rowNumber}`).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: [`'Listas'!$E$2:$E$${Math.max(productOptions.length + 1, 2)}`],
      showErrorMessage: true,
      errorTitle: "Producto inválido",
      error: "Selecciona un producto del catálogo sugerido."
    };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: xlsxMimeType });
  downloadBlob(blob, xlsxFileName);
}

export function parseBulkOrdersInput(source: string): ParsedBulkOrderBatch {
  const normalizedSource = source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const lines = normalizedSource.split("\n").filter((line) => line.trim().length > 0);

  if (!lines.length) {
    return {
      delimiter: ",",
      headers: [],
      rowCount: 0,
      itemCount: 0,
      orders: [],
      issues: []
    };
  }

  const delimiter = detectDelimiter(lines[0] ?? ",");
  const headers = splitDelimitedLine(lines[0] ?? "", delimiter).map((cell) => cell.trim());
  const canonicalHeaders = headers.map((header) => {
    const normalized = normalizeHeader(header);
    return (Object.entries(headerAliases).find(([, aliases]) => aliases.includes(normalized))?.[0] ?? null) as CanonicalField | null;
  });

  const issues: BulkOrderImportIssue[] = [];
  const recognizedColumns = canonicalHeaders.filter(Boolean).length;
  if (recognizedColumns === 0) {
    issues.push({
      row: 1,
      message: "No reconocimos los encabezados del archivo. Usa la plantilla sugerida."
    });
  }

  const groupedOrders = new Map<string, AdminBackofficeOrderInput>();
  const invalidReferences = new Set<string>();

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const rowNumber = lineIndex + 1;
    const cells = splitDelimitedLine(lines[lineIndex] ?? "", delimiter);
    const row = new Map<CanonicalField, string>();

    canonicalHeaders.forEach((field, columnIndex) => {
      if (!field) {
        return;
      }

      row.set(field, cells[columnIndex] ?? "");
    });

    const clientReference = normalizeText(row.get("orderRef")) ?? `fila-${rowNumber}`;
    const firstName = normalizeText(row.get("firstName"));
    const quantity = parseInteger(row.get("quantity"));
    const unitPriceRaw = normalizeText(row.get("unitPrice"));
    const unitPrice = parseCurrency(row.get("unitPrice"));
    const initialStatus = parseStatus(row.get("initialStatus"));
    const sku = extractSelectableCode(row.get("sku"));
    const variantId = extractSelectableCode(row.get("variantId"));
    const departmentFromCode = parseLocationSelection(row.get("departmentCode"), "department");
    const departmentFromName = parseLocationSelection(row.get("departmentName"), "department");
    const provinceFromCode = parseLocationSelection(row.get("provinceCode"), "province");
    const provinceFromName = parseLocationSelection(row.get("provinceName"), "province");
    const districtFromCode = parseLocationSelection(row.get("districtCode"), "district");
    const districtFromName = parseLocationSelection(row.get("districtName"), "district");
    const departmentCode = departmentFromCode.code ?? departmentFromName.code;
    const departmentName = departmentFromName.name ?? departmentFromCode.name;
    const provinceCode = provinceFromCode.code ?? provinceFromName.code;
    const provinceName = provinceFromName.name ?? provinceFromCode.name;
    const districtCode = districtFromCode.code ?? districtFromName.code;
    const districtName = districtFromName.name ?? districtFromCode.name;
    const city = normalizeText(row.get("city"));
    const hasUbigeo = Boolean(
      departmentCode || departmentName || provinceCode || provinceName || districtCode || districtName
    );

    const rowIssues: string[] = [];

    if (!firstName) {
      rowIssues.push("El nombre del cliente es obligatorio.");
    }

    if (!normalizeText(row.get("line1"))) {
      rowIssues.push("La direccion principal es obligatoria.");
    }

    if (!sku && !variantId) {
      rowIssues.push("Cada linea debe incluir producto_sku o variant_id.");
    }

    if (!quantity || quantity <= 0) {
      rowIssues.push("La cantidad debe ser un entero mayor a cero.");
    }

    if (unitPriceRaw && (unitPrice === undefined || unitPrice < 0)) {
      rowIssues.push("El precio unitario debe ser un numero valido mayor o igual a cero.");
    }

    if (!initialStatus) {
      rowIssues.push("El estado de pago debe ser paid o pending_payment.");
    }

    if (hasUbigeo) {
      const hasDepartment = Boolean(departmentCode || departmentName);
      const hasProvince = Boolean(provinceCode || provinceName);
      const hasDistrict = Boolean(districtCode || districtName);

      if (!hasDepartment || !hasProvince || !hasDistrict) {
        rowIssues.push("Si usas ubigeo, completa departamento, provincia y distrito.");
      }
    } else if (!city) {
      rowIssues.push("Indica ciudad o completa departamento, provincia y distrito.");
    }

    if (rowIssues.length > 0) {
      invalidReferences.add(clientReference);
      rowIssues.forEach((message) => issues.push({ row: rowNumber, clientReference, message }));
      continue;
    }

    const order: AdminBackofficeOrderInput = {
      clientReference,
      customer: {
        firstName: firstName ?? "",
        lastName: normalizeText(row.get("lastName")) ?? "",
        email: normalizeText(row.get("email")) ?? "",
        phone: normalizeText(row.get("phone")) ?? ""
      },
      address: {
        line1: normalizeText(row.get("line1")) ?? "",
        line2: normalizeText(row.get("line2")),
        city,
        region: normalizeText(row.get("region")),
        countryCode: normalizeText(row.get("countryCode")) ?? "PE",
        departmentCode,
        departmentName,
        provinceCode,
        provinceName,
        districtCode,
        districtName
      },
      items: [
        {
          sku,
          variantId,
          slug: normalizeText(row.get("slug")),
          name: normalizeText(row.get("name")),
          quantity: quantity ?? 0,
          ...(unitPrice !== undefined ? { unitPrice } : {})
        }
      ],
      initialStatus: initialStatus ?? "pending_payment",
      notes: normalizeText(row.get("notes")),
      vendorCode: extractSelectableCode(row.get("vendorCode"))
    };

    const existingOrder = groupedOrders.get(clientReference);
    if (!existingOrder) {
      groupedOrders.set(clientReference, order);
      continue;
    }

    if (!sameOrderShape(existingOrder, order)) {
      invalidReferences.add(clientReference);
      issues.push({
        row: rowNumber,
        clientReference,
        message: "Las filas del mismo pedido_ref deben compartir cliente, destino, pago, vendedor y notas."
      });
      continue;
    }

    existingOrder.items.push(order.items[0]!);
  }

  const orders = Array.from(groupedOrders.values())
    .filter((order) => !invalidReferences.has(order.clientReference ?? ""))
    .map((order) => ({
      ...order,
      items: mergeOrderItems(order.items)
    }));
  const itemCount = orders.reduce((total, order) => total + order.items.length, 0);

  return {
    delimiter,
    headers,
    rowCount: Math.max(lines.length - 1, 0),
    itemCount,
    orders,
    issues
  };
}
