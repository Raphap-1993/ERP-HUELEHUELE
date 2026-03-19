"use client";

import { type FormEvent, useEffect, useState } from "react";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Textarea, WholesalePlanCard } from "@huelegood/ui";
import { wholesalePlans } from "@huelegood/shared";
import { fetchWholesaleTiers, submitWholesaleLead } from "../lib/api";
import { EditorialMedia } from "./public-brand";
import { brandArt } from "./public-brand-art";
import { PublicChecklist, PublicField, PublicPageHero, PublicPanel, PublicSectionHeading } from "./public-shell";

export function WholesaleWorkspace() {
  const [tiers, setTiers] = useState(wholesalePlans);
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingTiers, setLoadingTiers] = useState(true);
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

    try {
      const response = await submitWholesaleLead({
        company: company.trim(),
        contact: contact.trim(),
        email: email.trim(),
        city: city.trim(),
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
        source: "Landing mayorista"
      });

      setMessage(response.message);
      setNextStep(response.nextStep ?? null);
      setCompany("");
      setContact("");
      setEmail("");
      setCity("");
      setPhone("");
      setNotes("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No pudimos enviar tu solicitud.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-10 py-6 md:space-y-14 md:py-10">
      <PublicPageHero
        eyebrow="Canal comercial"
        title="Mayoristas y distribuidores con una entrada clara y seria."
        description="Si el canal público quiere verse profesional, el módulo mayorista debe sentirse igual de bien resuelto: propuesta de valor clara, formulario sólido y condiciones visibles."
        actions={[
          { label: "Solicitar cotización", href: "#form-mayoristas" },
          { label: "Ver planes", href: "#planes", variant: "secondary" }
        ]}
        metrics={[
          { label: "Canal", value: "B2B", detail: "Compra por volumen para distribuidores y puntos de venta." },
          { label: "Proceso", value: "Ágil", detail: "Solicitud, revisión y cotización comercial." },
          { label: "Relación", value: "Directa", detail: "Seguimiento real con ventas, no formularios vacíos." }
        ]}
        aside={<EditorialMedia src={brandArt.wholesale} alt="Visual editorial de canal mayorista" className="min-h-[460px]" />}
      />

      <section className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
        <Card id="form-mayoristas" className="rounded-[2.4rem] border-black/8 bg-[linear-gradient(180deg,#ffffff_0%,#f2f6ee_100%)]">
          <CardHeader>
            <CardTitle>Solicitud comercial</CardTitle>
            <CardDescription>Déjanos tus datos y el contexto de compra para responder con una propuesta seria.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <PublicField label="Empresa o distribuidora">
                  <Input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Ej. Distribuciones del Pacífico" required />
                </PublicField>
                <PublicField label="Nombre de contacto">
                  <Input value={contact} onChange={(event) => setContact(event.target.value)} placeholder="Nombre completo" required />
                </PublicField>
                <PublicField label="Correo electrónico">
                  <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="contacto@empresa.com" type="email" required />
                </PublicField>
                <PublicField label="Ciudad">
                  <Input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Ciudad base" required />
                </PublicField>
                <PublicField label="Teléfono">
                  <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="WhatsApp o teléfono" />
                </PublicField>
                <PublicField label="Volumen y contexto" helper="Cuéntanos qué tipo de negocio operas o el volumen estimado." className="md:col-span-2">
                  <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Tipo de negocio, volumen aproximado y expectativa comercial" />
                </PublicField>
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Enviando..." : "Enviar solicitud"}
              </Button>
            </form>

            {message ? (
              <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                <p className="font-medium">{message}</p>
                {nextStep ? <p className="mt-1 text-emerald-800">{nextStep}</p> : null}
              </div>
            ) : null}

            {error ? (
              <div className="mt-4 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                {error}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[2.4rem] border-black/8 bg-[#132016] text-white shadow-[0_28px_90px_rgba(19,32,22,0.24)]">
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Badge className="w-fit bg-white/14 text-white">Proceso</Badge>
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white">Cómo avanzamos contigo.</h2>
              <p className="text-sm leading-7 text-white/72">
                El canal mayorista no debe parecer un formulario de prueba. Debe explicar claramente cómo se atiende la oportunidad.
              </p>
            </div>
            <PublicChecklist
              tone="dark"
              items={[
                "Recibimos tu empresa, ciudad y contexto comercial.",
                "Ventas revisa potencial, fit y volumen estimado.",
                "Si aplica, enviamos condiciones, cotización y siguiente paso.",
                "El seguimiento continúa hasta primer pedido o cierre comercial."
              ]}
            />
            <EditorialMedia
              src={brandArt.travel}
              alt="Escena editorial de canal comercial"
              className="min-h-[260px] border-white/10 bg-white/8 shadow-none"
            />
          </CardContent>
        </Card>
      </section>

      <section id="planes" className="space-y-6">
        <PublicSectionHeading
          eyebrow="Planes por volumen"
          title="Escala la compra según el tamaño de tu operación."
          description="Mostramos condiciones visibles para que el visitante entienda el canal antes de hablar con ventas."
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {tiers.map((plan) => (
            <WholesalePlanCard key={plan.tier} plan={plan} />
          ))}
        </div>
      </section>

      {loadingTiers ? <p className="text-sm text-black/55">Cargando tiers mayoristas...</p> : null}
    </div>
  );
}
