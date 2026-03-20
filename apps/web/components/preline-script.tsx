"use client";
import { useEffect } from "react";

export function PrelineScript() {
  useEffect(() => {
    import("preline").then(({ HSStaticMethods }) => {
      HSStaticMethods.autoInit();
    });
  }, []);
  return null;
}
