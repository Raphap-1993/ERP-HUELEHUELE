# Arquitectura De Solucion

Este documento queda como compatibilidad para enlaces antiguos.

La arquitectura de solucion vigente vive en:

- [overview.md](./overview.md)
- [system-diagrams.md](./system-diagrams.md)
- [modules.md](./modules.md)

Resumen actual:

- monolito modular con `web`, `admin`, `api` y `worker`;
- PostgreSQL productivo como fuente de verdad;
- Redis/BullMQ para jobs;
- Cloudflare R2 para media publica;
- PM2, Hestia y Nginx en el VPS;
- homologacion codigo LOCAL -> produccion sin reemplazar la BD productiva.
