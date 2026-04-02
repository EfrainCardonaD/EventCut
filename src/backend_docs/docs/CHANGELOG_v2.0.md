# Changelog v2.0 - Contrato API (Events Service)

> Fecha de release: 2026-04-01

## Resumen

Version 2.0 agrega capacidades de comunidades, solicitudes evento-comunidad, baneos de usuarios y enlaces sociales en eventos/comunidades.

## Cambios de contrato

### 1) Eventos

#### Nuevos campos de entrada/salida
- `social_links` (objeto opcional)
- `community_id` (string opcional, solo en `POST /api/v1/events`)

#### Endpoints impactados
- `POST /api/v1/events`
- `PATCH /api/v1/events/{event_id}`
- `GET /api/v1/events`
- `GET /api/v1/events/{event_id}`

#### Reglas nuevas relevantes
- `social_links.whatsapp` debe iniciar con `https://wa.me/`
- `social_links.facebook` debe iniciar con `https://facebook.com/` o `https://www.facebook.com/`
- `social_links.instagram` debe iniciar con `https://instagram.com/` o `https://www.instagram.com/`
- Si se envia `community_id`, la comunidad debe existir y estar `ACTIVE`.

### 2) Modulo de comunidades

#### Nuevos endpoints
- Publicos:
  - `GET /api/v1/communities`
  - `GET /api/v1/communities/{community_id}`
  - `GET /api/v1/communities/{community_id}/events`
- Autenticados:
  - `POST /api/v1/communities`
  - `PATCH /api/v1/communities/{community_id}`
  - `DELETE /api/v1/communities/{community_id}`
  - `GET /api/v1/communities/my`
- Solicitudes de eventos a comunidad:
  - `POST /api/v1/communities/{community_id}/events/{event_id}/request`
  - `GET /api/v1/communities/{community_id}/requests`
  - `PATCH /api/v1/communities/{community_id}/requests/{request_id}`

#### Estados
- Comunidad: `PENDING | ACTIVE | REJECTED`
- Solicitud evento-comunidad: `PENDING | APPROVED | REJECTED`

### 3) Endpoints administrativos

#### Moderacion de comunidades
- `GET /api/v1/admin/communities`
- `PATCH /api/v1/admin/communities/{community_id}/status`

#### Gestion de baneos
- `POST /api/v1/admin/users/{user_id}/ban`
- `DELETE /api/v1/admin/users/{user_id}/ban`
- `GET /api/v1/admin/users/banned`
- `GET /api/v1/admin/users/{user_id}/ban-status`

#### Roles requeridos
- `ROLE_ADMIN` o `ROLE_SECURITY_ADMIN` (backend normaliza rol).

## Cambios de validacion y errores

### Codigos de error incorporados/relevantes
- `USER_BANNED`
- `COMMUNITY_NOT_FOUND`
- `COMMUNITY_NOT_ACTIVE`
- `NOT_COMMUNITY_OWNER`
- `NOT_EVENT_OWNER`
- `EVENT_ALREADY_REQUESTED`
- `DUPLICATE_COMMUNITY_NAME`
- `TERMS_NOT_ACCEPTED`
- `REQUEST_NOT_FOUND`
- `VALIDATION_ERROR`

### Comportamiento de validaciones
- Errores de esquema (Pydantic) retornan `422` con `code=VALIDATION_ERROR`.
- Reglas de negocio pueden retornar `400`, `403`, `404` o `409` segun el caso.

## Cambios en seguridad

- Mutaciones de eventos/comunidades usan `get_verified_user` para bloquear usuarios baneados.
- Endpoints de admin usan `require_admin`.

## Flujos de negocio habilitados

### Flujo: comunidad
1. Usuario crea comunidad (`PENDING`).
2. Admin activa o rechaza.
3. Solo comunidades `ACTIVE` aparecen en listados publicos.

### Flujo: asociar evento a comunidad
1. Se crea evento con `community_id` o se solicita asociacion por endpoint dedicado.
2. Owner de comunidad revisa solicitud.
3. Si aprueba, el evento aparece en `GET /communities/{id}/events`.

### Flujo: baneo
1. Admin banea usuario.
2. Usuario recibe `403 USER_BANNED` en operaciones de escritura protegidas.
3. Admin desbanea para restaurar operaciones.

## Nota de compatibilidad

- Operaciones de actualizacion de eventos son via `PATCH` (no `PUT`).
- Contrato base del servicio se mantiene bajo prefijo `/api`.
