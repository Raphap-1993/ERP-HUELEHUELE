# UC-13 Configuracion Global Y Media Publica

## Objetivo

Formalizar la administracion de la configuracion editorial global del sitio y
de la media publica asociada al CMS.

## Actores

- marketing
- cms
- media
- web/storefront

## Precondiciones

- `marketing` tiene permisos para operar CMS
- existe un snapshot CMS vigente o recuperable
- la capa de media publica entrega URLs utilizables por el storefront

## Flujo principal

1. `marketing` edita `site settings`, `hero copy` o `navigation`.
2. `marketing` actualiza logo, favicon, hero image, loading image u otros
   assets publicos compatibles con el CMS.
3. `media` procesa el upload tecnico y entrega una URL publica valida.
4. `cms` persiste el snapshot global actualizado.
5. `web/storefront` consume la configuracion vigente en la siguiente lectura
   valida del snapshot.

## Reglas canonicas

- `site settings`, `hero copy` y `navigation` son singleton globales
- la media publica del CMS forma parte del snapshot editorial del sitio
- `marketing` decide el contenido; `media` resuelve el delivery tecnico
- el CMS editorial no usa este flujo para campaigns ni assets de CRM

## Resultado esperado

La configuracion global y la media publica del sitio quedan actualizadas de
forma consistente, trazable y consumible por el storefront sin abrir un dominio
de campanas.
