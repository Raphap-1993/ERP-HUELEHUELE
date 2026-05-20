# Estandar De Desarrollo

[README principal](../../README.md) | [Indice docs](../README.md)

## Objetivo

Definir que practicas del `project-template.zip` conviene adoptar en `ERP-HUELEHUELE`, cuales deben vivir en el repositorio y cuales deben quedarse en la capa local de agentes y skills del operador.

## Contexto

`ERP-HUELEHUELE` no es un proyecto verde. Ya opera en `Fase 2` y su frente prioritario vigente es `catalogo y media administrable`, seguido por automatizacion comercial, reporting y homologacion visual fina. La estandarizacion de proceso debe ayudar a ejecutar ese roadmap, no reemplazarlo ni introducir burocracia que frene entrega real.

Referencias vigentes:

- [Roadmap por fases](../product/roadmap.md)
- [Plan operativo de Fase 2](../product/fase-2-execution-plan.md)
- [Despliegue y homologacion](../infra/deployment-strategy.md)

## Decision Arquitectonica

El `project-template.zip` se usa como `donor de practicas`, no como base para copiar completa dentro del monorepo.

Reglas:

- adoptar solo piezas que mejoren gobernanza, trazabilidad, release y UX delivery
- no copiar la estructura completa de fases, ejemplos, memoria local o catalogos genericos del template
- no esconder comportamiento critico del proyecto unicamente en skills o agentes locales
- toda regla que afecte como se construye, valida o despliega `ERP-HUELEHUELE` debe vivir en Git

## Lo Que Va En Git

Estas piezas deben quedar versionadas porque definen proceso real del proyecto:

- `CONTRIBUTING.md` adaptado al monorepo real
- `.editorconfig`
- `.gitattributes`
- `.github/pull_request_template.md`
- workflow CI minimo con `typecheck`, `test:erp-sales` y `build`
- documentos de `docs/engineering/` para:
  - estandar de desarrollo
  - checklist de release y smoke
  - playbooks de UX, motion y QA visual
- reglas de deploy, release y rollback enlazadas a la documentacion vigente
- prompts o playbooks del proyecto cuando dependan del dominio Huele Huele

No se debe dejar solo en local:

- gates previos a merge
- criterios de release
- definicion de done para UX o QA
- flujo de trabajo operativo entre agentes del proyecto

## Lo Que Va En Agentes Y Skills Locales

La capa local sirve para aceleradores reutilizables en cualquier repo, no para esconder la fuente de verdad del proyecto.

Skills locales recomendadas:

- `ux-brief-composer`: convierte contexto del repo en brief de UX accionable
- `motion-system-review`: revisa animaciones, timing, transiciones y reduced motion
- `responsive-performance-guard`: audita impacto visual sin romper mobile ni performance
- `release-readiness-auditor`: repasa gates tecnicos antes de ship

Prompts o playbooks locales recomendados:

- checklist base de arquitectura para nuevos frentes
- plantilla de auditoria de release
- plantilla de revision cross-device
- plantilla de handoff tecnico

Regla:

- el skill puede ser local
- la politica del proyecto que ese skill consume debe existir en Git

## Lo Que No Conviene Copiar Del Template

No adoptar por ahora:

- `ai/memory/framework-agent.db`
- la estructura completa de fases y entregables del template
- los gates completos de `SPDD/prototype` como bloqueo universal para todo el repo
- el catalogo tipo `Backstage` mientras no exista necesidad real de service catalog
- ejemplos canonicos, prompts genericos o dominio ajeno al ERP

## Plan Minimo De Adopcion

### Ola 1. Estandar Basico Del Repo

Objetivo:

- dejar una base de trabajo versionada, pequena y util

Entregables:

- `CONTRIBUTING.md`
- `.editorconfig`
- `.gitattributes`
- `.github/pull_request_template.md`
- `docs/engineering/development-standard.md`

Resultado esperado:

- cualquier colaborador entiende como leer, cambiar, validar y preparar un corte sin depender de memoria implicita

### Ola 2. Gates Operativos Minimos

Objetivo:

- subir el nivel de control sin meter pipeline pesado

Entregables:

- workflow CI minimo
- checklist de release enlazado a [deployment-strategy.md](../infra/deployment-strategy.md)
- criterio de smoke tecnico y smoke funcional

Resultado esperado:

- cada merge a `main` se valida con gates consistentes y cada deploy tiene evidencia clara

### Ola 3. Playbooks Para Frente UX Y Motion

Objetivo:

- soportar el frente `F2-VIS` sin rehacer trabajo ni romper el foco del `F2-URG`

Entregables:

- playbook UX de superficies secundarias
- playbook de motion y reduced motion
- checklist QA visual cross-device

Resultado esperado:

- `Aether`, `Pulse`, `Neon` y `Echo` trabajan con criterios compartidos y trazables

## Reparto Entre Repo Y Operador

### Repo

- politica del proyecto
- fuentes de verdad
- criterios de validacion
- workflow de release
- playbooks especificos del ERP

### Operador Local

- skills reutilizables
- prompts base
- atajos de Codex
- configuracion personal de herramientas

## Criterio De Exito

La adopcion esta bien hecha si:

- mejora velocidad y claridad sin frenar entrega
- soporta el roadmap vigente en vez de competir con el
- permite que otro colaborador entienda el proceso desde Git
- deja a los agentes locales como aceleradores, no como dependencia oculta
