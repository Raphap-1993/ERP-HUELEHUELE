"use client";

import { type FormEvent, useEffect, useState } from "react";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Textarea, WholesalePlanCard } from "@huelegood/ui";
import { wholesalePlans } from "@huelegood/shared";
import { fetchWholesaleTiers, submitWholesaleLead } from "../lib/api";
import { brandArt, EditorialMedia } from "./public-brand";

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
    <div className="space-y-8 py-6 md:py-10">
      <section className="grid gap-6 lg:grid-cols-[1fr_0.92fr]">
        <Card className="rounded-[2.4rem] border-black/8 bg-[linear-gradient(180deg,#ffffff_0%,#f2f6ee_100%)]">
          <CardContent className="space-y-5">
            <Badge className="bg-[#132016] text-white">Canal comercial</Badge>
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-[#132016] md:text-5xl">Mayoristas y distribuidores</h1>
              <p className="max-w-2xl text-base leading-7 text-black/66">
                Huele Huele tambien se puede mover por volumen. Presenta tu negocio, deja tu contacto y te compartimos
                condiciones comerciales claras segun volumen y continuidad.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="neutral" className="bg-[#eef2e8]">Compra por volumen</Badge>
              <Badge tone="neutral" className="bg-[#eef2e8]">Cotizacion rapida</Badge>
              <Badge tone="neutral" className="bg-[#eef2e8]">Seguimiento comercial</Badge>
            </div>
          </CardContent>
        </Card>
        <EditorialMedia src={brandArt.wholesale} alt="Visual editorial de canal mayorista" className="min-h-[320px]" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Formulario comercial</CardTitle>
            <CardDescription>Tu solicitud será revisada por nuestro equipo comercial.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                placeholder="Empresa o distribuidora"
                required
              />
              <Input
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                placeholder="Nombre de contacto"
                required
              />
              <Input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Correo electrónico"
                type="email"
                required
              />
              <Input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Ciudad"
                required
              />
              <Input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Teléfono"
              />
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Cuéntanos el volumen aproximado o el tipo de compra que buscas"
              />
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

        <Card>
          <CardHeader>
            <CardTitle>Como funciona</CardTitle>
            <CardDescription>Proceso corto, comercial y facil de seguir.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-black/70">
            <p>1. Registras tu empresa y un contacto valido.</p>
            <p>2. El equipo comercial revisa potencial, ciudad y volumen estimado.</p>
            <p>3. Si aplica, recibes una cotizacion con condiciones por compra y continuidad.</p>
            <p>4. El seguimiento se hace contigo hasta cerrar negociacion o primer pedido.</p>
            <p>5. Si el canal funciona, se escala la relacion comercial con mayor claridad.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {tiers.map((plan) => (
          <WholesalePlanCard key={plan.tier} plan={plan} />
        ))}
      </div>

      {loadingTiers ? <p className="text-sm text-black/55">Cargando tiers mayoristas...</p> : null}
    </div>
  );
}
