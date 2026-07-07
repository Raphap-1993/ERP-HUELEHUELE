"use client";

import Image from "next/image";
import Link from "next/link";
import { type PointerEvent, type ReactNode, useMemo, useState } from "react";
import { AddToCartLink } from "./add-to-cart-link";
import {
  hueleHomeBenefits,
  hueleHomeHeroFacts,
  hueleHomeMoments,
  hueleHomeNaturalFacts,
  hueleHomeSellerStats,
  type HueleHomeBenefit,
  type HueleHomeMomentKey,
  type HueleHomeProductCard
} from "../lib/huele-home-content";
import {
  cloudflareImageLoader,
  isRemoteStorefrontMediaUrl,
  resolveStorefrontMediaSrc
} from "../features/storefront-v2/lib/media";

type HueleHomeExperienceProps = {
  brandName: string;
  fontClassName: string;
  logoUrl: string;
  productCards: HueleHomeProductCard[];
  supportLines: string[];
};

function Icon({ name }: { name: "leaf" | "bag" | "play" | "store" | "shield" | "box" | "truck" | "mountain" | "wind" | "sparkles" | "zap" | "map" | "chevron" }) {
  const common = {
    "aria-hidden": true,
    fill: "none",
    focusable: false,
    height: 18,
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
    viewBox: "0 0 24 24",
    width: 18
  };

  const paths: Record<typeof name, ReactNode> = {
    leaf: <path d="M5 21c8-2 14-8 15-18C10 4 4 10 3 20c5-1 9-3 12-8" />,
    bag: <><path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9 8a3 3 0 0 1 6 0" /></>,
    play: <path d="m8 5 11 7-11 7V5Z" />,
    store: <><path d="M4 10h16" /><path d="M5 10 7 4h10l2 6" /><path d="M6 10v10h12V10" /></>,
    shield: <path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z" />,
    box: <><path d="m3 7 9-4 9 4-9 4-9-4Z" /><path d="M3 7v10l9 4 9-4V7" /><path d="M12 11v10" /></>,
    truck: <><path d="M3 7h11v9H3z" /><path d="M14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></>,
    mountain: <><path d="m3 20 7-14 4 8 2-4 5 10H3Z" /><path d="M10 6 8.5 9h3L10 6Z" /></>,
    wind: <><path d="M3 8h12a3 3 0 1 0-3-3" /><path d="M3 13h16a3 3 0 1 1-3 3" /><path d="M3 18h8" /></>,
    sparkles: <><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z" /><path d="M5 16v3" /><path d="M3.5 17.5h3" /></>,
    zap: <path d="M13 2 4 14h7l-1 8 10-13h-7l0-7Z" />,
    map: <><path d="M12 21s7-5 7-12a7 7 0 1 0-14 0c0 7 7 12 7 12Z" /><circle cx="12" cy="9" r="2.5" /></>,
    chevron: <path d="m9 18 6-6-6-6" />
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function BenefitIcon({ benefit }: { benefit: HueleHomeBenefit }) {
  return <Icon name={benefit.icon} />;
}

function ProductAction({ product }: { product: HueleHomeProductCard }) {
  const label = product.ctaLabel;
  const className = "hh-pill-button hh-primary hh-dark";

  if (product.action.mode === "direct") {
    return (
      <AddToCartLink
        className={className}
        productSlug={product.slug}
        variantId={product.action.variantId}
      >
        <Icon name="bag" />
        {label}
      </AddToCartLink>
    );
  }

  if (product.action.mode === "select_variant") {
    return (
      <Link className={className} href={product.action.href}>
        <Icon name="bag" />
        {label}
      </Link>
    );
  }

  if (product.action.mode === "catalog") {
    return (
      <Link className={className} href={product.action.href}>
        <Icon name="bag" />
        {label}
      </Link>
    );
  }

  return (
    <span className="hh-pill-button hh-disabled">
      <Icon name="bag" />
      {label}
    </span>
  );
}

function resolveHomeProductImage(product: HueleHomeProductCard) {
  if (!product.imageUrl) {
    return null;
  }

  const src = resolveStorefrontMediaSrc(product.imageUrl);

  return {
    alt: product.imageAlt,
    remote: isRemoteStorefrontMediaUrl(src),
    src
  };
}

export function HueleHomeExperience({
  brandName,
  fontClassName,
  logoUrl,
  productCards,
  supportLines
}: HueleHomeExperienceProps) {
  const [activeMoment, setActiveMoment] = useState<HueleHomeMomentKey>("trafico");
  const [selectedProduct, setSelectedProduct] = useState(productCards[0]?.key ?? "");
  const [burst, setBurst] = useState(false);

  const activeMomentData = useMemo(
    () => hueleHomeMoments.find((moment) => moment.key === activeMoment) ?? hueleHomeMoments[0],
    [activeMoment]
  );
  const selectedProductData =
    productCards.find((product) => product.key === selectedProduct) ?? productCards[0];
  const selectedProductImage = selectedProductData ? resolveHomeProductImage(selectedProductData) : null;
  const heroProductImages = productCards
    .map(resolveHomeProductImage)
    .filter((image): image is NonNullable<ReturnType<typeof resolveHomeProductImage>> => Boolean(image))
    .slice(0, 2);

  function updatePointer(event: PointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    event.currentTarget.style.setProperty("--mx", x.toFixed(3));
    event.currentTarget.style.setProperty("--my", y.toFixed(3));
  }

  function triggerBurst() {
    setBurst(true);
    window.setTimeout(() => setBurst(false), 800);
  }

  return (
    <div data-huele-green-home="true" className={`hh-page ${fontClassName}`} onPointerMove={updatePointer}>
      <div className="hh-texture-grid" aria-hidden="true" />

      <nav className="hh-top-nav" aria-label="Principal">
        <Link className="hh-brand-lockup" href="/" aria-label={`${brandName} inicio`}>
          <Image
            priority
            src={logoUrl}
            alt={brandName || "Huele Huele"}
            width={220}
            height={135}
            className="hh-brand-logo-image"
          />
        </Link>

        <div className="hh-nav-links">
          <a href="#beneficios">Beneficios</a>
          <Link href="/catalogo">Productos</Link>
          <Link href="/mayoristas">Mayoristas</Link>
          <a href="#natural">Natural</a>
        </div>

        <div className="hh-nav-actions">
          <Link className="hh-icon-button" href="/catalogo" aria-label="Ver productos">
            <Icon name="bag" />
          </Link>
          <Link className="hh-pill-button hh-small" href="/mayoristas">
            <Icon name="store" />
            Vender
          </Link>
        </div>
      </nav>

      <section id="hero" className="hh-hero-section">
        <div className="hh-hero-copy">
          <span className="hh-eyebrow">
            <Icon name="sparkles" />
            Inhalador herbal aromático
          </span>
          <h1>Frescura verde para cuando el día pide un reset.</h1>
          <p>
            Huele Huele es un inhalador portátil con aceites naturales como mentol,
            eucalipto, menta y alcanfor. No es vape, no tiene nicotina y cabe donde va tu rutina.
          </p>

          <div className="hh-hero-actions">
            <Link className="hh-pill-button hh-primary" href="/catalogo">
              <Icon name="bag" />
              Comprar ahora
            </Link>
            <button className="hh-pill-button hh-ghost" onClick={triggerBurst}>
              <Icon name="play" />
              Activar frescura
            </button>
          </div>

          <div className="hh-quick-facts" aria-label="Datos rápidos">
            {hueleHomeHeroFacts.map((fact, index) => (
              <span key={fact}>
                <Icon name={index === 0 ? "shield" : index === 1 ? "box" : "truck"} />
                {fact}
              </span>
            ))}
          </div>
        </div>

        <div className="hh-hero-stage" aria-label="Mascota Huele Huele animada">
          <div className="hh-aroma-ribbon hh-ribbon-one" />
          <div className="hh-aroma-ribbon hh-ribbon-two" />
          <div className={burst ? "hh-fresh-burst is-active" : "hh-fresh-burst"} />
          {heroProductImages[0] ? (
            <div className="hh-product-capsule hh-capsule-a" aria-hidden="true">
              <Image
                fill
                src={heroProductImages[0].src}
                loader={heroProductImages[0].remote ? cloudflareImageLoader : undefined}
                alt=""
                sizes="122px"
              />
            </div>
          ) : null}
          {heroProductImages[1] ? (
            <div className="hh-product-capsule hh-capsule-b" aria-hidden="true">
              <Image
                fill
                src={heroProductImages[1].src}
                loader={heroProductImages[1].remote ? cloudflareImageLoader : undefined}
                alt=""
                sizes="122px"
              />
            </div>
          ) : null}
          <div className="hh-hero-mascot">
            <Image
              priority
              src="/brand/lorito-cutout.png"
              alt="Lorito mascota de Huele Huele con lentes"
              width={620}
              height={620}
            />
            <span className="hh-mascot-shine" />
          </div>
        </div>
      </section>

      <section className="hh-moment-strip" aria-labelledby="moment-title">
        <div className="hh-today-cell">
          <strong>HOY</strong>
          <span>Ritual fresco</span>
        </div>
        <div className="hh-moment-tabs" role="tablist" aria-label="Momentos de uso">
          {hueleHomeMoments.map((moment) => (
            <button
              key={moment.key}
              className={moment.key === activeMoment ? "hh-moment-tab active" : "hh-moment-tab"}
              onClick={() => setActiveMoment(moment.key)}
              role="tab"
              aria-selected={moment.key === activeMoment}
            >
              <strong>{moment.time}</strong>
              <span>{moment.title}</span>
              <small>{moment.label}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="hh-moment-detail" aria-live="polite">
        <div>
          <span className="hh-section-kicker">Momento seleccionado</span>
          <h2 id="moment-title">{activeMomentData.title}</h2>
          <p>{activeMomentData.copy}</p>
        </div>
        <Image className="hh-mini-mascot hh-tilt-left" src="/brand/lorito-cutout.png" alt="" aria-hidden="true" width={180} height={180} />
      </section>

      <section id="beneficios" className="hh-benefits-panel" aria-labelledby="benefits-title">
        <div className="hh-section-heading hh-benefits-heading">
          <span className="hh-section-kicker">6 razones oficiales</span>
          <h2 id="benefits-title">Un pequeño reset para grandes momentos.</h2>
          <p>
            Pensado para soroche, mareos, malos olores, energía, descongestión y
            uso natural durante el día.
          </p>
        </div>

        <div className="hh-benefit-grid">
          {hueleHomeBenefits.map((benefit) => (
            <article className={`hh-benefit-item ${benefit.tone}`} key={benefit.title}>
              <div className="hh-benefit-icon"><BenefitIcon benefit={benefit} /></div>
              <div>
                <h3>{benefit.title}</h3>
                <p>{benefit.copy}</p>
              </div>
              <Link href="/catalogo" aria-label={`Comprar por beneficio ${benefit.title}`}>
                <Icon name="chevron" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section id="productos" className="hh-products-section" aria-labelledby="products-title">
        <div className="hh-section-heading compact">
          <span className="hh-section-kicker">Verde Huele Huele</span>
          <h2 id="products-title">Elige tu frescura de bolsillo.</h2>
        </div>

        <div className="hh-product-showcase">
          <div className="hh-selector-card">
            {productCards.map((product) => {
              const productImage = resolveHomeProductImage(product);
              return (
                <button
                  key={product.key}
                  className={selectedProduct === product.key ? "hh-product-option active" : "hh-product-option"}
                  onClick={() => setSelectedProduct(product.key)}
                  style={{ "--accent": product.accent } as React.CSSProperties}
                >
                  <span className="hh-option-visual">
                    {productImage ? (
                      <Image
                        fill
                        src={productImage.src}
                        loader={productImage.remote ? cloudflareImageLoader : undefined}
                        alt=""
                        aria-hidden="true"
                        sizes="56px"
                      />
                    ) : (
                      <span className="hh-product-image-missing">Foto</span>
                    )}
                  </span>
                  <span>
                    <strong>{product.name}</strong>
                    <small>{product.badge}</small>
                  </span>
                </button>
              );
            })}
          </div>

          {selectedProductData ? (
            <article className="hh-product-hero-card">
              <div className="hh-product-large-visual" style={{ "--accent": selectedProductData.accent } as React.CSSProperties}>
                {selectedProductImage ? (
                  <Image
                    fill
                    src={selectedProductImage.src}
                    loader={selectedProductImage.remote ? cloudflareImageLoader : undefined}
                    alt={selectedProductImage.alt}
                    sizes="(min-width: 921px) 36vw, 82vw"
                  />
                ) : (
                  <span className="hh-product-image-missing">Imagen pendiente</span>
                )}
              </div>
              <div className="hh-product-card-copy">
                <span className="hh-product-badge">{selectedProductData.badge}</span>
                <h3>{selectedProductData.name}</h3>
                <p>{selectedProductData.copy}</p>
                <strong className="hh-price">{selectedProductData.priceLabel}</strong>
                <ProductAction product={selectedProductData} />
              </div>
            </article>
          ) : null}
        </div>
      </section>

      <section id="mayoristas" className="hh-seller-band" aria-labelledby="seller-title">
        <Image className="hh-mini-mascot hh-seller-mascot" src="/brand/lorito-cutout.png" alt="" aria-hidden="true" width={240} height={240} />
        <div>
          <span className="hh-section-kicker">También para vender</span>
          <h2 id="seller-title">Un producto fácil de explicar y mover.</h2>
          <p>
            El programa mayorista comunica márgenes de hasta 100%, pedido mínimo
            de 12 unidades y entregas en Lima y provincias.
          </p>
        </div>
        <div className="hh-seller-stats">
          {hueleHomeSellerStats.map((stat) => (
            <span key={stat.value}>
              <strong>{stat.value}</strong>
              {stat.label}
            </span>
          ))}
        </div>
      </section>

      <section id="natural" className="hh-natural-band" aria-labelledby="natural-title">
        <div className="hh-natural-copy">
          <span className="hh-section-kicker">Natural, no humo</span>
          <h2 id="natural-title">Fresco sin nicotina, alcohol ni parabenos.</h2>
          <p>
            La propuesta oficial lo presenta como un inhalador de aromas naturales:
            se destapa, se huele y vuelve al bolsillo.
          </p>
        </div>
        <div className="hh-natural-checks">
          {hueleHomeNaturalFacts.map((fact, index) => (
            <span key={fact}>
              <Icon name={index === 0 ? "leaf" : index === 1 ? "shield" : "map"} />
              {fact}
            </span>
          ))}
        </div>
      </section>

      <section className="hh-support-band" aria-label="Soporte comercial">
        <div>
          <span>WhatsApp</span>
          <strong>{supportLines[0] ?? "+51 927 476 668"}</strong>
        </div>
        <div>
          <span>Envío gratis</span>
          <strong>{supportLines[1] ?? "Desde S/ 99"}</strong>
        </div>
        <div>
          <span>Soporte</span>
          <strong>{supportLines[2] ?? "contacto@huelegood.com"}</strong>
        </div>
      </section>

      <footer className="hh-site-footer">
        <Link className="hh-brand-lockup" href="/">
          <Image
            src={logoUrl}
            alt={brandName || "Huele Huele"}
            width={220}
            height={135}
            className="hh-brand-logo-image"
          />
        </Link>
        <nav aria-label="Pie de página">
          <Link href="/catalogo">Comprar</Link>
          <Link href="/mayoristas">Mayoristas</Link>
          <Link href="/trabaja-con-nosotros">Trabaja con nosotros</Link>
        </nav>
        <span>© 2026 Huele Huele. Perú.</span>
      </footer>
    </div>
  );
}
