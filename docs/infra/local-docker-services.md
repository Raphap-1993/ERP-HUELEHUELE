# Servicios Docker Locales

## Propósito

El flujo estándar para dependencias locales de Huelegood usa Docker y queda centralizado en un único punto de entrada:

- `npm run docker:up`

No se deben mezclar variantes ad hoc de `docker compose`, `docker-compose`, puertos improvisados o servicios nativos distintos cada vez que se quiera levantar el entorno.

## Fuente operativa

- archivo Compose: [`docker-compose.local.yml`](../../docker-compose.local.yml)
- wrapper soportado: [`scripts/docker-local.sh`](../../scripts/docker-local.sh)
- scripts npm: [`package.json`](../../package.json)
- variables base: [`.env.example`](../../.env.example)

## Convención local vigente

El repo reserva estos puertos host para evitar choques con instalaciones nativas ya existentes:

- `PostgreSQL`: `localhost:55436`
- `Redis`: `localhost:6380`

La configuración esperada en `.env` para este flujo es:

```dotenv
DATABASE_URL=postgresql://postgres:postgres@localhost:55436/huelegood
REDIS_URL=redis://localhost:6380
```

Si tu `.env` sigue apuntando a `5432`, `6379` o a sockets locales, primero debes alinearlo con [`.env.example`](../../.env.example).

## Flujo soportado

1. Instalar dependencias del monorepo:

   ```bash
   npm install
   ```

2. Crear `.env` desde el ejemplo del repo:

   ```bash
   cp .env.example .env
   ```

3. Levantar `PostgreSQL` y `Redis`:

   ```bash
   npm run docker:up
   ```

4. Verificar estado de contenedores:

   ```bash
   npm run docker:ps
   ```

5. Preparar base demo local:

   ```bash
   npm run local:demo
   ```

6. Levantar procesos de aplicación:

   ```bash
   npm run dev:web
   npm run dev:admin
   npm run dev:api
   npm run dev:worker
   ```

## Comandos soportados

- `npm run docker:up`: levanta `PostgreSQL` y `Redis`
- `npm run docker:down`: baja los contenedores del entorno local
- `npm run docker:ps`: muestra estado de servicios
- `npm run docker:logs`: sigue logs de ambos servicios

El wrapper del repo resuelve internamente si la máquina usa `docker compose` o `docker-compose`. A nivel de operación del proyecto, el comando que debe usarse es el script npm, no la variante subyacente.

## Requisitos

- Docker instalado
- daemon Docker operativo antes de ejecutar `npm run docker:up`

El repo no asume un runtime específico. Puede correr sobre `Docker Desktop` o sobre otro daemon compatible mientras el CLI `docker` responda correctamente.

## Troubleshooting mínimo

### El daemon Docker no responde

Si `npm run docker:up` falla antes de arrancar contenedores, primero corrige el runtime Docker de la máquina. El script ya corta con un error explícito cuando no hay daemon disponible para el contexto activo.

### Apple Silicon con Colima

Si trabajas en `arm64`, `colima` y `limactl` también deben estar instalados como binarios `arm64`. Una instalación mezclada en `x86_64` rompe el arranque del daemon aunque el comando `docker compose` exista.

### Necesitas puertos distintos

El Compose local acepta overrides de host:

```bash
POSTGRES_HOST_PORT=55432 REDIS_HOST_PORT=56379 npm run docker:up
```

Si haces eso, actualiza también `DATABASE_URL` y `REDIS_URL` en tu `.env` para que `api` y `worker` apunten a los mismos puertos.
