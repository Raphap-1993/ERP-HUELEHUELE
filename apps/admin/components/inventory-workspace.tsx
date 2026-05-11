"use client";

import { Fragment, useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  SectionHeader,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea
} from "@huelegood/ui";
import type { InventoryReportRow, InventoryReportSummary, InventoryStockOperationMode, WarehouseSummary } from "@huelegood/shared";
import { adjustInventoryStock, adjustInventoryStockBulk, fetchAdminWarehouses, fetchInventoryReport } from "../lib/api";
import { downloadInventoryBulkTemplate, parseInventoryBulkInput, readInventoryBulkFile } from "../lib/inventory-bulk-import";

type InventoryFilter = "all" | "negative" | "low" | "reserved";

type InventoryGroupSummary = {
  stockOnHand: number;
  reservedQuantity: number;
  committedQuantity: number;
  availableStock: number;
};

type InventoryProductGroup = {
  key: string;
  anchor: InventoryReportRow;
  rows: InventoryReportRow[];
};

type VisibleInventoryProductGroup = InventoryProductGroup & {
  scopedRows: InventoryReportRow[];
  detailRows: InventoryReportRow[];
  summary: InventoryGroupSummary;
};

type InventoryAlertGroup = InventoryProductGroup & {
  alertRows: InventoryReportRow[];
  summary: InventoryGroupSummary;
  negativeCount: number;
  lowCount: number;
};

type WarehouseAssignmentState = {
  group: InventoryProductGroup;
  warehouseId: string;
  stockOnHand: string;
  reason: string;
};

type BulkInventoryResult = Awaited<ReturnType<typeof adjustInventoryStockBulk>>;

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-PE", {
    maximumFractionDigits: 0
  }).format(value);
}

