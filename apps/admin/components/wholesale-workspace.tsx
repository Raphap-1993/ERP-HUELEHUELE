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
  StatusBadge,
  Textarea
} from "@huelegood/ui";
import { WholesaleLeadStatus, WholesaleQuoteStatus, type WholesaleLeadSummary, type WholesalePlan, type WholesaleQuoteAdminSummary } from "@huelegood/shared";
import {
  createWholesaleQuote,
  fetchWholesaleLeads,
  fetchWholesaleQuotes,
  fetchWholesaleTiers,
  updateWholesaleLeadStatus
} from "../lib/api";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
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

function leadTone(status: WholesaleLeadStatus): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === WholesaleLeadStatus.Won) {
    return "success";
  }

  if (status === WholesaleLeadStatus.Lost) {
    return "danger";
  }

  if (
    status === WholesaleLeadStatus.Qualified ||
    status === WholesaleLeadStatus.Quoted ||
    status === WholesaleLeadStatus.Negotiating
  ) {
    return "warning";
  }

  return "info";
}

function quoteTone(status: WholesaleQuoteStatus): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === WholesaleQuoteStatus.Accepted) {
    return "success";
  }

  if (status === WholesaleQuoteStatus.Rejected || status === WholesaleQuoteStatus.Expired) {
    return "danger";
  }

  if (status === WholesaleQuoteStatus.Sent) {
    return "warning";
  }

  return "info";
}

