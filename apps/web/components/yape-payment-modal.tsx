"use client";

import { useCallback, useRef, useState } from "react";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@huelegood/ui";
import { uploadPaymentEvidence } from "../lib/api";

interface YapePaymentModalProps {
  open: boolean;
  yapeNumber: string;
  total: string;
  onConfirm: (evidenceImageUrl: string) => void;
  onClose: () => void;
}

type UploadState = "idle" | "uploading" | "done" | "error";

export function YapePaymentModal({ open, yapeNumber, total, onConfirm, onClose }: YapePaymentModalProps) {
  const [copied, setCopied] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleCopy() {
    navigator.clipboard.writeText(yapeNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function applyFile(selected: File) {
    setFile(selected);
    setUploadState("idle");
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selected);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) applyFile(selected);
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.type.startsWith("image/")) {
      applyFile(dropped);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragging(false);
  }, []);

  async function handleConfirm() {
    if (!file) return;
    setUploadState("uploading");
    setUploadError(null);
    try {
      const { url } = await uploadPaymentEvidence(file);
      setUploadState("done");
      onConfirm(url);
    } catch (err) {
      setUploadState("error");
      setUploadError(err instanceof Error ? err.message : "No pudimos subir el comprobante. Intenta de nuevo.");
    }
  }

  function handleClose() {
    if (uploadState === "uploading") return;
    setFile(null);
    setPreview(null);
    setUploadState("idle");
    setUploadError(null);
    setCopied(false);
    onClose();
  }

  const isUploading = uploadState === "uploading";

  return (
    <Dialog open={open} onClose={handleClose} size="md">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pagar con Yape</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-5">
          {/* Total a pagar */}
          <div className="rounded-[14px] bg-[#d8f3dc] px-5 py-4 text-center">
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#2d6a4f]">Total a pagar</p>
            <p className="mt-1 font-serif text-3xl font-bold text-[#1a3a2e]">{total}</p>
          </div>

          {/* Número Yape */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">
              Número Yape
            </p>
            <div className="flex items-center gap-3 rounded-[12px] border-[1.5px] border-[rgba(26,58,46,0.15)] bg-[#f4f4f0] px-4 py-3">
              <span className="flex-1 font-mono text-[15px] font-semibold text-[#1a3a2e]">{yapeNumber}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-[8px] bg-[#1a3a2e] px-3 py-1.5 text-[12px] font-medium text-white transition hover:bg-[#2d6a4f] active:scale-95"
              >
                {copied ? "¡Copiado!" : "Copiar"}
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-[#6b7280]">
              Abre Yape, ingresa este número y realiza el pago.
            </p>
          </div>

          {/* Upload comprobante */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">
              Sube tu captura de pantalla *
            </p>

            {preview ? (
              <div className="space-y-2">
                <div className="relative overflow-hidden rounded-[12px] border-[1.5px] border-[rgba(26,58,46,0.15)] bg-[#f4f4f0]">
                  <img src={preview} alt="Comprobante Yape" className="max-h-52 w-full object-contain" />
                  {uploadState !== "uploading" && (
                    <button
                      type="button"
                      onClick={() => { setFile(null); setPreview(null); setUploadState("idle"); setUploadError(null); }}
                      className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white hover:bg-black/80"
                    >
                      Cambiar
                    </button>
                  )}
                </div>
                {uploadState === "error" && uploadError && (
                  <p className="text-[12px] text-red-600">{uploadError}</p>
                )}
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => inputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px] border-[1.5px] border-dashed py-8 transition ${
                  dragging
                    ? "border-[#52b788] bg-[#d8f3dc]"
                    : "border-[rgba(26,58,46,0.2)] bg-[#f9f9f7] hover:border-[#52b788] hover:bg-[#f4f4f0]"
                }`}
              >
                <span className="text-2xl">📎</span>
                <p className="text-[13px] font-medium text-[#1a3a2e]">
                  {dragging ? "Suelta la imagen aquí" : "Arrastra aquí o haz clic para seleccionar"}
                </p>
                <p className="text-[11px] text-[#6b7280]">JPG, PNG o WebP · máx 5 MB</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </div>
            )}
          </div>

          <p className="rounded-[10px] bg-amber-50 px-4 py-3 text-[12px] leading-relaxed text-amber-800">
            Una vez confirmado tu pedido, validaremos el comprobante y te avisaremos por WhatsApp o email.
          </p>
        </DialogBody>

        <DialogFooter>
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="rounded-[10px] border-[1.5px] border-[rgba(26,58,46,0.12)] bg-white px-5 py-2.5 text-[13px] font-medium text-[#1a3a2e] transition hover:bg-[#f4f4f0] disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!file || isUploading}
            className="rounded-[10px] bg-[#1a3a2e] px-6 py-2.5 text-[13px] font-medium text-white transition hover:bg-[#2d6a4f] disabled:opacity-50"
          >
            {isUploading ? "Subiendo..." : "Confirmar pedido →"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
