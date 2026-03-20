import { faqItems, featuredProducts } from "@huelegood/shared";
import { Badge, Button, FAQAccordion } from "@huelegood/ui";
import { EditorialMedia, EditorialProductGrid } from "../components/public-brand";
import { brandArt } from "../components/public-brand-art";
import { PublicChecklist, PublicPanel, PublicSectionHeading } from "../components/public-shell";

const useMoments = [
  {
    label: "Oficina",
    title: "Se integra a jornadas largas sin pedir una rutina nueva.",
    description: "Una presencia discreta, limpia y fácil de llevar cuando necesitas un reset breve entre bloques de trabajo.",
    image: brandArt.office
  },
  {
    label: "Tráfico",
    title: "Funciona bien en movimiento, trayecto y cambio de ritmo.",
    description: "Bolso, carro o mochila: el formato se siente portátil y práctico desde el primer contacto.",
    image: brandArt.traffic
  },
  {
    label: "Viaje",
    title: "Ligero, sobrio y fácil de llevar fuera de casa.",
    description: "Ideal para trayectos largos, altura y días donde necesitas mantener la sensación de frescura cerca.",
    image: brandArt.travel
  }
];

const tradeRoutes = [
  {
    label: "Compra directa",
    title: "Elige formato y entra directo al checkout.",
    description: "La selección principal vive en catálogo para que la decisión de compra sea simple y rápida.",
    action: { label: "Ir al catálogo", href: "/catalogo" }
  },
  {
    label: "Canal comercial",
    title: "Mayoristas y vendedores tienen rutas separadas.",
    description: "Si buscas volumen o quieres representar la marca, el flujo comercial ya vive fuera de la compra directa.",
    action: { label: "Ver mayoristas", href: "/mayoristas" }
  }
];

