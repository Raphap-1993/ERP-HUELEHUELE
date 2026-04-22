"use client";

import { useCallback, useRef, useState } from "react";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@huelegood/ui";
import { uploadPaymentEvidence } from "../lib/api";

interface YapePaymentModalProps {
  open: boolean;
  walletNumber: string;
  walletType: string;
  walletOwnerName: string;
  total: string;
  onConfirm: (evidenceImageUrl: string) => void;
  onClose: () => void;
}

type UploadState = "idle" | "uploading" | "done" | "error";

const MAX_EVIDENCE_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_EVIDENCE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export function YapePaymentModal({ open, walletNumber, walletType, walletOwnerName, total, onConfirm, onClose }: YapePaymentModalProps) {
  const [copied, setCopied] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleCopy() {
    navigator.clipboard.writeText(walletNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function validateFile(selected: File) {
    if (!SUPPORTED_EVIDENCE_TYPES.has(selected.type)) {
      return "Formato no soportado. Usa JPG, PNG, WebP o AVIF.";
    }

    if (selected.size > MAX_EVIDENCE_FILE_SIZE_BYTES) {
      return "El comprobante supera el máximo de 5 MB. Súbelo más liviano o vuelve a exportarlo.";
    }

    return null;
  }

  function applyFile(selected: File) {
    const validationError = validateFile(selected);
    if (validationError) {
      setFile(null);
      setPreview(null);
      setUploadState("error");
      setUploadError(validationError);
      return;
    }

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
          <DialogTitle>Pagar ahora con billetera virtual</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-5">
          <div className="rounded-[24px] bg-[#61a740] px-5 py-5 text-center text-[#163126]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#163126]/65">Paso 1 · Total a pagar</p>
            <p className="mt-2 font-serif text-4xl font-black">{total}</p>
            <p className="mt-2 text-xs leading-6 text-[#163126]/74">
              Abre tu billetera virtual, paga este monto y luego sube tu comprobante para confirmar el pedido.
            </p>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f6f66]">
              {walletType || "Billetera virtual"}
            </p>
            <div className="flex items-center gap-3 rounded-[20px] border border-[rgba(26,58,46,0.12)] bg-[#fbfaf6] px-4 py-3.5">
              <span className="flex-1 font-mono text-[15px] font-semibold text-[#163126]">{walletNumber}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-full bg-[#61a740] px-4 py-2 text-[12px] font-semibold text-[#163126] transition hover:bg-[#577e2f] hover:text-white active:scale-95"
              >
                {copied ? "¡Copiado!" : "Copiar"}
              </button>
            </div>
            {walletOwnerName && (
              <p className="mt-2 text-[12px] font-medium text-[#163126]">Titular: {walletOwnerName}</p>
            )}
            <p className="mt-1 text-[11px] leading-6 text-[#5f6f66]">
              Copia este número, haz el pago desde tu billetera virtual y sigue con el comprobante aquí mismo.
            </p>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f6f66]">
              Paso 2 · Sube tu comprobante *
            </p>

            {preview ? (
              <div className="space-y-2">
                <div className="relative overflow-hidden rounded-[20px] border border-[rgba(26,58,46,0.12)] bg-[#fbfaf6]">
                  <img src={preview} alt="Comprobante de pago" className="max-h-52 w-full object-contain" />
                  {uploadState !== "uploading" && (
                    <button
                      type="button"
                      onClick={() => { setFile(null); setPreview(null); setUploadState("idle"); setUploadError(null); }}
                      className="absolute right-3 top-3 rounded-full bg-black/65 px-3 py-1 text-[11px] text-white hover:bg-black/80"
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
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[22px] border border-dashed py-9 transition ${
                  dragging
                    ? "border-[#61a740] bg-[#e9f7ec]"
                    : "border-[rgba(26,58,46,0.18)] bg-[#fbfaf6] hover:border-[#61a740] hover:bg-[#f4fbf6]"
                }`}
              >
                <span className="text-2xl">📎</span>
                <p className="text-[13px] font-medium text-[#163126]">
                  {dragging ? "Suelta la imagen aquí" : "Arrastra aquí o haz clic para seleccionar"}
                </p>
                <p className="text-[11px] text-[#5f6f66]">JPG, PNG, WebP o AVIF · máximo 5 MB</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </div>
            )}

            {!preview && uploadState === "error" && uploadError ? (
              <p className="mt-2 text-[12px] text-red-600">{uploadError}</p>
            ) : null}
          </div>

          <p className="rounded-[18px] bg-[#fff7e8] px-4 py-3 text-[12px] leading-relaxed text-[#7a5e1c]">
            Cuando recibamos tu comprobante, te confirmaremos el pedido por WhatsApp o email.
          </p>
        </DialogBody>

        <DialogFooter>
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="rounded-full border border-[rgba(26,58,46,0.12)] bg-white px-5 py-2.5 text-[13px] font-medium text-[#163126] transition hover:bg-[#f4fbf6] disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!file || isUploading}
            className="rounded-full bg-[#61a740] px-6 py-2.5 text-[13px] font-semibold text-[#163126] transition hover:bg-[#577e2f] hover:text-white disabled:opacity-50"
          >
            {isUploading ? "Subiendo..." : "Enviar comprobante"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