function formatDateTime(value?: string) {
  if (!value) {
    return "Sin dato";
  }

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatChannelLabel(value: InventoryReportRow["salesChannel"]) {
  const labels: Record<InventoryReportRow["salesChannel"], string> = {
    public: "Público",
    internal: "Interno"
  };

  return labels[value] ?? value;
}

function warehouseLabel(row: InventoryReportRow) {
  return row.warehouseName ?? row.warehouseCode ?? "Sin almacén operativo";
}

function productInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function ProductThumbnail({ row }: { row: InventoryReportRow }) {
  if (row.productImageUrl) {
    return (
      <img
        src={row.productImageUrl}
        alt={row.productImageAlt ?? row.productName}
        loading="lazy"
        className="h-14 w-14 rounded-2xl border border-black/8 bg-white object-cover"
      />
    );
  }

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-black/8 bg-[#eef7e7] text-sm font-semibold text-[#2f6f2f]">
      {productInitials(row.productName)}
    </div>
  );
}

function rowKey(row: InventoryReportRow) {
  return `${row.variantId}:${row.warehouseId}`;
}

function productGroupKey(row: InventoryReportRow) {
  return row.variantId;
}

function rowMatchesStatus(row: InventoryReportRow, statusFilter: InventoryFilter) {
  if (statusFilter === "negative") {
    return row.availableStock < 0;
  }

  if (statusFilter === "low") {
    return row.lowStock && row.availableStock >= 0;
  }

  if (statusFilter === "reserved") {
    return row.reservedQuantity > 0 || row.committedQuantity > 0;
  }

  return true;
}

function productSearchText(group: InventoryProductGroup) {
  return [
    group.anchor.productName,
    group.anchor.reportingGroup,
    group.anchor.variantName,
    group.anchor.sku,
    formatChannelLabel(group.anchor.salesChannel)
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function warehouseSearchText(row: InventoryReportRow) {
  return [warehouseLabel(row), row.warehouseCode].filter(Boolean).join(" ").toLowerCase();
}

function sortWarehouseRows(rows: InventoryReportRow[]) {
  return [...rows].sort((left, right) => {
    if (left.isDefaultWarehouse !== right.isDefaultWarehouse) {
      return left.isDefaultWarehouse ? -1 : 1;
    }

    const leftNegative = left.availableStock < 0;
    const rightNegative = right.availableStock < 0;
    if (leftNegative !== rightNegative) {
      return leftNegative ? -1 : 1;
    }

    if (left.lowStock !== right.lowStock) {
      return left.lowStock ? -1 : 1;
    }

    return warehouseLabel(left).localeCompare(warehouseLabel(right));
  });
}

function assignmentFallbackReason(warehouse?: WarehouseSummary) {
  return warehouse ? `Alta inicial en ${warehouse.name}` : "Alta inicial en almacén";
}

function buildInventoryGroups(rows: InventoryReportRow[]) {
  const groups = new Map<string, InventoryProductGroup>();

  for (const row of rows) {
    const key = productGroupKey(row);
    const current = groups.get(key);

    if (current) {
      current.rows.push(row);
      continue;
    }

    groups.set(key, {
      key,
      anchor: row,
      rows: [row]
    });
  }

  return [...groups.values()].map((group) => ({
    ...group,
    rows: sortWarehouseRows(group.rows)
  }));
}

function summarizeInventoryRows(
  rows: InventoryReportRow[],
  anchor: InventoryReportRow,
  useVariantAggregate: boolean
): InventoryGroupSummary {
  if (useVariantAggregate) {
    return {
      stockOnHand: anchor.variantStockOnHand,
      reservedQuantity: anchor.variantReservedQuantity,
      committedQuantity: anchor.variantCommittedQuantity,
      availableStock: anchor.variantAvailableStock
    };
  }

  return rows.reduce<InventoryGroupSummary>(
    (summary, row) => ({
      stockOnHand: summary.stockOnHand + row.stockOnHand,
      reservedQuantity: summary.reservedQuantity + row.reservedQuantity,
      committedQuantity: summary.committedQuantity + row.committedQuantity,
      availableStock: summary.availableStock + row.availableStock
    }),
    {
      stockOnHand: 0,
      reservedQuantity: 0,
      committedQuantity: 0,
      availableStock: 0
    }
  );
}

function groupInventoryStatus(group: VisibleInventoryProductGroup) {
  if (group.scopedRows.some((row) => row.availableStock < 0)) {
    return {
      tone: "danger" as const,
      label: "Revisar almacén"
    };
  }

  if (group.scopedRows.some((row) => row.lowStock)) {
    return {
      tone: "warning" as const,
      label: "Bajo mínimo"
    };
  }

  if (group.scopedRows.some((row) => row.reservedQuantity > 0 || row.committedQuantity > 0)) {
    return {
      tone: "info" as const,
      label: "Con movimiento"
    };
  }

  return {
    tone: "success" as const,
    label: "OK"
  };
}

function sortInventoryGroups(groups: VisibleInventoryProductGroup[]) {
  return [...groups].sort((left, right) => {
    const leftNegative = left.scopedRows.some((row) => row.availableStock < 0);
    const rightNegative = right.scopedRows.some((row) => row.availableStock < 0);
    if (leftNegative !== rightNegative) {
      return leftNegative ? -1 : 1;
    }

    const leftLow = left.scopedRows.some((row) => row.lowStock);
    const rightLow = right.scopedRows.some((row) => row.lowStock);
    if (leftLow !== rightLow) {
      return leftLow ? -1 : 1;
    }

    return left.anchor.productName.localeCompare(right.anchor.productName) || left.anchor.sku.localeCompare(right.anchor.sku);
  });
}

function isOperationalAlertRow(row: InventoryReportRow) {
  return row.availableStock < 0 || row.lowStock;
}

function buildInventoryAlertGroups(groups: InventoryProductGroup[]) {
  return groups
    .map((group) => {
      const alertRows = sortWarehouseRows(group.rows.filter(isOperationalAlertRow));

      if (!alertRows.length) {
        return null;
      }

      const negativeCount = alertRows.filter((row) => row.availableStock < 0).length;
      const lowCount = alertRows.filter((row) => row.lowStock && row.availableStock >= 0).length;

      return {
        ...group,
        alertRows,
        summary: summarizeInventoryRows(group.rows, group.anchor, true),
        negativeCount,
        lowCount
      };
    })
    .filter((group): group is InventoryAlertGroup => Boolean(group))
    .sort((left, right) => {
      const leftNegative = left.negativeCount > 0;
      const rightNegative = right.negativeCount > 0;
      if (leftNegative !== rightNegative) {
        return leftNegative ? -1 : 1;
      }

      const leftLowestAvailable = Math.min(...left.alertRows.map((row) => row.availableStock));
      const rightLowestAvailable = Math.min(...right.alertRows.map((row) => row.availableStock));
      if (leftLowestAvailable !== rightLowestAvailable) {
        return leftLowestAvailable - rightLowestAvailable;
      }

      return right.anchor.variantUnitsSold - left.anchor.variantUnitsSold || left.anchor.productName.localeCompare(right.anchor.productName);
    });
}

function inventoryAlertGroupStatus(group: InventoryAlertGroup) {
  if (group.negativeCount > 0) {
    return {
      tone: "danger" as const,
      label: "Disponible negativo"
    };
  }

  return {
    tone: "warning" as const,
    label: "Bajo mínimo"
  };
}

function inventoryAlertGroupSummary(group: InventoryAlertGroup) {
  const parts: string[] = [];

  if (group.negativeCount > 0) {
    parts.push(`${group.negativeCount} almacén(es) con disponible negativo`);
  }

  if (group.lowCount > 0) {
    parts.push(`${group.lowCount} almacén(es) bajo mínimo`);
  }

  return parts.join(" · ");
}

function firstActionableAlertRow(group: InventoryAlertGroup) {
  return group.alertRows.find((row) => row.availableStock < 0) ?? group.alertRows[0];
}

function alertWarehousePreview(group: InventoryAlertGroup) {
  const visibleRows = group.alertRows.slice(0, 3);
  const preview = visibleRows
    .map((row) => `${warehouseLabel(row)}: ${formatNumber(row.availableStock)}`)
    .join(" · ");
  const hiddenCount = group.alertRows.length - visibleRows.length;

  return hiddenCount > 0 ? `${preview} · +${hiddenCount} más` : preview;
}

function inventoryStatus(row: InventoryReportRow) {
  if (row.availableStock < 0) {
    return {
      tone: "danger" as const,
      label: "Disponible negativo"
    };
  }

  if (row.lowStock) {
    return {
      tone: "warning" as const,
      label: "Bajo mínimo"
    };
  }

  if (row.reservedQuantity > 0 || row.committedQuantity > 0) {
    return {
      tone: "info" as const,
      label: "Con movimiento"
    };
  }

  return {
    tone: "success" as const,
    label: "OK"
  };
}

function variantMetaPills(row: InventoryReportRow) {
  return [
    row.flavorLabel ? `Sabor ${row.flavorLabel}` : null,
    row.presentationLabel ? `Presentación ${row.presentationLabel}` : null
  ].filter(Boolean) as string[];
}

function inventoryBulkModeLabel(mode: InventoryStockOperationMode) {
  return mode === "stock_receipt" ? "Ingreso de mercadería" : "Conteo físico";
}

function inventoryBulkQuantityLabel(mode: InventoryStockOperationMode) {
  return mode === "stock_receipt" ? "Unidades que ingresan" : "Stock final contado";
}

function parseStockDraft(value: string | undefined) {
  const parsed = Number(value ?? "");
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return Math.trunc(parsed);
}

export function InventoryWorkspace() {
  const [report, setReport] = useState<InventoryReportSummary | null>(null);
  const [warehouses, setWarehouses] = useState<WarehouseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [query, setQuery] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<InventoryFilter>("all");
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);
  const [expandedGroupKeys, setExpandedGroupKeys] = useState<Record<string, boolean>>({});
  const [productPage, setProductPage] = useState(1);
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});
  const [reasonDrafts, setReasonDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [assignment, setAssignment] = useState<WarehouseAssignmentState | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState<InventoryStockOperationMode>("physical_count");
  const [bulkSource, setBulkSource] = useState("");
  const [bulkSourceName, setBulkSourceName] = useState<string | null>(null);
  const [bulkReason, setBulkReason] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkTemplateLoading, setBulkTemplateLoading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkResult, setBulkResult] = useState<BulkInventoryResult | null>(null);

  useEffect(() => {
    let active = true;

    async function loadInventory() {
      setLoading(true);

      try {
        const [inventoryResponse, warehousesResponse] = await Promise.all([
          fetchInventoryReport(),
          fetchAdminWarehouses()
        ]);
        if (!active) {
          return;
        }

        setReport(inventoryResponse.data);
        setWarehouses(warehousesResponse.data);
        setError(null);
      } catch (fetchError) {
        if (active) {
          setReport(null);
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "No pudimos cargar el reporte de inventario. El backend /admin/inventory/report debe estar disponible para ver stock por variante y almacén."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadInventory();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const rows = report?.rows ?? [];

  useEffect(() => {
    setStockDrafts(Object.fromEntries(rows.map((row) => [rowKey(row), String(row.stockOnHand)])));
    setReasonDrafts({});
  }, [report?.generatedAt]);

  const warehouseOptions = useMemo(() => {
    const warehouseMap = new Map<string, string>();

    for (const warehouse of warehouses) {
      warehouseMap.set(warehouse.id, warehouse.name);
    }

    for (const row of rows) {
      if (row.warehouseId !== "unassigned") {
        warehouseMap.set(row.warehouseId, warehouseLabel(row));
      }
    }

    return [...warehouseMap.entries()]
      .map(([id, label]) => ({ id, label }))
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [rows, warehouses]);

  const productGroups = useMemo(() => buildInventoryGroups(rows), [rows]);

  const visibleProductGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sortInventoryGroups(
      productGroups
        .map((group) => {
          const scopedRows =
            warehouseFilter === "all"
              ? group.rows
              : group.rows.filter((row) => row.warehouseId === warehouseFilter);

          if (!scopedRows.length) {
            return null;
          }

          const statusRows = scopedRows.filter((row) => rowMatchesStatus(row, statusFilter));
          if (statusFilter !== "all" && !statusRows.length) {
            return null;
          }

          const queryMatchesProduct = !normalizedQuery || productSearchText(group).includes(normalizedQuery);
          const queryRows = !normalizedQuery
            ? scopedRows
            : scopedRows.filter((row) => warehouseSearchText(row).includes(normalizedQuery));

          if (!queryMatchesProduct && !queryRows.length) {
            return null;
          }

          const detailRows = sortWarehouseRows(
            (statusFilter === "all" ? scopedRows : statusRows).filter((row) =>
              queryMatchesProduct || !normalizedQuery ? true : warehouseSearchText(row).includes(normalizedQuery)
            )
          );

          return {
            ...group,
            scopedRows,
            detailRows,
            summary: summarizeInventoryRows(scopedRows, group.anchor, warehouseFilter === "all")
          };
        })
        .filter((group): group is VisibleInventoryProductGroup => Boolean(group))
    );
  }, [productGroups, query, statusFilter, warehouseFilter]);

  useEffect(() => {
    setProductPage(1);
  }, [query, report?.generatedAt, statusFilter, warehouseFilter]);

  const pageSize = 15;
  const totalProductPages = Math.max(1, Math.ceil(visibleProductGroups.length / pageSize));
  const paginatedProductGroups = visibleProductGroups.slice((productPage - 1) * pageSize, productPage * pageSize);
  const visibleWarehouseRows = visibleProductGroups.reduce((total, group) => total + group.detailRows.length, 0);

  const selectedRow = useMemo(
    () => rows.find((row) => rowKey(row) === selectedRowKey) ?? null,
    [rows, selectedRowKey]
  );

  const selectedKey = selectedRow ? rowKey(selectedRow) : undefined;
  const selectedStockDraft = selectedKey ? stockDrafts[selectedKey] : undefined;
  const selectedReasonDraft = selectedKey ? reasonDrafts[selectedKey] ?? "" : "";
  const selectedNextStock = parseStockDraft(selectedStockDraft);
  const selectedNextAvailable =
    selectedRow && selectedNextStock !== undefined
      ? selectedNextStock - selectedRow.reservedQuantity - selectedRow.committedQuantity
      : undefined;
  const selectedStockChanged = selectedRow && selectedNextStock !== undefined && selectedNextStock !== selectedRow.stockOnHand;
  const canSaveSelected =
    Boolean(selectedRow) &&
    selectedRow?.warehouseId !== "unassigned" &&
    selectedNextStock !== undefined &&
    selectedNextStock >= 0 &&
    Boolean(selectedReasonDraft.trim()) &&
    Boolean(selectedStockChanged) &&
    !saving;
  const activeWarehouses = useMemo(
    () => warehouses.filter((warehouse) => warehouse.status === "active"),
    [warehouses]
  );
  const assignmentWarehouseOptions = useMemo(() => {
    if (!assignment) {
      return [];
    }

    const existingWarehouseIds = new Set(assignment.group.rows.map((row) => row.warehouseId));
    return activeWarehouses.filter((warehouse) => !existingWarehouseIds.has(warehouse.id));
  }, [activeWarehouses, assignment]);
  const assignmentStock = parseStockDraft(assignment?.stockOnHand);
  const assignmentWarehouse = assignment
    ? activeWarehouses.find((warehouse) => warehouse.id === assignment.warehouseId)
    : undefined;
  const canSaveAssignment =
    Boolean(assignment) &&
    Boolean(assignment?.warehouseId) &&
    assignmentStock !== undefined &&
    assignmentStock >= 0 &&
    !saving;

  const alertRows = useMemo(
    () => buildInventoryAlertGroups(productGroups).slice(0, 6),
    [productGroups]
  );
  const bulkPreview = useMemo(() => {
    const parsed = parseInventoryBulkInput(bulkSource);
    if (bulkMode !== "stock_receipt") {
      return parsed;
    }

    const extraIssues = parsed.lines.reduce<Array<{ row: number; warehouseCode?: string; sku?: string; message: string }>>(
      (issues, line, index) => {
        if (line.quantity <= 0) {
          issues.push({
            row: index + 2,
            warehouseCode: line.warehouseCode,
            sku: line.sku,
            message: "En ingreso de mercadería la cantidad debe ser mayor a cero."
          });
        }

        return issues;
      },
      []
    );

    return {
      ...parsed,
      issues: [...parsed.issues, ...extraIssues]
    };
  }, [bulkMode, bulkSource]);

  function toggleGroup(groupKey: string) {
    setExpandedGroupKeys((current) => ({
      ...current,
      [groupKey]: !current[groupKey]
    }));
  }

  function primaryWarehouseRow(group: VisibleInventoryProductGroup) {
    return group.scopedRows.find((row) => row.isDefaultWarehouse) ?? group.scopedRows[0];
  }

  function groupAlertSummary(group: VisibleInventoryProductGroup) {
    const negative = group.scopedRows.filter((row) => row.availableStock < 0).length;
    const low = group.scopedRows.filter((row) => row.lowStock && row.availableStock >= 0).length;

    if (negative > 0) {
      return `${negative} almacén(es) con disponible negativo`;
    }

    if (low > 0) {
      return `${low} almacén(es) bajo mínimo`;
    }

    return `${group.scopedRows.length} almacén(es) operativo(s)`;
  }

  function openAdjustment(row: InventoryReportRow) {
    const key = rowKey(row);
    setSelectedRowKey(key);
    setStockDrafts((current) => ({
      ...current,
      [key]: current[key] ?? String(row.stockOnHand)
    }));
    setActionError(null);
    setActionMessage(null);
  }

  function closeAdjustment() {
    if (saving) {
      return;
    }

    setSelectedRowKey(null);
  }

  function openAssignment(group: InventoryProductGroup) {
    const existingWarehouseIds = new Set(group.rows.map((row) => row.warehouseId));
    const firstAvailableWarehouse = activeWarehouses.find((warehouse) => !existingWarehouseIds.has(warehouse.id));

    setAssignment({
      group,
      warehouseId: firstAvailableWarehouse?.id ?? "",
      stockOnHand: "0",
      reason: ""
    });
    setActionError(null);
    setActionMessage(null);
  }

  function closeAssignment() {
    if (saving) {
      return;
    }

    setAssignment(null);
  }

  async function handleSaveStock() {
    if (!selectedRow || !selectedKey || selectedNextStock === undefined) {
      return;
    }

    setSaving(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const response = await adjustInventoryStock({
        variantId: selectedRow.variantId,
        warehouseId: selectedRow.warehouseId,
        stockOnHand: selectedNextStock,
        reason: selectedReasonDraft
      });
      setActionMessage(response.message);
      setReasonDrafts((current) => ({
        ...current,
        [selectedKey]: ""
      }));
      setSelectedRowKey(null);
      setRefreshKey((current) => current + 1);
    } catch (saveError) {
      setActionError(saveError instanceof Error ? saveError.message : "No pudimos actualizar el stock físico.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAssignment() {
    if (!assignment || assignmentStock === undefined) {
      return;
    }

    setSaving(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const response = await adjustInventoryStock({
        variantId: assignment.group.anchor.variantId,
        warehouseId: assignment.warehouseId,
        stockOnHand: assignmentStock,
        reason: assignment.reason.trim() || assignmentFallbackReason(assignmentWarehouse)
      });
      setActionMessage(response.message);
      setAssignment(null);
      setExpandedGroupKeys((current) => ({
        ...current,
        [assignment.group.key]: true
      }));
      setRefreshKey((current) => current + 1);
    } catch (saveError) {
      setActionError(saveError instanceof Error ? saveError.message : "No pudimos agregar el producto al almacén.");
    } finally {
      setSaving(false);
    }
  }

  function openBulkModal() {
    setBulkOpen(true);
    setBulkSource("");
    setBulkSourceName(null);
    setBulkReason("");
    setBulkError(null);
    setBulkResult(null);
  }

  function closeBulkModal() {
    if (bulkLoading || bulkTemplateLoading) {
      return;
    }

    setBulkOpen(false);
  }

  async function handleDownloadBulkTemplate() {
    setBulkError(null);
    setBulkTemplateLoading(true);

    try {
      await downloadInventoryBulkTemplate({
        rows,
        warehouses,
        mode: bulkMode
      });
    } catch (error) {
      setBulkError(error instanceof Error ? error.message : "No se pudo generar la plantilla de inventario.");
    } finally {
      setBulkTemplateLoading(false);
    }
  }

  async function handleBulkFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setBulkSourceName(null);
      return;
    }

    try {
      const text = await readInventoryBulkFile(file);
      setBulkSource(text);
      setBulkSourceName(file.name);
      setBulkError(null);
      setBulkResult(null);
    } catch (error) {
      setBulkError(error instanceof Error ? error.message : "No se pudo leer el archivo.");
    } finally {
      event.target.value = "";
    }
  }

  async function handleBulkImport() {
    if (!bulkPreview.lines.length || bulkPreview.issues.length > 0) {
      return;
    }

    setBulkLoading(true);
    setBulkError(null);
    setBulkResult(null);

    try {
      const response = await adjustInventoryStockBulk({
        mode: bulkMode,
        reason: bulkReason.trim() || undefined,
        lines: bulkPreview.lines
      });
      setBulkResult(response);
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setBulkError(error instanceof Error ? error.message : "No se pudo procesar el lote de inventario.");
    } finally {
      setBulkLoading(false);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <SectionHeader
        title="Stock por producto y almacén"
        description="Control diario de SKUs físicos por almacén. Los combos virtuales se calculan desde sus productos unitarios."
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={() => setRefreshKey((current) => current + 1)} disabled={loading}>
          {loading ? "Actualizando..." : "Actualizar"}
        </Button>
        <Button variant="secondary" onClick={openBulkModal}>
          Ingreso / conteo masivo
        </Button>
        <Badge tone="neutral">Actualizado: {formatDateTime(report?.generatedAt)}</Badge>
        <Badge tone="info">{visibleProductGroups.length} producto(s) visibles</Badge>
        <Badge tone="neutral">{visibleWarehouseRows} almacén(es) en detalle</Badge>
      </div>

      {error ? (
        <Card className="border-amber-300/50 bg-amber-50">
          <CardContent className="space-y-2 py-4 text-sm text-amber-950">
            <p className="font-medium">No pudimos cargar el inventario.</p>
            <p>{error}</p>
          </CardContent>
        </Card>
      ) : null}

      {(actionMessage || actionError) ? (
        <Card className={actionError ? "border-rose-200 bg-rose-50" : "border-emerald-200 bg-emerald-50"}>
          <CardContent className={`py-4 text-sm ${actionError ? "text-rose-950" : "text-emerald-950"}`}>
            {actionError ?? actionMessage}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Trabajo diario</CardTitle>
          <CardDescription>Busca un SKU, filtra por almacén o enfócate solo en alertas.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1.4fr_0.9fr_0.9fr]">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar producto, SKU o almacén"
            aria-label="Buscar producto, SKU o almacén"
          />
          <select
            className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black/25"
            value={warehouseFilter}
            onChange={(event) => setWarehouseFilter(event.target.value)}
            aria-label="Filtrar por almacén"
          >
            <option value="all">Todos los almacenes</option>
            {warehouseOptions.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.label}
              </option>
            ))}
          </select>
          <select
            className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black/25"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as InventoryFilter)}
            aria-label="Filtrar por estado"
          >
            <option value="all">Todos los estados</option>
            <option value="negative">Disponible negativo</option>
            <option value="low">Bajo mínimo</option>
            <option value="reserved">Con reservas o ventas</option>
          </select>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div>
          <Badge tone="info">Operación</Badge>
          <h2 className="mt-2 text-xl font-semibold text-[#132016]">Resumen diario por variante y almacén</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-black/55">
            Cada SKU físico representa un sabor o presentación vendible. Abre el detalle cuando necesites ver o ajustar un almacén específico.
          </p>
        </div>

        <Card className="rounded-[1.6rem] border-black/8 bg-white shadow-[0_12px_34px_rgba(18,34,20,0.05)]">
          <CardHeader>
            <CardTitle>Productos consolidados</CardTitle>
            <CardDescription>
              Los almacenes se muestran como detalle desplegable para evitar duplicidad visual.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader className="bg-[#f7f8f4]">
                <TableRow>
                  <TableHead>Producto / SKU</TableHead>
                  <TableHead>Stock físico</TableHead>
                  <TableHead>Disponible para vender</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Almacén base</TableHead>
                  <TableHead>Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-black/50">
                      Cargando inventario...
                    </TableCell>
                  </TableRow>
                ) : paginatedProductGroups.length ? (
                  paginatedProductGroups.map((group) => {
                    const expanded = Boolean(expandedGroupKeys[group.key]);
                    const status = groupInventoryStatus(group);
                    const primaryRow = primaryWarehouseRow(group);

                    return (
                      <Fragment key={group.key}>
                        <TableRow>
                          <TableCell>
                            <div className="flex min-w-[260px] items-center gap-3">
                              <ProductThumbnail row={group.anchor} />
                              <div className="min-w-0 space-y-1">
                                <div className="font-semibold text-[#132016]">{group.anchor.productName}</div>
                                <div className="text-xs text-black/50">
                                  {group.anchor.variantName} · {group.anchor.sku}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {variantMetaPills(group.anchor).map((pill) => (
                                    <Badge key={pill} tone="neutral">{pill}</Badge>
                                  ))}
                                  <Badge tone="info">{formatChannelLabel(group.anchor.salesChannel)}</Badge>
                                  <Badge tone="neutral">{group.scopedRows.length} almacén(es)</Badge>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-[#132016]">{formatNumber(group.summary.stockOnHand)}</div>
                            <div className="mt-1 text-xs text-black/45">Conteo físico</div>
                          </TableCell>
                          <TableCell>
                            <div
                              className={`font-semibold ${
                                group.summary.availableStock < 0 ? "text-[#9f1239]" : "text-[#132016]"
                              }`}
                            >
                              {formatNumber(group.summary.availableStock)}
                            </div>
                            <div className="mt-1 text-xs text-black/45">
                              {warehouseFilter === "all" ? "Total producto" : "Total almacén filtrado"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <StatusBadge tone={status.tone} label={status.label} />
                              <div className="text-xs text-black/45">{groupAlertSummary(group)}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-[#132016]">
                                {primaryRow ? warehouseLabel(primaryRow) : "Sin almacén"}
                              </div>
                              <div className="text-xs text-black/45">
                                {warehouseFilter === "all" ? "Preferido o primer almacén" : "Almacén filtrado"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              <Button type="button" size="sm" variant="secondary" onClick={() => toggleGroup(group.key)}>
                                {expanded ? "Ocultar" : "Ver almacenes"}
                              </Button>
                              {primaryRow ? (
                                <Button type="button" size="sm" variant="secondary" onClick={() => openAdjustment(primaryRow)}>
                                  Ajustar
                                </Button>
                              ) : null}
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => openAssignment(group)}
                                disabled={activeWarehouses.every((warehouse) =>
                                  group.rows.some((row) => row.warehouseId === warehouse.id)
                                )}
                                className="disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Agregar almacén
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {expanded ? (
                          <TableRow>
                            <TableCell colSpan={6} className="bg-[#f7f8f4]">
                              <div className="space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div>
                                    <div className="text-sm font-semibold text-[#132016]">Stock por almacén</div>
                                    <div className="text-xs text-black/50">
                                      Ajusta sólo el almacén contado; el total del producto se recalcula automáticamente.
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge tone="neutral">{group.detailRows.length} fila(s) de almacén</Badge>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => openAssignment(group)}
                                      disabled={activeWarehouses.every((warehouse) =>
                                        group.rows.some((row) => row.warehouseId === warehouse.id)
                                      )}
                                      className="disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      Agregar almacén
                                    </Button>
                                  </div>
                                </div>

                                <div className="grid gap-3 xl:grid-cols-2">
                                  {group.detailRows.map((row) => {
                                    const rowStatus = inventoryStatus(row);

                                    return (
                                      <div
                                        key={rowKey(row)}
                                        className="rounded-2xl border border-black/8 bg-white px-4 py-4"
                                      >
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                          <div className="space-y-1">
                                            <div className="font-semibold text-[#132016]">{warehouseLabel(row)}</div>
                                            <div className="text-xs text-black/45">{row.warehouseCode ?? "Sin código"}</div>
                                            <div className="flex flex-wrap gap-1">
                                              <Badge tone={row.isDefaultWarehouse ? "success" : "neutral"}>
                                                {row.isDefaultWarehouse ? "Almacén preferido" : "Almacén secundario"}
                                              </Badge>
                                              <StatusBadge tone={rowStatus.tone} label={rowStatus.label} />
                                            </div>
                                          </div>
                                          <div className="flex flex-wrap gap-2">
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="secondary"
                                              onClick={() => openAdjustment(row)}
                                            >
                                              Ajustar
                                            </Button>
                                            <Button href="/transferencias" size="sm" variant="ghost">
                                              Transferir
                                            </Button>
                                          </div>
                                        </div>

                                        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                                          <div>
                                            <div className="text-xs text-black/45">Físico</div>
                                            <div className="font-semibold text-[#132016]">{formatNumber(row.stockOnHand)}</div>
                                          </div>
                                          <div>
                                            <div className="text-xs text-black/45">Disponible</div>
                                            <div
                                              className={`font-semibold ${
                                                row.availableStock < 0 ? "text-[#9f1239]" : "text-[#132016]"
                                              }`}
                                            >
                                              {formatNumber(row.availableStock)}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </Fragment>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-black/50">
                      No hay productos que coincidan con los filtros actuales.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          {totalProductPages > 1 ? (
            <div className="flex items-center justify-between border-t border-black/5 px-6 py-4">
              <p className="text-xs text-black/45">
                Página {productPage} de {totalProductPages} · {visibleProductGroups.length} producto(s)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setProductPage((current) => Math.max(1, current - 1))}
                  disabled={productPage === 1}
                  className="disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setProductPage((current) => Math.min(totalProductPages, current + 1))}
                  disabled={productPage === totalProductPages}
                  className="disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          ) : null}
        </Card>

        {alertRows.length ? (
          <Card>
            <CardHeader>
              <CardTitle>Alertas operativas</CardTitle>
              <CardDescription>
                Consolidadas por SKU físico. Los combos virtuales no generan alerta propia; se controlan por sus componentes.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {alertRows.map((group) => {
                const status = inventoryAlertGroupStatus(group);
                const targetRow = firstActionableAlertRow(group);

                return (
                  <button
                    key={group.key}
                    type="button"
                    onClick={() => openAdjustment(targetRow)}
                    className={`w-full rounded-2xl px-4 py-3 text-left transition hover:shadow-sm ${
                      group.negativeCount > 0 ? "border border-rose-200 bg-rose-50" : "border border-amber-200 bg-amber-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <ProductThumbnail row={group.anchor} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#132016]">{group.anchor.productName}</p>
                          <p className="text-xs text-black/50">
                            {group.anchor.variantName} · {group.anchor.sku}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {variantMetaPills(group.anchor).map((pill) => (
                              <Badge key={pill} tone="neutral">{pill}</Badge>
                            ))}
                          </div>
                          <p className="mt-1 text-xs text-black/55">{inventoryAlertGroupSummary(group)}</p>
                        </div>
                      </div>
                      <StatusBadge tone={status.tone} label={status.label} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-black/55">
                      <Badge tone="neutral">Stock: {formatNumber(group.summary.stockOnHand)}</Badge>
                      <Badge tone="neutral">Disponible: {formatNumber(group.summary.availableStock)}</Badge>
                      <Badge tone="neutral">{group.alertRows.length} almacén(es)</Badge>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-black/50">{alertWarehousePreview(group)}</p>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        ) : null}
      </section>

      <Dialog open={bulkOpen} onClose={closeBulkModal} size="xl">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ingreso / conteo masivo</DialogTitle>
            <DialogDescription>
              Carga líneas por `variante + almacén`. Usa `conteo físico` para reemplazar el stock contado y `ingreso de mercadería` solo para sumar unidades nuevas.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              {([
                {
                  value: "physical_count",
                  label: "Conteo físico",
                  description: "Reemplaza el stock del almacén con el número contado."
                },
                {
                  value: "stock_receipt",
                  label: "Ingreso de mercadería",
                  description: "Suma solo las unidades nuevas que acabas de recibir."
                }
              ] as const).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setBulkMode(option.value);
                    setBulkResult(null);
                  }}
                  className={`rounded-2xl border-2 p-4 text-left transition ${
                    bulkMode === option.value
                      ? "border-[#52b788] bg-[#f0faf4]"
                      : "border-black/10 bg-white hover:border-black/20"
                  }`}
                >
                  <div className="text-sm font-semibold text-[#132016]">{option.label}</div>
                  <div className="mt-1 text-xs leading-5 text-black/55">{option.description}</div>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="secondary" onClick={() => void handleDownloadBulkTemplate()} disabled={bulkTemplateLoading}>
                {bulkTemplateLoading ? "Generando plantilla..." : "Descargar plantilla"}
              </Button>
              <label className="inline-flex cursor-pointer items-center rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#132016] transition hover:border-black/20">
                Subir archivo
                <input type="file" accept=".csv,.tsv,.xlsx" className="hidden" onChange={(event) => void handleBulkFileChange(event)} />
              </label>
              <Badge tone="info">{inventoryBulkModeLabel(bulkMode)}</Badge>
              <Badge tone="neutral">{bulkPreview.lines.length} línea(s) listas</Badge>
              <Badge tone={bulkPreview.issues.length > 0 ? "warning" : "success"}>
                {bulkPreview.issues.length} observación(es)
              </Badge>
            </div>

            {bulkSourceName ? (
              <div className="rounded-2xl border border-black/8 bg-[#f7f8f4] px-4 py-3 text-sm text-black/60">
                Archivo cargado: <span className="font-medium text-[#132016]">{bulkSourceName}</span>
              </div>
            ) : null}

            {bulkError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950">
                {bulkError}
              </div>
            ) : null}

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-black/45">
                Motivo general del lote
              </label>
              <Textarea
                value={bulkReason}
                onChange={(event) => setBulkReason(event.target.value)}
                placeholder={
                  bulkMode === "stock_receipt"
                    ? "Ejemplo: ingreso por compra a proveedor, lote mayo"
                    : "Ejemplo: conteo físico de cierre, inventario general"
                }
              />
              <p className="mt-2 text-xs leading-5 text-black/50">
                Se usa como motivo por defecto si una fila no trae su propia observación.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-black/45">
                Archivo pegado o contenido CSV/TSV
              </label>
              <Textarea
                value={bulkSource}
                onChange={(event) => {
                  setBulkSource(event.target.value);
                  setBulkSourceName(null);
                  setBulkResult(null);
                }}
                placeholder={`almacen_codigo,producto_sku,cantidad,motivo\nWH-LIMA-CENTRAL,HG-PN-001,${bulkMode === "stock_receipt" ? "24" : "20"},${bulkMode === "stock_receipt" ? "Ingreso recibido" : "Conteo físico"}`}
                rows={10}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Card>
                <CardContent className="space-y-1 py-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-black/45">Modo</div>
                  <div className="text-sm font-semibold text-[#132016]">{inventoryBulkModeLabel(bulkMode)}</div>
                  <div className="text-xs text-black/50">{inventoryBulkQuantityLabel(bulkMode)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-1 py-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-black/45">Líneas listas</div>
                  <div className="text-sm font-semibold text-[#132016]">{bulkPreview.lines.length}</div>
                  <div className="text-xs text-black/50">Se procesan en orden y por `variante + almacén`.</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-1 py-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-black/45">Observaciones</div>
                  <div className="text-sm font-semibold text-[#132016]">{bulkPreview.issues.length}</div>
                  <div className="text-xs text-black/50">El lote se bloquea hasta que corrijas todas las filas.</div>
                </CardContent>
              </Card>
            </div>

            {bulkPreview.issues.length > 0 ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                <div className="text-sm font-semibold text-amber-950">Observaciones de la prevalidación</div>
                <div className="mt-3 space-y-2 text-sm text-amber-950">
                  {bulkPreview.issues.slice(0, 10).map((issue) => (
                    <p key={`${issue.row}-${issue.message}`}>
                      Fila {issue.row}: {issue.message}
                    </p>
                  ))}
                  {bulkPreview.issues.length > 10 ? (
                    <p className="text-xs text-amber-800">Mostrando 10 de {bulkPreview.issues.length} observaciones.</p>
                  ) : null}
                </div>
              </div>
            ) : bulkPreview.lines.length > 0 ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-950">
                Lote listo: {bulkPreview.lines.length} línea(s) en modo {inventoryBulkModeLabel(bulkMode).toLowerCase()}.
              </div>
            ) : null}

            {bulkResult ? (
              <div className="space-y-3 rounded-2xl border border-black/8 bg-[#f7f8f4] px-4 py-4">
                <div>
                  <div className="text-sm font-semibold text-[#132016]">Resultado del lote</div>
                  <div className="mt-1 text-xs text-black/55">{bulkResult.message}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={bulkResult.status === "rejected" ? "danger" : bulkResult.status === "partial" ? "warning" : "success"}>
                    {bulkResult.status}
                  </Badge>
                  <Badge tone="neutral">{bulkResult.processedCount} aplicadas</Badge>
                  <Badge tone="neutral">{bulkResult.failedCount} observadas</Badge>
                </div>
                {bulkResult.results.length > 0 ? (
                  <div className="space-y-2 text-sm text-black/65">
                    {bulkResult.results.slice(0, 8).map((result) => (
                      <p key={`${result.lineNumber}-${result.variantId}-${result.warehouseId}`}>
                        Fila {result.lineNumber}: {result.sku} en {result.warehouseName ?? result.warehouseCode ?? result.warehouseId} → {result.previousStockOnHand} a {result.nextStockOnHand} ({result.delta >= 0 ? "+" : ""}{result.delta})
                      </p>
                    ))}
                  </div>
                ) : null}
                {bulkResult.errors.length > 0 ? (
                  <div className="space-y-2 text-sm text-rose-950">
                    {bulkResult.errors.slice(0, 8).map((result) => (
                      <p key={`${result.lineNumber}-${result.message}`}>
                        Fila {result.lineNumber}: {result.message}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={closeBulkModal} disabled={bulkLoading || bulkTemplateLoading}>
              Cerrar
            </Button>
            <Button
              type="button"
              onClick={() => void handleBulkImport()}
              disabled={bulkLoading || bulkPreview.lines.length === 0 || bulkPreview.issues.length > 0}
            >
              {bulkLoading ? "Procesando..." : "Aplicar lote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedRow)} onClose={closeAdjustment} size="lg">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar stock físico</DialogTitle>
            <DialogDescription>
              Actualiza sólo la cantidad que existe en el almacén. El sistema calcula lo disponible.
            </DialogDescription>
          </DialogHeader>

          {selectedRow ? (
            <>
              <DialogBody className="space-y-5">
                <div className="rounded-2xl border border-black/8 bg-[#f7f8f4] px-4 py-3">
                  <p className="text-sm font-semibold text-[#132016]">{selectedRow.productName}</p>
                  <p className="text-xs text-black/55">
                    {selectedRow.variantName} · {selectedRow.sku}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {variantMetaPills(selectedRow).map((pill) => (
                      <Badge key={pill} tone="neutral">{pill}</Badge>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-black/55">{warehouseLabel(selectedRow)}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-black/45">
                      Stock actual en sistema
                    </label>
                    <Input value={formatNumber(selectedRow.stockOnHand)} readOnly />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-black/45">
                      Nuevo stock contado
                    </label>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={selectedStockDraft ?? ""}
                      onChange={(event) =>
                        setStockDrafts((current) => ({
                          ...current,
                          [rowKey(selectedRow)]: event.target.value
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge tone={selectedNextAvailable != null && selectedNextAvailable < 0 ? "danger" : "success"}>
                    Disponible: {selectedNextAvailable == null ? "-" : formatNumber(selectedNextAvailable)}
                  </Badge>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-black/45">
                    Motivo del ajuste
                  </label>
                  <Textarea
                    value={selectedReasonDraft}
                    onChange={(event) =>
                      setReasonDrafts((current) => ({
                        ...current,
                        [rowKey(selectedRow)]: event.target.value
                      }))
                    }
                    placeholder="Ejemplo: conteo de almacén, compra recibida, corrección documentada"
                  />
                </div>

                {selectedRow.warehouseId === "unassigned" ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                    Esta variante no tiene almacén operativo asignado. Asigna un almacén antes de guardar ajustes.
                  </div>
                ) : null}

                {selectedNextAvailable != null && selectedNextAvailable < 0 ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950">
                    Este ajuste dejará disponible negativo. Revisa pedidos pendientes antes de guardar.
                  </div>
                ) : null}
              </DialogBody>

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={closeAdjustment} disabled={saving}>
                  Cancelar
                </Button>
                <Button type="button" onClick={() => void handleSaveStock()} disabled={!canSaveSelected}>
                  {saving ? "Guardando..." : "Guardar ajuste"}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(assignment)} onClose={closeAssignment} size="lg">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar producto a almacén</DialogTitle>
            <DialogDescription>
              Crea la fila de stock para un almacén nuevo y registra el conteo físico inicial.
            </DialogDescription>
          </DialogHeader>

          {assignment ? (
            <>
              <DialogBody className="space-y-5">
                <div className="rounded-2xl border border-black/8 bg-[#f7f8f4] px-4 py-3">
                  <p className="text-sm font-semibold text-[#132016]">{assignment.group.anchor.productName}</p>
                  <p className="text-xs text-black/55">
                    {assignment.group.anchor.variantName} · {assignment.group.anchor.sku}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {variantMetaPills(assignment.group.anchor).map((pill) => (
                      <Badge key={pill} tone="neutral">{pill}</Badge>
                    ))}
                  </div>
                </div>

                {assignmentWarehouseOptions.length ? (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-black/45">
                        Almacén destino
                      </label>
                      <select
                        className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black/25"
                        value={assignment.warehouseId}
                        onChange={(event) =>
                          setAssignment((current) =>
                            current
                              ? {
                                  ...current,
                                  warehouseId: event.target.value
                                }
                              : current
                          )
                        }
                      >
                        {assignmentWarehouseOptions.map((warehouse) => (
                          <option key={warehouse.id} value={warehouse.id}>
                            {warehouse.name} · {warehouse.code}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-black/45">
                        Stock contado inicial
                      </label>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        value={assignment.stockOnHand}
                        onChange={(event) =>
                          setAssignment((current) =>
                            current
                              ? {
                                  ...current,
                                  stockOnHand: event.target.value
                                }
                              : current
                          )
                        }
                      />
                      <p className="mt-2 text-xs leading-5 text-black/50">
                        Usa 0 o déjalo vacío si sólo quieres habilitar el almacén para este producto y cargar stock después.
                      </p>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-black/45">
                        Motivo opcional
                      </label>
                      <Textarea
                        value={assignment.reason}
                        onChange={(event) =>
                          setAssignment((current) =>
                            current
                              ? {
                                  ...current,
                                  reason: event.target.value
                                }
                              : current
                          )
                        }
                        placeholder={assignmentFallbackReason(assignmentWarehouse)}
                      />
                      <p className="mt-2 text-xs leading-5 text-black/50">
                        Si lo dejas vacío, se guardará con el motivo “{assignmentFallbackReason(assignmentWarehouse)}”.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                    Este producto ya tiene fila en todos los almacenes activos. Si falta un almacén, créalo o actívalo en la sección Almacenes.
                  </div>
                )}
              </DialogBody>

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={closeAssignment} disabled={saving}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleSaveAssignment()}
                  disabled={!canSaveAssignment}
                  className="disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Agregar almacén"}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
