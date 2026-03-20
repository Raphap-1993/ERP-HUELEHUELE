"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAdminSession } from "./admin-session-provider";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";

export function AdminShell({ children }: { children: ReactNode }) {
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
      <div className="min-h-screen bg-[#f5f6f2] px-4 py-10">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-center justify-center">
          <div className="w-full rounded-[2rem] border border-black/8 bg-white px-8 py-10 text-center shadow-[0_18px_54px_rgba(18,34,20,0.06)]">
            <p className="text-xs uppercase tracking-[0.28em] text-black/40">Huelegood Admin</p>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[#132016]">Verificando acceso</h1>
            <p className="mt-3 text-sm leading-6 text-black/58">Estamos confirmando tu sesión para cargar el panel operativo.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#f5f6f2] px-4 py-8 md:px-6 md:py-10">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[1120px] items-center justify-center">{children}</div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto min-h-screen w-full max-w-[1520px] px-4 py-5 lg:px-6 lg:py-6">
        <div className="grid items-start gap-6 lg:grid-cols-[272px_minmax(0,1fr)] xl:grid-cols-[288px_minmax(0,1fr)]">
          <AdminSidebar variant="desktop" />
          <main className="min-w-0 space-y-6">
            <AdminTopbar onMenuClick={() => setMobileSidebarOpen(true)} />
            {children}
          </main>
        </div>
      </div>
      <AdminSidebar variant="mobile" open={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
    </>
  );
}
