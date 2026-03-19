"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { RoleCode, hasAdminAccess, type AuthCredentialsInput } from "@huelegood/shared";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, SectionHeader } from "@huelegood/ui";
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
  [RoleCode.Cliente]: "Cliente"
};

export function AdminAuthGate({ title, description, allowedRoles, children }: AdminAuthGateProps) {
  const { session, loading, login, logout } = useAdminSession();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState<AuthCredentialsInput>({
    email: "admin@huelegood.com",
    password: "huelegood123"
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

  return (
    <div className="space-y-6 pb-8">
      {title ? <SectionHeader title={title} description={description} /> : null}

      {loading ? (
        <Card>
          <CardContent className="py-6 text-sm text-black/60">Cargando sesión...</CardContent>
        </Card>
      ) : null}

      {!loading && !session ? (
        <Card>
          <CardHeader>
            <CardTitle>Acceso administrador</CardTitle>
            <CardDescription>Autenticación requerida para módulos sensibles del backoffice.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
            <form className="space-y-4" onSubmit={handleLogin}>
              <Input
                type="email"
                value={loginForm.email}
                onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="correo@huelegood.com"
              />
              <Input
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Contraseña"
              />
              <Button type="submit" disabled={submitting}>
                {submitting ? "Validando..." : "Ingresar"}
              </Button>
            </form>
            <div className="rounded-2xl border border-black/10 bg-black/[0.02] px-4 py-3 text-sm text-black/60">
              <div className="text-xs uppercase tracking-[0.2em] text-black/35">Acceso demo</div>
              <div className="mt-2">admin@huelegood.com / huelegood123</div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!loading && session && !isAuthorized ? (
        <Card>
          <CardHeader>
            <CardTitle>Acceso no autorizado</CardTitle>
            <CardDescription>No tienes permisos para este módulo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-black/60">
            <div className="flex flex-wrap gap-2">
              {roleList.length ? roleList.map((role) => <Badge key={role} tone="neutral">{role}</Badge>) : <Badge tone="neutral">Sin roles requeridos</Badge>}
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
              Sesión activa: {session.user.name} ({session.user.email})
            </div>
            <Button variant="secondary" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!loading && session && isAuthorized ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="info">Sesión activa</Badge>
              <div className="text-sm text-black/60">
                {session.user.name} · {session.user.email}
              </div>
              <div className="flex flex-wrap gap-2">
                {session.user.roles.map((role) => (
                  <Badge key={role.code} tone="neutral">
                    {role.label}
                  </Badge>
                ))}
              </div>
            </div>
            <Button variant="secondary" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </div>
          {children}
        </>
      ) : null}
    </div>
  );
}
