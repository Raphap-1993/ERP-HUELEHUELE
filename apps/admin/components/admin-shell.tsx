"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
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

  return (
    <>
      <div className="mx-auto min-h-screen w-full max-w-[1600px] px-4 py-4 lg:px-6 lg:py-6">
        <div className="grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[296px_minmax(0,1fr)]">
          <AdminSidebar variant="desktop" />
          <main className="min-w-0 space-y-5">
            <AdminTopbar onMenuClick={() => setMobileSidebarOpen(true)} />
            {children}
          </main>
        </div>
      </div>
      <AdminSidebar variant="mobile" open={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
    </>
  );
}
