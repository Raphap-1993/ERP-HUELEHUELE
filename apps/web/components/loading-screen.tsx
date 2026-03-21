"use client";

import { useEffect, useState } from "react";

interface LoadingScreenProps {
  imageUrl?: string;
}

export function LoadingScreen({ imageUrl }: LoadingScreenProps) {
  const [phase, setPhase] = useState<"enter" | "visible" | "exit" | "done">("enter");

  useEffect(() => {
    // Fase entrada: imagen aparece y crece desde 150px
    const enterTimer = setTimeout(() => setPhase("visible"), 50);

    // Fase salida: overlay desaparece después de que la página carga
    function startExit() {
      setPhase("exit");
      setTimeout(() => setPhase("done"), 600);
    }

    if (document.readyState === "complete") {
      const exitTimer = setTimeout(startExit, 800);
      return () => {
        clearTimeout(enterTimer);
        clearTimeout(exitTimer);
      };
    }

    window.addEventListener("load", startExit, { once: true });
    // Fallback: si load no dispara en 3s, salir igual
    const fallbackTimer = setTimeout(startExit, 3000);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(fallbackTimer);
      window.removeEventListener("load", startExit);
    };
  }, []);

  if (phase === "done" || !imageUrl) return null;

  return (
    <div
      aria-hidden="true"
      className={[
        "fixed inset-0 z-[9999] flex items-center justify-center bg-white",
        "transition-opacity duration-500 ease-in-out",
        phase === "exit" ? "opacity-0 pointer-events-none" : "opacity-100",
      ].join(" ")}
    >
      <img
        src={imageUrl}
        alt=""
        className={[
          "object-contain",
          "transition-all duration-700 ease-out",
          phase === "enter"
            ? "h-[150px] w-[150px] scale-75 opacity-0"
            : "h-[150px] w-[150px] scale-100 opacity-100",
        ].join(" ")}
      />
    </div>
  );
}
