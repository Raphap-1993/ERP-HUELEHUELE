# UC-15 Consumo Publico Con SEO Y Fallback Seguro

## Objetivo

Formalizar como `web/storefront` consume el snapshot CMS para SEO y contenido
editorial sin romper la operacion cuando el snapshot falla o es incompleto.

## Actores

- web/storefront
- cms

## Precondiciones

- la superficie publica corresponde a una ruta conocida del slice
- el storefront puede intentar leer snapshot CMS antes de renderizar
- existen defaults seguros para las superficies snapshot-backed del storefront

## Flujo principal

1. `web/storefront` intenta cargar el snapshot CMS.
2. Si el snapshot es valido, consume `title`, `description`, `keywords`,
   `canonicalPath` y `robots` por ruta conocida.
3. El storefront filtra contenido activo y paginas publicables antes de
   renderizar.
4. Si el snapshot es incompleto o falla, la superficie publica usa defaults
   seguros.
5. La ruta publica sigue renderizando sin romper la operacion.

## Reglas canonicas

- el storefront no debe caer por falla de lectura del snapshot CMS
- el fallback seguro no expone contenido `inactive` ni paginas `archived`
- `cuenta` y `checkout` pueden mantener `noindex,nofollow`
- el consumo publico no inventa rutas nuevas ni convierte el CMS en page
  builder

## Resultado esperado

La web publica conserva continuidad operativa y SEO controlado por ruta
conocida, aun cuando el snapshot CMS no pueda consumirse completo.
