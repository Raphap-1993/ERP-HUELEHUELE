"use client";
import { useEffect, type HTMLAttributes, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Ancho máximo del contenedor. Default: max-w-2xl */
  size?: "sm" | "md" | "lg" | "xl";
}

const DIALOG_SIZES = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Dialog({ open, onClose, children, size = "lg" }: DialogProps) {
  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-8 sm:py-12"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div className={cn("relative z-10 w-full", DIALOG_SIZES[size])}>
        {children}
      </div>
    </div>,
    document.body
  );
}

export function DialogContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-black/10 bg-white shadow-[0_24px_64px_rgba(0,0,0,0.14)]",
        className
      )}
      {...props}
    />
  );
}

export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-black/5 px-6 py-5", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-lg font-semibold tracking-tight text-[#132016]", className)}
      {...props}
    />
  );
}

export function DialogDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1 text-sm text-black/55", className)} {...props} />;
}

export function DialogBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 py-5", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 border-t border-black/5 px-6 py-4",
        className
      )}
      {...props}
    />
  );
}
