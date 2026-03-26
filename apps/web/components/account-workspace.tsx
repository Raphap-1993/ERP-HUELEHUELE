"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { RoleCode, type AuthSessionSummary, type LoyaltyAccountSummary } from "@huelegood/shared";
import { clearStoredSessionToken, readStoredSessionToken, writeStoredSessionToken } from "../lib/session";
import { fetchLoyaltySummary, fetchSession, login, logout, register } from "../lib/api";

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" ")
  };
}

function loyaltyMovementLabel(status: LoyaltyAccountSummary["recentMovement"]) {
  const labels: Record<LoyaltyAccountSummary["recentMovement"], string> = {
    pending: "Pendiente",
    available: "Disponible",
    reversed: "Revertido",
    expired: "Expirado"
  };

  return labels[status];
}

function redemptionLabel(status: LoyaltyAccountSummary["redemptionStatus"]) {
  const labels: Record<LoyaltyAccountSummary["redemptionStatus"], string> = {
    pending: "Pendiente",
    applied: "Aplicado",
    cancelled: "Cancelado"
  };

  return labels[status];
}

function AccountDetail({
  label,
  value,
  helper
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-[#d8f3dc] bg-[#f7f8f4] px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.24em] text-black/40">{label}</p>
      <p className="mt-3 text-xl font-semibold text-[#1a3a2e]">{value}</p>
      <p className="mt-2 text-sm leading-6 text-black/56">{helper}</p>
    </div>
  );
}

export function AccountWorkspace() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [session, setSession] = useState<AuthSessionSummary | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingLoyalty, setLoadingLoyalty] = useState(true);
  const [loyaltySummary, setLoyaltySummary] = useState<LoyaltyAccountSummary | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<"pedidos" | "tracking" | "favoritos" | "direcciones" | "configuracion">("pedidos");

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    accountType: "customer" as "customer" | "seller",
    phone: ""
  });

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const token = readStoredSessionToken();
      if (!token) {
        if (active) {
          setLoadingSession(false);
        }
        return;
      }

      try {
        const response = await fetchSession(token);
        if (!active) {
          return;
        }

        if (response.data) {
          setSession(response.data);
        } else {
          clearStoredSessionToken();
        }
      } catch {
        clearStoredSessionToken();
      } finally {
        if (active) {
          setLoadingSession(false);
        }
      }
    }

    void loadSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadLoyalty() {
      if (!session) {
        if (active) {
          setLoyaltySummary(null);
          setLoadingLoyalty(false);
        }
        return;
      }

      setLoadingLoyalty(true);

      try {
        const token = readStoredSessionToken();
        const response = await fetchLoyaltySummary(token ?? undefined);
        if (!active) {
          return;
        }

        setLoyaltySummary(response.data ?? null);
      } catch {
        if (active) {
          setLoyaltySummary(null);
        }
      } finally {
        if (active) {
          setLoadingLoyalty(false);
        }
      }
    }

    void loadLoyalty();

    return () => {
      active = false;
    };
  }, [session]);

  const accountState = useMemo(() => {
    if (!session) {
      return null;
    }

    return splitName(session.user.name);
  }, [session]);

  const hasSellerPanelAccess = useMemo(() => {
    if (!session) {
      return false;
    }

    const roles = session.user.roles.map((role) => role.code);
    return roles.includes(RoleCode.Vendedor) || roles.includes(RoleCode.SellerManager);
  }, [session]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await login(loginForm);
      if (response.data) {
        setSession(response.data);
        writeStoredSessionToken(response.data.token);
      }
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "No pudimos iniciar sesión.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await register(registerForm);
      if (response.data) {
        setSession(response.data);
        writeStoredSessionToken(response.data.token);
      }
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : "No pudimos crear la cuenta.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    const token = readStoredSessionToken();
    try {
      await logout(token ?? undefined);
    } finally {
      clearStoredSessionToken();
      setSession(null);
      setLoyaltySummary(null);
    }
  }

  if (loadingSession) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-[#6b7280]">Verificando tu sesión...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-[1120px] px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-start">

          {/* Left: copy */}
          <div className="rounded-[22px] bg-[#1a3a2e] p-10 text-white">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Mi cuenta</p>
            <h1 className="mb-4 font-serif text-[2.4rem] font-bold leading-[1.1] text-white">
              Acceso simple para compras, puntos y seguimiento.
            </h1>
            <p className="mb-8 text-[14px] leading-7 text-white/60">
              Ingresa con tu cuenta para consultar compras, beneficios y estado de tu experiencia Huele Huele desde un mismo lugar.
            </p>
            <div className="space-y-3">
              {["Historial de pedidos en un clic.", "Puntos de lealtad siempre visibles.", "Acceso a panel comercial si eres vendedor."].map((item) => (
                <div key={item} className="flex items-center gap-3 text-[13px] text-white/70">
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#52b788] text-[10px] text-white">✓</div>
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-10 grid grid-cols-3 gap-3">
              {[{ n: "6+", l: "Pedidos típicos" }, { n: "S/400+", l: "Por cliente" }, { n: "24h", l: "Soporte" }].map((stat) => (
                <div key={stat.l} className="rounded-[12px] border border-white/10 bg-white/6 p-3 text-center">
                  <div className="font-serif text-[20px] font-black text-[#52b788]">{stat.n}</div>
                  <div className="mt-1 text-[10px] text-white/35">{stat.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: form card */}
          <div className="rounded-[22px] border border-[rgba(26,58,46,0.1)] bg-white p-8 shadow-[0_18px_54px_rgba(26,58,46,0.06)]">
            <h2 className="mb-1.5 font-serif text-[22px] font-bold text-[#1a3a2e]">Entrar o crear cuenta</h2>
            <p className="mb-6 text-[13px] text-[#6b7280]">Accede con tu correo o crea una cuenta nueva.</p>

            {/* Mode switcher */}
            <div className="mb-6 inline-flex overflow-hidden rounded-full border border-[rgba(26,58,46,0.1)] bg-[#f4f4f0] p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`rounded-full px-5 py-2 text-[13px] font-medium transition ${mode === "login" ? "bg-[#1a3a2e] text-white" : "text-[#1a3a2e]"}`}
              >
                Ingresar
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`rounded-full px-5 py-2 text-[13px] font-medium transition ${mode === "register" ? "bg-[#1a3a2e] text-white" : "text-[#1a3a2e]"}`}
              >
                Crear cuenta
              </button>
            </div>

            {error ? (
              <div className="mb-5 rounded-[11px] bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
            ) : null}

            {mode === "login" ? (
              <form className="space-y-4" onSubmit={handleLogin}>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">Correo electrónico</label>
                  <input
                    type="email"
                    autoComplete="username"
                    required
                    value={loginForm.email}
                    onChange={(e) => setLoginForm((c) => ({ ...c, email: e.target.value }))}
                    placeholder="tu@correo.com"
                    className="w-full rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f8faf9] px-4 py-3 text-[14px] text-[#1c1c1c] placeholder:text-[#b0bbb5] outline-none transition focus:border-[#52b788] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">Contraseña</label>
                  <input
                    type="password"
                    autoComplete="current-password"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((c) => ({ ...c, password: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f8faf9] px-4 py-3 text-[14px] text-[#1c1c1c] placeholder:text-[#b0bbb5] outline-none transition focus:border-[#52b788] focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-[11px] bg-[#2d6a4f] py-3.5 text-[15px] font-semibold text-white transition hover:bg-[#1a3a2e] hover:-translate-y-px disabled:opacity-60"
                >
                  {submitting ? "Validando..." : "Ingresar →"}
                </button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleRegister}>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">Nombre y apellido</label>
                  <input
                    type="text"
                    required
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm((c) => ({ ...c, name: e.target.value, accountType: "customer" }))}
                    placeholder="Tu nombre completo"
                    className="w-full rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f8faf9] px-4 py-3 text-[14px] text-[#1c1c1c] placeholder:text-[#b0bbb5] outline-none transition focus:border-[#52b788] focus:bg-white"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">Correo electrónico</label>
                    <input
                      type="email"
                      required
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm((c) => ({ ...c, email: e.target.value }))}
                      placeholder="tu@correo.com"
                      className="w-full rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f8faf9] px-4 py-3 text-[14px] text-[#1c1c1c] placeholder:text-[#b0bbb5] outline-none transition focus:border-[#52b788] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">Contraseña</label>
                    <input
                      type="password"
                      required
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm((c) => ({ ...c, password: e.target.value, accountType: "customer" }))}
                      placeholder="••••••••"
                      className="w-full rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f8faf9] px-4 py-3 text-[14px] text-[#1c1c1c] placeholder:text-[#b0bbb5] outline-none transition focus:border-[#52b788] focus:bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">WhatsApp (opcional)</label>
                  <input
                    type="tel"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm((c) => ({ ...c, phone: e.target.value, accountType: "customer" }))}
                    placeholder="+51 999 000 000"
                    className="w-full rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f8faf9] px-4 py-3 text-[14px] text-[#1c1c1c] placeholder:text-[#b0bbb5] outline-none transition focus:border-[#52b788] focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-[11px] bg-[#2d6a4f] py-3.5 text-[15px] font-semibold text-white transition hover:bg-[#1a3a2e] hover:-translate-y-px disabled:opacity-60"
                >
                  {submitting ? "Creando cuenta..." : "Crear cuenta →"}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-12">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr] lg:items-start">

        {/* Sidebar */}
        <div className="sticky top-[84px] space-y-4">

          {/* Profile card */}
          <div className="rounded-[22px] border border-[rgba(26,58,46,0.1)] bg-white p-7 text-center">
            <div className="mx-auto mb-3.5 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#d8f3dc] font-serif text-[26px] font-black text-[#2d6a4f]">
              {session.user.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
            </div>
            <p className="font-serif text-[18px] font-bold text-[#1a3a2e]">{session.user.name}</p>
            <p className="mt-0.5 text-[13px] text-[#6b7280]">{session.user.email}</p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#d8f3dc] px-3.5 py-1.5 text-[11px] font-bold text-[#2d6a4f]">
              <span>🛡</span> Cliente activo
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <div className="rounded-[11px] bg-[#f4f4f0] py-3 text-center">
                <div className="font-serif text-[20px] font-black text-[#1a3a2e]">{loyaltySummary ? loyaltySummary.availablePoints : "—"}</div>
                <div className="mt-0.5 text-[10px] text-[#6b7280]">Puntos</div>
              </div>
              <div className="rounded-[11px] bg-[#f4f4f0] py-3 text-center">
                <div className="font-serif text-[20px] font-black text-[#1a3a2e]">{session.user.vendorCode ? "✓" : "—"}</div>
                <div className="mt-0.5 text-[10px] text-[#6b7280]">Vendedor</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <div className="overflow-hidden rounded-[18px] border border-[rgba(26,58,46,0.1)] bg-white">
            {([
              { id: "pedidos" as const, icon: "📦", label: "Mis pedidos" },
              { id: "tracking" as const, icon: "🚚", label: "Rastrear pedido" },
              { id: "favoritos" as const, icon: "❤️", label: "Favoritos" },
              { id: "direcciones" as const, icon: "📍", label: "Mis direcciones" },
              { id: "configuracion" as const, icon: "⚙️", label: "Configuración" },
            ]).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActivePanel(item.id)}
                className={`flex w-full items-center gap-2.5 border-b border-[rgba(26,58,46,0.05)] px-4 py-3.5 text-left text-[13px] font-medium last:border-b-0 transition ${
                  activePanel === item.id
                    ? "bg-[#d8f3dc] font-semibold text-[#1a3a2e]"
                    : "text-[#6b7280] hover:bg-[#faf8f3] hover:text-[#1a3a2e]"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => { void handleLogout(); }}
              className="flex w-full items-center gap-2.5 px-4 py-3.5 text-left text-[13px] font-medium text-rose-500 transition hover:bg-rose-50"
            >
              <span className="text-base">🚪</span>
              Cerrar sesión
            </button>
          </div>

        </div>

        {/* Content panels */}
        <div>

          {/* Panel: Mis pedidos */}
          {activePanel === "pedidos" && (
            <div className="rounded-[22px] border border-[rgba(26,58,46,0.1)] bg-white p-8">
              <h3 className="mb-1 font-serif text-[19px] font-bold text-[#1a3a2e]">Mis pedidos</h3>
              <p className="mb-6 text-[14px] text-[#6b7280]">Historial completo de tus compras en Huele Huele.</p>
              <div className="space-y-4">
                {[
                  { id: "#00089", date: "21 de marzo, 2025", status: "Entregado", statusColor: "bg-green-100 text-green-700", products: [{ emoji: "🖤", name: "Premium Negro", qty: "x 2 und." }], total: "S/ 79.80" },
                  { id: "#00085", date: "18 de marzo, 2025", status: "En camino", statusColor: "bg-blue-100 text-blue-700", products: [{ emoji: "✨", name: "Pack x3", qty: "Verde + Negro + Negro" }], total: "S/ 99.90" },
                ].map((order) => (
                  <div key={order.id} className="rounded-[16px] border border-[rgba(26,58,46,0.1)] p-5 transition hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(26,58,46,0.08)]">
                    <div className="mb-3.5 flex items-center justify-between">
                      <div>
                        <p className="text-[14px] font-bold text-[#2d6a4f]">{order.id}</p>
                        <p className="text-[12px] text-[#6b7280]">{order.date}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${order.statusColor}`}>{order.status}</span>
                    </div>
                    <div className="mb-3.5 flex flex-wrap gap-2">
                      {order.products.map((p) => (
                        <div key={p.name} className="flex items-center gap-2 rounded-[9px] bg-[#f4f4f0] px-3 py-2">
                          <span className="text-base">{p.emoji}</span>
                          <div>
                            <p className="text-[12px] font-medium text-[#1a3a2e]">{p.name}</p>
                            <p className="text-[11px] text-[#6b7280]">{p.qty}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-[18px] font-bold text-[#1a3a2e]">{order.total}</span>
                      <div className="flex gap-2">
                        <button type="button" className="rounded-[9px] border border-[rgba(26,58,46,0.12)] px-3 py-1.5 text-[12px] font-medium text-[#6b7280] transition hover:border-[#2d6a4f] hover:bg-[#d8f3dc] hover:text-[#2d6a4f]">Ver detalle</button>
                        <button type="button" className="rounded-[9px] bg-[#2d6a4f] px-3 py-1.5 text-[12px] font-medium text-white transition hover:bg-[#1a3a2e]">Comprar de nuevo</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Panel: Tracking */}
          {activePanel === "tracking" && (
            <div className="rounded-[22px] border border-[rgba(26,58,46,0.1)] bg-white p-8">
              <h3 className="mb-1 font-serif text-[19px] font-bold text-[#1a3a2e]">Rastrear pedido</h3>
              <p className="mb-6 text-[14px] text-[#6b7280]">Estado actual de tu pedido en camino.</p>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[14px] bg-[#d8f3dc] p-5">
                <div>
                  <p className="text-[12px] font-semibold text-[#2d6a4f]">Pedido en camino</p>
                  <p className="font-serif text-[22px] font-black text-[#1a3a2e]">#00085</p>
                  <p className="text-[12px] text-[#6b7280]">Pack x3 · S/ 99.90</p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] text-[#6b7280]">Courier</p>
                  <p className="text-[14px] font-semibold text-[#1a3a2e]">Olva Courier</p>
                  <p className="text-[12px] font-semibold text-[#2d6a4f]">ABC-123456</p>
                </div>
              </div>
              <div className="space-y-0">
                {[
                  { label: "Pedido confirmado", detail: "18 mar · 10:05am — Pago verificado", done: true, current: false },
                  { label: "Preparando tu pedido", detail: "18 mar · 2:00pm — Empacado y listo", done: true, current: false },
                  { label: "En camino 🚚", detail: "19 mar · 8:30am — En ruta de entrega", done: false, current: true },
                  { label: "Entregado", detail: "Estimado: hoy entre 2pm – 6pm", done: false, current: false },
                ].map((step, i, arr) => (
                  <div key={step.label} className="flex gap-4 pb-5 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 ${step.done ? "border-[#52b788] bg-[#52b788]" : step.current ? "border-[#2d6a4f] bg-[#2d6a4f] shadow-[0_0_0_4px_rgba(82,183,136,0.2)]" : "border-[rgba(26,58,46,0.2)]"}`} />
                      {i < arr.length - 1 && <div className={`mt-1 w-0.5 flex-1 ${step.done ? "bg-[#52b788]" : "bg-[rgba(26,58,46,0.1)]"}`} style={{ minHeight: "24px" }} />}
                    </div>
                    <div className="pb-0">
                      <p className={`text-[13px] font-semibold ${step.current ? "text-[#2d6a4f]" : step.done ? "text-[#1a3a2e]" : "text-[#6b7280]"}`}>{step.label}</p>
                      <p className="text-[12px] text-[#6b7280]">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Panel: Favoritos */}
          {activePanel === "favoritos" && (
            <div className="rounded-[22px] border border-[rgba(26,58,46,0.1)] bg-white p-8">
              <h3 className="mb-1 font-serif text-[19px] font-bold text-[#1a3a2e]">Mis favoritos</h3>
              <p className="mb-6 text-[14px] text-[#6b7280]">Los productos que guardaste para comprar después.</p>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { emoji: "🖤", name: "Premium Negro", price: "S/ 39.90", slug: "premium-negro" },
                  { emoji: "✨", name: "Pack x3", price: "S/ 99.90", slug: "combo-duo-perfecto" },
                  { emoji: "🎁", name: "Pack Regalo Premium", price: "S/ 74.90", slug: "combo-duo-perfecto" },
                ].map((item) => (
                  <div key={item.name} className="relative rounded-[16px] border border-[rgba(26,58,46,0.1)] bg-[#f4f4f0] p-4 text-center">
                    <button type="button" className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full border border-[rgba(26,58,46,0.1)] bg-white text-[12px] text-[#6b7280] transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500">✕</button>
                    <div className="mb-2.5 text-4xl">{item.emoji}</div>
                    <p className="text-[13px] font-semibold text-[#1a3a2e]">{item.name}</p>
                    <p className="mb-3 mt-1 font-serif text-[16px] font-bold text-[#1a3a2e]">{item.price}</p>
                    <a href={`/producto/${item.slug}`} className="block w-full rounded-[9px] bg-[#2d6a4f] py-2 text-[12px] font-semibold text-white transition hover:bg-[#1a3a2e]">Ver detalle</a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Panel: Direcciones */}
          {activePanel === "direcciones" && (
            <div className="rounded-[22px] border border-[rgba(26,58,46,0.1)] bg-white p-8">
              <h3 className="mb-1 font-serif text-[19px] font-bold text-[#1a3a2e]">Mis direcciones</h3>
              <p className="mb-6 text-[14px] text-[#6b7280]">Gestiona las direcciones de entrega guardadas en tu cuenta.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="relative rounded-[15px] border-[1.5px] border-[#52b788] bg-[#d8f3dc] p-5">
                  <span className="absolute right-3 top-3 rounded-full bg-[#2d6a4f] px-2.5 py-0.5 text-[10px] font-bold text-white">Principal</span>
                  <div className="mb-2.5 text-xl">🏠</div>
                  <p className="text-[13px] font-semibold text-[#1a3a2e]">Casa</p>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-[#6b7280]">Av. Javier Prado Este 1234<br />Miraflores, Lima</p>
                  <div className="mt-3.5">
                    <button type="button" className="rounded-[9px] border border-[rgba(26,58,46,0.12)] px-3 py-1.5 text-[12px] font-medium text-[#6b7280] transition hover:border-[#2d6a4f] hover:text-[#2d6a4f]">Editar</button>
                  </div>
                </div>
                <div className="rounded-[15px] border-[1.5px] border-[rgba(26,58,46,0.1)] p-5">
                  <div className="mb-2.5 text-xl">🏢</div>
                  <p className="text-[13px] font-semibold text-[#1a3a2e]">Trabajo</p>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-[#6b7280]">Calle Las Begonias 580<br />San Isidro, Lima · Piso 8</p>
                  <div className="mt-3.5 flex gap-2">
                    <button type="button" className="rounded-[9px] border border-[rgba(26,58,46,0.12)] px-3 py-1.5 text-[12px] font-medium text-[#6b7280] transition hover:border-[#2d6a4f] hover:text-[#2d6a4f]">Editar</button>
                    <button type="button" className="rounded-[9px] bg-[#2d6a4f] px-3 py-1.5 text-[12px] font-medium text-white transition hover:bg-[#1a3a2e]">Usar como principal</button>
                  </div>
                </div>
                <div className="flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-[15px] border-2 border-dashed border-[rgba(45,106,79,0.25)] p-6 text-center transition hover:border-[#52b788] hover:bg-[#d8f3dc]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-[#d8f3dc]">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#2d6a4f" strokeWidth={2}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </div>
                  <p className="text-[12px] font-semibold text-[#2d6a4f]">Agregar nueva dirección</p>
                </div>
              </div>
            </div>
          )}

          {/* Panel: Configuración */}
          {activePanel === "configuracion" && (
            <div className="space-y-5">
              <div className="rounded-[22px] border border-[rgba(26,58,46,0.1)] bg-white p-8">
                <h3 className="mb-1 font-serif text-[19px] font-bold text-[#1a3a2e]">Datos personales</h3>
                <p className="mb-6 text-[14px] text-[#6b7280]">Tu información de perfil asociada a esta cuenta.</p>
                <div className="mb-6 flex items-center gap-5 border-b border-[rgba(26,58,46,0.08)] pb-6">
                  <div className="flex h-[68px] w-[68px] flex-shrink-0 items-center justify-center rounded-full bg-[#d8f3dc] font-serif text-[24px] font-black text-[#2d6a4f]">
                    {session.user.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-[#1a3a2e]">{session.user.name}</p>
                    <p className="mt-0.5 text-[12px] text-[#6b7280]">{session.user.email}</p>
                    <p className="mt-1.5 text-[11px] text-[#6b7280]">{session.user.accountType === "customer" ? "Cliente" : "Vendedor"}</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">Nombre</label>
                    <input defaultValue={accountState?.firstName ?? ""} className="w-full rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f8faf9] px-4 py-3 text-[14px] text-[#1c1c1c] outline-none transition focus:border-[#52b788] focus:bg-white" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">Apellido</label>
                    <input defaultValue={accountState?.lastName ?? ""} className="w-full rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f8faf9] px-4 py-3 text-[14px] text-[#1c1c1c] outline-none transition focus:border-[#52b788] focus:bg-white" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">Email</label>
                    <input defaultValue={session.user.email} type="email" className="w-full rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f8faf9] px-4 py-3 text-[14px] text-[#1c1c1c] outline-none transition focus:border-[#52b788] focus:bg-white" />
                  </div>
                  {session.user.vendorCode ? (
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">Código vendedor</label>
                      <input readOnly defaultValue={session.user.vendorCode} className="w-full rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f8faf9] px-4 py-3 text-[14px] text-[#6b7280] outline-none" />
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Loyalty summary */}
              {!loadingLoyalty && loyaltySummary ? (
                <div className="rounded-[22px] border border-[rgba(26,58,46,0.1)] bg-white p-8">
                  <h3 className="mb-1 font-serif text-[19px] font-bold text-[#1a3a2e]">Puntos y beneficios</h3>
                  <p className="mb-6 text-[14px] text-[#6b7280]">Estado de tu cuenta de puntos Huele Huele.</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { label: "Disponibles", value: loyaltySummary.availablePoints, helper: "Listos para usar" },
                      { label: "Pendientes", value: loyaltySummary.pendingPoints, helper: "Se confirman pronto" },
                      { label: "Canjeados", value: loyaltySummary.redeemedPoints, helper: "Total histórico" },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-[13px] border border-[#d8f3dc] bg-[#f4f4f0] px-4 py-4">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b7280]">{stat.label}</p>
                        <p className="mt-2 font-serif text-[22px] font-black text-[#1a3a2e]">{stat.value}</p>
                        <p className="mt-1 text-[11px] text-[#6b7280]">{stat.helper}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#d8f3dc] px-3 py-1 text-[11px] font-semibold text-[#2d6a4f]">{loyaltyMovementLabel(loyaltySummary.recentMovement)}</span>
                    <span className="rounded-full bg-[#d8f3dc] px-3 py-1 text-[11px] font-semibold text-[#2d6a4f]">{redemptionLabel(loyaltySummary.redemptionStatus)}</span>
                  </div>
                </div>
              ) : null}

              {/* Seller panel access */}
              {hasSellerPanelAccess ? (
                <div className="rounded-[22px] bg-[#1a3a2e] p-8 text-white">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Acceso comercial</p>
                  <h3 className="mb-2 font-serif text-[22px] font-bold text-white">Tu cuenta tiene panel vendedor.</h3>
                  <p className="mb-6 text-[13px] leading-7 text-white/60">Revisa pedidos atribuidos, comisiones y liquidaciones desde un solo lugar.</p>
                  <a href="/panel-vendedor" className="inline-block rounded-full bg-[#52b788] px-6 py-3 text-[13px] font-semibold text-[#1a3a2e] transition hover:bg-[#d8f3dc]">
                    Ir al panel vendedor →
                  </a>
                </div>
              ) : null}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
