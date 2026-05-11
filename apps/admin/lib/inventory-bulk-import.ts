import type {
  InventoryReportRow,
  InventoryStockBulkLineInput,
  InventoryStockOperationMode,
  WarehouseSummary
} from "@huelegood/shared";

export interface InventoryBulkImportIssue {
  row: number;
  warehouseCode?: string;
  sku?: string;
  message: string;
}

export interface ParsedInventoryBulkBatch {
  delimiter: string;
  headers: string[];
  rowCount: number;
  lines: InventoryStockBulkLineInput[];
  issues: InventoryBulkImportIssue[];
}

export interface InventoryBulkTemplateOptions {
  rows?: InventoryReportRow[];
  warehouses?: WarehouseSummary[];
  mode: InventoryStockOperationMode;
}

type CanonicalField =
  | "warehouseCode"
  | "warehouseId"
  | "sku"
  | "variantId"
  | "quantity"
  | "reason";

const headerAliases: Record<CanonicalField, string[]> = {
  warehouseCode: ["almacen_codigo", "warehouse_code", "almacen", "warehouse", "warehouse_selector"],
  warehouseId: ["warehouse_id", "almacen_id"],
  sku: ["producto_sku", "sku", "producto_selector", "variant_selector"],
  variantId: ["variant_id", "producto_variant_id", "variantid"],
  quantity: ["cantidad", "qty", "quantity", "stock", "stock_final", "conteo", "unidades", "ingreso"],
  reason: ["motivo", "reason", "nota", "observacion", "observaciones"]
};

const csvMimeType = "text/csv;charset=utf-8";
const xlsxMimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function normalizeText(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function detectDelimiter(headerLine: string) {
  const commaCount = (headerLine.match(/,/g) ?? []).length;
  const tabCount = (headerLine.match(/\t/g) ?? []).length;
  return tabCount > commaCount ? "\t" : ",";
}

function splitDelimitedLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === "\"") {
      if (quoted && line[index + 1] === "\"") {
        current += "\"";
        index += 1;
        continue;
      }

      quoted = !quoted;
      continue;
    }

    if (!quoted && char === delimiter) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells;
}

function serializeCsvCell(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }

  return value;
}

function selectorSegments(value?: string) {
  return (value ?? "")
    .split("|")
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function extractSelectableCode(value?: string) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return undefined;
  }

  return selectorSegments(normalized)[0] ?? normalized;
}

function formatModeLabel(mode: InventoryStockOperationMode) {
  return mode === "stock_receipt" ? "ingreso" : "conteo";
}

type VariantOption = {
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  flavorLabel?: string;
  presentationLabel?: string;
};

function buildVariantOptions(rows: InventoryReportRow[]) {
  const variants = new Map<string, VariantOption>();

  for (const row of rows) {
    if (variants.has(row.variantId)) {
      continue;
    }

    variants.set(row.variantId, {
      variantId: row.variantId,
      sku: row.sku,
      productName: row.productName,
      variantName: row.variantName,
      flavorLabel: row.flavorLabel,
      presentationLabel: row.presentationLabel
    });
  }

  return [...variants.values()].sort((left, right) => left.productName.localeCompare(right.productName, "es") || left.sku.localeCompare(right.sku, "es"));
}

function buildWarehouseOptions(warehouses: WarehouseSummary[]) {
  return warehouses
    .filter((warehouse) => warehouse.status === "active")
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name, "es"));
}

function buildVariantSelectorLabel(option: VariantOption) {
  const fragments = [option.sku, option.productName];
  if (option.variantName && option.variantName !== option.productName) {
    fragments.push(option.variantName);
  }
  if (option.flavorLabel) {
    fragments.push(`Sabor ${option.flavorLabel}`);
  }
  if (option.presentationLabel) {
    fragments.push(`Presentación ${option.presentationLabel}`);
  }

  return fragments.join(" | ");
}

function buildWarehouseSelectorLabel(warehouse: WarehouseSummary) {
  return [warehouse.code, warehouse.name].filter(Boolean).join(" | ");
}