export default function HomePage() {
  return (
    <div className="space-y-14 py-4 md:space-y-20 md:py-6">
      <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="space-y-8 rounded-[2rem] border border-[#d7ddd3] bg-white px-7 py-8 shadow-[0_20px_60px_rgba(18,34,20,0.06)] md:px-9 md:py-10">
          <div className="space-y-4">
            <Badge className="bg-[#132016] text-white">Cuidado herbal portátil</Badge>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-[3rem] font-semibold leading-[0.94] tracking-[-0.045em] text-[#102114] md:text-[4.65rem]">
                Frescura herbal pensada para días largos, trayectos y viaje.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-black/62 md:text-lg">
                Huele Huele acompaña oficina, tráfico y movimiento diario con una experiencia limpia, portable y fácil de integrar a tu rutina.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button href="/catalogo">Ver colección</Button>
            <Button href="/checkout?producto=clasico-verde" variant="secondary">
              Comprar Clásico Verde
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.4rem] border border-[#d7ddd3] bg-[#f7f8f4] px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/40">Formato</p>
              <p className="mt-3 text-xl font-semibold text-[#132016]">Portátil</p>
              <p className="mt-2 text-sm leading-6 text-black/54">Cabe en bolso, carro o escritorio sin estorbar.</p>
            </div>
            <div className="rounded-[1.4rem] border border-[#d7ddd3] bg-[#f7f8f4] px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/40">Sensación</p>
              <p className="mt-3 text-xl font-semibold text-[#132016]">Fresca</p>
              <p className="mt-2 text-sm leading-6 text-black/54">Una lectura clara del producto, sin ruido ni claims exagerados.</p>
            </div>
            <div className="rounded-[1.4rem] border border-[#d7ddd3] bg-[#f7f8f4] px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/40">Compra</p>
              <p className="mt-3 text-xl font-semibold text-[#132016]">Directa</p>
              <p className="mt-2 text-sm leading-6 text-black/54">Selección corta para decidir rápido y salir a checkout sin fricción.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <EditorialMedia
            src={brandArt.hero}
            alt="Presentación editorial de Huele Huele"
            className="min-h-[420px]"
            priority
            overlay={
              <div className="flex h-full flex-col justify-between p-6">
                <div className="flex justify-end">
                  <div className="rounded-full border border-white/55 bg-white/82 px-4 py-2 text-xs uppercase tracking-[0.24em] text-[#132016]">
                    Huele Huele
                  </div>
                </div>
                <div className="max-w-sm rounded-[1.5rem] border border-white/45 bg-white/86 p-5 backdrop-blur">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-black/40">Selección principal</p>
                  <div className="mt-3 grid gap-2 text-sm text-[#132016]">
                    <div className="flex items-center justify-between rounded-full bg-[#f3f5ef] px-4 py-2">
                      <span>Clásico Verde</span>
                      <span className="font-semibold">$149</span>
                    </div>
                    <div className="flex items-center justify-between rounded-full bg-[#f3f5ef] px-4 py-2">
                      <span>Premium Negro</span>
                      <span className="font-semibold">$179</span>
                    </div>
                    <div className="flex items-center justify-between rounded-full bg-[#f3f5ef] px-4 py-2">
                      <span>Combo Dúo Perfecto</span>
                      <span className="font-semibold">$279</span>
                    </div>
                  </div>
                </div>
              </div>
            }
          />

          <PublicPanel className="grid gap-4 bg-[#f4f6f1] md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/40">Qué es</p>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#132016]">Una categoría propia, fácil de entender.</h2>
              <p className="text-sm leading-7 text-black/58">
                El producto se presenta desde uso, formato y rutina. Esa claridad hace más profesional la decisión de compra.
              </p>
            </div>
            <PublicChecklist
              items={[
                "Lectura simple del producto desde el primer scroll.",
                "Compra directa sin mezclar promesas comerciales internas.",
                "Diseño sobrio y wellness sin caer en estética clínica."
              ]}
            />
          </PublicPanel>
        </div>
      </section>

      <section className="space-y-6">
        <PublicSectionHeading
          eyebrow="Colección curada"
          title="Tres favoritos para decidir rápido y comprar con claridad."
          description="La selección principal vive primero. El catálogo completo queda disponible, pero la home se concentra en los formatos que mejor explican la marca."
          action={{ label: "Ver catálogo", href: "/catalogo" }}
        />
        <EditorialProductGrid products={featuredProducts} />
      </section>

      <section className="space-y-6">
        <PublicSectionHeading
          eyebrow="Cómo encaja"
          title="Una marca de bienestar se entiende mejor cuando vive en escenas reales."
          description="Oficina, tráfico y viaje resumen el contexto correcto del producto: discreto, práctico y fácil de llevar."
        />
        <div className="grid gap-5 md:grid-cols-3">
          {useMoments.map((item) => (
            <article key={item.label} className="space-y-4 rounded-[1.85rem] border border-[#d7ddd3] bg-white p-5 shadow-[0_12px_36px_rgba(22,34,20,0.05)]">
              <EditorialMedia src={item.image} alt={item.title} className="min-h-[220px]" />
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/40">{item.label}</p>
                <h3 className="text-[1.45rem] font-semibold tracking-[-0.03em] text-[#132016]">{item.title}</h3>
                <p className="text-sm leading-7 text-black/58">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <PublicPanel className="space-y-6 bg-[#f4f6f1]">
          <PublicSectionHeading
            eyebrow="Rutas comerciales"
            title="La compra directa y el canal comercial ya están ordenados."
            description="La home se queda enfocada en producto. Mayoristas y vendedores viven en rutas separadas para no distraer al consumidor final."
          />
          <div className="grid gap-4">
            {tradeRoutes.map((route) => (
              <div key={route.label} className="rounded-[1.5rem] border border-[#d7ddd3] bg-white px-5 py-5">
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/40">{route.label}</p>
                <h3 className="mt-2 text-[1.35rem] font-semibold tracking-[-0.03em] text-[#132016]">{route.title}</h3>
                <p className="mt-2 text-sm leading-7 text-black/58">{route.description}</p>
                <div className="mt-4">
                  <Button href={route.action.href} variant="secondary">
                    {route.action.label}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </PublicPanel>

        <PublicPanel className="space-y-6">
          <PublicSectionHeading
            eyebrow="Preguntas frecuentes"
            title="Lo justo para resolver dudas antes de comprar."
            description="Una tienda premium no sobreexplica. Responde rápido y deja que la compra avance."
          />
          <div className="rounded-[1.5rem] border border-[#d7ddd3] bg-[#f9faf7] p-3 md:p-4">
            <FAQAccordion items={faqItems.slice(0, 4)} />
          </div>
        </PublicPanel>
      </section>

      <section className="rounded-[2rem] border border-[#d7ddd3] bg-[#132016] px-7 py-8 text-white shadow-[0_24px_70px_rgba(19,32,22,0.22)] md:px-10 md:py-10">
        <div className="grid gap-6 xl:grid-cols-[1fr_auto] xl:items-end">
          <div className="space-y-4">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/42">Compra directa</p>
            <h2 className="max-w-3xl text-[2.4rem] font-semibold leading-[0.96] tracking-[-0.04em] text-white md:text-[3.2rem]">
              Elige tu formato, compra con claridad y sigue tu pedido desde tu cuenta.
            </h2>
            <p className="max-w-2xl text-base leading-7 text-white/70">
              Una experiencia más limpia para una marca de bienestar: producto primero, checkout claro y acceso simple a compras y beneficios.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href="/checkout?producto=clasico-verde" variant="secondary">
              Comprar ahora
            </Button>
            <Button href="/cuenta" variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
              Ir a mi cuenta
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
