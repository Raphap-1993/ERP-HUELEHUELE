# Storefront V2 Premium Landing

## Resumen

Este documento consolida el plan generado por agentes y el estado posterior de la consolidación del storefront premium público de Huelegood.

La solución ya no se trata como preview pública. Hoy funciona así:

- la home `/` es la experiencia pública oficial
- no cambia contratos API
- no abre rutas demo o preview en producción
- mantiene una sola fuente de verdad para la narrativa pública
- convive con mantenimiento controlado del storefront cuando se requiere intervenir producción

## Plan generado por agentes

### Orquestación aplicada

- `Software Architect` + skill `propose-architecture`
- `UI/UX Agent` + skill `create-ui-brief`
- `Frontend Lead`
- `QA Lead` + skill `plan-test-strategy`

### Decisiones consolidadas

1. La experiencia premium vive aislada en `apps/web/features/storefront-v2-premium/`.
2. El contenido editorial es curado en código, no en un CMS total.
3. La home `/` usa `storefront-v2-premium` por defecto y deja de arbitrar entre variantes.
4. Las rutas `/storefront-v2` y `/storefront-v2-premium` quedaron retiradas como preview pública y hoy redirigen a `/`.
5. `storefront-v2` y `storefront-v2-premium` se conservan sólo como antecedentes técnicos y documentales.
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

- No existe una ruta segura pública para preview en producción.
- `GET /storefront-v2-premium` hoy redirige a `/`.
- `GET /storefront-v2` hoy redirige a `/`.
- El criterio actual es no exponer superficies de QA o demo al usuario final.

### Home oficial

- `GET /`

La home productiva ahora renderiza `storefront-v2-premium` de forma directa.

### Operación segura en producción

- existe `WEB_MAINTENANCE_MODE` para cerrar temporalmente el storefront público sin afectar `admin`, `api`, `/health` ni assets
- el bypass controlado puede habilitarse con `WEB_MAINTENANCE_BYPASS_TOKEN`
- este mecanismo sustituyó la necesidad de dejar previews públicas vivas

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

### Smoke path actual

1. Abrir `/`.
2. Verificar navegación y CTAs hacia `/catalogo`, `/checkout`, `/mayoristas`, `/trabaja-con-nosotros` y `/cuenta`.
3. Confirmar que `/storefront-v2` y `/storefront-v2-premium` redirigen a `/`.
4. Probar assets locales y remotos.
5. Enviar una postulación válida en `trabaja-con-nosotros`.

### Riesgos vigilados

- deriva visual entre la home actual y páginas públicas secundarias
- mantener copy interno, técnico o de demo en superficies públicas
- fallo de media remota sin fallback local
- confusión entre wholesale y vendor si el copy cambia sin criterio
- sobrecargar producción con experimentos visuales sin maintenance mode

## Cómo probar

### Desarrollo local

```bash
npm run dev:web
```

Luego abrir:

- `/`
- si se necesita revisar comportamiento histórico, abrir el código de `apps/web/features/storefront-v2-premium/`

### Formulario de vendedores

Abrir:

- `/trabaja-con-nosotros`

Enviar una postulación válida y verificar que la API responda con estado `queued`.

## Siguientes pasos

- hacer un segundo pase UX de nivel final para que home, catálogo, cuenta y checkout queden alineados visualmente
- sustituir placeholders editoriales por fotografía real optimizada del producto
- medir scroll depth y clics en CTAs ahora que la home oficial ya no expone variantes públicas
