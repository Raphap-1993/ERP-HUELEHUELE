"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { WholesalePlanCard } from "@huelegood/ui";
import { wholesalePlans, type AuthSessionSummary } from "@huelegood/shared";
import { fetchSession, fetchWholesaleTiers, logout, submitWholesaleLead } from "../lib/api";
import { accountTypeLabel, hasWholesalePortalAccess } from "../lib/portal-access";
import { clearStoredSessionToken, readStoredSessionToken } from "../lib/session";
import {
  HueleBadge,
  HueleButton,
  HueleButtonLink,
  HueleFieldShell,
  HuelePanel,
  HuelePublicPage,
  HueleSection,
  HueleStatusCard
} from "./huele-public-ui";

const benefitLines = [
  {
    label: "Margen",
    title: "Hasta 57% de margen por unidad",
    description: "Tu precio de compra baja cuanto mas volumen manejas. Empieza desde 10 unidades."
  },
  {
    label: "Stock",
    title: "Stock disponible y despacho 24-72h",
    description: "Lima y provincias via Olva Courier y Shalom con continuidad comercial."
  },
  {
    label: "Soporte",
    title: "Soporte comercial y materiales",
    description: "Catalogo, imagenes y orientacion para vender desde el primer pedido."
  },
  {
    label: "Ruta",
    title: "Ruta distribuidor cuando aplica",
    description: "El modo distribuidor cambia copy y seguimiento, no la propiedad del flujo."
  }
] as const;

function parseEstimatedVolume(value: string) {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : undefined;
}

