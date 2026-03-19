# Storefront Redesign Phase 7

## Qué se implementó

Se agregó una nueva capa visual premium/editorial del storefront dentro de `apps/web` sin reemplazar la experiencia actual por defecto.

La implementación incluye:

- nueva estructura modular en `apps/web/features/storefront-v2`
- tokens visuales premium para paleta, radios, sombras, spacing y gradientes
- secciones nuevas y reutilizables para hero, beneficios, historia sensorial, uso, prueba social, catálogo destacado, marca, FAQ y CTA final
- nueva ruta segura de preview en `/storefront-v2`
- feature flag `NEXT_PUBLIC_STOREFRONT_V2` para permitir un switch controlado de la home
- preparación de `next/image` para media remota en `cdn.huelegood.com` y `images.huelegood.com`
- helper de media para resolver assets locales o remotos sin cambiar los componentes consumidores

## Estructura

La capa nueva vive en:

- `apps/web/features/storefront-v2/components`
- `apps/web/features/storefront-v2/sections`
- `apps/web/features/storefront-v2/layouts`
- `apps/web/features/storefront-v2/lib`
- `apps/web/features/storefront-v2/tokens`

Piezas principales:

- `layouts/storefront-v2-page.tsx`
  orquesta la experiencia completa del storefront v2
- `lib/content.ts`
  carga CMS con fallback a `@huelegood/shared` y compone el view model del storefront
- `lib/media.ts`
  resuelve URLs de assets y deja lista la transición a Cloudflare media
- `lib/flags.ts`
  centraliza el flag `NEXT_PUBLIC_STOREFRONT_V2`
- `sections/*`
  encapsulan cada bloque del nuevo storefront

## Cómo activar el feature flag

Por defecto:

- `/` sigue mostrando la home actual
- `/storefront-v2` muestra la nueva experiencia en modo seguro

Para usar el nuevo storefront también en `/`, define:

```bash
NEXT_PUBLIC_STOREFRONT_V2=true
```

Valores aceptados para encenderlo:

- `true`
- `1`
- `yes`
- `on`

## Cómo preparar imágenes remotas con Cloudflare

`apps/web/next.config.mjs` ya permite imágenes remotas para:

- `https://cdn.huelegood.com`
- `https://images.huelegood.com`

Además, existe el helper:

- `apps/web/features/storefront-v2/lib/media.ts`

Ese helper soporta un base URL opcional:

```bash
NEXT_PUBLIC_STOREFRONT_MEDIA_BASE_URL=https://cdn.huelegood.com
```

Comportamiento:

- si no existe `NEXT_PUBLIC_STOREFRONT_MEDIA_BASE_URL`, los assets siguen sirviéndose desde `public/brand/*`
- si existe y apunta a uno de los hosts permitidos, los mismos paths se resuelven contra Cloudflare
- el helper también expone un loader reutilizable para `next/image`, pensado para una migración progresiva

Ejemplo:

- local: `/brand/hero-huele-huele.svg`
- remoto resuelto: `https://cdn.huelegood.com/brand/hero-huele-huele.svg`

## Compatibilidad mantenida

La nueva capa:

- reutiliza `featuredProducts`, `heroCopy`, `faqItems`, `promoBanners` y testimonios actuales desde `@huelegood/shared`
- mantiene el fetch a CMS con fallback seguro
- no cambia contratos de API
- no toca checkout ni admin
- no elimina componentes previos
- no modifica rutas productivas existentes de forma destructiva

## Siguientes pasos sugeridos

1. Reemplazar gradualmente assets SVG locales por variantes fotográficas remotas en Cloudflare usando el helper ya creado.
2. Conectar más bloques del storefront v2 a CMS interno cuando el equipo quiera editar contenido sin deploy.
3. Medir impacto en conversión y scroll depth usando la ruta `/storefront-v2` antes de encender el flag en home.
4. Definir una librería real de imagen lifestyle y packshots premium para que la capa editorial alcance todo su potencial.
5. Si el switch en `/` se vuelve definitivo, mover navegación/promos del header hacia la nueva jerarquía visual en una fase posterior.
