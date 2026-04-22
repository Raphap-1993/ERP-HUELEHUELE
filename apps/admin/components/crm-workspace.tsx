"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AdminDataTable,
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
import {
  CHECKOUT_DOCUMENT_TYPE_OPTIONS,
  type CheckoutDocumentType,
  type CustomerIdentityConflictSummary,
  type CustomerDetail,
  type CustomerStatusValue,
  type CustomerSummary
} from "@huelegood/shared";
import {
  createCustomer,
  deleteCustomer,
  fetchCustomer,
  fetchCustomerConflicts,
  fetchCustomers,
  mergeCustomers,
  resolveCustomerConflict,
  updateCustomer
} from "../lib/api";

function formatDate(value?: string) {
  if (!value) {
    return "Sin dato";
  }

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function customerTone(status: CustomerStatusValue): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === "active") {
    return "success";
  }

  if (status === "pending") {
    return "warning";
  }

  if (status === "suspended") {
    return "danger";
  }

  return "neutral";
}

function customerStatusLabel(status: CustomerStatusValue) {
  const labels: Record<CustomerStatusValue, string> = {
    active: "Activo",
    inactive: "Inactivo",
    pending: "Pendiente",
    suspended: "Suspendido"
  };

  return labels[status];
}

function conflictTone(status: CustomerIdentityConflictSummary["status"]): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === "open") {
    return "warning";
  }

  if (status === "merged") {
    return "info";
  }

  if (status === "resolved") {
    return "success";
  }

  return "neutral";
}

function conflictStatusLabel(status: CustomerIdentityConflictSummary["status"]) {
  const labels: Record<CustomerIdentityConflictSummary["status"], string> = {
    open: "Abierto",
    resolved: "Resuelto",
    ignored: "Ignorado",
    merged: "Fusionado"
  };

  return labels[status];
}

function conflictSignalsLabel(conflict: CustomerIdentityConflictSummary) {
  const values = [
    conflict.documentNumber ? `${documentTypeLabel(conflict.documentType)} ${conflict.documentNumber}` : null,
    conflict.email,
    conflict.phone
  ].filter(Boolean);

  return values.length ? values.join(" · ") : "Sin señal fuerte";
}

function documentTypeLabel(value?: CheckoutDocumentType) {
  return CHECKOUT_DOCUMENT_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? "Documento";
}

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function isSyntheticCustomerEmail(value?: string) {
  return Boolean(value?.trim().toLowerCase().endsWith("@customers.huelegood.local"));
}

function customerEmailLabel(value?: string) {
  return value && !isSyntheticCustomerEmail(value) ? value : "Sin email";
}

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

type CustomerFormState = {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  documentType: CheckoutDocumentType | "";
  documentNumber: string;
  marketingOptIn: boolean;
  status: CustomerStatusValue;
  addressLabel: string;
  recipientName: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode: string;
};

function createEmptyCustomerForm(): CustomerFormState {
  return {
    email: "",
    phone: "",
    password: "",
    firstName: "",
    lastName: "",
    documentType: "",
    documentNumber: "",
    marketingOptIn: false,
    status: "active",
    addressLabel: "Principal",
    recipientName: "",
    line1: "",
    line2: "",
    city: "",
    region: "",
    postalCode: "",
    countryCode: "PE"
  };
}

function hasAnyAddressValue(form: CustomerFormState) {
  return Boolean(
    form.addressLabel.trim() ||
      form.recipientName.trim() ||
      form.line1.trim() ||
      form.line2.trim() ||
      form.city.trim() ||
      form.region.trim() ||
      form.postalCode.trim()
  );
}

function formFromCustomer(customer: CustomerDetail): CustomerFormState {
  const address = customer.addresses[0];

  return {
    email: customer.email,
    phone: customer.phone ?? "",
    password: "",
    firstName: customer.firstName,
    lastName: customer.lastName,
    documentType: customer.documentType ?? "",
    documentNumber: customer.documentNumber ?? "",
    marketingOptIn: customer.marketingOptIn,
    status: customer.status,
    addressLabel: address?.label ?? "Principal",
    recipientName: address?.recipientName ?? customer.fullName,
    line1: address?.line1 ?? "",
    line2: address?.line2 ?? "",
    city: address?.city ?? "",
    region: address?.region ?? "",
    postalCode: address?.postalCode ?? "",
    countryCode: address?.countryCode ?? "PE"
  };
}

