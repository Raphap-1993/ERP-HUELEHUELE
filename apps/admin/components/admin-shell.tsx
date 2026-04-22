"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { type SiteSetting } from "@huelegood/shared";
import { useAdminSession } from "./admin-session-provider";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";

const DESKTOP_SIDEBAR_COLLAPSED_STORAGE_KEY = "huelegood-admin-sidebar-collapsed";

export function AdminShell({ children, runtimeSiteSettings }: { children: ReactNode; runtimeSiteSettings: SiteSetting }) {
  const pathname = usePathname();
  const { session, loading } = useAdminSession();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState<boolean | null>(null);
  const isPrintRoute = /^\/pedidos\/[^/]+\/etiqueta\/?$/.test(pathname);
  const loadingImageUrl = runtimeSiteSettings.loadingImageUrl?.trim() || undefined;
  const sidebarCollapsed = desktopSidebarCollapsed ?? false;

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileSidebarOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileSidebarOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileSidebarOpen]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const closeSidebar = () => {
      if (mediaQuery.matches) {
        setMobileSidebarOpen(false);
      }
    };

    closeSidebar();
    mediaQuery.addEventListener("change", closeSidebar);

    return () => {
      mediaQuery.removeEventListener("change", closeSidebar);
    };
  }, []);

  useEffect(() => {
    const storedPreference = window.localStorage.getItem(DESKTOP_SIDEBAR_COLLAPSED_STORAGE_KEY);

    if (storedPreference === "true" || storedPreference === "false") {
      setDesktopSidebarCollapsed(storedPreference === "true");
      return;
    }

    setDesktopSidebarCollapsed(window.matchMedia("(max-width: 1279px)").matches);
  }, []);

  useEffect(() => {
    if (desktopSidebarCollapsed === null) {
      return;
    }

    window.localStorage.setItem(DESKTOP_SIDEBAR_COLLAPSED_STORAGE_KEY, String(desktopSidebarCollapsed));
  }, [desktopSidebarCollapsed]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f6f5] px-4 py-10">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-center justify-center">
          <div className="flex w-full flex-col items-center justify-center gap-4 rounded-[2rem] border border-black/8 bg-white px-8 py-10 shadow-[0_18px_54px_rgba(26,58,46,0.06)]">
            {loadingImageUrl ? (
              <div className="flex h-[180px] w-[180px] items-center justify-center rounded-[1.5rem] bg-[#faf8f3] p-4">
                <img src={loadingImageUrl} alt="" className="h-full w-full object-contain" />
              </div>
            ) : (
              <>
                <p className="text-xs uppercase tracking-[0.28em] text-black/40">Huelegood Admin</p>
                <h1 className="text-2xl font-semibold tracking-tight text-[#1a3a2e]">Verificando acceso</h1>
                <p className="text-sm leading-6 text-black/58">Estamos confirmando tu sesión para cargar el panel operativo.</p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#f4f6f5] px-4 py-8 md:px-6 md:py-10">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[1120px] items-center justify-center">{children}</div>
      </div>
    );
  }

  if (isPrintRoute) {
    return <div className="min-h-screen bg-[#f4f6f5]">{children}</div>;
  }

  return (
    <>
      <div className="mx-auto h-screen w-full max-w-[1480px] overflow-hidden px-4 py-4.5 lg:px-5 lg:py-5">
        <div
          className={`grid h-full gap-3 transition-[grid-template-columns] duration-200 ${
            sidebarCollapsed
              ? "lg:grid-cols-[84px_minmax(0,1fr)]"
              : "lg:grid-cols-[220px_minmax(0,1fr)] 2xl:grid-cols-[232px_minmax(0,1fr)]"
          }`}
        >
          <AdminSidebar
            siteSettings={runtimeSiteSettings}
            variant="desktop"
            collapsed={sidebarCollapsed}
            onToggleCollapsed={() => {
              setDesktopSidebarCollapsed((current) => !current);
            }}
          />
          <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
            <div className="lg:hidden">
              <AdminTopbar onMenuClick={() => setMobileSidebarOpen(true)} />
            </div>
            <div className="mt-4 flex-1 space-y-6 overflow-y-auto pb-6 lg:mt-0">
              {children}
            </div>
          </main>
        </div>
      </div>
      <AdminSidebar
        siteSettings={runtimeSiteSettings}
        variant="mobile"
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
    </>
  );
}
