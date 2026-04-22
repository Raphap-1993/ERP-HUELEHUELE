"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { RoleCode, hasAdminAccess, type AuthCredentialsInput } from "@huelegood/shared";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@huelegood/ui";
import { useAdminSession } from "./admin-session-provider";

type AdminAuthGateProps = {
  title?: string;
  description?: string;
  allowedRoles?: readonly RoleCode[];
  children: ReactNode;
};

const roleLabels: Record<RoleCode, string> = {
  [RoleCode.SuperAdmin]: "Super Admin",
  [RoleCode.Admin]: "Admin",
  [RoleCode.OperadorPagos]: "Operador de pagos",
  [RoleCode.Ventas]: "Ventas",
  [RoleCode.Marketing]: "Marketing",
  [RoleCode.SellerManager]: "Seller Manager",
  [RoleCode.Vendedor]: "Vendedor",
  [RoleCode.Mayorista]: "Mayorista",
  [RoleCode.Cliente]: "Cliente"
};

export function AdminAuthGate({ title, description, allowedRoles, children }: AdminAuthGateProps) {
  const { session, loading, login, logout } = useAdminSession();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState<AuthCredentialsInput>({
    email: "",
    password: ""
  });

  const roleList = useMemo(() => {
    if (!allowedRoles?.length) {
      return [];
    }

    return allowedRoles.map((role) => roleLabels[role]);
  }, [allowedRoles]);

  const isAuthorized = useMemo(() => {
    if (!session) {
      return false;
    }

    const sessionRoles = session.user.roles.map((role) => role.code);
    return hasAdminAccess(sessionRoles, allowedRoles);
  }, [allowedRoles, session]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login(loginForm);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "No pudimos iniciar sesión.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
    } finally {
      setError(null);
    }
  }

  if (loading) {
    return null;
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8f3] p-6">
        <div className="grid w-full max-w-[860px] grid-cols-2 min-h-[520px] overflow-hidden rounded-[24px] shadow-[0_24px_80px_rgba(26,58,46,0.18)]">

          {/* Izquierda: dark panel */}
          <div className="relative flex flex-col justify-between overflow-hidden bg-[#1a3a2e] px-10 py-11">
            {/* Círculos decorativos */}
            <div className="pointer-events-none absolute -right-[70px] -top-[70px] h-[300px] w-[300px] rounded-full bg-[rgba(82,183,136,0.08)]" />
            <div className="pointer-events-none absolute -bottom-[50px] -left-[50px] h-[220px] w-[220px] rounded-full bg-[rgba(201,168,76,0.06)]" />

            {/* Logo */}
            <div className="relative flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-[#52b788] font-bold text-[15px] text-[#1a3a2e]">
                HH
              </div>
              <div>
                <div className="font-semibold text-[19px] text-white leading-tight">Huele Huele</div>
                <div className="text-[10px] text-white/30">Panel de administración</div>
              </div>
            </div>

            {/* Copy */}
            <div className="relative">
              <h2 className="mb-3 text-[26px] font-bold text-white leading-[1.2]">
                Gestiona tu negocio desde un solo lugar
              </h2>
              <p className="text-[13px] leading-[1.7] text-white/50">
                Pedidos, pagos, contenido y frentes comerciales — todo centralizado para tomar mejores decisiones cada día.
              </p>
            </div>

            {/* Stats */}
            <div className="relative flex gap-4">
              {[
                { n: "450", l: "Unidades" },
                { n: "S/17K", l: "Este mes" },
                { n: "18", l: "Distrib." },
              ].map(stat => (
                <div key={stat.l} className="rounded-[12px] border border-white/10 bg-white/6 px-4 py-3.5 text-center">
                  <div className="font-bold text-[22px] text-[#52b788]">{stat.n}</div>
                  <div className="mt-1 text-[10px] text-white/35">{stat.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Derecha: form */}
          <div className="flex flex-col justify-center bg-white px-10 py-11">
            <h3 className="mb-1.5 font-bold text-[23px] text-[#1a3a2e]">Bienvenida de vuelta</h3>
            <p className="mb-7 text-[13px] text-[#6b7280]">Ingresa tus credenciales para acceder al panel</p>

            {error ? (
              <div className="mb-4 rounded-[11px] bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
            ) : null}

            <form className="space-y-4" onSubmit={handleLogin}>
              <label className="block space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">
                  Correo electrónico
                </span>
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  required
                  value={loginForm.email}
                  onChange={(e) => setLoginForm(curr => ({ ...curr, email: e.target.value }))}
                  placeholder="admin@huelegood.com"
                  className="w-full rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f8faf9] px-4 py-3 text-[14px] text-[#1c1c1c] placeholder:text-[#b0bbb5] outline-none transition focus:border-[#52b788] focus:bg-white"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">
                  Contraseña
                </span>
                <input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(curr => ({ ...curr, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full rounded-[11px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-[#f8faf9] px-4 py-3 text-[14px] text-[#1c1c1c] placeholder:text-[#b0bbb5] outline-none transition focus:border-[#52b788] focus:bg-white"
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-[11px] bg-[#2d6a4f] py-3.5 text-[15px] font-semibold text-white transition hover:bg-[#1a3a2e] hover:-translate-y-px disabled:opacity-60"
              >
                {submitting ? "Validando..." : "Ingresar al panel →"}
              </button>
            </form>

            {roleList.length ? (
              <div className="mt-5 space-y-2">
                <p className="text-[11px] uppercase tracking-[0.07em] text-[#6b7280]">Módulo habilitado para</p>
                <div className="flex flex-wrap gap-1.5">
                  {roleList.map((role) => (
                    <span key={role} className="rounded-full bg-[#d8f3dc] px-2.5 py-0.5 text-[11px] font-medium text-[#2d6a4f]">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <p className="mt-4 text-center text-[11px] text-[#6b7280]">
              ¿Problemas para ingresar?{" "}
              <a href="mailto:admin@huelegood.com" className="font-medium text-[#2d6a4f]">
                Contáctanos
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="pb-8">
        <Card className="rounded-[2rem] border-black/8 bg-white shadow-[0_18px_60px_rgba(18,34,20,0.06)]">
          <CardHeader>
            <CardTitle>Acceso no autorizado</CardTitle>
            <CardDescription>Tu sesión está activa, pero no cuenta con permisos para este módulo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-black/60">
            <div className="flex flex-wrap gap-2">
              {roleList.length ? roleList.map((role) => <Badge key={role}>{role}</Badge>) : <Badge>Sin roles requeridos</Badge>}
            </div>
            <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
              Sesión activa: {session.user.name} ({session.user.email})
            </div>
            <Button variant="secondary" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
