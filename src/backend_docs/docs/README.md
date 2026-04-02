# Documentación de APIs (Auth Service + Events Service)

Este repositorio contiene dos microservicios FastAPI:

- **Auth Service** (puerto típico local: `8000`) — autenticación, usuarios, roles, verificación email y recuperación de contraseña.
- **Events Service** (puerto típico local: `8001`) — catálogo de categorías, eventos, comunidades, moderación y sistema de baneos.

> Base path común en ambos servicios: `/api`.

## Índice

### Convenciones comunes
- [`docs/CONVENTIONS.md`](./CONVENTIONS.md)

### Auth Service
- [`docs/auth/README.md`](./auth/README.md)

### Events Service
- [`events_service/docs/INDEX.md`](../events_service/docs/INDEX.md)

## Quickstart (local)

Auth Service:

```powershell
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Events Service:

```powershell
uvicorn events_service.main:app --host 127.0.0.1 --port 8001 --reload
```

## Colecciones de prueba
- Auth: [`test_auth.http`](../test_auth.http)
- Events (eventos): [`events_service/test_events.http`](../events_service/test_events.http)
- Events (comunidades + admin): [`events_service/test_communities.http`](../events_service/test_communities.http)

