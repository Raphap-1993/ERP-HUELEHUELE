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
  Input,
  MetricCard,
  SectionHeader,
  Separator,
  StatusBadge
} from "@huelegood/ui";
import type { VendorApplicationSummary, VendorCodeSummary, VendorStatus, VendorSummary } from "@huelegood/shared";
import {
  approveVendorApplication,
  fetchVendorApplications,
  fetchVendorCodes,
  fetchVendors,
  rejectVendorApplication
} from "../lib/api";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(value?: string) {
  if (!value) {
    return "Sin dato";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function applicationTone(status: VendorApplicationSummary["status"]): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === "approved" || status === "onboarded") {
    return "success";
  }

  if (status === "rejected") {
    return "danger";
  }

  if (status === "screening") {
    return "warning";
  }

  return "info";
}

function vendorTone(status: VendorStatus): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === "active") {
    return "success";
  }

  if (status === "suspended") {
    return "danger";
  }

  return "warning";
}

export function VendorsWorkspace() {
  const [applications, setApplications] = useState<VendorApplicationSummary[]>([]);
  const [vendors, setVendors] = useState<VendorSummary[]>([]);
  const [codes, setCodes] = useState<VendorCodeSummary[]>([]);
  const [reviewer, setReviewer] = useState("seller_manager");
  const [reviewNotes, setReviewNotes] = useState("Revisión comercial.");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);

      try {
        const [applicationsResponse, vendorsResponse, codesResponse] = await Promise.all([
          fetchVendorApplications(),
          fetchVendors(),
          fetchVendorCodes()
        ]);

        if (!active) {
          return;
        }

        setApplications(applicationsResponse.data);
        setVendors(vendorsResponse.data);
        setCodes(codesResponse.data);
        setError(null);
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : "No pudimos cargar los vendedores.");
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

  const metrics = useMemo(
    () => [
      {
        label: "Postulaciones",
        value: String(applications.length),
        detail: "Solicitudes registradas en el sistema."
      },
      {
        label: "En screening",
        value: String(applications.filter((application) => application.status === "screening").length),
        detail: "Revisión comercial en curso."
      },
      {
        label: "Vendedores activos",
        value: String(vendors.filter((vendor) => vendor.status === "active").length),
        detail: "Códigos habilitados para atribución."
      },
      {
        label: "Códigos visibles",
        value: String(codes.length),
        detail: "Códigos listos para checkout y comisiones."
      }
    ],
    [applications.length, codes.length, vendors]
  );

  function refresh() {
    setRefreshKey((current) => current + 1);
  }

  async function handleReview(applicationId: string, decision: "approve" | "reject") {
    setActionLoading(true);
    setError(null);

    try {
      const payload = {
        reviewer: reviewer.trim() || undefined,
        notes: reviewNotes.trim() || undefined
      };

      if (decision === "approve") {
        await approveVendorApplication(applicationId, payload);
      } else {
        await rejectVendorApplication(applicationId, payload);
      }

      refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos procesar la postulación.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <SectionHeader
        title="Vendedores"
        description="Postulaciones, códigos comerciales, estado operativo y snapshot de comisiones."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revisión comercial</CardTitle>
          <CardDescription>Aprobar o rechazar postulaciones con un criterio común y trazable.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="vendor-reviewer">
                Revisor
              </label>
              <Input
                id="vendor-reviewer"
                value={reviewer}
                onChange={(event) => setReviewer(event.target.value)}
                placeholder="seller_manager"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="vendor-review-notes">
                Notas de revisión
              </label>
              <Input
                id="vendor-review-notes"
                value={reviewNotes}
                onChange={(event) => setReviewNotes(event.target.value)}
                placeholder="Notas de la decisión"
              />
            </div>
            <p className="text-sm text-black/55">
              El flujo deja traza de la decisión y actualiza el vendedor si la postulación se aprueba.
            </p>
          </div>
          <div className="rounded-3xl border border-black/10 bg-black/[0.02] p-4">
            <div className="space-y-3">
              {applications.slice(0, 3).map((application) => (
                <div key={application.id} className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-[#132016]">{application.name}</div>
                      <p className="text-sm text-black/55">{application.email}</p>
                    </div>
                    <StatusBadge label={application.status} tone={applicationTone(application.status)} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleReview(application.id, "approve")}
                      disabled={actionLoading || application.status === "approved" || application.status === "rejected"}
                    >
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleReview(application.id, "reject")}
                      disabled={actionLoading || application.status === "approved" || application.status === "rejected"}
                    >
                      Rechazar
                    </Button>
                  </div>
                </div>
              ))}
              {!applications.length ? <p className="text-sm text-black/55">No hay postulaciones disponibles.</p> : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <AdminDataTable
        title="Postulaciones"
        description="Estado de cada solicitud y resultado de onboarding."
        headers={["Nombre", "Email", "Ciudad", "Estado", "Origen", "Acciones"]}
        rows={applications.map((application) => [
          application.name,
          application.email,
          application.city,
          <StatusBadge key={`${application.id}-status`} label={application.status} tone={applicationTone(application.status)} />,
          application.source,
          <div key={`${application.id}-actions`} className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => handleReview(application.id, "approve")}
              disabled={actionLoading || application.status === "approved" || application.status === "rejected"}
            >
              Aprobar
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleReview(application.id, "reject")}
              disabled={actionLoading || application.status === "approved" || application.status === "rejected"}
            >
              Rechazar
            </Button>
          </div>
        ])}
      />

      <AdminDataTable
        title="Vendedores"
        description="Consolidado operativo con ventas, comisiones y estado comercial."
        headers={["Nombre", "Código", "Estado", "Ciudad", "Ventas", "Comisiones", "Pendientes", "Pagadas"]}
        rows={vendors.map((vendor) => [
          vendor.name,
          vendor.code,
          <StatusBadge key={`${vendor.code}-status`} label={vendor.status} tone={vendorTone(vendor.status)} />,
          vendor.city ?? "Sin ciudad",
          formatCurrency(vendor.sales),
          formatCurrency(vendor.commissions),
          formatCurrency(vendor.pendingCommissions),
          formatCurrency(vendor.paidCommissions)
        ])}
      />

      <AdminDataTable
        title="Códigos comerciales"
        description="Trazabilidad rápida del código aplicado a cada vendedor."
        headers={["Código", "Nombre", "Estado", "Aprobado", "Actualizado"]}
        rows={codes.map((code) => [
          code.code,
          code.name,
          <StatusBadge key={`${code.code}-badge`} label={code.status} tone={vendorTone(code.status)} />,
          formatDate(code.approvedAt),
          formatDate(code.updatedAt)
        ])}
      />

      <Card>
        <CardHeader>
          <CardTitle>Reglas del flujo</CardTitle>
          <CardDescription>
            El vendedor se habilita desde postulación, y la atribución queda lista para checkout y liquidación.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-black/65">
          <p>1. El cliente envía su postulación desde el storefront.</p>
          <p>2. Operación revisa la solicitud y aprueba o rechaza.</p>
          <p>3. Si se aprueba, el vendedor recibe código y snapshot comercial.</p>
          <p>4. Las ventas con código alimentan el módulo de comisiones.</p>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {loading ? <p className="text-sm text-black/55">Cargando vendedores...</p> : null}
      <Separator />
    </div>
  );
}