function downloadBlob(blob: Blob, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
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

function worksheetToCsvSource(worksheet: { eachRow: (callback: (row: { eachCell: (cellCallback: (cell: { value: unknown }) => void) => void }) => void) => void }) {
  const lines: string[] = [];

  worksheet.eachRow((row) => {
    const cells: string[] = [];
    row.eachCell((cell) => {
      cells.push(serializeCsvCell(cellValueToText(cell.value)));
    });
    lines.push(cells.join(","));
  });

  return lines.join("\n");
}

async function parseInventorySpreadsheet(file: File) {
  const ExcelJS = await loadExcelJs();
  const workbook = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets.find((sheet) => sheet.actualRowCount > 0);

  if (!worksheet) {
    throw new Error("No encontramos una hoja válida en el archivo XLSX.");
  }

  return worksheetToCsvSource(worksheet);
}

export async function readInventoryBulkFile(file: File) {
  const lowerName = file.name.toLowerCase();
  const isSpreadsheet = lowerName.endsWith(".xlsx") || file.type === xlsxMimeType;

  if (isSpreadsheet) {
    return parseInventorySpreadsheet(file);
  }

  return file.text();
}

function downloadInventoryCsvTemplate(mode: InventoryStockOperationMode) {
  const headers = ["almacen_codigo", "producto_sku", "cantidad", "motivo"];
  const sampleRow =
    mode === "stock_receipt"
      ? ["WH-LIMA-CENTRAL", "HG-PN-001", "24", "Ingreso recibido de proveedor"]
      : ["WH-LIMA-CENTRAL", "HG-PN-001", "20", "Conteo físico mayo"];
  const csv = [headers.join(","), sampleRow.map(serializeCsvCell).join(",")].join("\n");
  const blob = new Blob([csv], { type: csvMimeType });
  downloadBlob(blob, `inventario-${formatModeLabel(mode)}-template.csv`);
}

export async function downloadInventoryBulkTemplate(options: InventoryBulkTemplateOptions) {
  const variantOptions = buildVariantOptions(options.rows ?? []);
  const warehouseOptions = buildWarehouseOptions(options.warehouses ?? []);
  const mode = options.mode;

  if (!variantOptions.length || !warehouseOptions.length) {
    downloadInventoryCsvTemplate(mode);
    return;
  }

  const ExcelJS = await loadExcelJs();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Huelegood Admin";
  workbook.lastModifiedBy = "Huelegood Admin";
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheet = workbook.addWorksheet("Inventario");
  const helpSheet = workbook.addWorksheet("Ayuda");
  const variantsSheet = workbook.addWorksheet("Variantes");
  const warehousesSheet = workbook.addWorksheet("Almacenes");
  const listsSheet = workbook.addWorksheet("Listas");

  const sampleWarehouse = warehouseOptions[0]!;
  const sampleVariantPrimary = variantOptions[0]!;
  const sampleVariantSecondary = variantOptions[1] ?? variantOptions[0]!;

  sheet.columns = [
    { header: "almacen_codigo", key: "almacen_codigo", width: 34 },
    { header: "producto_sku", key: "producto_sku", width: 56 },
    { header: "cantidad", key: "cantidad", width: 14 },
    { header: "motivo", key: "motivo", width: 36 }
  ];

  sheet.addRow([
    buildWarehouseSelectorLabel(sampleWarehouse),
    buildVariantSelectorLabel(sampleVariantPrimary),
    mode === "stock_receipt" ? "24" : "20",
    mode === "stock_receipt" ? "Ingreso recibido de proveedor" : "Conteo físico mayo"
  ]);
  sheet.addRow([
    buildWarehouseSelectorLabel(sampleWarehouse),
    buildVariantSelectorLabel(sampleVariantSecondary),
    mode === "stock_receipt" ? "12" : "30",
    mode === "stock_receipt" ? "Reposición parcial" : "Conteo físico mayo"
  ]);
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = { from: "A1", to: "D1" };
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE7EFE8" }
  };

  helpSheet.columns = [
    { header: "campo", key: "campo", width: 22 },
    { header: "como_usarlo", key: "como_usarlo", width: 42 },
    { header: "nota_operativa", key: "nota_operativa", width: 54 }
  ];
  helpSheet.addRows([
    ["almacen_codigo", "Usa el combo desplegable", "Cada fila debe cerrar sabor/presentación y almacén exacto."],
    ["producto_sku", "Usa el combo desplegable", "Cada opción ya representa una variante física vendible: sabor y/o presentación."],
    [
      "cantidad",
      mode === "stock_receipt" ? "Unidades que ingresan" : "Stock final contado",
      mode === "stock_receipt"
        ? "No pongas el total acumulado; solo las unidades nuevas que acabas de recibir."
        : "Este valor reemplaza el stock físico actual del almacén para esa variante."
    ],
    ["motivo", "Opcional por fila", "Si lo dejas vacío, el sistema usa el motivo general del lote."]
  ]);
  helpSheet.views = [{ state: "frozen", ySplit: 1 }];
  helpSheet.getRow(1).font = { bold: true };

  variantsSheet.columns = [
    { header: "selector", key: "selector", width: 56 },
    { header: "sku", key: "sku", width: 18 },
    { header: "producto", key: "producto", width: 26 },
    { header: "variante", key: "variante", width: 26 },
    { header: "sabor", key: "sabor", width: 18 },
    { header: "presentacion", key: "presentacion", width: 18 },
    { header: "variant_id", key: "variant_id", width: 22 }
  ];
  variantOptions.forEach((variant) => {
    variantsSheet.addRow([
      buildVariantSelectorLabel(variant),
      variant.sku,
      variant.productName,
      variant.variantName,
      variant.flavorLabel ?? "",
      variant.presentationLabel ?? "",
      variant.variantId
    ]);
  });
  variantsSheet.views = [{ state: "frozen", ySplit: 1 }];
  variantsSheet.getRow(1).font = { bold: true };

  warehousesSheet.columns = [
    { header: "selector", key: "selector", width: 34 },
    { header: "codigo", key: "codigo", width: 18 },
    { header: "nombre", key: "nombre", width: 24 }
  ];
  warehouseOptions.forEach((warehouse) => {
    warehousesSheet.addRow([
      buildWarehouseSelectorLabel(warehouse),
      warehouse.code,
      warehouse.name
    ]);
  });
  warehousesSheet.views = [{ state: "frozen", ySplit: 1 }];
  warehousesSheet.getRow(1).font = { bold: true };

  listsSheet.getColumn(1).values = ["almacen_codigo", ...warehouseOptions.map(buildWarehouseSelectorLabel)];
  listsSheet.getColumn(3).values = ["producto_sku", ...variantOptions.map(buildVariantSelectorLabel)];
  listsSheet.state = "hidden";

  for (let rowNumber = 2; rowNumber <= 300; rowNumber += 1) {
    sheet.getCell(`A${rowNumber}`).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: [`'Listas'!$A$2:$A$${warehouseOptions.length + 1}`],
      showErrorMessage: true,
      errorTitle: "Almacén inválido",
      error: "Selecciona un almacén de la lista sugerida."
    };
    sheet.getCell(`B${rowNumber}`).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: [`'Listas'!$C$2:$C$${variantOptions.length + 1}`],
      showErrorMessage: true,
      errorTitle: "Variante inválida",
      error: "Selecciona un SKU/variante física de la lista sugerida."
    };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: xlsxMimeType });
  downloadBlob(blob, `inventario-${formatModeLabel(mode)}-template.xlsx`);
}

