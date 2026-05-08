import type { AdminBackofficeOrderInput, AdminBackofficeOrderItemInput } from "@huelegood/shared";

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
  initialStatus: ["estado_pago", "initial_status", "payment_status", "estado"],
  vendorCode: ["vendedor_codigo", "vendor_code", "seller_code"],
  notes: ["notas", "notes", "observaciones"],
  sku: ["producto_sku", "sku"],
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
  "cantidad",
  "precio_unitario"
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
    "2",
    "60"
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
    "1",
    "55"
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
    "1",
    "60"
  ]
] as const;

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
  const normalized = normalizeHeader(value ?? "");
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

export function downloadBulkOrdersTemplate() {
  const csv = [templateHeaders.join(","), ...templateRows.map((row) => row.map(serializeCsvCell).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = "pedidos-masivos-template.csv";
  anchor.click();
  URL.revokeObjectURL(anchor.href);
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
    const unitPrice = parseCurrency(row.get("unitPrice"));
    const initialStatus = parseStatus(row.get("initialStatus"));
    const sku = normalizeText(row.get("sku"));
    const variantId = normalizeText(row.get("variantId"));
    const departmentCode = normalizeText(row.get("departmentCode"));
    const departmentName = normalizeText(row.get("departmentName"));
    const provinceCode = normalizeText(row.get("provinceCode"));
    const provinceName = normalizeText(row.get("provinceName"));
    const districtCode = normalizeText(row.get("districtCode"));
    const districtName = normalizeText(row.get("districtName"));
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

    if (unitPrice === undefined || unitPrice < 0) {
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
          unitPrice: unitPrice ?? 0
        }
      ],
      initialStatus: initialStatus ?? "pending_payment",
      notes: normalizeText(row.get("notes")),
      vendorCode: normalizeText(row.get("vendorCode"))
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
