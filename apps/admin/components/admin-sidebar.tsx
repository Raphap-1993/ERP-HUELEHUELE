"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { adminNavigation, filterNavigationGroupsByRoles, siteSetting } from "@huelegood/shared";
import { useAdminSession } from "./admin-session-provider";

type AdminSidebarProps = {
  variant?: "desktop" | "mobile";
  open?: boolean;
  onClose?: () => void;
};

const NAV_GROUP_META: Record<string, string> = {
  Resumen: "Dashboard y lectura ejecutiva",
  "Operación": "Pedidos, pagos y seguimiento diario",
  "Catálogo": "Productos y contenido publicado",
  Comercial: "Canales, vendedores y mayoristas",
  Clientes: "CRM, campañas y retención",
  Sistema: "Control interno y configuración"
};

const NAV_ICONS: Record<string, React.ReactNode> = {
  "/": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  "/reportes": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  "/pedidos": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
  "/pagos": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  "/productos": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M20 7l-8-4-8 4 8 4 8-4z"/><path d="M4 7v10l8 4 8-4V7"/><path d="M12 11v10"/></svg>,
  "/vendedores": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  "/comisiones": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  "/cupones": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  "/cms": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>,
  "/mayoristas": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>,
  "/loyalty": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  "/marketing": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  "/crm": <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
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
  variant: AdminSidebarProps["variant"],
  activeGroupTitle?: string
) {
  if (variant === "mobile") {
    return Array.from(new Set([activeGroupTitle ?? groups[0]?.title].filter(Boolean))) as string[];
  }

  const activeIndex = activeGroupTitle ? groups.findIndex((group) => group.title === activeGroupTitle) : -1;
  if (activeIndex === -1) {
    return Array.from(new Set(groups.slice(0, 2).map((group) => group.title).filter(Boolean))) as string[];
  }

  const adjacentTitle = groups[activeIndex + 1]?.title ?? groups[activeIndex - 1]?.title ?? groups[0]?.title;
  return Array.from(new Set([activeGroupTitle, adjacentTitle].filter(Boolean))) as string[];
}

function getCollapsedGroupPreview(items: { label: string }[]) {
  return items.slice(0, 2).map((item) => item.label).join(" · ");
}

