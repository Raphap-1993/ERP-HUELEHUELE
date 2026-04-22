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
  SectionHeader
} from "@huelegood/ui";
import type {
  CommercialAccessAccountType,
  CommercialAccessCreateInput,
  CommercialAccessStatus,
  CommercialAccessSummary,
  CommercialAccessUpdateInput,
  VendorSummary,
  WholesaleLeadSummary
} from "@huelegood/shared";
import {
  createCommercialAccess,
  fetchCommercialAccesses,
  fetchVendors,
  fetchWholesaleLeads,
  resetCommercialAccessPassword,
  updateCommercialAccess,
  updateCommercialAccessStatus
} from "../lib/api";

type AccessFormState = {
  name: string;
  email: string;
  phone: string;
  accountType: CommercialAccessAccountType;
  status: CommercialAccessStatus;
  password: string;
  vendorCode: string;
  wholesaleLeadId: string;
};

type DeliveryState = {
  email: string;
  temporaryPassword?: string;
  message: string;
};

const accessTypes: Array<{ value: CommercialAccessAccountType; label: string; helper: string }> = [
  { value: "seller", label: "Vendedor", helper: "Deriva a /panel-vendedor desde /cuenta." },
  { value: "wholesale", label: "Mayorista", helper: "Deja lista la cuenta B2B para el panel mayorista." }
];

const statusOptions: Array<{ value: CommercialAccessStatus; label: string }> = [
  { value: "active", label: "Activo" },
  { value: "inactive", label: "Inactivo" },
  { value: "suspended", label: "Suspendido" }
];

const emptyForm: AccessFormState = {
  name: "",
  email: "",
  phone: "",
  accountType: "seller",
  status: "active",
  password: "",
  vendorCode: "",
  wholesaleLeadId: ""
};

function formatDate(value?: string) {
  if (!value) {
    return "Sin dato";
  }

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function accessTypeLabel(value: CommercialAccessAccountType) {
  return accessTypes.find((type) => type.value === value)?.label ?? value;
}

function statusLabel(value: CommercialAccessStatus) {
  return statusOptions.find((status) => status.value === value)?.label ?? value;
}

function statusTone(status: CommercialAccessStatus): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === "active") {
    return "success";
  }

  if (status === "suspended") {
    return "danger";
  }

  return "warning";
}

function clean(value: string) {
  const next = value.trim();
  return next || undefined;
}

function buildCreatePayload(form: AccessFormState): CommercialAccessCreateInput {
  return {
    name: form.name.trim(),
    email: form.email.trim(),
    accountType: form.accountType,
    phone: clean(form.phone),
    password: clean(form.password),
    vendorCode: form.accountType === "seller" ? clean(form.vendorCode) : undefined,
    wholesaleLeadId: form.accountType === "wholesale" ? clean(form.wholesaleLeadId) : undefined
  };
}

function buildUpdatePayload(form: AccessFormState): CommercialAccessUpdateInput {
  return {
    name: clean(form.name),
    phone: clean(form.phone),
    vendorCode: form.accountType === "seller" ? clean(form.vendorCode) : undefined,
    wholesaleLeadId: form.accountType === "wholesale" ? clean(form.wholesaleLeadId) : undefined
  };
}

