import { VendorApplicationForm } from "../components/vendor-application-form";

const ROLES = [
  { id: "afiliado", icon: "🔗", title: "Afiliado/a de ventas", desc: "Recomienda con tu código personalizado y gana comisión. Sin inversión, sin stock." },
  { id: "contenido", icon: "📱", title: "Creador/a de contenido", desc: "Crea Reels, TikToks y Stories. Ideal si tienes comunidad en redes sociales." },
  { id: "vendedor", icon: "🛍️", title: "Vendedor/a presencial", desc: "Vende en ferias, mercados, eventos o tu barrio. Te damos el stock y tú eliges cómo." },
  { id: "otro", icon: "✨", title: "Otra propuesta", desc: "¿Tienes una idea de cómo colaborar? Cuéntanos — estamos abiertos a todo." },
];

const PERKS = [
  { icon: "💸", text: "Comisiones reales pagadas cada fin de mes por Yape o Plin" },
  { icon: "🎁", text: "Producto gratis para usar y recomendar con honestidad" },
  { icon: "📈", text: "Mejores condiciones cuanto más vendas" },
  { icon: "🤝", text: "Comunidad activa de colaboradores con soporte directo" },
];

export function VendorApplicationPage() {
  return (
    <section className="bg-[#faf8f3] py-24">
      <div className="mx-auto max-w-[1120px] px-6">

        {/* Header centrado */}
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#2d6a4f] bg-[#d8f3dc] px-4 py-1.5 rounded-full mb-5">
            Únete al equipo
          </span>
          <h2 className="font-serif text-4xl font-black text-[#1a3a2e] md:text-5xl mb-4">
            Trabaja con nosotros
          </h2>
          <p className="text-[17px] text-[#6b7280] leading-7 max-w-[520px] mx-auto">
            ¿Te apasiona el bienestar o las ventas? Huele Huele está creciendo y queremos que seas parte.
          </p>
        </div>

        {/* Grid: roles+perks izquierda | formulario derecha */}
        <div className="grid grid-cols-1 gap-16 xl:grid-cols-2 xl:items-start">

          {/* Columna izquierda */}
          <div>
            <h3 className="font-serif text-xl text-[#1a3a2e] mb-2">¿Cómo puedes sumarte?</h3>
            <p className="text-[15px] text-[#6b7280] leading-7 mb-6">
              No buscamos solo empleados — buscamos personas con energía que crean en el producto y quieran crecer con la marca.
            </p>

            {/* Roles: tarjetas estáticas */}
            <div className="flex flex-col gap-3 mb-8">
              {ROLES.map((role, i) => (
                <div
                  key={role.id}
                  className={`flex gap-4 items-start rounded-[17px] p-5 border cursor-default transition
                    ${i === 0
                      ? "border-[#52b788] bg-[#d8f3dc]"
                      : "border-[rgba(26,58,46,0.08)] bg-white hover:shadow-[0_4px_20px_rgba(26,58,46,0.08)] hover:translate-x-1"
                    }`}
                >
                  <div
                    className={`w-11 h-11 rounded-[12px] flex-shrink-0 flex items-center justify-center text-[18px]
                      ${i === 0 ? "bg-white" : "bg-[#d8f3dc]"}`}
                  >
                    {role.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#1a3a2e] mb-1">{role.title}</h4>
                    <p className="text-[13px] text-[#6b7280] leading-[1.5]">{role.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Perks en grid 2 cols */}
            <div className="grid grid-cols-2 gap-2.5">
              {PERKS.map((perk) => (
                <div
                  key={perk.text}
                  className="bg-white rounded-[13px] p-4 border border-[rgba(26,58,46,0.07)] flex gap-2.5 items-start"
                >
                  <span className="text-[17px] flex-shrink-0 mt-0.5">{perk.icon}</span>
                  <p className="text-[13px] text-[#6b7280] leading-[1.55]">{perk.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Columna derecha: formulario */}
          <VendorApplicationForm source="Trabaja con nosotros" />

        </div>
      </div>
    </section>
  );
}
