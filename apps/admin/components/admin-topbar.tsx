"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { adminNavigation, filterNavigationGroupsByRoles, siteSetting } from "@huelegood/shared";
import { Badge, Button } from "@huelegood/ui";
import { useAdminSession } from "./admin-session-provider";

type AdminTopbarProps = {
  onMenuClick: () => void;
};

export function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  const pathname = usePathname();
  const { session } = useAdminSession();

  const roleCodes = session?.user.roles.map((role) => role.code) ?? [];
  const roleLabels = session?.user.roles.map((role) => role.label) ?? [];
  const visibleNavigation = session ? filterNavigationGroupsByRoles(adminNavigation, roleCodes) : [];
  const visibleLinks = useMemo(() => visibleNavigation.flatMap((group) => group.items), [visibleNavigation]);
  const quickLinks = visibleLinks.slice(0, 6);
  const currentItem = useMemo(
    () => visibleLinks.find((item) => pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`))),
    [pathname, visibleLinks]
  );

  return (
    <header className="rounded-[1.75rem] border border-black/10 bg-white/85 px-6 py-5 shadow-soft backdrop-blur">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-xs uppercase tracking-[0.24em] text-black/45">Backoffice</div>
              {currentItem ? (
                <Badge tone="info">Sección: {currentItem.label}</Badge>
              ) : (
                <Badge tone="neutral">Sin sección activa</Badge>
              )}
              {session ? <Badge tone="success">RBAC</Badge> : <Badge tone="warning">Sin sesión</Badge>}
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-[#132016]">
                {siteSetting.brandName} operación central
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-black/60">
                Storefront, pagos, CMS, vendedores, mayoristas, CRM, fidelización, notificaciones y auditoría.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="info">PM2 ready</Badge>
            <Badge tone="success">RBAC</Badge>
            <Badge tone="warning">Pagos en revisión</Badge>
            {session ? (
              <Button type="button" variant="secondary" size="sm" className="lg:hidden" onClick={onMenuClick}>
                Menú
              </Button>
            ) : null}
          </div>
        </div>

        {session ? (
          <div className="hidden flex-wrap items-center gap-2 lg:flex">
            <div className="text-xs uppercase tracking-[0.22em] text-black/40">Accesos rápidos</div>
            <div className="flex flex-wrap gap-2">
              {quickLinks.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
                return (
                  <Button
                    key={item.href}
                    href={item.href}
                    size="sm"
                    variant={isActive ? "primary" : "secondary"}
                    className={isActive ? "" : "bg-white"}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              {roleLabels.map((role) => (
                <Badge key={role} tone="neutral">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
