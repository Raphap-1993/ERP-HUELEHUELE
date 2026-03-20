"use client";

import { usePathname } from "next/navigation";
import { adminNavigation, filterNavigationGroupsByRoles, siteSetting } from "@huelegood/shared";
import { Badge, Button, Card, CardContent, CardDescription, CardTitle, Separator, AdminSidebarLinkGroup } from "@huelegood/ui";
import { useAdminSession } from "./admin-session-provider";

type AdminSidebarProps = {
  variant?: "desktop" | "mobile";
  open?: boolean;
  onClose?: () => void;
};

export function AdminSidebar({ variant = "desktop", open = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { session, loading, logout } = useAdminSession();
  const roleCodes = session?.user.roles.map((role) => role.code) ?? [];
  const roleLabels = session?.user.roles.map((role) => role.label) ?? [];
  const visibleNavigation = session ? filterNavigationGroupsByRoles(adminNavigation, roleCodes) : [];

  if (variant === "mobile" && !open) {
    return null;
  }

  const handleNavigate = () => {
    onClose?.();
  };

  const handleLogout = async () => {
    await logout();
    onClose?.();
  };

  const shellContent = (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="text-xs uppercase tracking-[0.24em] text-black/40">Operación</div>
        <div className="text-2xl font-semibold tracking-tight text-[#132016]">{siteSetting.brandName}</div>
        <p className="text-sm leading-6 text-black/58">
          Pedidos, pagos, contenido, vendedores y seguimiento comercial desde un solo panel.
        </p>
      </div>

      <Card className="border-black/8 bg-white/84 shadow-none">
        <CardContent className="space-y-3">
          <div className="text-xs uppercase tracking-[0.2em] text-black/40">Sesión</div>
          {loading ? (
            <p className="text-sm text-black/55">Verificando permisos...</p>
          ) : session ? (
            <div className="space-y-3">
              <div>
                <CardTitle>{session.user.name}</CardTitle>
                <CardDescription>{session.user.email}</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="info">{session.user.accountType}</Badge>
                {roleLabels.map((role) => (
                  <Badge key={role} tone="neutral">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-black/55">Inicia sesión para ver los módulos habilitados.</p>
          )}
        </CardContent>
      </Card>

      <Separator className="bg-black/8" />

      {session ? (
        visibleNavigation.length ? (
          <AdminSidebarLinkGroup roles={roleCodes} currentPath={pathname} variant="light" onNavigate={handleNavigate} />
        ) : (
          <Card className="border-black/8 bg-white/84 shadow-none">
            <CardContent className="space-y-2">
              <CardTitle>Sin módulos visibles</CardTitle>
              <p className="text-sm leading-6 text-black/58">
                La sesión actual no tiene permisos de navegación en este panel.
              </p>
            </CardContent>
          </Card>
        )
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button href="/" variant="secondary" size="sm" onClick={handleNavigate}>
          Ver sitio
        </Button>
        {session ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              void handleLogout();
            }}
          >
            Cerrar sesión
          </Button>
        ) : null}
      </div>
    </div>
  );

  if (variant === "desktop") {
    return (
      <aside className="sticky top-4 hidden max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[1.75rem] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(246,244,239,0.94)_100%)] p-5 text-[#132016] shadow-soft lg:block">
        {shellContent}
      </aside>
    );
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Cerrar navegación"
        className="absolute inset-0 bg-[#0f1510]/35 backdrop-blur-sm"
        onClick={() => {
          onClose?.();
        }}
      />
      <aside className="absolute left-0 top-0 z-10 h-full w-[min(92vw,360px)] overflow-y-auto rounded-r-[1.75rem] border-r border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(246,244,239,0.97)_100%)] p-5 text-[#132016] shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.24em] text-black/40">Operación</div>
            <p className="text-sm leading-6 text-black/58">Navegación segura y ordenada para trabajo diario.</p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => {
            onClose?.();
          }}>
            Cerrar
          </Button>
        </div>
        {shellContent}
      </aside>
    </div>
  );
}
