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
      <section className="grid w-full gap-6 lg:grid-cols-[0.88fr_1.12fr]">
        <div className="rounded-[2rem] border border-black/8 bg-[#132016] px-8 py-10 text-white shadow-[0_22px_72px_rgba(19,32,22,0.22)]">
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.28em] text-white/42">Huelegood Admin</p>
              <h1 className="text-[2.4rem] font-semibold leading-[0.98] tracking-[-0.04em] text-white md:text-[3.2rem]">
                {title ?? "Acceso administrativo seguro"}
              </h1>
              <p className="max-w-xl text-sm leading-7 text-white/72">
                {description ?? "Ingresa con tus credenciales para operar pedidos, pagos, contenido y frentes comerciales."}
              </p>
            </div>

            <div className="grid gap-3">
              <div className="rounded-[1.4rem] border border-white/12 bg-white/8 px-4 py-4 text-sm leading-6 text-white/76">
                El panel operativo se abre solo después de autenticar la sesión y cargar los permisos reales.
              </div>
              <div className="rounded-[1.4rem] border border-white/12 bg-white/8 px-4 py-4 text-sm leading-6 text-white/76">
                La navegación y los módulos se filtran por rol para que cada perfil vea solo lo que le corresponde.
              </div>
            </div>

            {roleList.length ? (
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.24em] text-white/40">Módulo habilitado para</p>
                <div className="flex flex-wrap gap-2">
                  {roleList.map((role) => (
                    <Badge key={role} className="bg-white/10 text-white">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <Card className="rounded-[2rem] border-black/8 bg-white shadow-[0_18px_60px_rgba(18,34,20,0.06)]">
          <CardHeader className="space-y-2">
            <CardTitle className="text-[2rem] tracking-[-0.03em]">Iniciar sesión</CardTitle>
            <CardDescription>Usa tu correo y contraseña operativos para entrar al backoffice.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {error ? <div className="rounded-[1.25rem] bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-2">
                <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42" htmlFor="admin-email">
                  Email
                </label>
                <Input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  value={loginForm.email}
                  onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="correo@huelegood.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42" htmlFor="admin-password">
                  Contraseña
                </label>
                <Input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Contraseña"
                />
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Validando..." : "Ingresar al panel"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
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
