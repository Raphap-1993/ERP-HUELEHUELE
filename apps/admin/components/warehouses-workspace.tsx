"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AdminDataTable,
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
  MetricCard,
  SectionHeader,
  StatusBadge
} from "@huelegood/ui";
import type {
  PeruDepartmentSummary,
  PeruDistrictSummary,
  PeruProvinceSummary,
  WarehouseServiceAreaScopeValue,
  WarehouseStatusValue,
  WarehouseSummary,
  WarehouseUpsertInput
} from "@huelegood/shared";
import {
  createAdminWarehouse,
  deleteAdminWarehouse,
  fetchAdminWarehouses,
  fetchPeruDepartments,
  fetchPeruDistricts,
  fetchPeruProvinces,
  updateAdminWarehouse
} from "../lib/api";

type WarehouseFormState = {
  code?: string;
  name: string;
  status: WarehouseStatusValue;
  priority: string;
  addressLine1: string;
  addressLine2: string;
  reference: string;
  departmentCode: string;
  departmentName: string;
  provinceCode: string;
  provinceName: string;
  districtCode: string;
  districtName: string;
  latitude: string;
  longitude: string;
  serviceAreas: WarehouseServiceAreaFormItem[];
};

const WAREHOUSE_STATUSES: WarehouseStatusValue[] = ["active", "inactive", "suspended"];
const SERVICE_AREA_SCOPE_OPTIONS: Array<{
  value: WarehouseServiceAreaScopeValue;
  label: string;
}> = [
  { value: "district", label: "Distrito" },
  { value: "province", label: "Provincia" },
  { value: "department", label: "Departamento" }
];

type WarehouseServiceAreaFormItem = {
  id?: string;
  scopeType: WarehouseServiceAreaScopeValue;
  scopeCode: string;
  scopeLabel?: string;
  priority: string;
  isActive: boolean;
};

type ServiceAreaDraftState = {
  scopeType: WarehouseServiceAreaScopeValue;
  departmentCode: string;
  provinceCode: string;
  districtCode: string;
  priority: string;
  isActive: boolean;
};

type WarehouseFormTab = "general" | "coverage" | "map";

const WAREHOUSE_FORM_TABS: Array<{
  value: WarehouseFormTab;
  label: string;
  description: string;
}> = [
  {
    value: "general",
    label: "General",
    description: "Datos base y ubicación."
  },
  {
    value: "coverage",
    label: "Cobertura",
    description: "Zonas que puede atender."
  },
  {
    value: "map",
    label: "Ubicación exacta",
    description: "Coordenadas opcionales."
  }
];

function statusTone(status: WarehouseStatusValue): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === "active") {
    return "success";
  }

  if (status === "suspended") {
    return "warning";
  }

  return "neutral";
}

function statusLabel(status: WarehouseStatusValue) {
  const labels: Record<WarehouseStatusValue, string> = {
    active: "Activo",
    inactive: "Inactivo",
    suspended: "Suspendido"
  };

  return labels[status];
}

function createEmptyForm(): WarehouseFormState {
  return {
    name: "",
    status: "active",
    priority: "0",
    addressLine1: "",
    addressLine2: "",
    reference: "",
    departmentCode: "",
    departmentName: "",
    provinceCode: "",
    provinceName: "",
    districtCode: "",
    districtName: "",
    latitude: "",
    longitude: "",
    serviceAreas: []
  };
}

function fromWarehouse(warehouse: WarehouseSummary): WarehouseFormState {
  return {
    code: warehouse.code,
    name: warehouse.name,
    status: warehouse.status,
    priority: String(warehouse.priority),
    addressLine1: warehouse.addressLine1,
    addressLine2: warehouse.addressLine2 ?? "",
    reference: warehouse.reference ?? "",
    departmentCode: warehouse.departmentCode,
    departmentName: warehouse.departmentName ?? "",
    provinceCode: warehouse.provinceCode,
    provinceName: warehouse.provinceName ?? "",
    districtCode: warehouse.districtCode,
    districtName: warehouse.districtName ?? "",
    latitude: warehouse.latitude == null ? "" : String(warehouse.latitude),
    longitude: warehouse.longitude == null ? "" : String(warehouse.longitude),
    serviceAreas: (warehouse.serviceAreas ?? []).map((serviceArea) => ({
      id: serviceArea.id,
      scopeType: serviceArea.scopeType,
      scopeCode: serviceArea.scopeCode,
      scopeLabel: serviceArea.scopeLabel,
      priority: String(serviceArea.priority),
      isActive: serviceArea.isActive
    }))
  };
}

function createEmptyServiceAreaDraft(): ServiceAreaDraftState {
  return {
    scopeType: "district",
    departmentCode: "",
    provinceCode: "",
    districtCode: "",
    priority: "0",
    isActive: true
  };
}

function parseCoordinateInput(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  return Number(normalized);
}

function extractCoordinates(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const patterns = [
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /[?&](?:q|query)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match) {
      continue;
    }

    const latitude = Number(match[1]);
    const longitude = Number(match[2]);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      continue;
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      continue;
    }

    return {
      latitude: latitude.toFixed(6).replace(/\.?0+$/, ""),
      longitude: longitude.toFixed(6).replace(/\.?0+$/, "")
    };
  }

  return null;
}

