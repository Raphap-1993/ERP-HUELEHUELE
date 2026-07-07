"use client";

import { type FormEvent, useState, useTransition } from "react";
import {
  submitVendorApplicationDraft,
  validateVendorApplicationDraft,
  type VendorApplicationDraft,
  type VendorApplicationErrors,
} from "../lib/vendor-applications";
import {
  HueleBadge,
  HueleButton,
  HueleFieldShell,
  HueleMascot,
  HuelePanel
} from "../../../components/huele-public-ui";

const applicationIntentOptions: Array<{
  id: VendorApplicationDraft["applicationIntent"];
  label: string;
  messageLabel: string;
}> = [
  { id: "affiliate", label: "Afiliado/a", messageLabel: "Afiliado/a" },
  { id: "content_creator", label: "Contenido", messageLabel: "Creador/a de contenido" },
  { id: "seller", label: "Vendedor/a", messageLabel: "Vendedor/a" },
  { id: "other", label: "Otra idea", messageLabel: "Otra idea" },
];

export function VendorApplicationForm({
  source = "Trabaja con nosotros",
  submitLabel = "Enviar mi postulación",
  className,
}: {
  source?: string;
  submitLabel?: string;
  className?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [applicationIntent, setApplicationIntent] = useState<VendorApplicationDraft["applicationIntent"]>("affiliate");
  const [instagram, setInstagram] = useState("");
  const [messageText, setMessageText] = useState("");
  const [errors, setErrors] = useState<VendorApplicationErrors>({});
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const selectedIntent = applicationIntentOptions.find((option) => option.id === applicationIntent);
    const fullMessage = [
      selectedIntent ? `Modalidad: ${selectedIntent.messageLabel}` : null,
      age ? `Edad: ${age}` : null,
      instagram ? `Instagram: ${instagram}` : null,
      messageText.trim() ? messageText.trim() : null,
    ]
      .filter(Boolean)
      .join("\n");

    const currentDraft: VendorApplicationDraft = {
      name: name.trim(),
      email: email.trim(),
      city: city.trim(),
      phone: phone.trim(),
      applicationIntent,
      message: fullMessage,
    };

    const nextErrors = validateVendorApplicationDraft(currentDraft);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          const response = await submitVendorApplicationDraft(currentDraft, source);
          setFeedback({ tone: "success", message: response.message });
          setName("");
          setEmail("");
          setCity("");
          setPhone("");
          setAge("");
          setInstagram("");
          setMessageText("");
          setApplicationIntent("affiliate");
          setErrors({});
        } catch (error) {
          setFeedback({
            tone: "error",
            message: error instanceof Error ? error.message : "No pudimos registrar la postulación.",
          });
        }
      })();
    });
  }

  return (
    <HuelePanel tone="cream" className={className}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <HueleBadge tone="green">Postula ahora</HueleBadge>
          <h3 className="mt-4 text-3xl leading-none text-[var(--hh-public-green-950)]">Cuéntanos quién eres</h3>
          <p className="mt-3 text-sm leading-6 text-[var(--hh-public-muted)]">
            Te respondemos en 48 horas con los siguientes pasos para validar tu colaboración.
          </p>
        </div>
        <HueleMascot decorative size="sm" className="hidden shrink-0 sm:block" />
      </div>

      {feedback?.tone === "success" ? (
        <div className="grid place-items-center py-8 text-center">
          <HueleMascot decorative size="md" />
          <h4 className="mt-4 text-3xl leading-none text-[var(--hh-public-green-950)]">Postulación recibida</h4>
          <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--hh-public-muted)]">{feedback.message}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_112px]">
            <HueleFieldShell label="Nombre completo" error={errors.name}>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                autoComplete="name"
              />
            </HueleFieldShell>
            <HueleFieldShell label="Edad">
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="24"
                min="16"
                max="65"
              />
            </HueleFieldShell>
          </div>

          <HueleFieldShell label="WhatsApp" error={errors.phone}>
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+51 999 000 000"
              autoComplete="tel"
            />
          </HueleFieldShell>

          <HueleFieldShell label="Email" error={errors.email}>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              autoComplete="email"
            />
          </HueleFieldShell>

          <HueleFieldShell label="Ciudad" error={errors.city}>
            <input
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Lima, Cusco, Trujillo..."
              autoComplete="address-level2"
            />
          </HueleFieldShell>

          <div className="grid gap-2 text-[var(--hh-public-ink)]">
            <span className="text-sm font-extrabold">¿Cómo te gustaría colaborar?</span>
            <div className="flex flex-wrap gap-2">
              {applicationIntentOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setApplicationIntent(opt.id)}
                  className={`px-3.5 py-2 rounded-[9px] border text-xs font-medium transition
                    ${
                      applicationIntent === opt.id
                        ? "border-[var(--hh-public-green-600)] bg-[#dff8ca] text-[var(--hh-public-green-950)]"
                        : "border-[var(--hh-public-line)] bg-white/74 text-[var(--hh-public-muted)] hover:border-[rgba(96,189,61,0.42)]"
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <HueleFieldShell label="Instagram u otra red social">
            <input
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@tuusuario"
              autoComplete="off"
            />
          </HueleFieldShell>

          <HueleFieldShell label="Cuéntanos sobre ti" error={errors.message}>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="¿Por qué te interesa Huele Huele? ¿Qué experiencia tienes en ventas o contenido?"
              rows={4}
              className="resize-y"
            />
          </HueleFieldShell>

          {feedback?.tone === "error" ? (
            <div
              className="rounded-2xl border border-[#ffc2b1] bg-[#ffe4db] px-4 py-3 text-sm font-bold text-[#9e321f]"
              role="status"
            >
              {feedback.message}
            </div>
          ) : null}

          <HueleButton
            type="submit"
            disabled={isPending}
            tone="dark"
            className="w-full disabled:opacity-60"
          >
            {isPending ? "Enviando..." : submitLabel}
          </HueleButton>
          <p className="text-[11px] text-[#6b7280] text-center">
            Respondemos en 48 horas hábiles. Todas las postulaciones se revisan personalmente.
          </p>
        </form>
      )}
    </HuelePanel>
  );
}
