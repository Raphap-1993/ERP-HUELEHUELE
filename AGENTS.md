# AGENTS.md - ERP-HUELEHUELE

Este repo hereda la ley global de agentes de `/Users/rapha/.codex/AGENTS.md`.

## Alcance local
- `ERP-HUELEHUELE` es un brownfield sobre software vivo, no un greenfield.
- La capa canonica nace en la raiz (`AGENTS.md`, `AI_CONTEXT.md`, `PROJECT_MAP.md`, `TRACEABILITY_MATRIX.md`, `GLOSSARY.md`) y en `docs/fase-*`.
- La documentacion operativa previa sigue vigente mientras su equivalente canonico no exista o no este mapeado en `docs/transversal/90.00-mapa-homologacion-brownfield.md`.

## Punto de entrada
1. `AI_CONTEXT.md`
2. `PROJECT_MAP.md`
3. `TRACEABILITY_MATRIX.md`
4. `docs/transversal/90.00-mapa-homologacion-brownfield.md`
5. `docs/README.md`

## Reglas locales
- No borrar ni reescribir documentacion previa solo por cambiar de estructura.
- No copiar texto instructivo del template ni ejemplos de otros dominios.
- Si cambia fase activa, alcance o fuente de verdad, actualizar `AI_CONTEXT.md` y `TRACEABILITY_MATRIX.md` en el mismo corte.
- Producto y negocio parten de `docs/product/`; arquitectura y despliegue parten de `docs/architecture/overview.md` y `docs/infra/`.
- Git confirma la verdad tecnica; la memoria curada vive fuera del repo.
