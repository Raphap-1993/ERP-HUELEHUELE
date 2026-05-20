## Resumen

Describe el cambio en una o dos frases.

## Contexto

- frente o ticket:
- problema real que resuelve:
- superficie tocada:

## Riesgo

- impacto productivo:
- cambio de schema: si o no
- cambio de variables de entorno: si o no
- cambio de comportamiento visible: si o no

## Validacion

- [ ] `npm run typecheck`
- [ ] `npm run test:erp-sales`
- [ ] `npm run build`
- [ ] smoke tecnico ejecutado o no aplica
- [ ] smoke funcional ejecutado o no aplica

## Documentacion

- [ ] actualice la documentacion vigente o no aplica
- [ ] revise `docs/infra/deployment-strategy.md` si el cambio toco release o runtime
- [ ] revise `docs/api/api-v1-outline.md` si el cambio toco contratos
- [ ] revise `docs/data/` y `prisma/schema.prisma` si el cambio toco persistencia
- [ ] revise `docs/ux/` si el cambio toco patrones visuales aceptados

## Deploy

- estrategia de despliegue:
- ventana requerida:
- rollback previsto:

## Notas

Pon aqui cualquier aclaracion importante para revision o deploy.
