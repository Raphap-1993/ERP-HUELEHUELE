# Spec Tareas - Automatizacion Comercial Amplia

Fecha: 2026-05-29.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec funcional](spec-funcional.md) | [Spec tecnica](spec-tecnica.md) | [Traceability](traceability.md)

## Backlog Canonico

### T1. Contratos shared del journey

- introducir unions canonicas para templates y estados de instancia
- introducir shape compartida de `journey_instance`
- introducir shape cerrada de tipos de paso y milestones

### T2. Persistencia de templates e instancias

- modelar catalogo cerrado de templates
- modelar snapshot al instanciar
- sostener unicidad no terminal por `template + case`
- sostener `reentryCooldown` por template

### T3. Motor de gating e instanciacion

- evaluar elegibilidad por contexto comercial
- instanciar por trigger canonico o lanzamiento manual excepcional
- impedir duplicado no terminal del mismo template

### T4. Scheduler y continuaciones diferidas

- programar waits y timers en `worker/BullMQ`
- reanudar instancias en el paso correcto
- registrar cancelacion o completion tecnica cuando aplique

### T5. Manual reviews y control humano

- crear `manual_review` bloqueante
- resolver pasos manuales dentro de `/crm`
- reanudar automaticamente al resolver si corresponde

### T6. Side effects seguros

- crear tareas de follow-up
- sugerir prioridad
- encolar campañas existentes
- marcar milestones
- mantener prohibicion de mutar automaticamente estados comerciales

### T7. Binding y compatibilidad con oportunidad activa

- ligar el journey a la oportunidad activa cuando el template la requiera
- impedir rebind silencioso a otro deal
- cancelar o pausar por incompatibilidad fuerte o blanda

### T8. Bandeja y detalle en `/crm`

- mostrar journeys activos y pausados dentro del detalle del cliente
- mostrar pasos manuales, milestones, estado y assignee
- abrir bandeja secundaria de journeys dentro del mismo modulo

### T9. Trazabilidad y auditoria

- trazar inicio, pausa, reanudacion, branch, manual review, completion y
  cancelacion
- preservar lectura de la traza dentro del mismo `/crm`

## Criterio De Priorizacion

- primero lenguaje compartido y modelo de persistencia
- luego gating e instanciacion
- despues waits y pasos manuales
- finalmente bandeja, trazabilidad y ergonomia del workbench
