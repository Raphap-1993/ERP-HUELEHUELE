"use client";

import { type FormEvent, useEffect, useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, SectionHeader, Textarea, WholesalePlanCard } from "@huelegood/ui";
import { wholesalePlans } from "@huelegood/shared";
import { fetchWholesaleTiers, submitWholesaleLead } from "../lib/api";

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
      <SectionHeader
        title="Mayoristas y distribuidores"
        description="Captura leads B2B, revisa tiers y deja trazabilidad comercial desde el primer contacto."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Formulario comercial</CardTitle>
            <CardDescription>Tu solicitud entra al flujo mayorista y se revisa desde el backoffice.</CardDescription>
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
            <CardTitle>Proceso mayorista</CardTitle>
            <CardDescription>Flujo corto, visible y compatible con CRM básico.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-black/70">
            <p>1. Registras tu empresa y un contacto válido.</p>
            <p>2. Ventas califica la oportunidad y define si requiere cotización.</p>
            <p>3. Si aplica, se genera una cotización con condiciones comerciales.</p>
            <p>4. El seguimiento queda trazado en el módulo de CRM y mayoristas.</p>
            <p>5. El estado puede avanzar a negociación, ganado o perdido según avance real.</p>
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
