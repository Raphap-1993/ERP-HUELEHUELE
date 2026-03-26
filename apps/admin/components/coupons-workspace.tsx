"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminDataTable,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  SectionHeader
} from "@huelegood/ui";
import type { CouponSummary } from "@huelegood/shared";
import { fetchCoupons, createCoupon, updateCoupon, deleteCoupon } from "../lib/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

const DEMO_CODES = new Set(["RESET10", "DUPLO15", "WELCOME5"]);

const EMPTY_FORM = {
  code: "",
  discountType: "percentage" as "percentage" | "fixed",
  discountValue: "",
  description: "",
  conditions: ""
};

// ── Main component ────────────────────────────────────────────────────────────

export function CouponsWorkspace() {
  const [coupons, setCoupons] = useState<CouponSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCoupons();
      setCoupons(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los cupones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const code = form.code.trim().toUpperCase();
    const value = Number(form.discountValue);
    if (!code) { setFormError("El código es obligatorio."); return; }
    if (!value || value <= 0) { setFormError("El valor del descuento debe ser mayor a 0."); return; }

    setSaving(true);
    setFormError(null);
    try {
      await createCoupon({
        code,
        discountType: form.discountType,
        discountValue: value,
        description: form.description.trim() || code,
        conditions: form.conditions.trim() || undefined,
        isActive: true
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al crear el cupón.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(coupon: CouponSummary) {
    try {
      await updateCoupon(coupon.code, { isActive: !coupon.isActive });
      await load();
    } catch {
      // silently fail — table will stay as-is
    }
  }

  async function handleDelete(code: string) {
    if (!confirm(`¿Eliminar el cupón ${code}?`)) return;
    try {
      await deleteCoupon(code);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar el cupón.");
    }
  }

  const rows = coupons.map((c) => [
    c.code,
    c.discountType === "percentage" ? `${c.discountValue}%` : `S/ ${c.discountValue}`,
    c.description,
    c.conditions ?? "—",
    c.isActive ? "Activo" : "Inactivo",
    String(c.usageCount),
    c.createdAt.slice(0, 10),
    // Actions column rendered as text — real buttons handled outside table
    c.code
  ]);

  const active = coupons.filter((c) => c.isActive).length;
  const inactive = coupons.length - active;

  return (
    <div className="space-y-6 py-6 md:py-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <SectionHeader
          title="Cupones"
          description="Gestiona los códigos de descuento disponibles en el checkout."
        />
        <Button variant="primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancelar" : "Nuevo cupón"}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nuevo cupón</CardTitle>
            <CardDescription>El código se guardará en mayúsculas automáticamente.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { void handleCreate(e); }} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-black/50">Código</label>
                  <Input
                    placeholder="RESET10"
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-black/50">Tipo</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value as "percentage" | "fixed" }))}
                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#1a3a2e] focus:border-[#52b788] focus:outline-none"
                  >
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Monto fijo (S/)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-black/50">
                    Valor {form.discountType === "percentage" ? "(%)" : "(S/)"}
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max={form.discountType === "percentage" ? "100" : undefined}
                    placeholder={form.discountType === "percentage" ? "10" : "20"}
                    value={form.discountValue}
                    onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-black/50">Descripción</label>
                  <Input
                    placeholder="10% de descuento en cualquier pedido"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-black/50">
                    Condición (slug de producto, opcional)
                  </label>
                  <Input
                    placeholder="combo-duo-perfecto"
                    value={form.conditions}
                    onChange={(e) => setForm((f) => ({ ...f, conditions: e.target.value }))}
                  />
                </div>
              </div>
              {formError && (
                <p className="text-sm text-red-600">{formError}</p>
              )}
              <div className="flex gap-2">
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? "Guardando…" : "Crear cupón"}
                </Button>
                <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setFormError(null); }}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {!loading && coupons.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <Badge tone="neutral">{coupons.length} total</Badge>
          <Badge tone="success">{active} activos</Badge>
          {inactive > 0 && <Badge tone="warning">{inactive} inactivos</Badge>}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-2xl bg-black/5" />
          ))}
        </div>
      )}

      {/* Table */}
      {!loading && coupons.length > 0 && (
        <AdminDataTable
          title="Cupones registrados"
          description={`${coupons.length} código${coupons.length !== 1 ? "s" : ""} configurados`}
          headers={["Código", "Descuento", "Descripción", "Condición", "Estado", "Usos", "Creado"]}
          rows={coupons.map((c) => [
            c.code,
            c.discountType === "percentage" ? `${c.discountValue}%` : `S/ ${c.discountValue}`,
            c.description,
            c.conditions ?? "—",
            c.isActive ? "Activo" : "Inactivo",
            String(c.usageCount),
            c.createdAt.slice(0, 10)
          ])}
        />
      )}

      {/* Per-row actions */}
      {!loading && coupons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Acciones por cupón</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {coupons.map((c) => (
                <div key={c.code} className="flex items-center justify-between rounded-xl bg-black/[0.025] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-[#1a3a2e]">{c.code}</span>
                    <Badge tone={c.isActive ? "success" : "neutral"}>
                      {c.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                    {DEMO_CODES.has(c.code) && (
                      <Badge tone="info">Demo</Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => { void handleToggle(c); }}
                    >
                      {c.isActive ? "Desactivar" : "Activar"}
                    </Button>
                    {!DEMO_CODES.has(c.code) && (
                      <Button
                        variant="danger"
                        onClick={() => { void handleDelete(c.code); }}
                      >
                        Eliminar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty */}
      {!loading && !error && coupons.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-black/40">No hay cupones registrados.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