function buildMapsUrl(latitude?: string, longitude?: string) {
  const lat = latitude?.trim();
  const lng = longitude?.trim();

  if (lat && lng) {
    return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`;
  }

  return undefined;
}

function buildPayload(form: WarehouseFormState): WarehouseUpsertInput {
  return {
    code: form.code?.trim().toUpperCase() || undefined,
    name: form.name.trim(),
    status: form.status,
    priority: Number(form.priority),
    countryCode: "PE",
    addressLine1: form.addressLine1.trim(),
    addressLine2: form.addressLine2.trim() || undefined,
    reference: form.reference.trim() || undefined,
    departmentCode: form.departmentCode.trim(),
    departmentName: form.departmentName.trim() || undefined,
    provinceCode: form.provinceCode.trim(),
    provinceName: form.provinceName.trim() || undefined,
    districtCode: form.districtCode.trim(),
    districtName: form.districtName.trim() || undefined,
    latitude: parseCoordinateInput(form.latitude),
    longitude: parseCoordinateInput(form.longitude),
    serviceAreas: form.serviceAreas.map((serviceArea) => ({
      scopeType: serviceArea.scopeType,
      scopeCode: serviceArea.scopeCode,
      priority: Number(serviceArea.priority),
      isActive: serviceArea.isActive
    }))
  };
}

function serviceAreaScopeLabel(scopeType: WarehouseServiceAreaScopeValue) {
  return SERVICE_AREA_SCOPE_OPTIONS.find((option) => option.value === scopeType)?.label ?? scopeType;
}

function serviceAreaScopeDescription(scopeType: WarehouseServiceAreaScopeValue) {
  const descriptions: Record<WarehouseServiceAreaScopeValue, string> = {
    department: "El almacén podrá atender pedidos de cualquier distrito dentro del departamento elegido.",
    province: "El almacén podrá atender pedidos de cualquier distrito dentro de la provincia elegida.",
    district: "El almacén se sugerirá solo para pedidos que vayan a ese distrito.",
    zone: "Esta cobertura representa una zona operativa definida manualmente."
  };

  return descriptions[scopeType];
}

function sortWarehousesByPriority(items: WarehouseSummary[]) {
  return [...items].sort((left, right) => left.priority - right.priority || left.name.localeCompare(right.name));
}

function normalizePriorityPosition(value: string, maxPosition: number) {
  const parsed = Number.parseInt(value.trim(), 10);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.min(Math.max(parsed, 0), Math.max(0, maxPosition));
}

function buildPriorityPreviewRows(input: {
  warehouses: WarehouseSummary[];
  targetWarehouseId?: string | null;
  targetName: string;
  targetStatus: WarehouseStatusValue;
  desiredPosition: number;
}) {
  const others = sortWarehousesByPriority(input.warehouses).filter((warehouse) => warehouse.id !== input.targetWarehouseId);
  const insertAt = Math.min(Math.max(input.desiredPosition, 0), others.length);

  const rows: Array<{
    position: number;
    label: string;
    status: WarehouseStatusValue;
    warehouseId?: string;
    isTarget: boolean;
  }> = [];

  others.forEach((warehouse, index) => {
    if (index === insertAt) {
      rows.push({
        position: rows.length,
        label: input.targetName,
        status: input.targetStatus,
        warehouseId: input.targetWarehouseId ?? undefined,
        isTarget: true
      });
    }

    rows.push({
      position: rows.length,
      label: warehouse.name,
      status: warehouse.status,
      warehouseId: warehouse.id,
      isTarget: false
    });
  });

  if (insertAt >= others.length) {
    rows.push({
      position: rows.length,
      label: input.targetName,
      status: input.targetStatus,
      warehouseId: input.targetWarehouseId ?? undefined,
      isTarget: true
    });
  }

  return rows;
}

export function WarehousesWorkspace() {
  const [warehouses, setWarehouses] = useState<WarehouseSummary[]>([]);
  const [departments, setDepartments] = useState<PeruDepartmentSummary[]>([]);
  const [provinces, setProvinces] = useState<PeruProvinceSummary[]>([]);
  const [districts, setDistricts] = useState<PeruDistrictSummary[]>([]);
  const [serviceAreaProvinces, setServiceAreaProvinces] = useState<PeruProvinceSummary[]>([]);
  const [serviceAreaDistricts, setServiceAreaDistricts] = useState<PeruDistrictSummary[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<WarehouseFormState>(() => createEmptyForm());
  const [serviceAreaDraft, setServiceAreaDraft] = useState<ServiceAreaDraftState>(() => createEmptyServiceAreaDraft());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WarehouseSummary | null>(null);
  const [activeTab, setActiveTab] = useState<WarehouseFormTab>("general");
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [coordinateDraft, setCoordinateDraft] = useState("");

  useEffect(() => {
    let active = true;

    async function loadWarehouses() {
      setLoading(true);
      try {
        const [warehousesResponse, departmentsResponse] = await Promise.all([
          fetchAdminWarehouses(),
          fetchPeruDepartments()
        ]);
        if (!active) {
          return;
        }

        setWarehouses(warehousesResponse.data);
        setDepartments(departmentsResponse.data);
        setError(null);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "No pudimos cargar los almacenes.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadWarehouses();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadProvinces() {
      if (!form.departmentCode) {
        setProvinces([]);
        setDistricts([]);
        return;
      }

      try {
        const response = await fetchPeruProvinces(form.departmentCode);
        if (!active) {
          return;
        }

        setProvinces(response.data);
        setError(null);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "No pudimos cargar las provincias.");
        }
      }
    }

    void loadProvinces();

    return () => {
      active = false;
    };
  }, [form.departmentCode]);

  useEffect(() => {
    let active = true;

    async function loadDistricts() {
      if (!form.provinceCode) {
        setDistricts([]);
        return;
      }

      try {
        const response = await fetchPeruDistricts(form.provinceCode);
        if (!active) {
          return;
        }

        setDistricts(response.data);
        setError(null);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "No pudimos cargar los distritos.");
        }
      }
    }

    void loadDistricts();

    return () => {
      active = false;
    };
  }, [form.provinceCode]);

  useEffect(() => {
    let active = true;

    async function loadServiceAreaProvinces() {
      if (!serviceAreaDraft.departmentCode) {
        setServiceAreaProvinces([]);
        setServiceAreaDistricts([]);
        return;
      }

      try {
        const response = await fetchPeruProvinces(serviceAreaDraft.departmentCode);
        if (!active) {
          return;
        }

        setServiceAreaProvinces(response.data);
        setError(null);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "No pudimos cargar las provincias de cobertura.");
        }
      }
    }

    void loadServiceAreaProvinces();

    return () => {
      active = false;
    };
  }, [serviceAreaDraft.departmentCode]);

  useEffect(() => {
    let active = true;

    async function loadServiceAreaDistricts() {
      if (!serviceAreaDraft.provinceCode) {
        setServiceAreaDistricts([]);
        return;
      }

      try {
        const response = await fetchPeruDistricts(serviceAreaDraft.provinceCode);
        if (!active) {
          return;
        }

        setServiceAreaDistricts(response.data);
        setError(null);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "No pudimos cargar los distritos de cobertura.");
        }
      }
    }

    void loadServiceAreaDistricts();

    return () => {
      active = false;
    };
  }, [serviceAreaDraft.provinceCode]);

  const selectedWarehouse = useMemo(
    () => warehouses.find((warehouse) => warehouse.id === selectedWarehouseId) ?? null,
    [selectedWarehouseId, warehouses]
  );

  const nextSuggestedPriority = useMemo(() => {
    if (!warehouses.length) {
      return "0";
    }

    return String(Math.max(...warehouses.map((warehouse) => warehouse.priority)) + 1);
  }, [warehouses]);

  const metrics = useMemo(() => {
    const activeWarehouses = warehouses.filter((warehouse) => warehouse.status === "active").length;
    const suspendedWarehouses = warehouses.filter((warehouse) => warehouse.status === "suspended").length;
    const serviceAreas = warehouses.reduce((sum, warehouse) => sum + (warehouse.serviceAreas?.length ?? 0), 0);

    return [
      {
        label: "Almacenes",
        value: String(warehouses.length),
        detail: "Orígenes configurables para fulfillment."
      },
      {
        label: "Activos",
        value: String(activeWarehouses),
        detail: "Listos para sugerencia de salida."
      },
      {
        label: "Suspendidos",
        value: String(suspendedWarehouses),
        detail: "Fuera de operación temporal."
      },
      {
        label: "Coberturas",
        value: String(serviceAreas),
        detail: "Service areas declaradas en backend."
      }
    ];
  }, [warehouses]);

  function openCreate() {
    setIsCreating(true);
    setSelectedWarehouseId(null);
    setForm({
      ...createEmptyForm(),
      priority: nextSuggestedPriority
    });
    setServiceAreaDraft(createEmptyServiceAreaDraft());
    setCoordinateDraft("");
    setActiveTab("general");
    setError(null);
    setFeedback(null);
    setModalOpen(true);
  }

  function openEdit(warehouse: WarehouseSummary) {
    setIsCreating(false);
    setSelectedWarehouseId(warehouse.id);
    setForm(fromWarehouse(warehouse));
    setServiceAreaDraft(createEmptyServiceAreaDraft());
    setCoordinateDraft("");
    setActiveTab("general");
    setError(null);
    setFeedback(null);
    setModalOpen(true);
  }

  function openDelete(warehouse: WarehouseSummary) {
    setDeleteTarget(warehouse);
    setDeleteError(null);
    setError(null);
    setFeedback(null);
  }

  async function reloadWarehouses() {
    const response = await fetchAdminWarehouses();
    setWarehouses(response.data);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setFeedback(null);

    try {
      const payload = buildPayload(form);
      const priorityLimit = isCreating ? warehouses.length : Math.max(warehouses.length - 1, 0);
      const desiredPriority = normalizePriorityPosition(form.priority, priorityLimit);
      const reorderWarehouses = async (targetWarehouseId: string, baseMessage: string) => {
        const priorityPlan = buildPriorityPreviewRows({
          warehouses,
          targetWarehouseId,
          targetName: payload.name,
          targetStatus: payload.status,
          desiredPosition: desiredPriority
        });

        for (const row of priorityPlan) {
          if (row.isTarget) {
            await updateAdminWarehouse(targetWarehouseId, {
              ...payload,
              priority: row.position
            });
            continue;
          }

          const currentWarehouse = warehouses.find((warehouse) => warehouse.id === row.warehouseId);
          if (!currentWarehouse || currentWarehouse.priority === row.position) {
            continue;
          }

          await updateAdminWarehouse(currentWarehouse.id, {
            priority: row.position
          });
        }

        setFeedback(`${baseMessage} Se reordenó la prioridad de atención.`);
      };

      if (isCreating || !selectedWarehouseId) {
        const response = await createAdminWarehouse(payload);
        const createdWarehouseId = response.warehouse?.id;
        if (!createdWarehouseId) {
          throw new Error("No pudimos identificar el almacén creado para reordenar prioridades.");
        }

        setSelectedWarehouseId(createdWarehouseId);
        await reorderWarehouses(createdWarehouseId, response.message);
      } else {
        await reorderWarehouses(selectedWarehouseId, "Almacén actualizado.");
      }

      await reloadWarehouses();
      setModalOpen(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No pudimos guardar el almacén.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteWarehouse() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);
    setError(null);
    setFeedback(null);

    try {
      const response = await deleteAdminWarehouse(deleteTarget.id);
      if (selectedWarehouseId === deleteTarget.id) {
        setSelectedWarehouseId(null);
        setModalOpen(false);
      }

      setDeleteTarget(null);
      await reloadWarehouses();
      setFeedback(response.message);
    } catch (deleteFailure) {
      setDeleteError(deleteFailure instanceof Error ? deleteFailure.message : "No pudimos eliminar el almacén.");
    } finally {
      setDeleting(false);
    }
  }

  function handleDepartmentChange(nextCode: string) {
    const department = departments.find((item) => item.code === nextCode);

    setForm((current) => ({
      ...current,
      departmentCode: nextCode,
      departmentName: department?.name ?? "",
      provinceCode: "",
      provinceName: "",
      districtCode: "",
      districtName: ""
    }));
  }

  function handleProvinceChange(nextCode: string) {
    const province = provinces.find((item) => item.code === nextCode);

    setForm((current) => ({
      ...current,
      provinceCode: nextCode,
      provinceName: province?.name ?? "",
      districtCode: "",
      districtName: ""
    }));
  }

  function handleDistrictChange(nextCode: string) {
    const district = districts.find((item) => item.code === nextCode);

    setForm((current) => ({
      ...current,
      districtCode: nextCode,
      districtName: district?.name ?? ""
    }));
  }

  function handleServiceAreaDepartmentChange(nextCode: string) {
    setServiceAreaDraft((current) => ({
      ...current,
      departmentCode: nextCode,
      provinceCode: "",
      districtCode: ""
    }));
  }

  function handleServiceAreaProvinceChange(nextCode: string) {
    setServiceAreaDraft((current) => ({
      ...current,
      provinceCode: nextCode,
      districtCode: ""
    }));
  }

  function handleServiceAreaDistrictChange(nextCode: string) {
    setServiceAreaDraft((current) => ({
      ...current,
      districtCode: nextCode
    }));
  }

  function resolveServiceAreaDraftCode(draft: ServiceAreaDraftState) {
    if (draft.scopeType === "department") {
      return draft.departmentCode;
    }

    if (draft.scopeType === "province") {
      return draft.provinceCode;
    }

    return draft.districtCode;
  }

  function resolveServiceAreaDraftLabel(draft: ServiceAreaDraftState) {
    if (draft.scopeType === "department") {
      return departments.find((department) => department.code === draft.departmentCode)?.name;
    }

    if (draft.scopeType === "province") {
      const province = serviceAreaProvinces.find((item) => item.code === draft.provinceCode);
      const department = departments.find((item) => item.code === draft.departmentCode);
      return [province?.name, department?.name].filter(Boolean).join(", ");
    }

    const district = serviceAreaDistricts.find((item) => item.code === draft.districtCode);
    const province = serviceAreaProvinces.find((item) => item.code === draft.provinceCode);
    const department = departments.find((item) => item.code === draft.departmentCode);
    return [district?.name, province?.name, department?.name].filter(Boolean).join(", ");
  }

  function addServiceArea() {
    const scopeCode = resolveServiceAreaDraftCode(serviceAreaDraft).trim();
    if (!scopeCode) {
      setError(`Selecciona un ${serviceAreaScopeLabel(serviceAreaDraft.scopeType).toLowerCase()} para la cobertura.`);
      return;
    }

    if (
      form.serviceAreas.some(
        (serviceArea) =>
          serviceArea.scopeType === serviceAreaDraft.scopeType &&
          serviceArea.scopeCode === scopeCode
      )
    ) {
      setError("Esa cobertura ya está cargada en este almacén.");
      return;
    }

    setForm((current) => ({
      ...current,
      serviceAreas: [
        ...current.serviceAreas,
        {
          scopeType: serviceAreaDraft.scopeType,
          scopeCode,
          scopeLabel: resolveServiceAreaDraftLabel(serviceAreaDraft),
          priority: serviceAreaDraft.priority.trim() || "0",
          isActive: serviceAreaDraft.isActive
        }
      ]
    }));
    setServiceAreaDraft(createEmptyServiceAreaDraft());
    setError(null);
  }

  function updateServiceArea(index: number, patch: Partial<WarehouseServiceAreaFormItem>) {
    setForm((current) => ({
      ...current,
      serviceAreas: current.serviceAreas.map((serviceArea, serviceAreaIndex) =>
        serviceAreaIndex === index ? { ...serviceArea, ...patch } : serviceArea
      )
    }));
  }

  function removeServiceArea(index: number) {
    setForm((current) => ({
      ...current,
      serviceAreas: current.serviceAreas.filter((_, serviceAreaIndex) => serviceAreaIndex !== index)
    }));
  }

  function handleCoordinateExtraction() {
    const extracted = extractCoordinates(coordinateDraft);
    if (!extracted) {
      setError("No pudimos extraer coordenadas válidas. Pega un enlace de mapa o un texto con formato latitud,longitud.");
      return;
    }

    setForm((current) => ({
      ...current,
      latitude: extracted.latitude,
      longitude: extracted.longitude
    }));
    setError(null);
  }

  function clearCoordinates() {
    setForm((current) => ({
      ...current,
      latitude: "",
      longitude: ""
    }));
    setCoordinateDraft("");
  }

  const mapUrl = buildMapsUrl(form.latitude, form.longitude);
  const hasExactLocation = form.latitude.trim() && form.longitude.trim();
  const coordinatesIncomplete = Boolean(form.latitude.trim()) !== Boolean(form.longitude.trim());
  const serviceAreaPreview = resolveServiceAreaDraftLabel(serviceAreaDraft);
  const priorityMaxPosition = isCreating ? warehouses.length : Math.max(warehouses.length - 1, 0);
  const desiredPriorityPosition = normalizePriorityPosition(form.priority, priorityMaxPosition);
  const priorityReferenceList = sortWarehousesByPriority(warehouses).filter((warehouse) => warehouse.id !== selectedWarehouseId);
  const occupiedPriorityWarehouse = priorityReferenceList[desiredPriorityPosition] ?? null;
  const priorityPreviewRows = buildPriorityPreviewRows({
    warehouses,
    targetWarehouseId: selectedWarehouseId,
    targetName: form.name.trim() || (isCreating ? "Nuevo almacén" : "Este almacén"),
    targetStatus: form.status,
    desiredPosition: desiredPriorityPosition
  });

  const rows = loading
    ? [[<span key="loading" className="text-black/50">Cargando almacenes...</span>, null, null, null, null, null]]
    : warehouses.length
      ? warehouses.map((warehouse) => [
          <div key={`${warehouse.id}-main`}>
            <div className="font-semibold text-[#132016]">{warehouse.name}</div>
            <div className="text-xs text-black/45">{warehouse.addressLine1}</div>
          </div>,
          <div key={`${warehouse.id}-ubigeo`} className="text-sm text-black/65">
            <div>{warehouse.districtName ?? warehouse.districtCode}</div>
            <div className="text-xs text-black/45">
              {warehouse.provinceName ?? warehouse.provinceCode} · {warehouse.departmentName ?? warehouse.departmentCode}
            </div>
            {warehouse.latitude != null && warehouse.longitude != null ? (
              <div className="mt-2">
                <Badge tone="success">Ubicación exacta</Badge>
              </div>
            ) : null}
          </div>,
          String(warehouse.priority),
          <div key={`${warehouse.id}-coverage`} className="space-y-1">
            <div className="text-sm text-[#132016]">{warehouse.serviceAreas?.length ?? 0} cobertura(s)</div>
            {warehouse.serviceAreas?.length ? (
              <div className="text-xs text-black/45">
                {warehouse.serviceAreas
                  .slice(0, 2)
                  .map((serviceArea) => serviceArea.scopeLabel ?? serviceArea.scopeCode)
                  .join(" · ")}
                {warehouse.serviceAreas.length > 2 ? " ..." : ""}
              </div>
            ) : (
              <div className="text-xs text-black/45">Usará el ubigeo del almacén como cobertura implícita.</div>
            )}
          </div>,
          <StatusBadge key={`${warehouse.id}-status`} label={statusLabel(warehouse.status)} tone={statusTone(warehouse.status)} />,
          <div key={`${warehouse.id}-actions`} className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => openEdit(warehouse)}>
              Editar
            </Button>
            <Button size="sm" variant="danger" onClick={() => openDelete(warehouse)}>
              Eliminar
            </Button>
          </div>
        ])
      : [[<span key="empty" className="text-black/50">Todavía no hay almacenes configurados.</span>, null, null, null, null, null]];

  return (
    <div className="space-y-6 pb-10">
      <SectionHeader
        title="Configuración de almacenes"
        description="Define puntos de salida, cobertura y prioridad operativa para pedidos y despachos."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      {error ? (
        <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      {feedback ? (
        <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div>
      ) : null}

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Almacenes configurados</CardTitle>
              <CardDescription>La actualización de stock físico se realiza desde Inventario.</CardDescription>
            </div>
            <Button type="button" size="sm" onClick={openCreate}>
              Nuevo almacén
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs text-black/45">
            <Badge tone="info">{warehouses.length} registros</Badge>
            <span>Aquí dejas lista la base operativa para sugerir desde qué punto debe salir cada pedido.</span>
          </div>
        </CardHeader>
        <CardContent>
          <AdminDataTable
            title="Puntos de salida"
            description="Ubicación operativa y prioridad de uso para la salida de pedidos."
            headers={["Almacén", "Ubigeo", "Prioridad", "Coberturas", "Estado", "Acción"]}
            rows={rows}
          />
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} size="xl">
        <DialogContent className="overflow-hidden">
          <DialogHeader>
            <DialogTitle>{isCreating ? "Nuevo punto de salida" : selectedWarehouse?.name ?? "Editar almacén"}</DialogTitle>
            <DialogDescription>
              Configura desde dónde puede salir la mercadería y en qué zonas puede usarse este almacén.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="max-h-[78vh] overflow-y-auto">
            <form id="warehouse-form" className="space-y-5" onSubmit={(event) => void handleSave(event)}>
              <div className="grid gap-2 rounded-[1.25rem] border border-black/10 bg-[#f7f5ef] p-2 md:grid-cols-3">
                {WAREHOUSE_FORM_TABS.map((tab) => {
                  const isActive = tab.value === activeTab;

                  return (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setActiveTab(tab.value)}
                      className={`rounded-[1rem] px-4 py-3 text-left transition ${
                        isActive
                          ? "bg-[#61a740] text-white shadow-soft"
                          : "text-black/55 hover:bg-white/70 hover:text-[#132016]"
                      }`}
                    >
                      <div className="text-sm font-semibold">{tab.label}</div>
                      <div className={`mt-1 text-xs ${isActive ? "text-white/85" : ""}`}>{tab.description}</div>
                    </button>
                  );
                })}
              </div>

              {activeTab === "general" ? (
                <div className="space-y-5">
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                    <label className="space-y-1.5">
                      <span className="text-sm font-medium text-[#132016]">Nombre del almacén</span>
                      <Input
                        value={form.name}
                        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                        placeholder="Almacén principal"
                      />
                    </label>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium text-[#132016]">Estado</span>
                        <select
                          value={form.status}
                          onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as WarehouseStatusValue }))}
                          className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black/25"
                        >
                          {WAREHOUSE_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {statusLabel(status)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-1.5">
                        <span className="text-sm font-medium text-[#132016]">Prioridad de uso</span>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          max={priorityMaxPosition}
                          value={form.priority}
                          onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
                        />
                        <span className="block text-xs text-black/50">
                          0 = primera opción del sistema cuando varios almacenes pueden atender el pedido.
                        </span>
                        {occupiedPriorityWarehouse ? (
                          <span className="block text-xs text-[#2f6f2f]">
                            La posición {desiredPriorityPosition} hoy la usa <strong>{occupiedPriorityWarehouse.name}</strong>. Al guardar, ese almacén se moverá.
                          </span>
                        ) : null}
                      </label>
                    </div>
                  </div>

                  <div className="rounded-[1.25rem] border border-black/10 bg-[#f7f5ef] p-5">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="text-sm font-medium text-[#132016]">Orden de atención</div>
                        <div className="text-xs text-black/55">
                          Puedes insertar este almacén en cualquier posición. Al guardar, el resto se reordena automáticamente.
                        </div>
                      </div>
                      <Badge tone="info">Posición final: {desiredPriorityPosition}</Badge>
                    </div>

                    <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                      <div className="space-y-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Orden actual</div>
                        {priorityReferenceList.length ? (
                          <div className="space-y-2">
                            {priorityReferenceList.map((warehouse) => (
                              <div
                                key={`priority-ref-${warehouse.id}`}
                                className="flex flex-col gap-3 rounded-[1rem] border border-black/8 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between"
                              >
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-[#132016]">
                                    {warehouse.priority} · {warehouse.name}
                                  </div>
                                  <div className="text-xs text-black/45">
                                    {warehouse.districtName ?? warehouse.districtCode}
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setForm((current) => ({ ...current, priority: String(warehouse.priority) }))}
                                >
                                  Poner aquí
                                </Button>
                              </div>
                            ))}
                            <div className="flex justify-end">
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => setForm((current) => ({ ...current, priority: String(priorityMaxPosition) }))}
                              >
                                Enviar al final
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-[1rem] border border-dashed border-black/10 bg-white px-4 py-4 text-sm text-black/50">
                            Este sería el primer almacén en el orden de atención.
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Así quedará</div>
                        <div className="space-y-2">
                          {priorityPreviewRows.map((row) => (
                            <div
                              key={`priority-preview-${row.position}-${row.warehouseId ?? row.label}`}
                              className={`flex items-center justify-between rounded-[1rem] border px-4 py-3 ${
                                row.isTarget
                                  ? "border-[#61a740]/40 bg-[#eef7e7]"
                                  : "border-black/8 bg-white"
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-[#132016]">
                                  {row.position} · {row.label}
                                </div>
                                <div className="text-xs text-black/45">
                                  {row.isTarget ? "Este almacén" : "Se ajustará automáticamente"}
                                </div>
                              </div>
                              <Badge tone={row.isTarget ? "success" : "neutral"}>
                                {row.isTarget ? "Nuevo orden" : "Existente"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.25rem] border border-black/10 bg-white p-5">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-sm font-medium text-[#132016]">Ubicación base</div>
                        <div className="text-xs text-black/55">
                          Esta es la ubicación principal del almacén. Si no defines coberturas, el sistema usará esta zona como base.
                        </div>
                      </div>
                      <Badge tone="info">País fijo: Perú</Badge>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium text-[#132016]">Departamento</span>
                        <select
                          value={form.departmentCode}
                          onChange={(event) => handleDepartmentChange(event.target.value)}
                          className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black/25"
                        >
                          <option value="">Selecciona un departamento</option>
                          {departments.map((department) => (
                            <option key={department.code} value={department.code}>
                              {department.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-1.5">
                        <span className="text-sm font-medium text-[#132016]">Provincia</span>
                        <select
                          value={form.provinceCode}
                          onChange={(event) => handleProvinceChange(event.target.value)}
                          disabled={!form.departmentCode}
                          className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black/25 disabled:cursor-not-allowed disabled:bg-black/5"
                        >
                          <option value="">Selecciona una provincia</option>
                          {provinces.map((province) => (
                            <option key={province.code} value={province.code}>
                              {province.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-1.5">
                        <span className="text-sm font-medium text-[#132016]">Distrito</span>
                        <select
                          value={form.districtCode}
                          onChange={(event) => handleDistrictChange(event.target.value)}
                          disabled={!form.provinceCode}
                          className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black/25 disabled:cursor-not-allowed disabled:bg-black/5"
                        >
                          <option value="">Selecciona un distrito</option>
                          {districts.map((district) => (
                            <option key={district.code} value={district.code}>
                              {district.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-1.5">
                      <span className="text-sm font-medium text-[#132016]">Dirección principal</span>
                      <Input
                        value={form.addressLine1}
                        onChange={(event) => setForm((current) => ({ ...current, addressLine1: event.target.value }))}
                        placeholder="Av. logística 123"
                      />
                    </label>

                    <label className="space-y-1.5">
                      <span className="text-sm font-medium text-[#132016]">Dirección adicional</span>
                      <Input
                        value={form.addressLine2}
                        onChange={(event) => setForm((current) => ({ ...current, addressLine2: event.target.value }))}
                        placeholder="Piso, referencia o zona"
                      />
                    </label>
                  </div>

                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-[#132016]">Referencia</span>
                    <Input
                      value={form.reference}
                      onChange={(event) => setForm((current) => ({ ...current, reference: event.target.value }))}
                      placeholder="Ejemplo: frente al supermercado o junto a la cochera."
                    />
                  </label>
                </div>
              ) : null}

              {activeTab === "coverage" ? (
                <div className="space-y-5">
                  <div className="rounded-[1.25rem] border border-black/10 bg-white p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="text-base font-semibold text-[#132016]">Zonas que puede atender</div>
                        <div className="mt-1 text-sm text-black/60">
                          Aquí defines en qué zonas este almacén puede usarse para despachar.
                        </div>
                      </div>
                      <Badge tone={form.serviceAreas.length ? "info" : "neutral"}>
                        {form.serviceAreas.length} zona(s) cargada(s)
                      </Badge>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium text-[#132016]">Alcance</span>
                        <select
                          value={serviceAreaDraft.scopeType}
                          onChange={(event) =>
                            setServiceAreaDraft({
                              ...createEmptyServiceAreaDraft(),
                              scopeType: event.target.value as WarehouseServiceAreaScopeValue
                            })
                          }
                          className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black/25"
                        >
                          {SERVICE_AREA_SCOPE_OPTIONS.map((scope) => (
                            <option key={scope.value} value={scope.value}>
                              {scope.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-1.5">
                        <span className="text-sm font-medium text-[#132016]">Departamento</span>
                        <select
                          value={serviceAreaDraft.departmentCode}
                          onChange={(event) => handleServiceAreaDepartmentChange(event.target.value)}
                          className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black/25"
                        >
                          <option value="">Selecciona un departamento</option>
                          {departments.map((department) => (
                            <option key={department.code} value={department.code}>
                              {department.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-1.5">
                        <span className="text-sm font-medium text-[#132016]">Provincia</span>
                        <select
                          value={serviceAreaDraft.provinceCode}
                          onChange={(event) => handleServiceAreaProvinceChange(event.target.value)}
                          disabled={!serviceAreaDraft.departmentCode || serviceAreaDraft.scopeType === "department"}
                          className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black/25 disabled:cursor-not-allowed disabled:bg-black/5"
                        >
                          <option value="">Selecciona una provincia</option>
                          {serviceAreaProvinces.map((province) => (
                            <option key={province.code} value={province.code}>
                              {province.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-1.5">
                        <span className="text-sm font-medium text-[#132016]">Distrito</span>
                        <select
                          value={serviceAreaDraft.districtCode}
                          onChange={(event) => handleServiceAreaDistrictChange(event.target.value)}
                          disabled={!serviceAreaDraft.provinceCode || serviceAreaDraft.scopeType !== "district"}
                          className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black/25 disabled:cursor-not-allowed disabled:bg-black/5"
                        >
                          <option value="">Selecciona un distrito</option>
                          {serviceAreaDistricts.map((district) => (
                            <option key={district.code} value={district.code}>
                              {district.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="mt-4 rounded-[1rem] border border-dashed border-black/10 bg-[#f7f5ef] px-4 py-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Zona seleccionada</div>
                      <div className="mt-2 text-sm font-medium text-[#132016]">
                        {serviceAreaPreview || "Elige el alcance y la zona que este almacén puede atender."}
                      </div>
                      <div className="mt-1 text-xs text-black/55">
                        {serviceAreaScopeDescription(serviceAreaDraft.scopeType)}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium text-[#132016]">Prioridad en esta zona</span>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={serviceAreaDraft.priority}
                          onChange={(event) =>
                            setServiceAreaDraft((current) => ({ ...current, priority: event.target.value }))
                          }
                        />
                        <span className="block text-xs text-black/50">
                          Si dos almacenes cubren la misma zona, gana el número más bajo.
                        </span>
                      </label>

                      <label className="space-y-1.5">
                        <span className="text-sm font-medium text-[#132016]">Estado</span>
                        <select
                          value={serviceAreaDraft.isActive ? "active" : "inactive"}
                          onChange={(event) =>
                            setServiceAreaDraft((current) => ({
                              ...current,
                              isActive: event.target.value === "active"
                            }))
                          }
                          className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black/25"
                        >
                          <option value="active">Activa</option>
                          <option value="inactive">Pausada</option>
                        </select>
                      </label>

                      <div className="flex items-end">
                        <Button type="button" variant="secondary" onClick={addServiceArea}>
                          Agregar zona
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.25rem] border border-black/10 bg-[#f7f5ef] px-4 py-4">
                    <div className="text-sm font-medium text-[#132016]">Cómo funciona la cobertura</div>
                    <div className="mt-2 grid gap-2 text-sm text-black/60 md:grid-cols-2">
                      <p><strong>Alcance:</strong> decide si el almacén cubre un departamento, una provincia o un distrito.</p>
                      <p><strong>Zona:</strong> indica exactamente qué lugar puede atender.</p>
                      <p><strong>Prioridad:</strong> define qué almacén se prefiere si varios pueden despachar a la misma zona.</p>
                      <p><strong>Estado:</strong> permite pausar una cobertura sin borrarla.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {form.serviceAreas.length ? (
                      form.serviceAreas.map((serviceArea, index) => (
                        <div
                          key={`${serviceArea.scopeType}-${serviceArea.scopeCode}-${index}`}
                          className="rounded-[1rem] border border-black/8 bg-white px-4 py-4"
                        >
                          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                            <div className="space-y-2">
                              <div className="text-sm font-semibold text-[#132016]">
                                {serviceArea.scopeLabel ?? serviceArea.scopeCode}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Badge tone="neutral">{serviceAreaScopeLabel(serviceArea.scopeType)}</Badge>
                                <Badge tone={serviceArea.isActive ? "success" : "warning"}>
                                  {serviceArea.isActive ? "Activa" : "Pausada"}
                                </Badge>
                              </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-[160px_180px_auto] xl:min-w-[460px]">
                              <label className="space-y-1">
                                <span className="text-xs font-medium text-black/45">Prioridad</span>
                                <Input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={serviceArea.priority}
                                  onChange={(event) => updateServiceArea(index, { priority: event.target.value })}
                                />
                              </label>

                              <label className="space-y-1">
                                <span className="text-xs font-medium text-black/45">Estado</span>
                                <select
                                  value={serviceArea.isActive ? "active" : "inactive"}
                                  onChange={(event) =>
                                    updateServiceArea(index, { isActive: event.target.value === "active" })
                                  }
                                  className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black/25"
                                >
                                  <option value="active">Activa</option>
                                  <option value="inactive">Pausada</option>
                                </select>
                              </label>

                              <div className="flex items-end justify-end">
                                <Button type="button" variant="secondary" size="sm" onClick={() => removeServiceArea(index)}>
                                  Quitar
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[1rem] border border-dashed border-black/10 px-4 py-4 text-sm text-black/50">
                        Todavía no definiste zonas explícitas. Si guardas así, el sistema usará la ubicación base del almacén como referencia inicial.
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {activeTab === "map" ? (
                <div className="rounded-[1.25rem] border border-black/10 bg-[#f7f5ef] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-[#132016]">Ubicación exacta (opcional)</div>
                      <div className="text-xs text-black/55">
                        Sirve para mejorar la sugerencia entre almacenes. Si no la tienes ahora, basta con guardar la ubicación base.
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {mapUrl ? (
                        <a
                          href={mapUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-[#2f6f2f] underline underline-offset-2"
                        >
                          Ver en Google Maps
                        </a>
                      ) : null}
                      {hasExactLocation ? (
                        <Button type="button" variant="secondary" size="sm" onClick={clearCoordinates}>
                          Limpiar
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <label className="space-y-1.5">
                      <span className="text-sm font-medium text-[#132016]">Pega enlace o coordenadas</span>
                      <div className="flex flex-col gap-3 md:flex-row">
                        <Input
                          value={coordinateDraft}
                          onChange={(event) => setCoordinateDraft(event.target.value)}
                          placeholder="https://maps.google.com/... o -12.121204,-77.030513"
                        />
                        <Button type="button" variant="secondary" onClick={handleCoordinateExtraction}>
                          Extraer coordenadas
                        </Button>
                      </div>
                    </label>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium text-[#132016]">Latitud</span>
                        <Input
                          value={form.latitude}
                          onChange={(event) => setForm((current) => ({ ...current, latitude: event.target.value }))}
                          placeholder="-12.121204"
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium text-[#132016]">Longitud</span>
                        <Input
                          value={form.longitude}
                          onChange={(event) => setForm((current) => ({ ...current, longitude: event.target.value }))}
                          placeholder="-77.030513"
                        />
                      </label>
                    </div>

                    {coordinatesIncomplete ? (
                      <div className="text-xs text-amber-700">
                        Completa latitud y longitud juntas, o deja ambas vacías.
                      </div>
                    ) : null}

                    <div className="text-xs text-black/45">
                      En esta fase no usamos rutas ni ETA. La coordenada solo ayuda a desempatar cuando varios almacenes son viables.
                    </div>
                  </div>
                </div>
              ) : null}
            </form>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="warehouse-form" disabled={saving}>
              {saving ? "Guardando..." : isCreating ? "Crear punto de salida" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)} size="md">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar almacén</DialogTitle>
            <DialogDescription>
              El borrado solo se permite cuando el almacén no tiene stock, movimientos, pedidos, variantes ni traslados.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
              {deleteTarget ? (
                <p>
                  Vas a eliminar <strong>{deleteTarget.name}</strong>. Si ya fue usado en operación, suspéndelo para
                  conservar el historial de producción.
                </p>
              ) : null}
            </div>
            {deleteError ? (
              <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {deleteError}
              </div>
            ) : null}
          </DialogBody>
          <DialogFooter className="justify-between">
            <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button type="button" variant="danger" onClick={() => void handleDeleteWarehouse()} disabled={deleting}>
              {deleting ? "Eliminando..." : "Eliminar almacén"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
