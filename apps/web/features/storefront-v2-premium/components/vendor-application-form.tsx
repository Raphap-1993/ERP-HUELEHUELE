"use client";

import { useState, useTransition } from "react";
import {
  submitVendorApplicationDraft,
  validateVendorApplicationDraft,
  type VendorApplicationDraft,
  type VendorApplicationErrors,
} from "../lib/vendor-applications";

const labelStyle = "text-[11px] font-semibold uppercase tracking-[0.07em] text-black/42 block";
const inputLight =
  "w-full px-3.5 py-3 bg-white border border-[rgba(26,58,46,0.15)] rounded-[11px] text-[#1c1c1c] text-sm placeholder:text-[#6b7280] outline-none focus:border-[#52b788] transition";

export function VendorApplicationForm({
  source = "Trabaja con nosotros",
  submitLabel = "✦ Enviar mi postulación",
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
  const [colaboracion, setColaboracion] = useState("afiliado");
  const [instagram, setInstagram] = useState("");
  const [messageText, setMessageText] = useState("");
  const [errors, setErrors] = useState<VendorApplicationErrors>({});
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const fullMessage = [
      colaboracion ? `Modalidad: ${colaboracion}` : null,
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
          setColaboracion("afiliado");
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
    <div
      className={`bg-white rounded-[26px] border border-[rgba(26,58,46,0.08)] p-9 shadow-[0_4px_20px_rgba(26,58,46,0.08)]${className ? ` ${className}` : ""}`}
    >
      <h3 className="font-serif text-xl text-[#1a3a2e] mb-1.5">Postula ahora</h3>
      <p className="text-[13px] text-[#6b7280] mb-6 leading-relaxed">
        Cuéntanos quién eres y cómo te gustaría colaborar. Te respondemos en 48 horas.
      </p>

      {feedback?.tone === "success" ? (
        <div className="text-center py-8">
          <div className="text-5xl mb-4">🦜</div>
          <h4 className="font-serif text-xl text-[#1a3a2e] mb-2">¡Postulación recibida!</h4>
          <p className="text-[13px] text-[#6b7280] leading-relaxed">{feedback.message}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Nombre + Edad */}
          <div className="grid grid-cols-2 gap-3.5">
            <label className="block space-y-1.5">
              <span className={labelStyle}>Nombre completo *</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className={inputLight}
              />
              {errors.name ? (
                <span className="text-xs leading-5 text-[#8c2f1a]">{errors.name}</span>
              ) : null}
            </label>
            <label className="block space-y-1.5">
              <span className={labelStyle}>Edad</span>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="24"
                min="16"
                max="65"
                className={inputLight}
              />
            </label>
          </div>

          {/* WhatsApp */}
          <label className="block space-y-1.5">
            <span className={labelStyle}>WhatsApp *</span>
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+51 999 000 000"
              className={inputLight}
            />
            {errors.phone ? (
              <span className="text-xs leading-5 text-[#8c2f1a]">{errors.phone}</span>
            ) : null}
          </label>

          {/* Email */}
          <label className="block space-y-1.5">
            <span className={labelStyle}>Email *</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className={inputLight}
            />
            {errors.email ? (
              <span className="text-xs leading-5 text-[#8c2f1a]">{errors.email}</span>
            ) : null}
          </label>

          {/* Ciudad */}
          <label className="block space-y-1.5">
            <span className={labelStyle}>Ciudad *</span>
            <input
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Lima, Cusco, Trujillo..."
              className={inputLight}
            />
            {errors.city ? (
              <span className="text-xs leading-5 text-[#8c2f1a]">{errors.city}</span>
            ) : null}
          </label>

          {/* Cómo colaborar: pills */}
          <div className="space-y-1.5">
            <span className={labelStyle}>¿Cómo te gustaría colaborar? *</span>
            <div className="flex gap-2 flex-wrap">
              {[
                { id: "afiliado", label: "🔗 Afiliado/a" },
                { id: "contenido", label: "📱 Contenido" },
                { id: "vendedor", label: "🛍️ Vendedor/a" },
                { id: "otro", label: "✨ Otra idea" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setColaboracion(opt.id)}
                  className={`px-3.5 py-2 rounded-[9px] border text-xs font-medium transition
                    ${
                      colaboracion === opt.id
                        ? "border-[#2d6a4f] bg-[#d8f3dc] text-[#1a3a2e]"
                        : "border-[rgba(26,58,46,0.18)] text-[#6b7280] hover:border-[rgba(45,106,79,0.4)]"
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Instagram */}
          <label className="block space-y-1.5">
            <span className={labelStyle}>Instagram u otra red social</span>
            <input
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@tuusuario"
              className={inputLight}
            />
          </label>

          {/* Cuéntanos */}
          <label className="block space-y-1.5">
            <span className={labelStyle}>Cuéntanos sobre ti *</span>
            <textarea
              required
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="¿Por qué te interesa Huele Huele? ¿Qué experiencia tienes en ventas o contenido?"
              rows={4}
              className={`${inputLight} resize-y`}
            />
            {errors.message ? (
              <span className="text-xs leading-5 text-[#8c2f1a]">{errors.message}</span>
            ) : null}
          </label>

          {/* Error feedback */}
          {feedback?.tone === "error" ? (
            <div
              className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
              role="status"
            >
              {feedback.message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-[#2d6a4f] hover:bg-[#1a3a2e] text-white font-semibold py-4 rounded-full text-sm transition shadow-[0_8px_30px_rgba(45,106,79,0.3)] disabled:opacity-60"
          >
            {isPending ? "Enviando..." : submitLabel}
          </button>
          <p className="text-[11px] text-[#6b7280] text-center">
            Respondemos en 48 horas hábiles. Todas las postulaciones se revisan personalmente.
          </p>
        </form>
      )}
    </div>
  );
}
