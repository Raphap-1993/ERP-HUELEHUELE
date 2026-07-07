# Checklist De Verificacion De Control De Acceso

Objetivo: validar el rollout de acceso unificado antes de merge, smoke fuerte o release.

## Precondiciones

- `npm run prisma:seed` deja catalogos de permisos, scopes, modulos y roles sistema consistentes.
- Existe al menos un usuario admin con permisos de seguridad, un usuario admin restringido y un usuario comercial autenticable.
- `GET /auth/me` responde desde el runtime que se quiere validar, no desde snapshots viejos o mocks fuera de corte.

## Checklist

- Usuario sin permiso no ve el modulo en sidebar, dashboard ni CTA de accion sensible.
- Usuario sin permiso recibe `403` si fuerza una ruta admin o consume el endpoint protegido correspondiente.
- `GET /auth/me` devuelve `primaryRoleCode`, `surfaces[]` y `effectivePermissions[]` coherentes con los roles y overrides vigentes.
- Un usuario `authenticated_portal` no accede a surfaces `internal_admin` aunque conserve roles legacy de compatibilidad.
- El modulo `/seguridad` solo aparece si existe `security.roles.read` y sus acciones de mutacion solo aparecen con permisos `manage`.
- Un `override grant` concede el permiso esperado dentro del scope configurado y desaparece al vencer `expiresAt`.
- Un `override revoke` bloquea el permiso aunque el rol base todavia lo conceda.
- Un `system role` no se elimina ni se renombra desde la API o la UI de seguridad.
- Un cambio de roles u overrides invalida o refresca la sesion de forma que `GET /auth/me` no siga devolviendo permisos obsoletos.
- `/cuenta` redirige por permiso efectivo a `/panel-vendedor` o `/mayoristas` y no por string de rol hardcodeado.

## Gate Minimo Del Repo

- `npm run typecheck`
- `npm run test:erp-sales`
- `npm run build`
