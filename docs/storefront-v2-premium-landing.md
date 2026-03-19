# Storefront V2 Premium Landing

## Resumen

Este documento consolida el plan generado por agentes y la implementación de una nueva landing/storefront premium para ERP-HUELEHUELE.

La solución es aditiva:

- reemplaza la home actual como experiencia pública oficial
- no cambia contratos API
- no toca checkout, admin ni worker
- deja una ruta segura en `/storefront-v2-premium`
- fija una sola fuente de verdad para el storefront

## Plan generado por agentes

### Orquestación aplicada

- `Software Architect` + skill `propose-architecture`
- `UI/UX Agent` + skill `create-ui-brief`
- `Frontend Lead`
- `QA Lead` + skill `plan-test-strategy`

### Decisiones consolidadas

1. La experiencia premium vive aislada en `apps/web/features/storefront-v2-premium/`.
2. El contenido editorial es curado en código, no en un CMS total.
3. La ruta segura `/storefront-v2-premium` sirve como preview y QA de la experiencia oficial.
4. La home `/` usa `storefront-v2-premium` por defecto y deja de arbitrar entre variantes.
5. `storefront-v2` queda deprecado como preview histórica, no como camino activo.
6. `trabaja-con-nosotros` se mantiene y se conecta al endpoint existente `POST /store/vendor-applications`.

## Arquitectura implementada

### Nueva feature

Ruta base:

- `apps/web/features/storefront-v2-premium/`

Capas creadas:

- `components`
- `sections`
- `layouts`
- `tokens`
- `content`
- `lib`

### Secciones premium

- `HeroEditorialSection`
- `ProductCatalogSection`
- `UseCasesSection`
- `BenefitsEditorialSection`
- `BrandStorySection`
- `WhyChooseSection`
- `WholesaleSection`
- `VendorCalloutSection`
- `FaqSection`
- `CtaBannerSection`

### Integración de media

La nueva feature reutiliza los helpers existentes para media remota y mantiene compatibilidad con:

- `cdn.huelegood.com`
- `images.huelegood.com`

No se creó pipeline backend de media.

## Routing y rollout

### Ruta segura

- `GET /storefront-v2-premium`

Expone la misma experiencia que vive en `/`, pero en una ruta dedicada para QA, comparación visual y revisión controlada.

### Home oficial

- `GET /`

La home productiva ahora renderiza `storefront-v2-premium` de forma directa.

### Deprecación de `storefront-v2`

- `GET /storefront-v2`

Se conserva solo como preview histórica y deja de ser candidata a reemplazar la home.

## Contenido curado local

La feature premium define contenido local para:

- hero
- benefits
- use cases
- brand story
- product highlights
- faq
- wholesale callout

La fuente operativa de productos sigue siendo `featuredProducts` y la fuente operativa de planes mayoristas sigue siendo `wholesalePlans`.

## Trabaja con nosotros

La ruta existente se mantuvo:

- `/trabaja-con-nosotros`

Cambios:

- ahora reutiliza una nueva `VendorApplicationForm`
- el formulario se conecta a `POST /store/vendor-applications`
- respeta el contrato `VendorApplicationInput`
- aplica validación mínima en frontend
- muestra estados de éxito y error sin cambiar el backend

Campos enviados:

- `name`
- `email`
- `city`
- `phone`
- `message`
- `source`

## Validación esperada

### Smoke path

1. Abrir `/storefront-v2-premium`.
2. Verificar navegación y CTAs hacia `/catalogo`, `/checkout`, `/mayoristas` y `/trabaja-con-nosotros`.
3. Confirmar que `/`, `/checkout`, `/catalogo` y `/trabaja-con-nosotros` siguen vivas.
4. Probar assets locales y remotos.
5. Enviar una postulación válida en `trabaja-con-nosotros`.

### Riesgos vigilados

- duplicación editorial parcial con `storefront-v2`
- mantener viva la variante vieja por inercia de equipo
- fallo de media remota sin fallback local
- confusión entre wholesale y vendor si el copy cambia sin criterio

## Cómo probar

### Preview segura

```bash
npm run dev:web
```

Luego abrir:

- `/storefront-v2-premium`

### Formulario de vendedores

Abrir:

- `/trabaja-con-nosotros`

Enviar una postulación válida y verificar que la API responda con estado `queued`.

## Siguientes pasos

- marcar `storefront-v2` como referencia histórica en docs y seguimiento interno
- medir scroll depth y clics en CTAs ahora que la home premium ya es la experiencia oficial
- preparar una fase posterior para media remota productiva y campañas editoriales