function buildCustomerPayload(form: CustomerFormState, mode: "create" | "edit") {
  const recipientName = form.recipientName.trim() || `${form.firstName.trim()} ${form.lastName.trim()}`.trim();

  return {
    email: form.email.trim(),
    phone: form.phone.trim() || undefined,
    password: mode === "create" || form.password.trim() ? form.password.trim() : undefined,
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    documentType: form.documentType || undefined,
    documentNumber: form.documentNumber.trim() || undefined,
    marketingOptIn: form.marketingOptIn,
    status: form.status,
    addresses: hasAnyAddressValue(form)
      ? [
          {
            label: form.addressLabel.trim() || "Principal",
            recipientName,
            line1: form.line1.trim(),
            line2: form.line2.trim() || undefined,
            city: form.city.trim(),
            region: form.region.trim(),
            postalCode: form.postalCode.trim(),
            countryCode: form.countryCode.trim() || "PE",
            isDefault: true
          }
        ]
      : []
  };
}

export function CrmWorkspace() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [conflicts, setConflicts] = useState<CustomerIdentityConflictSummary[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [conflictLoading, setConflictLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resolvingConflict, setResolvingConflict] = useState(false);
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [conflictFormError, setConflictFormError] = useState<string | null>(null);
  const [mergeError, setMergeError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomerSummary | null>(null);
  const [selectedConflict, setSelectedConflict] = useState<CustomerIdentityConflictSummary | null>(null);
  const [conflictAction, setConflictAction] = useState<"assign_existing" | "merge" | "ignore">("assign_existing");
  const [conflictWinnerId, setConflictWinnerId] = useState("");
  const [conflictMergeSourceId, setConflictMergeSourceId] = useState("");
  const [conflictNotes, setConflictNotes] = useState("");
  const [mergeSourceCustomer, setMergeSourceCustomer] = useState<CustomerSummary | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [mergeNotes, setMergeNotes] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState<CustomerFormState>(() => createEmptyCustomerForm());

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setConflictLoading(true);

      try {
        const [customersResponse, conflictsResponse] = await Promise.all([fetchCustomers(), fetchCustomerConflicts()]);

        if (!active) {
          return;
        }

        setCustomers(customersResponse.data);
        setConflicts(conflictsResponse.data);
        setError(null);
        setConflictError(null);
      } catch (fetchError) {
        if (active) {
          setError(toErrorMessage(fetchError, "No pudimos cargar clientes."));
          setConflictError(toErrorMessage(fetchError, "No pudimos cargar conflictos de identidad."));
        }
      } finally {
        if (active) {
          setLoading(false);
          setConflictLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const filteredCustomers = useMemo(() => {
    const query = normalizeSearchValue(search);
    if (!query) {
      return customers;
    }

    return customers.filter((customer) =>
      [
        customer.fullName,
        customer.email,
        customer.phone,
        customer.documentNumber,
        customer.defaultAddressSummary
      ]
        .filter(Boolean)
        .some((value) => normalizeSearchValue(String(value)).includes(query))
    );
  }, [customers, search]);

  const openConflicts = useMemo(
    () => conflicts.filter((conflict) => conflict.status === "open"),
    [conflicts]
  );

  const metrics = useMemo(
    () => [
      {
        label: "Clientes",
        value: String(customers.length),
        detail: "Perfiles operativos disponibles."
      },
      {
        label: "Activos",
        value: String(customers.filter((customer) => customer.status === "active").length),
        detail: "Listos para operar."
      },
      {
        label: "Con pedidos",
        value: String(customers.filter((customer) => customer.ordersCount > 0).length),
        detail: "Con historial reciente."
      },
      {
        label: "Conflictos",
        value: String(openConflicts.length),
        detail: "Pendientes de resolución."
      },
      {
        label: "Opt-in marketing",
        value: String(customers.filter((customer) => customer.marketingOptIn).length),
        detail: "Aceptaron comunicaciones."
      }
    ],
    [customers, openConflicts.length]
  );

  async function openCustomerDetail(id: string) {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);

    try {
      const response = await fetchCustomer(id);
      setSelectedCustomer(response.data);
    } catch (fetchError) {
      setSelectedCustomer(null);
      setDetailError(toErrorMessage(fetchError, "No pudimos cargar el detalle del cliente."));
    } finally {
      setDetailLoading(false);
    }
  }

  async function openCreateForm() {
    setFormMode("create");
    setEditingCustomerId(null);
    setForm(createEmptyCustomerForm());
    setFormError(null);
    setFormLoading(false);
    setFormOpen(true);
  }

  async function openEditForm(id: string) {
    setFormMode("edit");
    setEditingCustomerId(id);
    setFormOpen(true);
    setFormLoading(true);
    setFormError(null);
    setDetailOpen(false);

    try {
      const response = await fetchCustomer(id);
      setSelectedCustomer(response.data);
      setForm(formFromCustomer(response.data));
    } catch (fetchError) {
      setForm(createEmptyCustomerForm());
      setFormError(toErrorMessage(fetchError, "No pudimos cargar el cliente para editar."));
    } finally {
      setFormLoading(false);
    }
  }

  async function handleSaveCustomer() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setFormError("Nombre, apellido y email son obligatorios.");
      return;
    }

    if (formMode === "create" && form.password.trim().length < 6) {
      setFormError("La contraseña temporal debe tener al menos 6 caracteres.");
      return;
    }

    if (
      hasAnyAddressValue(form) &&
      (!form.line1.trim() || !form.city.trim() || !form.region.trim() || !form.postalCode.trim())
    ) {
      setFormError("Si registras una dirección, completa dirección, ciudad, región y código postal.");
      return;
    }

    if (formMode === "edit" && !editingCustomerId) {
      setFormError("No encontramos el cliente que intentas actualizar.");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const payload = buildCustomerPayload(form, formMode);
      const response =
        formMode === "create"
          ? await createCustomer(payload)
          : await updateCustomer(editingCustomerId as string, payload);

      setSelectedCustomer(response.data);
      setNotice(formMode === "create" ? "Cliente creado correctamente." : "Cliente actualizado correctamente.");
      setFormOpen(false);
      setDetailOpen(true);
      setRefreshKey((current) => current + 1);
    } catch (saveError) {
      setFormError(toErrorMessage(saveError, "No pudimos guardar el cliente."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCustomer() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    try {
      const response = await deleteCustomer(deleteTarget.id);
      if (selectedCustomer?.id === deleteTarget.id) {
        setSelectedCustomer(null);
        setDetailOpen(false);
      }

      setDeleteTarget(null);
      setNotice(response.message);
      setRefreshKey((current) => current + 1);
    } catch (deleteFailure) {
      setDeleteError(toErrorMessage(deleteFailure, "No pudimos eliminar el cliente."));
    } finally {
      setDeleting(false);
    }
  }

  function openConflictDialog(conflict: CustomerIdentityConflictSummary) {
    setSelectedConflict(conflict);
    setConflictAction("assign_existing");
    setConflictWinnerId(conflict.candidateCustomers[0]?.id ?? "");
    setConflictMergeSourceId(conflict.candidateCustomers[1]?.id ?? "");
    setConflictNotes("");
    setConflictFormError(null);
    setConflictDialogOpen(true);
  }

  function openMergeDialog(customer: CustomerSummary) {
    setMergeSourceCustomer(customer);
    setMergeTargetId("");
    setMergeNotes("");
    setMergeError(null);
  }

  async function handleResolveConflict() {
    if (!selectedConflict) {
      return;
    }

    if (conflictAction === "assign_existing" && !conflictWinnerId) {
      setConflictFormError("Selecciona el cliente canónico que debe quedarse con el pedido.");
      return;
    }

    if (conflictAction === "merge") {
      if (!conflictWinnerId || !conflictMergeSourceId) {
        setConflictFormError("Selecciona cliente destino y cliente fuente para la fusión.");
        return;
      }

      if (conflictWinnerId === conflictMergeSourceId) {
        setConflictFormError("La fusión requiere dos clientes distintos.");
        return;
      }
    }

    setResolvingConflict(true);
    setConflictFormError(null);

    try {
      const response = await resolveCustomerConflict(selectedConflict.id, {
        action: conflictAction,
        winnerCustomerId: conflictAction === "ignore" ? undefined : conflictWinnerId || undefined,
        mergeSourceCustomerId: conflictAction === "merge" ? conflictMergeSourceId : undefined,
        notes: conflictNotes.trim() || undefined,
        actor: "admin"
      });

      setNotice(response.message);
      setConflictDialogOpen(false);
      setSelectedConflict(null);
      setRefreshKey((current) => current + 1);
    } catch (resolveError) {
      setConflictFormError(toErrorMessage(resolveError, "No pudimos resolver el conflicto."));
    } finally {
      setResolvingConflict(false);
    }
  }

  async function handleMergeCustomers() {
    if (!mergeSourceCustomer) {
      return;
    }

    if (!mergeTargetId) {
      setMergeError("Selecciona el cliente destino de la fusión.");
      return;
    }

    if (mergeTargetId === mergeSourceCustomer.id) {
      setMergeError("El cliente destino debe ser distinto del cliente fuente.");
      return;
    }

    setMerging(true);
    setMergeError(null);

    try {
      const response = await mergeCustomers({
        sourceCustomerId: mergeSourceCustomer.id,
        targetCustomerId: mergeTargetId,
        notes: mergeNotes.trim() || undefined,
        actor: "admin"
      });

      setSelectedCustomer(response.data);
      setDetailOpen(true);
      setMergeSourceCustomer(null);
      setNotice("Clientes fusionados correctamente.");
      setRefreshKey((current) => current + 1);
    } catch (mergeFailure) {
      setMergeError(toErrorMessage(mergeFailure, "No pudimos fusionar los clientes."));
    } finally {
      setMerging(false);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <SectionHeader
        title="Clientes"
        description="Perfiles, direcciones base y lectura reciente de pedidos para operación comercial."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <p className="text-sm text-black/55">
            Usa este módulo para crear o corregir clientes del backoffice, revisar conflictos de identidad y operar el perfil canónico sin depender del snapshot del pedido abierto.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Busca por nombre, email, teléfono o documento"
            className="min-w-[280px]"
          />
          <Button type="button" onClick={() => void openCreateForm()}>
            + Nuevo cliente
          </Button>
        </div>
      </div>

      <AdminDataTable
        title="Conflictos de identidad"
        description={
          openConflicts.length
            ? `${openConflicts.length} conflicto(s) abierto(s) esperando decisión operativa.`
            : "No hay conflictos abiertos en este momento."
        }
        headers={["Pedido", "Cliente detectado", "Señales", "Candidatos", "Acciones"]}
        rows={openConflicts.map((conflict) => [
          <div key={`${conflict.id}-order`} className="space-y-1">
            <div className="font-semibold text-[#132016]">{conflict.orderNumber}</div>
            <div className="text-xs text-black/45">{formatDate(conflict.createdAt)}</div>
          </div>,
          <div key={`${conflict.id}-identity`} className="space-y-1">
            <div className="font-semibold text-[#132016]">{conflict.customerName}</div>
            <div className="text-xs text-black/45">{conflict.reason}</div>
          </div>,
          <div key={`${conflict.id}-signals`} className="space-y-2">
            <div className="text-sm text-[#132016]">{conflictSignalsLabel(conflict)}</div>
            <StatusBadge label={conflictStatusLabel(conflict.status)} tone={conflictTone(conflict.status)} />
          </div>,
          <div key={`${conflict.id}-candidates`} className="space-y-2">
            {conflict.candidateCustomers.length ? conflict.candidateCustomers.map((candidate) => (
              <div key={candidate.id} className="rounded-[10px] border border-black/10 bg-[#fbfbf8] px-3 py-2">
                <p className="text-sm font-semibold text-[#132016]">{candidate.fullName}</p>
                <p className="text-xs text-black/45">{customerEmailLabel(candidate.email)}</p>
                <p className="text-xs text-black/40">
                  {candidate.documentNumber
                    ? `${documentTypeLabel(candidate.documentType)} · ${candidate.documentNumber}`
                    : candidate.phone ?? "Sin documento ni teléfono"}
                </p>
              </div>
            )) : <p className="text-sm text-black/45">Sin candidatos disponibles.</p>}
          </div>,
          <div key={`${conflict.id}-actions`} className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openConflictDialog(conflict)}
              className="rounded-[8px] bg-[#1a3a2e] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#2d6a4f]"
            >
              Resolver
            </button>
          </div>
        ])}
      />

      <AdminDataTable
        title="Base de clientes"
        description={`${filteredCustomers.length} cliente(s) visibles${search.trim() ? " para la búsqueda actual" : ""}.`}
        headers={["Cliente", "Contacto", "Estado", "Pedidos", "Dirección", "Acciones"]}
        rows={filteredCustomers.map((customer) => [
          <div key={`${customer.id}-identity`} className="space-y-1">
            <div className="font-semibold text-[#132016]">{customer.fullName}</div>
            <div className="text-xs text-black/45">{customerEmailLabel(customer.email)}</div>
            {customer.documentNumber ? (
              <div className="text-xs text-black/40">{documentTypeLabel(customer.documentType)} · {customer.documentNumber}</div>
            ) : null}
          </div>,
          <div key={`${customer.id}-contact`} className="space-y-1">
            <div className="text-sm text-[#132016]">{customer.phone ?? "Sin teléfono"}</div>
            <div className="text-xs text-black/45">
              {customer.marketingOptIn ? "Con opt-in marketing" : "Sin opt-in marketing"}
            </div>
          </div>,
          <StatusBadge
            key={`${customer.id}-status`}
            label={customerStatusLabel(customer.status)}
            tone={customerTone(customer.status)}
          />,
          <div key={`${customer.id}-orders`} className="space-y-1">
            <div className="font-semibold text-[#132016]">{customer.ordersCount}</div>
            <div className="text-xs text-black/45">
              {customer.lastOrderAt ? formatDate(customer.lastOrderAt) : "Sin pedidos todavía"}
            </div>
          </div>,
          <div key={`${customer.id}-address`} className="text-sm text-black/65">
            {customer.defaultAddressSummary ?? "Sin dirección principal"}
          </div>,
          <div key={`${customer.id}-actions`} className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void openCustomerDetail(customer.id)}
              className="rounded-[8px] bg-[#1a3a2e] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#2d6a4f]"
            >
              Ver
            </button>
            <button
              type="button"
              onClick={() => void openEditForm(customer.id)}
              className="rounded-[8px] border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-[#132016] transition hover:border-[#52b788] hover:bg-[#f5fbf7]"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => openMergeDialog(customer)}
              className="rounded-[8px] border border-[#d9e7dd] bg-[#eef7f1] px-3 py-1.5 text-xs font-medium text-[#1a3a2e] transition hover:bg-[#e3f2e8]"
            >
              Fusionar
            </button>
            <button
              type="button"
              onClick={() => {
                setDeleteError(null);
                setDeleteTarget(customer);
              }}
              className="rounded-[8px] border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
            >
              Eliminar
            </button>
          </div>
        ])}
      />

      <Card>
        <CardHeader>
          <CardTitle>Lectura operativa</CardTitle>
          <CardDescription>Cómo se usa este módulo dentro del backoffice.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-black/65">
          <p>1. El perfil del cliente vive en PostgreSQL y se normaliza desde los pedidos para evitar duplicidad.</p>
          <p>2. Cuando existe documento, CRM prioriza esa identidad; email y teléfono quedan como señales secundarias.</p>
          <p>3. Crear y editar aquí corrige el perfil canónico sin reescribir el snapshot histórico de cada pedido.</p>
        </CardContent>
      </Card>

      {notice ? <p className="text-sm text-emerald-700">{notice}</p> : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {conflictError ? <p className="text-sm text-rose-700">{conflictError}</p> : null}
      {loading ? <p className="text-sm text-black/55">Cargando clientes...</p> : null}
      {conflictLoading ? <p className="text-sm text-black/55">Cargando conflictos de identidad...</p> : null}

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} size="lg">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle del cliente</DialogTitle>
            <DialogDescription>Perfil, direcciones y pedidos recientes vinculados operativamente.</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-5">
            {detailLoading ? <p className="text-sm text-black/55">Cargando detalle...</p> : null}
            {detailError ? <p className="text-sm text-rose-700">{detailError}</p> : null}
            {!detailLoading && !detailError && selectedCustomer ? (
              <div className="space-y-5">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: "Email", value: customerEmailLabel(selectedCustomer.email) },
                    { label: "Teléfono", value: selectedCustomer.phone ?? "Sin teléfono" },
                    { label: "Estado", value: customerStatusLabel(selectedCustomer.status) },
                    { label: "Pedidos", value: String(selectedCustomer.ordersCount) }
                  ].map((item) => (
                    <div key={item.label} className="rounded-[14px] border border-black/10 bg-[#fbfbf8] p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-black/40">{item.label}</p>
                      <p className="mt-2 text-sm font-semibold text-[#132016]">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <Card>
                    <CardHeader>
                      <CardTitle>Perfil</CardTitle>
                      <CardDescription>Datos base y lectura comercial.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-black/65">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-black/40">Nombre</p>
                        <p className="mt-1 font-medium text-[#132016]">{selectedCustomer.fullName}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-black/40">Documento</p>
                        <p className="mt-1">
                          {selectedCustomer.documentNumber
                            ? `${documentTypeLabel(selectedCustomer.documentType)} · ${selectedCustomer.documentNumber}`
                            : "Sin documento"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-black/40">Marketing</p>
                        <p className="mt-1">{selectedCustomer.marketingOptIn ? "Con opt-in" : "Sin opt-in"}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-black/40">Último pedido</p>
                        <p className="mt-1">{selectedCustomer.lastOrderAt ? formatDate(selectedCustomer.lastOrderAt) : "Sin historial"}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Direcciones</CardTitle>
                      <CardDescription>Base persistida en customer profile.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-black/65">
                      {selectedCustomer.addresses.length ? selectedCustomer.addresses.map((address) => (
                        <div key={address.id} className="rounded-[12px] border border-black/10 bg-[#fbfbf8] p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-[#132016]">{address.label}</p>
                            {address.isDefault ? (
                              <span className="rounded-full bg-[#eef7f1] px-2.5 py-1 text-[11px] font-semibold text-[#2d6a4f]">
                                Principal
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2">{address.recipientName}</p>
                          <p>{address.line1}{address.line2 ? ` · ${address.line2}` : ""}</p>
                          <p>{address.city}, {address.region} · {address.postalCode}</p>
                        </div>
                      )) : <p>Este cliente todavía no tiene direcciones registradas.</p>}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Pedidos recientes</CardTitle>
                    <CardDescription>Lectura operativa obtenida desde snapshots de pedidos.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedCustomer.recentOrders.length ? selectedCustomer.recentOrders.map((order) => (
                      <div key={order.orderNumber} className="flex flex-col gap-3 rounded-[12px] border border-black/10 bg-[#fbfbf8] p-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold text-[#132016]">{order.orderNumber}</p>
                          <p className="text-sm text-black/55">{order.customerName}</p>
                          <p className="text-xs text-black/45">{formatDate(order.createdAt)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge label={order.orderStatus} tone="info" />
                          <StatusBadge label={order.paymentStatus} tone={order.paymentStatus === "paid" ? "success" : "warning"} />
                          <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#132016]">
                            S/ {order.total.toFixed(0)}
                          </div>
                        </div>
                      </div>
                    )) : <p className="text-sm text-black/55">No encontramos pedidos recientes asociados a este cliente.</p>}
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </DialogBody>
          <DialogFooter className="justify-between">
            <Button type="button" variant="secondary" onClick={() => setDetailOpen(false)}>
              Cerrar
            </Button>
            {selectedCustomer ? (
              <Button type="button" onClick={() => void openEditForm(selectedCustomer.id)}>
                Editar cliente
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={formOpen} onClose={() => !saving && setFormOpen(false)} size="lg">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formMode === "create" ? "Nuevo cliente" : "Editar cliente"}</DialogTitle>
            <DialogDescription>
              Mantén aquí el perfil persistido del cliente. La contraseña solo es obligatoria al crear.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-5">
            {formLoading ? <p className="text-sm text-black/55">Cargando formulario...</p> : null}
            {!formLoading ? (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    { key: "firstName", label: "Nombre *", type: "text", placeholder: "Pedro" },
                    { key: "lastName", label: "Apellido *", type: "text", placeholder: "García" },
                    { key: "email", label: "Email *", type: "email", placeholder: "pedro@example.com" },
                    { key: "phone", label: "Teléfono", type: "text", placeholder: "+51 999 000 000" },
                    { key: "password", label: formMode === "create" ? "Contraseña temporal *" : "Nueva contraseña", type: "text", placeholder: formMode === "create" ? "Min. 6 caracteres" : "Déjala vacía para mantenerla" }
                  ].map(({ key, label, type, placeholder }) => (
                    <div key={key}>
                      <label className="mb-1 block text-[11px] text-black/50">{label}</label>
                      <Input
                        type={type}
                        value={form[key as keyof CustomerFormState] as string}
                        onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                        placeholder={placeholder}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="mb-1 block text-[11px] text-black/50">Tipo de documento</label>
                    <select
                      value={form.documentType}
                      onChange={(event) => setForm((current) => ({ ...current, documentType: event.target.value as CheckoutDocumentType | "" }))}
                      className="w-full rounded-[10px] border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#52b788]"
                    >
                      <option value="">Sin documento</option>
                      {CHECKOUT_DOCUMENT_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-black/50">Número de documento</label>
                    <Input
                      value={form.documentNumber}
                      onChange={(event) => setForm((current) => ({ ...current, documentNumber: event.target.value }))}
                      placeholder="12345678"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-black/50">Estado</label>
                    <select
                      value={form.status}
                      onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as CustomerStatusValue }))}
                      className="w-full rounded-[10px] border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#52b788]"
                    >
                      <option value="active">Activo</option>
                      <option value="pending">Pendiente</option>
                      <option value="inactive">Inactivo</option>
                      <option value="suspended">Suspendido</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 rounded-[10px] border border-black/10 bg-[#fbfbf8] px-3 py-2 text-sm text-[#132016]">
                    <input
                      type="checkbox"
                      checked={form.marketingOptIn}
                      onChange={(event) => setForm((current) => ({ ...current, marketingOptIn: event.target.checked }))}
                    />
                    Permitir comunicaciones comerciales
                  </label>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-black/45">Dirección principal</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {[
                      { key: "addressLabel", label: "Etiqueta", placeholder: "Principal" },
                      { key: "recipientName", label: "Recibe", placeholder: "Pedro García" },
                      { key: "line1", label: "Dirección", placeholder: "Av. Larco 123" },
                      { key: "line2", label: "Referencia", placeholder: "Dpto 402" },
                      { key: "city", label: "Ciudad", placeholder: "Lima" },
                      { key: "region", label: "Región", placeholder: "Lima" },
                      { key: "postalCode", label: "Código postal", placeholder: "15074" },
                      { key: "countryCode", label: "País", placeholder: "PE" }
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="mb-1 block text-[11px] text-black/50">{label}</label>
                        <Input
                          value={form[key as keyof CustomerFormState] as string}
                          onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                          placeholder={placeholder}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
            {formError ? <p className="text-sm text-rose-700">{formError}</p> : null}
          </DialogBody>
          <DialogFooter className="justify-between">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void handleSaveCustomer()} disabled={saving || formLoading}>
              {saving ? "Guardando..." : formMode === "create" ? "Crear cliente" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={conflictDialogOpen} onClose={() => !resolvingConflict && setConflictDialogOpen(false)} size="lg">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver conflicto de identidad</DialogTitle>
            <DialogDescription>
              Decide qué cliente debe quedar asociado al pedido o marca el conflicto como ignorado.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-5">
            {selectedConflict ? (
              <>
                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    { label: "Pedido", value: selectedConflict.orderNumber },
                    { label: "Cliente detectado", value: selectedConflict.customerName },
                    { label: "Señales", value: conflictSignalsLabel(selectedConflict) }
                  ].map((item) => (
                    <div key={item.label} className="rounded-[14px] border border-black/10 bg-[#fbfbf8] p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-black/40">{item.label}</p>
                      <p className="mt-2 text-sm font-semibold text-[#132016]">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[11px] text-black/50">Acción</label>
                    <select
                      value={conflictAction}
                      onChange={(event) => setConflictAction(event.target.value as "assign_existing" | "merge" | "ignore")}
                      className="w-full rounded-[10px] border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#52b788]"
                    >
                      <option value="assign_existing">Asignar a cliente existente</option>
                      <option value="merge">Fusionar clientes y asignar</option>
                      <option value="ignore">Ignorar conflicto</option>
                    </select>
                  </div>

                  {conflictAction !== "ignore" ? (
                    <div>
                      <label className="mb-1 block text-[11px] text-black/50">Cliente destino</label>
                      <select
                        value={conflictWinnerId}
                        onChange={(event) => setConflictWinnerId(event.target.value)}
                        className="w-full rounded-[10px] border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#52b788]"
                      >
                        <option value="">Selecciona un cliente</option>
                        {selectedConflict.candidateCustomers.map((candidate) => (
                          <option key={candidate.id} value={candidate.id}>
                            {candidate.fullName} · {candidate.documentNumber ?? candidate.phone ?? customerEmailLabel(candidate.email)}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}

                  {conflictAction === "merge" ? (
                    <div>
                      <label className="mb-1 block text-[11px] text-black/50">Cliente fuente</label>
                      <select
                        value={conflictMergeSourceId}
                        onChange={(event) => setConflictMergeSourceId(event.target.value)}
                        className="w-full rounded-[10px] border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#52b788]"
                      >
                        <option value="">Selecciona un cliente a fusionar</option>
                        {selectedConflict.candidateCustomers
                          .filter((candidate) => candidate.id !== conflictWinnerId)
                          .map((candidate) => (
                            <option key={candidate.id} value={candidate.id}>
                              {candidate.fullName} · {candidate.documentNumber ?? candidate.phone ?? customerEmailLabel(candidate.email)}
                            </option>
                          ))}
                      </select>
                    </div>
                  ) : null}

                  <div>
                    <label className="mb-1 block text-[11px] text-black/50">Notas operativas</label>
                    <Input
                      value={conflictNotes}
                      onChange={(event) => setConflictNotes(event.target.value)}
                      placeholder="Opcional. Deja contexto de la decisión."
                    />
                  </div>
                </div>
              </>
            ) : null}
            {conflictFormError ? <p className="text-sm text-rose-700">{conflictFormError}</p> : null}
          </DialogBody>
          <DialogFooter className="justify-between">
            <Button type="button" variant="secondary" onClick={() => setConflictDialogOpen(false)} disabled={resolvingConflict}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void handleResolveConflict()} disabled={resolvingConflict}>
              {resolvingConflict ? "Guardando..." : "Guardar decisión"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(mergeSourceCustomer)} onClose={() => !merging && setMergeSourceCustomer(null)} size="lg">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fusionar clientes</DialogTitle>
            <DialogDescription>
              Fusiona el cliente fuente dentro de un cliente canónico y mueve sus referencias operativas.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-5">
            {mergeSourceCustomer ? (
              <>
                <div className="rounded-[14px] border border-black/10 bg-[#fbfbf8] p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-black/40">Cliente fuente</p>
                  <p className="mt-2 text-sm font-semibold text-[#132016]">{mergeSourceCustomer.fullName}</p>
                  <p className="mt-1 text-xs text-black/45">{customerEmailLabel(mergeSourceCustomer.email)}</p>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] text-black/50">Cliente destino</label>
                  <select
                    value={mergeTargetId}
                    onChange={(event) => setMergeTargetId(event.target.value)}
                    className="w-full rounded-[10px] border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#52b788]"
                  >
                    <option value="">Selecciona el cliente canónico</option>
                    {customers
                      .filter((customer) => customer.id !== mergeSourceCustomer.id)
                      .map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.fullName} · {customer.documentNumber ?? customer.phone ?? customerEmailLabel(customer.email)}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] text-black/50">Notas operativas</label>
                  <Input
                    value={mergeNotes}
                    onChange={(event) => setMergeNotes(event.target.value)}
                    placeholder="Opcional. Explica por qué estás fusionando."
                  />
                </div>
              </>
            ) : null}
            {mergeError ? <p className="text-sm text-rose-700">{mergeError}</p> : null}
          </DialogBody>
          <DialogFooter className="justify-between">
            <Button type="button" variant="secondary" onClick={() => setMergeSourceCustomer(null)} disabled={merging}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void handleMergeCustomers()} disabled={merging}>
              {merging ? "Fusionando..." : "Fusionar clientes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)} size="sm">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar cliente</DialogTitle>
            <DialogDescription>
              Esta acción elimina el perfil persistido del cliente. No toca los snapshots históricos de pedidos.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <p className="text-sm text-black/65">
              {deleteTarget ? `Vas a eliminar a ${deleteTarget.fullName}.` : ""}
            </p>
            {deleteError ? <p className="text-sm text-rose-700">{deleteError}</p> : null}
          </DialogBody>
          <DialogFooter className="justify-between">
            <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void handleDeleteCustomer()} disabled={deleting}>
              {deleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
