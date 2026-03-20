"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { adminNavigation, filterNavigationGroupsByRoles } from "@huelegood/shared";
import { useAdminSession } from "./admin-session-provider";

type AdminTopbarProps = {
  onMenuClick: () => void;
};

export function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  const pathname = usePathname();
  const { session } = useAdminSession();
  const [period, setPeriod] = useState<"semana" | "mes" | "año">("semana");

  const roleCodes = session?.user.roles.map((role) => role.code) ?? [];
  const visibleNavigation = session ? filterNavigationGroupsByRoles(adminNavigation, roleCodes) : [];
  const visibleLinks = visibleNavigation.flatMap((group) => group.items);
  const currentItem = visibleLinks.find(
    (item) => pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`))
  );

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[rgba(26,58,46,0.1)] bg-white px-5 py-3 flex-shrink-0">

      {/* Izquierda: burger (mobile) + título */}
      <div className="flex items-center gap-3">
        {session ? (
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#f4f6f5] lg:hidden"
          >
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        ) : null}
        <div>
          <h2 className="text-[15px] font-semibold text-[#1c1c1c]">
            {currentItem?.label ?? "Dashboard"}
          </h2>
          <p className="text-[11px] text-[#6b7280] mt-0.5">
            {currentItem
              ? `Gestiona ${currentItem.label.toLowerCase()} del negocio`
              : "Resumen general del negocio"}
          </p>
        </div>
      </div>

      {/* Derecha: período + notif + user */}
      <div className="flex items-center gap-2.5">

        {/* Selector período */}
        <div className="hidden items-center overflow-hidden rounded-[9px] border border-[rgba(26,58,46,0.1)] md:flex">
          {(["semana", "mes", "año"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-3.5 py-1.5 text-[12px] font-medium capitalize transition
                ${period === p
                  ? "bg-[#2d6a4f] text-white"
                  : "bg-transparent text-[#6b7280] hover:bg-[#f4f6f5]"
                }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Notificaciones */}
        <div className="relative flex h-8 w-8 items-center justify-center rounded-[8px] border border-[rgba(26,58,46,0.1)] bg-[#f4f6f5] cursor-pointer">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500 ring-[1.5px] ring-white" />
        </div>

        {/* User avatar */}
        {session ? (
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#2d6a4f] text-[11px] font-semibold text-white">
            {session.user.name
              ? session.user.name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
              : "AD"}
          </div>
        ) : null}
      </div>
    </header>
  );
}