export function WholesaleWorkspace() {
  const [leads, setLeads] = useState<WholesaleLeadSummary[]>([]);
  const [quotes, setQuotes] = useState<WholesaleQuoteAdminSummary[]>([]);
  const [tiers, setTiers] = useState<WholesalePlan[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("0");
  const [quoteStatus, setQuoteStatus] = useState<WholesaleQuoteStatus>(WholesaleQuoteStatus.Sent);
  const [quoteNotes, setQuoteNotes] = useState("Cotización preparada desde ventas.");
  const [reviewer, setReviewer] = useState("ventas");
  const [reviewNotes, setReviewNotes] = useState("Revisión comercial mayorista.");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      try {
        const [leadsResponse, quotesResponse, tiersResponse] = await Promise.all([
          fetchWholesaleLeads(),
          fetchWholesaleQuotes(),
          fetchWholesaleTiers()
        ]);

        if (!active) {
          return;
        }

        setLeads(leadsResponse.data);
        setQuotes(quotesResponse.data);
        setTiers(tiersResponse.data);
        setError(null);

        if (!selectedLeadId && leadsResponse.data[0]) {
          setSelectedLeadId(leadsResponse.data[0].id);
          setQuoteAmount(String(Math.max(1, Math.round(leadsResponse.data[0].quoteCount ? 9850 : 4500))));
        }
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : "No pudimos cargar mayoristas.");
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

  useEffect(() => {
    if (!leads.length) {
      setSelectedLeadId("");
      return;
    }

    if (!selectedLeadId || !leads.some((lead) => lead.id === selectedLeadId)) {
      setSelectedLeadId(leads[0].id);
    }
  }, [leads, selectedLeadId]);

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) ?? null,
    [leads, selectedLeadId]
  );

  const metrics = useMemo(
    () => [
      {
        label: "Leads",
        value: String(leads.length),
        detail: "Oportunidades capturadas."
      },
      {
        label: "Calificados",
        value: String(leads.filter((lead) => lead.status === WholesaleLeadStatus.Qualified).length),
        detail: "Listos para cotizar."
      },
      {
        label: "Cotizados",
        value: String(
          leads.filter(
            (lead) => lead.status === WholesaleLeadStatus.Quoted || lead.status === WholesaleLeadStatus.Negotiating
          ).length
        ),
        detail: "En seguimiento comercial."
      },
      {
        label: "Ganados",
        value: String(leads.filter((lead) => lead.status === WholesaleLeadStatus.Won).length),
        detail: "Convertidos a oportunidad cerrada."
      }
    ],
    [leads]
  );

  function refresh() {
    setRefreshKey((current) => current + 1);
  }

  async function handleStatusChange(leadId: string, status: WholesaleLeadStatus) {
    setActionLoading(true);
    setError(null);

    try {
      await updateWholesaleLeadStatus(leadId, {
        status,
        reviewer: reviewer.trim() || undefined,
        notes: reviewNotes.trim() || undefined
      });
      refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos actualizar el lead.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCreateQuote() {
    if (!selectedLeadId) {
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      await createWholesaleQuote({
        leadId: selectedLeadId,
        amount: Number(quoteAmount),
        status: quoteStatus,
        notes: quoteNotes.trim() || undefined
      });
      refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos crear la cotización.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <SectionHeader
        title="Mayoristas"
        description="Lead B2B, cotizaciones y reglas operativas con trazabilidad en tiempo real."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestión de leads</CardTitle>
          <CardDescription>Actualiza el estado comercial sin salir del backoffice.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="wholesale-reviewer">
                Revisor
              </label>
              <Input
                id="wholesale-reviewer"
                value={reviewer}
                onChange={(event) => setReviewer(event.target.value)}
                placeholder="ventas"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="wholesale-review-notes">
                Notas
              </label>
              <Textarea
                id="wholesale-review-notes"
                value={reviewNotes}
                onChange={(event) => setReviewNotes(event.target.value)}
                placeholder="Comentarios de la revisión"
              />
            </div>
          </div>
          <div className="space-y-3">
            {leads.slice(0, 4).map((lead) => (
              <div key={lead.id} className="rounded-3xl border border-black/10 bg-black/[0.02] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-[#132016]">{lead.company}</div>
                    <p className="text-sm text-black/55">
                      {lead.contact} · {lead.email}
                    </p>
                  </div>
                  <StatusBadge label={lead.status} tone={leadTone(lead.status)} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleStatusChange(lead.id, WholesaleLeadStatus.Qualified)}
                    disabled={actionLoading}
                  >
                    Calificar
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleStatusChange(lead.id, WholesaleLeadStatus.Negotiating)}
                    disabled={actionLoading}
                  >
                    Negociar
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleStatusChange(lead.id, WholesaleLeadStatus.Won)}
                    disabled={actionLoading}
                  >
                    Ganar
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleStatusChange(lead.id, WholesaleLeadStatus.Lost)}
                    disabled={actionLoading}
                  >
                    Perder
                  </Button>
                </div>
              </div>
            ))}
            {!leads.length ? <p className="text-sm text-black/55">No hay leads mayoristas aún.</p> : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nueva cotización</CardTitle>
            <CardDescription>Preparación manual con un monto de referencia y estado inicial.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.1fr_0.7fr]">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="wholesale-lead">
                Lead
              </label>
              <select
                id="wholesale-lead"
                className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/25"
                value={selectedLeadId}
                onChange={(event) => setSelectedLeadId(event.target.value)}
              >
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.company} · {lead.contact}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="wholesale-amount">
                Monto
              </label>
              <Input
                id="wholesale-amount"
                type="number"
                min="1"
                step="1"
                value={quoteAmount}
                onChange={(event) => setQuoteAmount(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="wholesale-status">
                Estado
              </label>
              <select
                id="wholesale-status"
                className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/25"
                value={quoteStatus}
                onChange={(event) => setQuoteStatus(event.target.value as WholesaleQuoteStatus)}
              >
                <option value={WholesaleQuoteStatus.Draft}>Borrador</option>
                <option value={WholesaleQuoteStatus.Sent}>Enviada</option>
                <option value={WholesaleQuoteStatus.Accepted}>Aceptada</option>
                <option value={WholesaleQuoteStatus.Rejected}>Rechazada</option>
                <option value={WholesaleQuoteStatus.Expired}>Expirada</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="wholesale-quote-notes">
                Notas
              </label>
              <Textarea
                id="wholesale-quote-notes"
                value={quoteNotes}
                onChange={(event) => setQuoteNotes(event.target.value)}
                placeholder="Notas comerciales"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleCreateQuote} disabled={actionLoading || !selectedLeadId}>
                Crear cotización
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalle rápido</CardTitle>
            <CardDescription>Contexto del lead seleccionado para no perder el hilo comercial.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-black/65">
            {selectedLead ? (
              <>
                <p>
                  <span className="font-medium text-[#132016]">Empresa:</span> {selectedLead.company}
                </p>
                <p>
                  <span className="font-medium text-[#132016]">Contacto:</span> {selectedLead.contact}
                </p>
                <p>
                  <span className="font-medium text-[#132016]">Ciudad:</span> {selectedLead.city}
                </p>
                <p>
                  <span className="font-medium text-[#132016]">Estado:</span> {selectedLead.status}
                </p>
                <p>
                  <span className="font-medium text-[#132016]">Cotizaciones:</span> {selectedLead.quoteCount}
                </p>
              </>
            ) : (
              <p>No hay un lead seleccionado.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <AdminDataTable
        title="Leads mayoristas"
        description="Pipeline B2B con estado, origen y actividad comercial."
        headers={["Empresa", "Contacto", "Email", "Ciudad", "Estado", "Origen", "Cotizaciones", "Actualizado", "Acciones"]}
        rows={leads.map((lead) => [
          lead.company,
          lead.contact,
          lead.email,
          lead.city,
          <StatusBadge key={`${lead.id}-status`} label={lead.status} tone={leadTone(lead.status)} />,
          lead.source,
          String(lead.quoteCount),
          formatDate(lead.updatedAt),
          <div key={`${lead.id}-actions`} className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => handleStatusChange(lead.id, WholesaleLeadStatus.Qualified)}
              disabled={actionLoading}
            >
              Calificar
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleStatusChange(lead.id, WholesaleLeadStatus.Negotiating)}
              disabled={actionLoading}
            >
              Negociar
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleStatusChange(lead.id, WholesaleLeadStatus.Won)}
              disabled={actionLoading}
            >
              Ganar
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleStatusChange(lead.id, WholesaleLeadStatus.Lost)}
              disabled={actionLoading}
            >
              Perder
            </Button>
          </div>
        ])}
      />

      <AdminDataTable
        title="Cotizaciones"
        description="Cotizaciones emitidas, aceptadas y listas para seguimiento."
        headers={["Empresa", "Contacto", "Estado", "Monto", "Items", "Expira", "Actualizado"]}
        rows={quotes.map((quote) => [
          quote.company,
          quote.contact,
          <StatusBadge key={`${quote.id}-quote`} label={quote.status} tone={quoteTone(quote.status)} />,
          formatCurrency(quote.amount),
          String(quote.itemsCount),
          formatDate(quote.expiresAt),
          formatDate(quote.updatedAt)
        ])}
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {tiers.map((plan) => (
          <Card key={plan.tier}>
            <CardHeader>
              <CardTitle>{plan.tier}</CardTitle>
              <CardDescription>Desde {plan.minimumUnits} unidades</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-black/65">
              <p>{plan.description}</p>
              <p className="font-medium text-[#132016]">{plan.savingsLabel}</p>
              <ul className="space-y-1">
                {plan.perks.map((perk) => (
                  <li key={perk}>• {perk}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {loading ? <p className="text-sm text-black/55">Cargando mayoristas...</p> : null}
      <Separator />
    </div>
  );
}
