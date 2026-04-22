"use client";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { adminNavigation, filterNavigationGroupsByRoles, type SiteSetting } from "@huelegood/shared";
import { useAdminSession } from "./admin-session-provider";

type AdminSidebarProps = {
  siteSettings: SiteSetting;
  variant?: "desktop" | "mobile";
  open?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
};

const NAV_GROUP_META: Record<string, string> = {
  "Operación diaria": "Pedidos, despachos y pagos",
  "Inventario y reportes": "Stock, almacenes y lectura del negocio",
  "Catálogo": "Productos y CMS comercial",
  Comercial: "Canales, comisiones y mayoristas",
  Clientes: "Clientes, fidelización y campañas",
  Sistema: "Alertas, observabilidad y configuración"
};

const NAV_GROUP_TONES: Record<string, { muted: string; surface: string; accent: string; guide: string; activeItem: string }> = {
  "Operación diaria": {
    muted: "bg-[#1c382d] hover:bg-[#214032]",
    surface: "bg-[#244638]",
    accent: "bg-[#8fdcb0]",
    guide: "bg-[#8fdcb0]/14",
    activeItem: "bg-[#2a4c3d]"
  },
  "Inventario y reportes": {
    muted: "bg-[#1c3932] hover:bg-[#21413a]",
    surface: "bg-[#234239]",
    accent: "bg-[#8fcec4]",
    guide: "bg-[#8fcec4]/14",
    activeItem: "bg-[#294a40]"
  },
  "Catálogo": {
    muted: "bg-[#1d3930] hover:bg-[#223f33]",
    surface: "bg-[#253f34]",
    accent: "bg-[#b9d089]",
    guide: "bg-[#b9d089]/14",
    activeItem: "bg-[#2b473a]"
  },
  Comercial: {
    muted: "bg-[#1c3932] hover:bg-[#21413a]",
    surface: "bg-[#234239]",
    accent: "bg-[#8fcec4]",
    guide: "bg-[#8fcec4]/14",
    activeItem: "bg-[#294a40]"
  },
  Clientes: {
    muted: "bg-[#1d3a31] hover:bg-[#224036]",
    surface: "bg-[#264138]",
    accent: "bg-[#a6d1b4]",
    guide: "bg-[#a6d1b4]/14",
    activeItem: "bg-[#2d493e]"
  },
  Sistema: {
    muted: "bg-[#1c3732] hover:bg-[#203d38]",
    surface: "bg-[#233d38]",
    accent: "bg-[#a8bbdf]",
    guide: "bg-[#a8bbdf]/14",
    activeItem: "bg-[#294641]"
  }
};

const DEFAULT_NAV_GROUP_TONE = {
  muted: "bg-[#1d392f] hover:bg-[#223f33]",
  surface: "bg-[#244638]",
  accent: "bg-[#8fdcb0]",
  guide: "bg-white/[0.08]",
  activeItem: "bg-[#2a4c3d]"
};

const NAV_ICONS: Record<string, React.ReactNode> = {
  "/": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  "/reportes": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  "/pedidos": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
  "/despachos": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 7.5h11v9H3z"/><path d="M14 10h3l3 3v3h-6z"/><circle cx="7.5" cy="18" r="1.5"/><circle cx="17.5" cy="18" r="1.5"/></svg>,
  "/inventario": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M4 7l8-4 8 4-8 4-8-4z"/><path d="M4 12l8 4 8-4"/><path d="M4 17l8 4 8-4"/></svg>,
  "/transferencias": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M7 7h11"/><path d="M14 4l4 3-4 3"/><path d="M17 17H6"/><path d="M10 14l-4 3 4 3"/></svg>,
  "/pagos": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  "/productos": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M20 7l-8-4-8 4 8 4 8-4z"/><path d="M4 7v10l8 4 8-4V7"/><path d="M12 11v10"/></svg>,
  "/almacenes": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 9h6"/><path d="M9 13h6"/></svg>,
  "/vendedores": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  "/comisiones": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  "/cupones": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  "/cms": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>,
  "/mayoristas": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>,
  "/accesos": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V8a5 5 0 0110 0v3"/><path d="M12 15v2"/></svg>,
  "/loyalty": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  "/marketing": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  "/crm": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  "/notificaciones": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  "/observabilidad": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  "/auditoria": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  "/configuracion": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
};

function isNavigationItemActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

function getDefaultExpandedGroups(
  groups: { title: string }[],
  activeGroupTitle?: string
) {
  const fallbackTitle = activeGroupTitle ?? groups[0]?.title;
  return fallbackTitle ? [fallbackTitle] : [];
}

export function AdminSidebar({
  siteSettings,
  variant = "desktop",
  open = false,
  onClose,
  collapsed = false,
  onToggleCollapsed
}: AdminSidebarProps) {
  const isDesktop = variant === "desktop";
  const isCollapsed = isDesktop && collapsed;
  const pathname = usePathname();
  const { session, logout } = useAdminSession();
  const roleCodes = session?.user.roles.map((role) => role.code) ?? [];
  const roleCodesSignature = roleCodes.join("|");
  const visibleNavigation = useMemo(
    () => (session ? filterNavigationGroupsByRoles(adminNavigation, roleCodes) : []),
    [session, roleCodesSignature]
  );
  const activeGroupTitle = visibleNavigation.find((group) =>
    group.items.some((item) => isNavigationItemActive(pathname, item.href))
  )?.title;
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

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

  const initials = session?.user.name
    ? session.user.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
    : "AD";
  const navigationSignature = visibleNavigation
    .map((group) => `${group.title}:${group.items.map((item) => item.href).join(",")}`)
    .join("|");
  const sidebarLogoUrl = siteSettings.adminSidebarLogoUrl?.trim() || siteSettings.headerLogoUrl?.trim() || undefined;
  const compactNavigation = visibleNavigation.flatMap((group) =>
    group.items.map((item, index) => ({
      ...item,
      groupTitle: group.title,
      isGroupStart: index === 0
    }))
  );

  useEffect(() => {
    if (!visibleNavigation.length) {
      setExpandedGroups([]);
      return;
    }

    const defaultGroups = getDefaultExpandedGroups(visibleNavigation, activeGroupTitle);
    setExpandedGroups((current) => {
      const availableGroups = new Set(visibleNavigation.map((group) => group.title));
      const next = current.filter((title) => availableGroups.has(title));

      if (!next.length) {
        return defaultGroups;
      }

      if (activeGroupTitle && !next.includes(activeGroupTitle)) {
        return [...next, activeGroupTitle];
      }

      return next.length === current.length && next.every((title, index) => title === current[index]) ? current : next;
    });
  }, [activeGroupTitle, navigationSignature, variant, visibleNavigation]);

  const toggleGroup = (title: string) => {
    setExpandedGroups((current) => {
      if (current.includes(title)) {
        return current.filter((groupTitle) => groupTitle !== title);
      }

      return [...current, title];
    });
  };

  const collapseButton = isDesktop && onToggleCollapsed ? (
    <button
      type="button"
      onClick={onToggleCollapsed}
      aria-label={isCollapsed ? "Expandir menú" : "Colapsar menú"}
      title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px] border border-white/[0.07] bg-white/[0.03] text-[#d7e5dd] transition hover:bg-white/[0.07] hover:text-white"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <rect x="4" y="4" width="5" height="16" rx="1.2" />
        {isCollapsed ? <polyline points="13 8 17 12 13 16" /> : <polyline points="17 8 13 12 17 16" />}
      </svg>
    </button>
  ) : null;

  const expandedNavigation = (
    <nav className="admin-sidebar-scroll h-full overflow-y-auto overscroll-contain px-1.5 py-1.5 pr-1 [scrollbar-gutter:stable]">
      {session && visibleNavigation.length
        ? visibleNavigation.map((group) => {
            const isExpanded = expandedGroups.includes(group.title);
            const isGroupActive = group.title === activeGroupTitle;
            const groupSummary = NAV_GROUP_META[group.title] ?? group.items.map((item) => item.label).join(" · ");
            const showExpandedContainer = isExpanded || isGroupActive;
            const groupTone = NAV_GROUP_TONES[group.title] ?? DEFAULT_NAV_GROUP_TONE;

            return (
              <div key={group.title} className="mb-1.5 rounded-[12px]">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.title)}
                  aria-expanded={isExpanded}
                  title={groupSummary}
                  className={`flex w-full items-center gap-2.5 rounded-[11px] px-3 py-2 text-left transition-colors ${
                    showExpandedContainer ? groupTone.surface : groupTone.muted
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                      isGroupActive ? groupTone.accent : isExpanded ? "bg-[#b9ccbf]" : "bg-[#6f897d]"
                    }`}
                  />
                  <div
                    className={`min-w-0 flex-1 truncate text-[11px] font-semibold uppercase tracking-[0.18em] ${
                      showExpandedContainer ? "text-[#edf5f0]" : "text-[#d7e5dd]"
                    }`}
                  >
                    {group.title}
                  </div>
                  <svg
                    className={`h-3.5 w-3.5 flex-shrink-0 text-[#b8cbc1] transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {isExpanded ? (
                  <div className="px-2 pb-1.5 pt-1">
                    <div className="relative pl-2">
                      <div className={`absolute bottom-2 left-[0.95rem] top-1 w-px rounded-full ${groupTone.guide}`} />
                      <div className="space-y-1">
                        {group.items.map((item) => {
                          const isActive = isNavigationItemActive(pathname, item.href);
                          return (
                            <a
                              key={item.href}
                              href={item.href}
                              onClick={handleNavigate}
                              aria-current={isActive ? "page" : undefined}
                              className={`relative flex items-center gap-2 rounded-[10px] px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                                isActive
                                  ? `${groupTone.activeItem} text-white shadow-[inset_0_0_0_1px_rgba(143,220,176,0.12)]`
                                  : "text-[#dbe8e0] hover:bg-[#223f33] hover:text-white"
                              }`}
                            >
                              <span aria-hidden className={`ml-3 h-px w-2 flex-shrink-0 rounded-full ${groupTone.guide}`} />
                              <span
                                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[7px] ${
                                  isActive ? "bg-[#214032] text-[#90dcb0]" : "bg-white/[0.06] text-[#c6d7ce]"
                                }`}
                              >
                                {NAV_ICONS[item.href] ?? (
                                  <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <circle cx="12" cy="12" r="3" />
                                  </svg>
                                )}
                              </span>
                              <span className="truncate">{item.label}</span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        : null}
    </nav>
  );

  const compactNavigationRail = (
    <nav className="admin-sidebar-scroll h-full overflow-y-auto overscroll-contain px-1.5 py-2 pr-1 [scrollbar-gutter:stable]">
      {session && compactNavigation.length
        ? compactNavigation.map((item) => {
            const isActive = isNavigationItemActive(pathname, item.href);
            const isActiveGroupStart = item.isGroupStart && item.groupTitle === activeGroupTitle;
            const groupTone = NAV_GROUP_TONES[item.groupTitle] ?? DEFAULT_NAV_GROUP_TONE;

            return (
              <div key={item.href} className={item.isGroupStart ? "mt-3 first:mt-0" : "mt-1.5"}>
                {item.isGroupStart ? (
                  <div className={`mx-auto mb-2 rounded-full ${isActiveGroupStart ? `h-1 w-5 ${groupTone.accent}` : `h-px w-8 ${groupTone.guide}`}`} />
                ) : null}
                <a
                  href={item.href}
                  onClick={handleNavigate}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={`${item.groupTitle}: ${item.label}`}
                  title={`${item.groupTitle}: ${item.label}`}
                  className={`mx-auto flex h-11 w-11 items-center justify-center rounded-[12px] transition-colors ${
                    isActive
                      ? "bg-[#2a4c3d] text-[#90dcb0] shadow-[inset_0_0_0_1px_rgba(143,220,176,0.12)]"
                      : "text-[#dbe8e0] hover:bg-[#223f33] hover:text-white"
                  }`}
                >
                  {NAV_ICONS[item.href] ?? (
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </a>
              </div>
            );
          })
        : null}
    </nav>
  );

  const shellContent = (
    <div className="flex h-full min-h-0 flex-col">

      {/* Header: logo */}
      <div
        className={`border-b border-white/[0.06] py-3 ${
          isDesktop && isCollapsed ? "flex flex-col items-center gap-2 px-2.5" : "flex items-center gap-2.5 px-3.5"
        }`}
      >
        <div className={`flex min-w-0 items-center ${isDesktop && isCollapsed ? "justify-center" : "flex-1 gap-2.5"}`}>
          {sidebarLogoUrl ? (
            <img
              src={sidebarLogoUrl}
              alt={siteSettings.brandName}
              className={`w-auto flex-shrink-0 object-contain ${isDesktop && isCollapsed ? "h-10 max-w-[44px]" : "h-9 max-w-[70px]"}`}
            />
          ) : (
            <span className="flex-shrink-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#dff0e6]">
              {siteSettings.brandName.slice(0, 2).toUpperCase()}
            </span>
          )}
          {isDesktop && isCollapsed ? null : (
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold leading-tight text-white">{siteSettings.brandName}</div>
            </div>
          )}
        </div>
        {collapseButton}
      </div>

      {/* Nav */}
      <div className="relative min-h-0 flex-1">
        <div className="pointer-events-none absolute inset-x-2 top-0 z-10 h-3 bg-gradient-to-b from-[#17352a] via-[#17352a]/92 to-transparent" />
        {isCollapsed ? compactNavigationRail : expandedNavigation}
        <div className="pointer-events-none absolute inset-x-2 bottom-0 z-10 h-5 bg-gradient-to-t from-[#17352a] via-[#17352a]/96 to-transparent" />
      </div>

      {/* User card */}
      <div
        className={`border-t border-white/[0.06] px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] ${
          isDesktop && isCollapsed ? "flex flex-col items-center gap-2" : "flex items-center gap-2.5"
        }`}
      >
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#234234] text-[11px] font-semibold text-white">
          {initials}
        </div>
        {isDesktop && isCollapsed ? null : (
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-semibold text-white">{session?.user.name ?? "Admin"}</div>
            <div className="truncate text-[10px] text-[#bed0c6]">
              {session?.user.roles[0]?.label ?? ""}
            </div>
          </div>
        )}
        <button
          type="button"
          title="Cerrar sesión"
          onClick={() => { void handleLogout(); }}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[7px] transition hover:bg-[#223f32]"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.58)" strokeWidth={2}>
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </div>
  );

  if (variant === "desktop") {
    return (
      <aside className="sticky top-5 hidden h-[calc(100dvh-2.5rem)] min-h-0 w-full flex-shrink-0 overflow-hidden rounded-[14px] bg-[#17352a] shadow-[0_10px_24px_rgba(7,17,12,0.14)] lg:top-6 lg:flex lg:h-[calc(100dvh-3rem)] lg:flex-col">
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
        onClick={() => { onClose?.(); }}
      />
      <aside className="absolute left-0 top-0 z-10 h-[100dvh] min-h-0 w-[min(88vw,272px)] overflow-hidden bg-[#17352a] shadow-[0_18px_42px_rgba(7,17,12,0.24)]">
        {shellContent}
      </aside>
    </div>
  );
}
