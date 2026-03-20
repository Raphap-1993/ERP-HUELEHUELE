"use client";

import { useState, useTransition } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Textarea, cn } from "@huelegood/ui";
import { submitVendorApplicationDraft, type VendorApplicationDraft, type VendorApplicationErrors, validateVendorApplicationDraft } from "../lib/vendor-applications";

const initialDraft: VendorApplicationDraft = {
  name: "",
  email: "",
  city: "",
  phone: "",
  message: ""
};

function Field({
  label,
  helper,
  error,
  children,
  className
}: {
  label: string;
  helper?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("grid gap-2", className)}>
      <span className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42">{label}</span>
      {children}
      {error ? <span className="text-xs leading-5 text-[#8c2f1a]">{error}</span> : helper ? <span className="text-xs leading-5 text-black/46">{helper}</span> : null}
    </label>
  );
}

export function VendorApplicationForm({
  source = "Trabaja con nosotros",
  submitLabel = "Enviar postulación",
  className
}: {
  source?: string;
  submitLabel?: string;
  className?: string;
}) {
  const [draft, setDraft] = useState(initialDraft);
  const [errors, setErrors] = useState<VendorApplicationErrors>({});
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateField<K extends keyof VendorApplicationDraft>(field: K, value: VendorApplicationDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const nextErrors = validateVendorApplicationDraft(draft);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          const response = await submitVendorApplicationDraft(draft, source);
          setFeedback({
            tone: "success",
            message: response.message
          });
          setDraft(initialDraft);
          setErrors({});
        } catch (error) {
          setFeedback({
            tone: "error",
            message: error instanceof Error ? error.message : "No pudimos registrar la postulación."
          });
        }
      })();
    });
  }

  return (
    <Card className={cn("rounded-[2.4rem] border-black/8 bg-[linear-gradient(180deg,#ffffff_0%,#faf8f3_100%)]", className)}>
      <CardHeader>
        <CardTitle>Postulación</CardTitle>
        <CardDescription>Cuéntanos quién eres, desde dónde venderías y por qué conectas con la marca.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre completo" error={errors.name}>
              <Input value={draft.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Nombre y apellido" />
            </Field>
            <Field label="Correo electrónico" error={errors.email}>
              <Input
                type="email"
                value={draft.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="correo@ejemplo.com"
              />
            </Field>
            <Field label="Ciudad" error={errors.city}>
              <Input value={draft.city} onChange={(event) => updateField("city", event.target.value)} placeholder="Ciudad base" />
            </Field>
            <Field label="Teléfono" helper="Opcional, si quieres acelerar el contacto comercial.">
              <Input value={draft.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="+51 999 999 999" />
            </Field>
          </div>

          <Field
            label="Por qué quieres vender Huele Huele"
            helper="Buscamos claridad comercial, no un texto genérico."
            error={errors.message}
          >
            <Textarea
              value={draft.message}
              onChange={(event) => updateField("message", event.target.value)}
              placeholder="Cuéntanos cómo lo moverías, con qué tipo de cliente conectas y por qué te interesa representar la marca."
            />
          </Field>

          {feedback ? (
            <div
              className={cn(
                "rounded-[1.4rem] border px-4 py-3 text-sm leading-6",
                feedback.tone === "success" ? "border-[#d8f3dc] bg-[#f0faf4] text-[#1a3a2e]" : "border-[#e5b8aa] bg-[#fff5f1] text-[#7a2d1d]"
              )}
              role="status"
              aria-live="polite"
            >
              {feedback.message}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enviando..." : submitLabel}
            </Button>
            <p className="text-xs uppercase tracking-[0.18em] text-black/40">Se envía al flujo actual `POST /store/vendor-applications`.</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
