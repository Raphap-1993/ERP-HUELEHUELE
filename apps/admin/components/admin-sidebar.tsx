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
      <div className="space-y-3">
        <div className="text-xs uppercase tracking-[0.24em] text-white/45">{siteSetting.brandName} Admin</div>
        <p className="text-sm leading-6 text-white/72">
          Operación de pedidos, pagos, CMS, vendedores, mayoristas, CRM, fidelización, notificaciones, comisiones y marketing.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          href="/"
          variant="secondary"
          size="sm"
          className="!border-white/10 !bg-white/10 !text-white hover:!bg-white/15"
          onClick={handleNavigate}
        >
          Ir al storefront
        </Button>
        {session ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="border !border-white/10 !bg-transparent !text-white hover:!bg-white/10"
            onClick={() => {
              void handleLogout();
            }}
          >
            Cerrar sesión
          </Button>
        ) : null}
      </div>

      <Card className="!border-white/10 !bg-white/5 !text-white !shadow-none">
        <CardContent className="space-y-3">
          <div className="text-xs uppercase tracking-[0.2em] text-white/45">Sesión admin</div>
          {loading ? (
            <p className="text-sm text-white/70">Verificando permisos...</p>
          ) : session ? (
            <div className="space-y-3">
              <div>
                <CardTitle className="!text-white">{session.user.name}</CardTitle>
                <CardDescription className="!text-white/65">{session.user.email}</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="!bg-white/10 !text-white">{session.user.accountType}</Badge>
                {roleLabels.map((role) => (
                  <Badge key={role} className="!bg-white/10 !text-white">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-white/70">Sin sesión activa. Inicia sesión para ver los módulos habilitados.</p>
          )}
        </CardContent>
      </Card>

      <Separator className="!bg-white/10" />

      {session ? (
        visibleNavigation.length ? (
          <AdminSidebarLinkGroup roles={roleCodes} currentPath={pathname} variant="dark" onNavigate={handleNavigate} />
        ) : (
          <Card className="!border-white/10 !bg-white/5 !text-white !shadow-none">
            <CardContent className="space-y-2">
              <CardTitle className="!text-white">Sin módulos visibles</CardTitle>
              <p className="text-sm leading-6 text-white/70">
                La sesión actual no tiene permisos de navegación en el backoffice.
              </p>
            </CardContent>
          </Card>
        )
      ) : null}
    </div>
  );

  if (variant === "desktop") {
    return (
      <aside className="sticky top-4 hidden h-fit rounded-[1.75rem] border border-white/10 bg-[#132016] p-6 text-white shadow-soft lg:block">
        {shellContent}
      </aside>
    );
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Cerrar navegación"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => {
          onClose?.();
        }}
      />
      <aside className="absolute left-0 top-0 z-10 h-full w-[min(88vw,360px)] overflow-y-auto rounded-r-[1.75rem] border-r border-white/10 bg-[#132016] p-6 text-white shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.24em] text-white/45">{siteSetting.brandName} Admin</div>
            <p className="text-sm leading-6 text-white/72">
              Operación central con navegación filtrada por rol.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="!border-white/10 !bg-white/10 !text-white hover:!bg-white/15"
            onClick={() => {
              onClose?.();
            }}
          >
            Cerrar
          </Button>
        </div>
        {shellContent}
      </aside>
    </div>
  );
}