export function AdminSidebar({ variant = "desktop", open = false, onClose }: AdminSidebarProps) {
  const isDesktop = variant === "desktop";
  const pathname = usePathname();
  const { session, logout } = useAdminSession();
  const roleCodes = session?.user.roles.map((role) => role.code) ?? [];
  const visibleNavigation = session ? filterNavigationGroupsByRoles(adminNavigation, roleCodes) : [];
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

  useEffect(() => {
    if (!visibleNavigation.length) {
      setExpandedGroups([]);
      return;
    }

    const defaultGroups = getDefaultExpandedGroups(visibleNavigation, variant, activeGroupTitle);
    setExpandedGroups((current) => {
      const availableGroups = new Set(visibleNavigation.map((group) => group.title));
      const next = current.filter((title) => availableGroups.has(title));

      if (!next.length) {
        return defaultGroups;
      }

      if (variant === "desktop" && next.length < Math.min(defaultGroups.length, visibleNavigation.length)) {
        return Array.from(new Set([...next, ...defaultGroups]));
      }

      if (activeGroupTitle && !next.includes(activeGroupTitle)) {
        return variant === "mobile" ? [activeGroupTitle] : [...next, activeGroupTitle];
      }

      return next.length === current.length && next.every((title, index) => title === current[index]) ? current : next;
    });
  }, [activeGroupTitle, navigationSignature, variant, visibleNavigation]);

  const toggleGroup = (title: string) => {
    setExpandedGroups((current) => {
      if (variant === "mobile") {
        if (current.includes(title)) {
          return title === activeGroupTitle ? current : [];
        }

        return [title];
      }

      if (current.includes(title)) {
        return title === activeGroupTitle ? current : current.filter((groupTitle) => groupTitle !== title);
      }

      return [...current, title];
    });
  };

  const shellContent = (
    <div className="flex h-full min-h-0 flex-col">

      {/* Header: logo */}
      <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-5">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px] bg-[#52b788] font-bold text-[13px] text-[#1a3a2e]">
          HH
        </div>
        <div>
          <div className="text-[15px] font-semibold text-white leading-tight">{siteSetting.brandName}</div>
          <div className="text-[10px] text-[#9db5a8]">Admin Panel</div>
        </div>
      </div>

      {/* Nav */}
      <div className="relative min-h-0 flex-1">
        <div className="pointer-events-none absolute inset-x-2.5 top-0 z-10 h-4 bg-gradient-to-b from-[#17352a] via-[#17352a]/92 to-transparent" />
        <nav className="admin-sidebar-scroll h-full overflow-y-auto overscroll-contain px-2.5 py-3 pr-2 [scrollbar-gutter:stable]">
          {session && visibleNavigation.length ? (
            visibleNavigation.map((group) => {
              const isExpanded = expandedGroups.includes(group.title);
              const isGroupActive = group.title === activeGroupTitle;
              const collapsedPreview = getCollapsedGroupPreview(group.items);
              const groupSummary = isExpanded
                ? (NAV_GROUP_META[group.title] ?? collapsedPreview)
                : collapsedPreview;
              const groupContainerClass = isDesktop
                ? isExpanded || isGroupActive
                  ? "border border-white/[0.06] bg-[#203f33]"
                  : "border border-white/[0.04] bg-[#1d3a2f]"
                : isExpanded || isGroupActive
                  ? "border border-white/[0.05] bg-[#203f33]"
                  : "border border-transparent bg-transparent";
              const groupHeaderClass = isDesktop
                ? isExpanded || isGroupActive
                  ? "bg-[#26493b]"
                  : "bg-[#214133] hover:bg-[#254738]"
                : isExpanded || isGroupActive
                  ? "bg-[#244638]"
                  : "hover:bg-[#1e3c30]";
              const groupSummaryClass = isDesktop
                ? isExpanded
                  ? "text-[12px] text-[#b8cec1]"
                  : "text-[12px] text-[#adc5b8]"
                : "text-[12px] text-[#b4c8bc]";
              const groupTitleClass = isDesktop
                ? "text-[15px] font-semibold tracking-[-0.01em] text-[#f4f8f5]"
                : "text-[14px] font-semibold tracking-[0.01em] text-white/92";
              const chevronClass = isDesktop
                ? isExpanded || isGroupActive
                  ? "text-white/54"
                  : "text-white/46"
                : "text-white/36";

              return (
                <div
                  key={group.title}
                  className={`mb-2 overflow-hidden rounded-[10px] ${groupContainerClass}`}
                >
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.title)}
                    aria-expanded={isExpanded}
                    className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors ${groupHeaderClass}`}
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className={`truncate ${groupTitleClass}`}>{group.title}</span>
                      {groupSummary ? (
                        <span className={`truncate leading-[1.35] ${groupSummaryClass}`}>
                          {groupSummary}
                        </span>
                      ) : null}
                    </div>
                    <svg
                      className={`mt-0.5 h-4 w-4 flex-shrink-0 transition-transform ${chevronClass} ${
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
                    <div className="px-4 pb-2 pt-1.5">
                      <div className="ml-1 border-l border-white/[0.07] pl-3">
                        {group.items.map((item) => {
                          const isActive = isNavigationItemActive(pathname, item.href);
                          return (
                            <a
                              key={item.href}
                              href={item.href}
                              onClick={handleNavigate}
                              aria-current={isActive ? "page" : undefined}
                              className={`mb-1 flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[14px] transition-colors [&_svg]:h-4 [&_svg]:w-4 [&_svg]:flex-shrink-0
                                ${isActive
                                  ? "border border-[#8fdcb0]/[0.12] bg-[#2a4c3d] text-white [&_svg]:opacity-100 [&_svg]:text-[#90dcb0]"
                                  : "text-white/70 hover:bg-[#213e32] hover:text-white/90 [&_svg]:opacity-70 [&_svg]:text-white/44"
                                }`}
                            >
                              {NAV_ICONS[item.href] ?? <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3"/></svg>}
                              <span className="truncate">{item.label}</span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : null}
        </nav>
        <div className="pointer-events-none absolute inset-x-2.5 bottom-0 z-10 h-5 bg-gradient-to-t from-[#17352a] via-[#17352a]/96 to-transparent" />
      </div>

      {/* User card */}
      <div className="flex items-center gap-2.5 border-t border-white/[0.06] px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#234234] text-[11px] font-semibold text-white/88">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold text-white truncate">{session?.user.name ?? "Admin"}</div>
          <div className="text-[10px] text-[#9db5a8] truncate">
            {session?.user.roles[0]?.label ?? ""}
          </div>
        </div>
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
      <aside className="absolute left-0 top-0 z-10 h-[100dvh] min-h-0 w-[min(92vw,288px)] overflow-hidden bg-[#17352a] shadow-[0_18px_42px_rgba(7,17,12,0.24)]">
        {shellContent}
      </aside>
    </div>
  );
}
