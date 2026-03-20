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
  const quickLinks = visibleLinks.slice(0, 4);
  const currentItem = useMemo(
    () => visibleLinks.find((item) => pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`))),
    [pathname, visibleLinks]
  );

  const sectionDescription = currentItem
    ? `Gestiona ${currentItem.label.toLowerCase()} con contexto operativo claro y acceso filtrado por rol.`
    : "Vista central de operación para pedidos, pagos, contenido y frentes comerciales.";

  return (
    <header className="rounded-[1.6rem] border border-black/8 bg-white px-5 py-5 shadow-[0_14px_42px_rgba(18,34,20,0.05)]">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3">
            {session ? (
              <Button type="button" variant="secondary" size="sm" className="mt-1 lg:hidden" onClick={onMenuClick}>
                Menú
              </Button>
            ) : null}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-xs uppercase tracking-[0.24em] text-black/42">{siteSetting.brandName}</div>
                {currentItem ? <Badge tone="info">{currentItem.label}</Badge> : <Badge tone="neutral">Panel operativo</Badge>}
              </div>
              <div className="space-y-1">
                <h1 className="text-[2rem] font-semibold tracking-[-0.03em] text-[#132016]">
                  {currentItem?.label ?? "Panel de operación"}
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-black/56">{sectionDescription}</p>
              </div>
            </div>
          </div>

          {session ? (
            <div className="rounded-[1.4rem] border border-black/8 bg-[#f7f8f4] px-4 py-3">
              <div className="text-sm font-medium text-[#132016]">{session.user.name}</div>
              <div className="text-sm text-black/52">{session.user.email}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {roleLabels.slice(0, 2).map((role) => (
                  <Badge key={role} tone="neutral">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {session && quickLinks.length ? (
          <div className="hidden items-center gap-2 border-t border-black/6 pt-4 lg:flex">
            <div className="text-xs uppercase tracking-[0.22em] text-black/38">Accesos rápidos</div>
            <div className="flex flex-wrap gap-2">
              {quickLinks.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
                return (
                  <Button key={item.href} href={item.href} size="sm" variant={isActive ? "primary" : "secondary"}>
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