export function CommercialAccessesWorkspace() {
  const [accesses, setAccesses] = useState<CommercialAccessSummary[]>([]);
  const [vendors, setVendors] = useState<VendorSummary[]>([]);
  const [wholesaleLeads, setWholesaleLeads] = useState<WholesaleLeadSummary[]>([]);
  const [typeFilter, setTypeFilter] = useState<"all" | CommercialAccessAccountType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | CommercialAccessStatus>("all");
  const [form, setForm] = useState<AccessFormState>(emptyForm);
  const [selectedAccess, setSelectedAccess] = useState<CommercialAccessSummary | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [modalOpen, setModalOpen] = useState(false);
  const [delivery, setDelivery] = useState<DeliveryState | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);

      try {
        const accessResponse = await fetchCommercialAccesses();
        const [vendorResponse, wholesaleResponse] = await Promise.allSettled([
          fetchVendors(),
          fetchWholesaleLeads()
        ]);
        if (!active) {
          return;
        }

        setAccesses(accessResponse.data);
        setVendors(vendorResponse.status === "fulfilled" ? vendorResponse.value.data : []);
        setWholesaleLeads(wholesaleResponse.status === "fulfilled" ? wholesaleResponse.value.data : []);
        setError(null);
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : "No pudimos cargar los accesos comerciales.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const filteredAccesses = useMemo(
    () =>
      accesses.filter((access) => {
        const typeMatches = typeFilter === "all" || access.accountType === typeFilter;
        const statusMatches = statusFilter === "all" || access.status === statusFilter;
        return typeMatches && statusMatches;
      }),
    [accesses, statusFilter, typeFilter]
  );

  const metrics = useMemo(
    () => [
      { label: "Accesos", value: String(accesses.length), detail: "Cuentas comerciales registradas." },
      { label: "Activos", value: String(accesses.filter((access) => access.status === "active").length), detail: "Listos para iniciar sesión." },
      { label: "Vendedores", value: String(accesses.filter((access) => access.accountType === "seller").length), detail: "Con ruta a panel vendedor." },
      { label: "Mayoristas", value: String(accesses.filter((access) => access.accountType === "wholesale").length), detail: "Preparados para panel B2B." }
    ],
    [accesses]
  );

  function refresh() {
    setRefreshKey((current) => current + 1);
  }

  function openCreateModal() {
    setModalMode("create");
    setSelectedAccess(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  }

  function openEditModal(access: CommercialAccessSummary) {
    setModalMode("edit");
    setSelectedAccess(access);
    setForm({
      name: access.name,
      email: access.email,
      phone: access.phone ?? "",
      accountType: access.accountType,
      status: access.status,
      password: "",
      vendorCode: access.vendorCode ?? "",
      wholesaleLeadId: access.wholesaleLeadId ?? ""
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionLoading(true);
    setError(null);
    setDelivery(null);

    try {
      if (modalMode === "create") {
        const response = await createCommercialAccess(buildCreatePayload(form));
        if (form.status !== "active" && response.access?.id) {
          await updateCommercialAccessStatus(response.access.id, { status: form.status });
        }

        setDelivery({
          email: form.email.trim(),
          temporaryPassword: response.temporaryPassword,
          message: response.message
        });
      } else if (selectedAccess) {
        await updateCommercialAccess(selectedAccess.id, buildUpdatePayload(form));
        if (form.status !== selectedAccess.status) {
          await updateCommercialAccessStatus(selectedAccess.id, { status: form.status });
        }
      }

      setModalOpen(false);
      refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos guardar el acceso comercial.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStatusChange(access: CommercialAccessSummary, status: CommercialAccessStatus) {
    setActionLoading(true);
    setError(null);

    try {
      await updateCommercialAccessStatus(access.id, { status });
      refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos actualizar el estado.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResetPassword(access: CommercialAccessSummary) {
    setActionLoading(true);
    setError(null);
    setDelivery(null);

    try {
      const response = await resetCommercialAccessPassword(access.id);
      setDelivery({
        email: access.email,
        temporaryPassword: response.temporaryPassword,
        message: response.message
      });
      refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos regenerar la contraseña.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <SectionHeader
        title="Accesos comerciales"
        description="Alta, entrega y control de credenciales para vendedores y mayoristas."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="rounded-[1.2rem]">
            <CardContent>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40">{metric.label}</p>
              <p className="mt-3 text-3xl font-semibold text-[#132016]">{metric.value}</p>
              <p className="mt-1 text-sm text-black/55">{metric.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-[1.4rem]">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Entrega de accesos</CardTitle>
            <CardDescription>El login público vive en /cuenta; el rol decide el panel destino.</CardDescription>
          </div>
          <Button onClick={openCreateModal} disabled={actionLoading}>
            Nuevo acceso
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-[220px_220px_1fr]">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Tipo</span>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as "all" | CommercialAccessAccountType)}
                className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/25"
              >
                <option value="all">Todos</option>
                {accessTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Estado</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as "all" | CommercialAccessStatus)}
                className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/25"
              >
                <option value="all">Todos</option>
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </label>
            <div className="rounded-2xl border border-black/8 bg-[#f7f8f4] px-4 py-3 text-sm text-black/58">
              {loading ? "Cargando accesos..." : `${filteredAccesses.length} de ${accesses.length} accesos visibles`}
            </div>
          </div>
        </CardContent>
      </Card>

      {delivery ? (
        <Card className="rounded-[1.4rem] border-[#61a740]/30 bg-[#f4fbf0]">
          <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#132016]">{delivery.message}</p>
              <p className="mt-1 text-sm text-black/55">Cuenta: {delivery.email}</p>
            </div>
            {delivery.temporaryPassword ? (
              <div className="rounded-2xl border border-[#61a740]/20 bg-white px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/40">Contraseña temporal</p>
                <p className="mt-1 font-mono text-sm text-[#132016]">{delivery.temporaryPassword}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <AdminDataTable
        title="Cuentas comerciales"
        description="Usuarios habilitados para operar con credenciales comerciales."
        headers={["Nombre", "Email", "Tipo", "Estado", "Rol", "Referencia", "Último ingreso", "Actualizado", "Acciones"]}
        rows={filteredAccesses.map((access) => [
          <div key={`${access.id}-name`}>
            <p className="font-semibold text-[#132016]">{access.name}</p>
            <p className="text-xs text-black/45">{access.phone ?? "Sin teléfono"}</p>
          </div>,
          access.email,
          <Badge key={`${access.id}-type`} tone={access.accountType === "seller" ? "info" : "neutral"}>
            {accessTypeLabel(access.accountType)}
          </Badge>,
          <select
            key={`${access.id}-status`}
            value={access.status}
            onChange={(event) => { void handleStatusChange(access, event.target.value as CommercialAccessStatus); }}
            disabled={actionLoading}
            className="h-9 rounded-full border border-black/10 bg-white px-3 text-xs font-semibold outline-none focus:border-black/25 disabled:opacity-50"
          >
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>,
          <Badge key={`${access.id}-roles`} tone={statusTone(access.status)}>
            {access.roles.map((role) => role.label).join(", ") || statusLabel(access.status)}
          </Badge>,
          access.accountType === "seller" ? access.vendorCode ?? "Sin código" : access.wholesaleLeadId ?? "Sin lead",
          formatDate(access.lastLoginAt),
          formatDate(access.updatedAt ?? access.createdAt),
          <div key={`${access.id}-actions`} className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => openEditModal(access)} disabled={actionLoading}>
              Editar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { void handleResetPassword(access); }} disabled={actionLoading}>
              Reset clave
            </Button>
            {access.status === "active" ? (
              <Button size="sm" variant="danger" onClick={() => { void handleStatusChange(access, "suspended"); }} disabled={actionLoading}>
                Suspender
              </Button>
            ) : null}
          </div>
        ])}
      />

      {!loading && !filteredAccesses.length ? (
        <Card className="rounded-[1.4rem]">
          <CardContent>
            <p className="text-sm text-black/55">No hay accesos comerciales con los filtros actuales.</p>
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} size="lg">
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{modalMode === "create" ? "Nuevo acceso comercial" : "Editar acceso comercial"}</DialogTitle>
              <DialogDescription>
                {modalMode === "create"
                  ? "Crea credenciales para que el usuario entre por /cuenta."
                  : "Actualiza datos operativos sin cambiar el correo de ingreso."}
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-[#132016]">Nombre</span>
                  <Input
                    required
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Nombre comercial"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-[#132016]">Email</span>
                  <Input
                    type="email"
                    required
                    disabled={modalMode === "edit"}
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="persona@correo.com"
                    className="disabled:bg-black/[0.03] disabled:text-black/45"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-[#132016]">Tipo de cuenta</span>
                  <select
                    value={form.accountType}
                    disabled={modalMode === "edit"}
                    onChange={(event) => setForm((current) => ({ ...current, accountType: event.target.value as CommercialAccessAccountType }))}
                    className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/25 disabled:bg-black/[0.03] disabled:text-black/45"
                  >
                    {accessTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-black/45">{accessTypes.find((type) => type.value === form.accountType)?.helper}</p>
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-[#132016]">Estado</span>
                  <select
                    value={form.status}
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as CommercialAccessStatus }))}
                    className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/25"
                  >
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-[#132016]">Teléfono</span>
                  <Input
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    placeholder="+51 999 000 000"
                  />
                </label>
                {modalMode === "create" ? (
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-[#132016]">Contraseña temporal</span>
                    <Input
                      type="text"
                      value={form.password}
                      onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                      placeholder="Autogenerar si se deja vacío"
                    />
                  </label>
                ) : null}
                {form.accountType === "seller" ? (
                  <label className="space-y-1.5 md:col-span-2">
                    <span className="text-sm font-medium text-[#132016]">Código vendedor</span>
                    {vendors.length ? (
                      <select
                        required
                        value={form.vendorCode}
                        onChange={(event) => setForm((current) => ({ ...current, vendorCode: event.target.value }))}
                        className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/25"
                      >
                        <option value="">Selecciona vendedor aprobado</option>
                        {form.vendorCode && !vendors.some((vendor) => vendor.code === form.vendorCode) ? (
                          <option value={form.vendorCode}>{form.vendorCode}</option>
                        ) : null}
                        {vendors.map((vendor) => (
                          <option key={vendor.id} value={vendor.code}>
                            {vendor.name} · {vendor.code}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        required
                        value={form.vendorCode}
                        onChange={(event) => setForm((current) => ({ ...current, vendorCode: event.target.value }))}
                        placeholder="HH-SELLER"
                      />
                    )}
                    <p className="text-xs text-black/45">El panel vendedor usa este código para mostrar ventas y comisiones.</p>
                  </label>
                ) : (
                  <label className="space-y-1.5 md:col-span-2">
                    <span className="text-sm font-medium text-[#132016]">Lead mayorista</span>
                    {wholesaleLeads.length ? (
                      <select
                        required
                        value={form.wholesaleLeadId}
                        onChange={(event) => setForm((current) => ({ ...current, wholesaleLeadId: event.target.value }))}
                        className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/25"
                      >
                        <option value="">Selecciona lead mayorista</option>
                        {form.wholesaleLeadId && !wholesaleLeads.some((lead) => lead.id === form.wholesaleLeadId) ? (
                          <option value={form.wholesaleLeadId}>{form.wholesaleLeadId}</option>
                        ) : null}
                        {wholesaleLeads.map((lead) => (
                          <option key={lead.id} value={lead.id}>
                            {lead.company} · {lead.contact} · {lead.status}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        required
                        value={form.wholesaleLeadId}
                        onChange={(event) => setForm((current) => ({ ...current, wholesaleLeadId: event.target.value }))}
                        placeholder="wholesale-lead-id"
                      />
                    )}
                    <p className="text-xs text-black/45">El acceso mayorista queda vinculado a la oportunidad B2B revisada por backoffice.</p>
                  </label>
                )}
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading ? "Guardando..." : "Guardar"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={actionLoading}>
                Cancelar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
