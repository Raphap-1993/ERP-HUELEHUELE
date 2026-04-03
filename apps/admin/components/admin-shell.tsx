"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAdminSession } from "./admin-session-provider";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";

export function AdminShell({ children, loadingImageUrl }: { children: ReactNode; loadingImageUrl?: string }) {
  const pathname = usePathname();
  const { session, loading } = useAdminSession();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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

  return (
    <>
      <div className="mx-auto h-screen w-full max-w-[1520px] overflow-hidden px-4 py-5 lg:px-6 lg:py-6">
        <div className="grid h-full gap-5 lg:grid-cols-[248px_minmax(0,1fr)] xl:grid-cols-[264px_minmax(0,1fr)]">
          <AdminSidebar variant="desktop" />
          <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
            <div className="lg:hidden">
              <AdminTopbar onMenuClick={() => setMobileSidebarOpen(true)} />
            </div>
            <div className="mt-6 flex-1 space-y-6 overflow-y-auto pb-6 lg:mt-0">
              {children}
            </div>
          </main>
        </div>
      </div>
      <AdminSidebar variant="mobile" open={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
    </>
  );
}
