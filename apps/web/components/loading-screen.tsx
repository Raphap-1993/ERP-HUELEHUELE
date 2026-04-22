"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface LoadingScreenProps {
  imageUrl?: string;
}

export function LoadingScreen({ imageUrl }: LoadingScreenProps) {
  const [phase, setPhase] = useState<"enter" | "visible" | "exit" | "done">("done");
  const pathname = usePathname();

  useEffect(() => {
    if (!imageUrl) {
      setPhase("done");
      return;
    }

    setPhase("enter");
    const enterTimer = setTimeout(() => setPhase("visible"), 50);
    const exitTimer = setTimeout(() => setPhase("exit"), 1000);
    const doneTimer = setTimeout(() => setPhase("done"), 1600);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [pathname]);

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
