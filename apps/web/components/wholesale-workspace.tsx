"use client";

import { type FormEvent, useEffect, useState } from "react";
import { WholesalePlanCard } from "@huelegood/ui";
import { wholesalePlans } from "@huelegood/shared";
import { fetchWholesaleTiers, submitWholesaleLead } from "../lib/api";

export function WholesaleWorkspace() {
  const [tiers, setTiers] = useState(wholesalePlans);
  const [loadingTiers, setLoadingTiers] = useState(true);

  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [volume, setVolume] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [nextStep, setNextStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadTiers() {
      setLoadingTiers(true);
      try {
        const response = await fetchWholesaleTiers();
        if (active) {
          setTiers(response.data);
        }
      } catch {
        if (active) {
          setTiers(wholesalePlans);
        }
      } finally {
        if (active) {
          setLoadingTiers(false);
        }
      }
    }

    void loadTiers();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    setNextStep(null);

    const notesValue = [
      businessType ? `Tipo de negocio: ${businessType}` : null,
      volume ? `Volumen estimado: ${volume}` : null,
      notes.trim() ? notes.trim() : null,
    ]
      .filter(Boolean)
      .join(" | ");

    try {
      const response = await submitWholesaleLead({
        company: company.trim(),
        contact: contact.trim(),
        email: email.trim(),
        city: city.trim(),
        phone: phone.trim() || undefined,
        notes: notesValue || undefined,
        source: "Landing mayorista",
      });
      setMessage(response.message);
      setNextStep(response.nextStep ?? null);
      setCompany("");
      setContact("");
      setEmail("");
      setCity("");
      setPhone("");
      setNotes("");
      setBusinessType("");
      setVolume("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No pudimos enviar tu solicitud."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-0">
      {/* Sección oscura principal */}
      <section className="bg-[#1a3a2e] py-24 relative overflow-hidden">
        <div className="mx-auto max-w-[1120px] px-6">
          <div className="grid grid-cols-1 gap-16 xl:grid-cols-2 xl:items-start">

            {/* Columna izquierda: info */}
            <div>
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#52b788] bg-[rgba(82,183,136,0.15)] px-4 py-1.5 rounded-full mb-5">
                Oportunidad de negocio
              </span>
              <h2 className="font-serif text-4xl font-black text-white leading-tight mb-4 md:text-5xl">
                Vende Huele Huele<br />en tu negocio
              </h2>
              <p className="text-[17px] text-white/65 leading-7 max-w-[520px] mb-8">
                Márgenes atractivos, stock disponible y soporte desde el primer pedido.
              </p>

              {/* Beneficios */}
              <div className="flex flex-col gap-5 mb-8">
                {[
                  {
                    icon: "💰",
                    title: "Hasta 57% de margen por unidad",
                    desc: "Tu precio de compra baja cuanto más volumen manejas. Empieza desde 10 unidades.",
                  },
                  {
                    icon: "📦",
                    title: "Stock disponible, despacho en 24-72h",
                    desc: "Lima y provincias vía Olva Courier y Shalom.",
                  },
                  {
                    icon: "🤝",
                    title: "Soporte y materiales de venta",
                    desc: "Imágenes, textos y orientación para que puedas vender desde el día 1.",
                  },
                  {
                    icon: "📍",
                    title: "Exclusividad de zona disponible",
                    desc: "Para distribuidores con 100+ unidades activas al mes.",
                  },
                ].map((ben) => (
                  <div key={ben.title} className="flex gap-4 items-start">
                    <div className="w-11 h-11 rounded-[13px] flex-shrink-0 bg-[rgba(82,183,136,0.12)] border border-[rgba(82,183,136,0.2)] flex items-center justify-center text-[18px]">
                      {ben.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-1">{ben.title}</h4>
                      <p className="text-[13px] text-white/50 leading-[1.55]">{ben.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3.5">
                {[
                  { num: "57%", label: "Margen máximo por unidad" },
                  { num: "10", label: "Unidades mínimas para empezar" },
                  { num: "72h", label: "Despacho a todo el Perú" },
                ].map((stat) => (
                  <div
                    key={stat.num}
                    className="bg-white/5 border border-white/8 rounded-[15px] p-4 text-center"
                  >
                    <div className="font-serif text-[28px] font-black text-[#52b788]">
                      {stat.num}
                    </div>
                    <p className="text-[11px] text-white/40 mt-1 leading-[1.4]">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Columna derecha: formulario */}
            <div>
              {message ? (
                <div className="bg-white/5 border border-white/12 rounded-[26px] p-10 text-center">
                  <div className="text-5xl mb-4">🎉</div>
                  <h4 className="font-serif text-xl text-white mb-2">¡Solicitud enviada!</h4>
                  <p className="text-sm text-white/55 leading-relaxed">{message}</p>
                  {nextStep ? (
                    <p className="mt-2 text-sm text-[#52b788]">{nextStep}</p>
                  ) : null}
                </div>
              ) : (
                <div className="bg-white/5 border border-white/12 rounded-[26px] p-9">
                  <h3 className="font-serif text-xl text-white mb-1.5">
                    Solicita tu catálogo mayorista
                  </h3>
                  <p className="text-[13px] text-white/50 mb-6 leading-relaxed">
                    Completa el formulario y te respondemos en menos de 24 horas.
                  </p>

                  <form className="space-y-3.5" onSubmit={handleSubmit}>
                    {/* Fila 1: nombre + WhatsApp */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <label className="block space-y-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-white/40">
                          Nombre completo *
                        </span>
                        <input
                          required
                          value={contact}
                          onChange={(e) => setContact(e.target.value)}
                          placeholder="Tu nombre"
                          className="w-full px-3.5 py-3 bg-white/7 border border-white/14 rounded-[11px] text-white text-sm placeholder:text-white/25 outline-none focus:border-[#52b788] transition"
                        />
                      </label>
                      <label className="block space-y-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-white/40">
                          WhatsApp *
                        </span>
                        <input
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+51 999 000 000"
                          type="tel"
                          className="w-full px-3.5 py-3 bg-white/7 border border-white/14 rounded-[11px] text-white text-sm placeholder:text-white/25 outline-none focus:border-[#52b788] transition"
                        />
                      </label>
                    </div>

                    {/* Email */}
                    <label className="block space-y-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-white/40">
                        Correo electrónico
                      </span>
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@correo.com"
                        type="email"
                        className="w-full px-3.5 py-3 bg-white/7 border border-white/14 rounded-[11px] text-white text-sm placeholder:text-white/25 outline-none focus:border-[#52b788] transition"
                      />
                    </label>

                    {/* Nombre de negocio */}
                    <label className="block space-y-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-white/40">
                        Nombre de tu negocio
                      </span>
                      <input
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Ej: Botica Central, Tienda Naturista..."
                        className="w-full px-3.5 py-3 bg-white/7 border border-white/14 rounded-[11px] text-white text-sm placeholder:text-white/25 outline-none focus:border-[#52b788] transition"
                      />
                    </label>

                    {/* Tipo de negocio */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-white/40">
                        Tipo de negocio *
                      </span>
                      <div className="flex gap-2 flex-wrap">
                        {["🛒 Tienda", "💊 Botica", "🌿 Naturista", "🚀 Emprendedor", "✦ Otro"].map(
                          (opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setBusinessType(opt)}
                              className={`px-3.5 py-2 rounded-[9px] border text-xs font-medium transition ${
                                businessType === opt
                                  ? "border-[#52b788] bg-[rgba(82,183,136,0.12)] text-white"
                                  : "border-white/13 text-white/60 hover:border-[rgba(82,183,136,0.4)]"
                              }`}
                            >
                              {opt}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Volumen */}
                    <label className="block space-y-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-white/40">
                        Volumen mensual estimado
                      </span>
                      <select
                        value={volume}
                        onChange={(e) => setVolume(e.target.value)}
                        className="w-full px-3.5 py-3 bg-white/7 border border-white/14 rounded-[11px] text-white text-sm outline-none focus:border-[#52b788] transition cursor-pointer appearance-none"
                      >
                        <option value="" className="bg-[#1a3a2e]">
                          Selecciona un rango
                        </option>
                        <option value="10 – 24 unidades" className="bg-[#1a3a2e]">
                          10 – 24 unidades
                        </option>
                        <option value="25 – 49 unidades" className="bg-[#1a3a2e]">
                          25 – 49 unidades
                        </option>
                        <option value="50 – 99 unidades" className="bg-[#1a3a2e]">
                          50 – 99 unidades
                        </option>
                        <option value="100+ unidades" className="bg-[#1a3a2e]">
                          100+ unidades
                        </option>
                      </select>
                    </label>

                    {/* Ciudad */}
                    <label className="block space-y-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-white/40">
                        Ciudad / Región
                      </span>
                      <input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Lima, Cusco, Arequipa..."
                        className="w-full px-3.5 py-3 bg-white/7 border border-white/14 rounded-[11px] text-white text-sm placeholder:text-white/25 outline-none focus:border-[#52b788] transition"
                      />
                    </label>

                    {/* Mensaje */}
                    <label className="block space-y-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-white/40">
                        Mensaje (opcional)
                      </span>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Cuéntanos sobre tu negocio o cualquier consulta..."
                        rows={3}
                        className="w-full px-3.5 py-3 bg-white/7 border border-white/14 rounded-[11px] text-white text-sm placeholder:text-white/25 outline-none focus:border-[#52b788] transition resize-y"
                      />
                    </label>

                    {error ? (
                      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                        {error}
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#f0d080] text-[#1a3a2e] font-bold py-4 rounded-full text-sm transition shadow-[0_8px_30px_rgba(201,168,76,0.3)] disabled:opacity-60"
                    >
                      {submitting ? "Enviando..." : "📋 Enviar solicitud de catálogo"}
                    </button>
                    <p className="text-[11px] text-white/30 text-center">
                      Te respondemos por WhatsApp en menos de 24 horas hábiles
                    </p>
                  </form>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* Sección de planes */}
      <section id="planes" className="bg-[#faf8f3] py-24">
        <div className="mx-auto max-w-[1120px] px-6">
          <div className="mb-10">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#2d6a4f] bg-[#d8f3dc] px-4 py-1.5 rounded-full">
              Planes por volumen
            </span>
            <h2 className="font-serif text-4xl font-black text-[#1a3a2e] mt-4 mb-3">
              Escala la compra según tu operación
            </h2>
          </div>
          {loadingTiers ? (
            <p className="text-sm text-black/55">Cargando planes...</p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {tiers.map((plan) => (
                <WholesalePlanCard key={plan.tier} plan={plan} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