export function WholesaleWorkspace() {
  const searchParams = useSearchParams();
  const interestType = searchParams.get("interestType") === "distributor" ? "distributor" : "wholesale";
  const [tiers, setTiers] = useState(wholesalePlans);
  const [loadingTiers, setLoadingTiers] = useState(true);
  const [session, setSession] = useState<AuthSessionSummary | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

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

    async function loadSession() {
      const token = readStoredSessionToken();
      if (!token) {
        if (active) {
          setSession(null);
          setLoadingSession(false);
        }
        return;
      }

      try {
        const response = await fetchSession(token);
        if (!active) {
          return;
        }

        if (response.data) {
          setSession(response.data);
        } else {
          clearStoredSessionToken();
          setSession(null);
        }
      } catch {
        clearStoredSessionToken();
        if (active) {
          setSession(null);
        }
      } finally {
        if (active) {
          setLoadingSession(false);
        }
      }
    }

    void loadSession();

    return () => {
      active = false;
    };
  }, []);

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
      notes.trim() ? notes.trim() : null
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
        interestType,
        estimatedVolume: parseEstimatedVolume(volume),
        notes: notesValue || undefined,
        source: interestType === "distributor" ? "Landing distribuidor" : "Landing mayorista"
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
      setError(submitError instanceof Error ? submitError.message : "No pudimos enviar tu solicitud.");
    } finally {
      setSubmitting(false);
    }
  }

  const wholesaleSession = session && hasWholesalePortalAccess(session) ? session : null;

  async function handleLogout() {
    const token = readStoredSessionToken();
    try {
      await logout(token ?? undefined);
    } finally {
      clearStoredSessionToken();
      setSession(null);
    }
  }

  if (loadingSession) {
    return (
      <HuelePublicPage
        eyebrow="Canal mayorista"
        title="Verificando tu acceso comercial"
        description="Estamos revisando si tu cuenta entra al portal mayorista o si corresponde mostrar la solicitud publica."
      >
        <HueleSection>
          <HueleStatusCard title="Un momento" tone="dark">
            <p className="text-sm leading-7 text-white/78">Resolviendo tu sesion comercial...</p>
          </HueleStatusCard>
        </HueleSection>
      </HuelePublicPage>
    );
  }

  if (wholesaleSession) {
    return (
      <HuelePublicPage
        eyebrow="Portal mayorista / distribuidor"
        title="Acceso comercial activo"
        description="Consulta tu identidad comercial, condiciones por volumen y salidas principales desde la misma ruta mayorista."
        actions={
          <>
            <HueleButtonLink href="/catalogo" tone="primary">Ir al catalogo</HueleButtonLink>
            <HueleButtonLink href="/cuenta" tone="secondary">Volver a cuenta</HueleButtonLink>
          </>
        }
      >
        <HueleSection>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(340px,1.08fr)]">
            <HuelePanel tone="dark" className="h-full">
              <HueleBadge tone="mint">Cuenta comercial</HueleBadge>
              <h2 className="mt-5 text-[2rem] leading-tight text-white">{wholesaleSession.user.name}</h2>
              <p className="mt-2 text-sm leading-7 text-white/72">{wholesaleSession.user.email}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[16px] border border-white/14 bg-white/8 px-4 py-4">
                  <p className="text-[11px] font-bold uppercase text-white/48">Tipo de cuenta</p>
                  <p className="mt-2 text-sm font-semibold text-white">{accountTypeLabel(wholesaleSession.user.accountType)}</p>
                </div>
                <div className="rounded-[16px] border border-white/14 bg-white/8 px-4 py-4">
                  <p className="text-[11px] font-bold uppercase text-white/48">Lead asociado</p>
                  <p className="mt-2 text-sm font-semibold text-white">{wholesaleSession.user.wholesaleLeadId ?? "No vinculado"}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {wholesaleSession.user.roles.map((role) => (
                  <HueleBadge key={role.code} tone="dark">{role.label}</HueleBadge>
                ))}
              </div>
            </HuelePanel>

            <HuelePanel tone="cream" className="h-full">
              <HueleBadge tone="green">Portal activo</HueleBadge>
              <h3 className="mt-5 text-[2rem] leading-tight text-[var(--hh-public-green-950)]">Operacion mayorista sobria y cerrada</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--hh-public-muted)]">
                Tu acceso ya esta autenticado. Por ahora el portal concentra identidad, condiciones comerciales y rutas de salida reales sin mezclarlo con checkout retail.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Tiers", value: loadingTiers ? "..." : String(tiers.length) },
                  { label: "Catalogo", value: "Activo" },
                  { label: "Cuenta", value: "Lista" }
                ].map((item) => (
                  <div key={item.label} className="rounded-[16px] border border-[var(--hh-public-line)] bg-white/70 px-4 py-4">
                    <p className="text-[11px] font-bold uppercase text-[var(--hh-public-muted)]">{item.label}</p>
                    <p className="mt-2 text-lg font-black text-[var(--hh-public-green-900)]">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <HueleButton type="button" tone="secondary" onClick={() => void handleLogout()}>
                  Cerrar sesion
                </HueleButton>
              </div>
            </HuelePanel>
          </div>
        </HueleSection>

        <HueleSection
          eyebrow="Condiciones"
          title="Planes por volumen"
          description="Los rangos comerciales se consultan al cargar el portal. Si no hay respuesta, mantenemos el fallback publico para no dejar la pagina vacia."
          actions={<HueleBadge tone={loadingTiers ? "blue" : "green"}>{loadingTiers ? "Cargando tiers" : "Tiers listos"}</HueleBadge>}
        >
          {loadingTiers ? (
            <HueleStatusCard title="Cargando condiciones" tone="mint">
              <p className="text-sm leading-7 text-[var(--hh-public-muted)]">Estamos actualizando planes y rangos comerciales.</p>
            </HueleStatusCard>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {tiers.map((plan) => (
                <WholesalePlanCard key={plan.tier} plan={plan} />
              ))}
            </div>
          )}
        </HueleSection>
      </HuelePublicPage>
    );
  }

  return (
    <HuelePublicPage
      eyebrow={interestType === "distributor" ? "Ruta distribuidor" : "Canal mayorista"}
      title={interestType === "distributor" ? "Activa tu ruta distribuidor" : "Vende Huele Huele en tu negocio"}
      description="Compra por volumen, recibe condiciones claras y deja tus datos para que el equipo comercial te contacte por WhatsApp."
      actions={
        <>
          <HueleButtonLink href="#solicitud" tone="primary">Solicitar catalogo</HueleButtonLink>
          <HueleButtonLink href="#planes" tone="ghost">Ver planes</HueleButtonLink>
        </>
      }
    >
      <HueleSection>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)]">
          <HuelePanel tone="dark" className="h-full">
            <HueleBadge tone="mint">{interestType === "distributor" ? "Distribuidor" : "Mayorista"}</HueleBadge>
            <h2 className="mt-5 text-[2rem] leading-tight text-white">
              {interestType === "distributor" ? "Una ruta comercial para crecer por zona" : "Condiciones claras para vender desde tu negocio"}
            </h2>
            <div className="mt-6 space-y-4">
              {benefitLines.map((benefit) => (
                <div key={benefit.title} className="flex items-start gap-4 rounded-[16px] border border-white/14 bg-white/8 px-4 py-4">
                  <HueleBadge tone="green" className="shrink-0">{benefit.label}</HueleBadge>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{benefit.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-white/72">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </HuelePanel>

          <div id="solicitud" className="scroll-mt-24">
          <HuelePanel tone={message ? "mint" : "cream"} className="h-full">
            {message ? (
              <HueleStatusCard title="Solicitud registrada" tone="mint" mascot>
                <p className="text-sm leading-7 text-[var(--hh-public-muted)]">{message}</p>
                {nextStep ? <HueleBadge tone="green" className="mt-4">{nextStep}</HueleBadge> : null}
              </HueleStatusCard>
            ) : (
              <>
                <HueleBadge tone="sun">Solicitar catalogo</HueleBadge>
                <h2 className="mt-5 text-[2rem] leading-tight text-[var(--hh-public-green-950)]">Cuéntanos sobre tu negocio</h2>
                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <HueleFieldShell label="Nombre completo *">
                      <input required value={contact} onChange={(event) => setContact(event.target.value)} placeholder="Tu nombre" />
                    </HueleFieldShell>
                    <HueleFieldShell label="WhatsApp *">
                      <input
                        required
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder="+51 999 000 000"
                        type="tel"
                      />
                    </HueleFieldShell>
                  </div>

                  <HueleFieldShell label="Correo electronico">
                    <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@correo.com" type="email" />
                  </HueleFieldShell>

                  <HueleFieldShell label="Nombre de tu negocio">
                    <input
                      value={company}
                      onChange={(event) => setCompany(event.target.value)}
                      placeholder="Ej: Botica Central, Tienda Naturista..."
                    />
                  </HueleFieldShell>

                  <div className="space-y-2">
                    <span className="text-[0.88rem] font-extrabold text-[var(--hh-public-green-950)]">Tipo de negocio *</span>
                    <div className="flex flex-wrap gap-2">
                      {["Tienda", "Botica", "Naturista", "Emprendedor", "Otro"].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setBusinessType(option)}
                          className={`rounded-full border px-4 py-2 text-xs font-black transition ${
                            businessType === option
                              ? "border-[var(--hh-public-green-600)] bg-[var(--hh-public-green-600)] text-white"
                              : "border-[var(--hh-public-line)] bg-white/72 text-[var(--hh-public-green-900)] hover:border-[var(--hh-public-green-500)]"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <HueleFieldShell label="Volumen mensual estimado">
                      <select value={volume} onChange={(event) => setVolume(event.target.value)}>
                        <option value="">Selecciona un rango</option>
                        <option value="10 – 24 unidades">10 – 24 unidades</option>
                        <option value="25 – 49 unidades">25 – 49 unidades</option>
                        <option value="50 – 99 unidades">50 – 99 unidades</option>
                        <option value="100+ unidades">100+ unidades</option>
                      </select>
                    </HueleFieldShell>
                    <HueleFieldShell label="Ciudad / region">
                      <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Lima, Cusco, Arequipa..." />
                    </HueleFieldShell>
                  </div>

                  <HueleFieldShell label="Mensaje">
                    <textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="Cuéntanos sobre tu negocio o cualquier consulta..."
                      rows={4}
                    />
                  </HueleFieldShell>

                  {error ? (
                    <div className="rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {error}
                    </div>
                  ) : null}

                  <HueleButton type="submit" disabled={submitting} tone="dark" className="w-full">
                    {submitting ? "Enviando solicitud" : "Enviar solicitud"}
                  </HueleButton>

                  <p className="text-center text-xs leading-6 text-[var(--hh-public-muted)]">
                    Te respondemos por WhatsApp en menos de 24 horas habiles.
                  </p>
                </form>
              </>
            )}
          </HuelePanel>
          </div>
        </div>
      </HueleSection>

      <HueleSection
        className="scroll-mt-24"
        eyebrow="Planes por volumen"
        title="Escala la compra segun tu operacion"
        description="Los tiers se actualizan al cargar la pagina. Si la consulta falla, mostramos el fallback publico para que puedas comparar rangos."
        actions={<HueleBadge tone={loadingTiers ? "blue" : "green"}>{loadingTiers ? "Cargando tiers" : "Tiers listos"}</HueleBadge>}
      >
        <div id="planes" className="scroll-mt-24">
          {loadingTiers ? (
            <HueleStatusCard title="Cargando planes" tone="mint">
              <p className="text-sm leading-7 text-[var(--hh-public-muted)]">Estamos trayendo los rangos comerciales disponibles.</p>
            </HueleStatusCard>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {tiers.map((plan) => (
                <WholesalePlanCard key={plan.tier} plan={plan} />
              ))}
            </div>
          )}
        </div>
      </HueleSection>
    </HuelePublicPage>
  );
}
