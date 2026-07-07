import { VendorApplicationForm } from "../components/vendor-application-form";
import {
  HueleBadge,
  HueleMascot,
  HuelePanel,
  HuelePublicPage,
  HueleSection
} from "../../../components/huele-public-ui";

const ROLES = [
  { id: "afiliado", badge: "Código", title: "Afiliado/a de ventas", desc: "Recomienda con tu código personalizado y gana comisión. Sin inversión, sin stock." },
  { id: "contenido", badge: "Redes", title: "Creador/a de contenido", desc: "Crea Reels, TikToks y Stories. Ideal si tienes comunidad en redes sociales." },
  { id: "vendedor", badge: "Campo", title: "Vendedor/a presencial", desc: "Vende en ferias, mercados, eventos o tu barrio. Te damos el stock y tú eliges cómo." },
  { id: "otro", badge: "Idea", title: "Otra propuesta", desc: "¿Tienes una idea de cómo colaborar? Cuéntanos; estamos abiertos a nuevas formas de crecer." },
];

const PERKS = [
  { title: "Comisiones", text: "Pagos reales cada fin de mes por billetera virtual." },
  { title: "Producto", text: "Producto gratis para usar y recomendar con honestidad." },
  { title: "Crecimiento", text: "Mejores condiciones cuanto más vendas." },
  { title: "Soporte", text: "Comunidad activa de colaboradores con seguimiento directo." },
];

export function VendorApplicationPage() {
  return (
    <HuelePublicPage
      eyebrow="Trabaja con nosotros"
      title="Crece con Huele Huele"
      description="Si te apasiona el bienestar, las ventas o crear contenido, puedes sumarte a una marca que crece con producto real, soporte cercano y comisiones claras."
      actions={
        <>
          <HueleBadge tone="sun">Afiliados</HueleBadge>
          <HueleBadge tone="mint">Contenido</HueleBadge>
          <HueleBadge tone="cream">Ventas presenciales</HueleBadge>
        </>
      }
    >
      <HueleSection
        eyebrow="Postulaciones"
        title="Elige la forma de colaborar"
        description="Buscamos personas con energía comercial, criterio para recomendar el producto y ganas de construir una comunidad alrededor de Huele Huele."
      >
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.85fr)] xl:items-start">
          <div className="grid gap-5">
            <HuelePanel tone="green" className="grid gap-5 overflow-visible md:grid-cols-[minmax(0,1fr)_180px] md:items-end">
              <div>
                <HueleBadge tone="sun">Convocatoria abierta</HueleBadge>
                <h2 className="mt-5 text-4xl leading-none md:text-5xl">Una red fresca para vender mejor</h2>
                <p className="mt-4 text-sm leading-6 text-white/78 md:text-base">
                  No buscamos solo empleados. Buscamos personas que crean en el producto, lo usen con honestidad y puedan activar su ciudad, comunidad o canal digital.
                </p>
              </div>
              <div className="flex justify-center md:justify-end">
                <HueleMascot decorative size="md" className="translate-y-3" />
              </div>
            </HuelePanel>

            <div className="grid gap-3 md:grid-cols-2">
              {ROLES.map((role, index) => (
                <HuelePanel key={role.id} tone={index === 0 ? "mint" : "cream"} className="flex h-full flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <HueleBadge tone={index === 0 ? "green" : "cream"}>{role.badge}</HueleBadge>
                    <span className="text-2xl font-black text-[var(--hh-public-green-800)]">{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <div>
                    <h3 className="text-2xl leading-none text-[var(--hh-public-green-950)]">{role.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[var(--hh-public-muted)]">{role.desc}</p>
                  </div>
                </HuelePanel>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              {PERKS.map((perk) => (
                <HuelePanel key={perk.title} tone="cream" className="p-5">
                  <HueleBadge tone="mint">{perk.title}</HueleBadge>
                  <p className="mt-3 text-sm leading-6 text-[var(--hh-public-muted)]">{perk.text}</p>
                </HuelePanel>
              ))}
            </div>
          </div>

          <VendorApplicationForm source="Trabaja con nosotros" submitLabel="Enviar postulación" />
        </div>
      </HueleSection>
    </HuelePublicPage>
  );
}