export function parseInventoryBulkInput(source: string): ParsedInventoryBulkBatch {
  const normalizedSource = source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const lines = normalizedSource.split("\n").filter((line) => line.trim().length > 0);

  if (!lines.length) {
    return {
      delimiter: ",",
      headers: [],
      rowCount: 0,
      lines: [],
      issues: []
    };
  }

  const delimiter = detectDelimiter(lines[0] ?? ",");
  const headers = splitDelimitedLine(lines[0] ?? "", delimiter).map((cell) => cell.trim());
  const canonicalHeaders = headers.map((header) => {
    const normalized = normalizeHeader(header);
    return (Object.entries(headerAliases).find(([, aliases]) => aliases.includes(normalized))?.[0] ?? null) as CanonicalField | null;
  });

  const issues: InventoryBulkImportIssue[] = [];
  const recognizedColumns = canonicalHeaders.filter(Boolean).length;
  if (recognizedColumns === 0) {
    issues.push({
      row: 1,
      message: "No reconocimos los encabezados del archivo. Usa la plantilla sugerida."
    });
  }

  const parsedLines: InventoryStockBulkLineInput[] = [];

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

    const warehouseCode = extractSelectableCode(row.get("warehouseCode"));
    const warehouseId = extractSelectableCode(row.get("warehouseId"));
    const sku = extractSelectableCode(row.get("sku"));
    const variantId = extractSelectableCode(row.get("variantId"));
    const quantity = Math.trunc(Number(row.get("quantity") ?? ""));
    const reason = normalizeText(row.get("reason"));
    const rowIssues: string[] = [];

    if (!warehouseCode && !warehouseId) {
      rowIssues.push("Cada línea debe incluir almacen_codigo o warehouse_id.");
    }

    if (!sku && !variantId) {
      rowIssues.push("Cada línea debe incluir producto_sku o variant_id.");
    }

    if (!Number.isFinite(quantity) || quantity < 0) {
      rowIssues.push("La cantidad debe ser un entero mayor o igual a cero.");
    }

    if (rowIssues.length > 0) {
      rowIssues.forEach((message) =>
        issues.push({
          row: rowNumber,
          warehouseCode,
          sku,
          message
        })
      );
      continue;
    }

    parsedLines.push({
      warehouseCode,
      warehouseId,
      sku,
      variantId,
      quantity,
      reason
    });
  }

  return {
    delimiter,
    headers,
    rowCount: Math.max(lines.length - 1, 0),
    lines: parsedLines,
    issues
  };
}
