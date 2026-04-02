# Arquitectura del Events Service

## Objetivo
`events_service` implementa el dominio CEMS (Centralized Event Management System) para:
- Publicar y descubrir eventos publicos.
- Marcar favoritos y calcular popularidad (`score`) por agregacion.
- Restringir cambios de eventos por ownership o roles administrativos.

## Limites del servicio
- Este servicio **no** administra usuarios ni credenciales.
- La identidad viene de `auth-service` por JWT compartido.
- La validacion remota (opcional) consulta `auth-service` con `X-Gateway-Secret`.

## Integracion con auth-service
Flujo de autenticacion/autorizacion en endpoints protegidos:
1. Se extrae `Authorization: Bearer <token>`.
2. Se valida firma y claims del JWT localmente (`JWT_SECRET_KEY`, `JWT_ISSUER`).
3. Si `AUTH_REMOTE_VALIDATION_ENABLED=true`, se llama a:
   - `GET /api/internal/auth/me` en `auth-service`
   - Headers: `Authorization`, `X-Gateway-Secret`
4. Se autoriza operacion segun owner/roles.

## Modelo de datos
El servicio usa un schema MySQL dedicado (`MYSQL_DB`, por defecto `eventcut_events_db`).

### `categories`
- `id` INT PK autoincrement.
- `slug` VARCHAR(50) UNIQUE.
- `name` VARCHAR(50).

### `events`
- `id` VARCHAR(36) PK (UUID v4 string).
- `title` VARCHAR(150).
- `description` TEXT.
- `image_url` VARCHAR(255), opcional.
- `start_datetime`, `end_datetime` (datetime).
- `location` VARCHAR(200).
- `owner_id` VARCHAR(36) (sin FK directa porque usuarios viven en otro schema/servicio).
- `category_id` FK -> `categories.id` con `ON DELETE RESTRICT`.
- `is_active` BOOLEAN/TINYINT(1), default `1` (interno para soft delete).
- `created_at`, `updated_at`.

Indices:
- `idx_events_dates(start_datetime, end_datetime)`
- `idx_events_category_date(category_id, start_datetime)`
- `ix_events_owner_id(owner_id)`

### `event_favorites`
- PK compuesta (`user_id`, `event_id`).
- `event_id` FK -> `events.id` con `ON DELETE CASCADE`.
- `created_at`.

## Reglas de negocio implementadas
- Eventos son publicos para lectura.
- Solo `owner_id` puede editar/borrar su evento.
- Tambien pueden editar/borrar: `ROLE_ADMIN`, `ROLE_SECURITY_ADMIN`.
- `DELETE` no elimina fisicamente: marca `is_active=0`.
- Eventos inactivos no se retornan en listados ni detalle publico.
- Favoritos funcionan como toggle:
  - Si existe (`user_id`, `event_id`) se elimina.
  - Si no existe se inserta.
- `score` no se persiste en tabla; se calcula por agregacion sobre `event_favorites`.

## Filtros de calendario
`GET /api/v1/events` soporta:
- Rango explicito: `from`, `to` (ISO 8601).
- Atajo mensual: `month=YYYY-MM`.
- Atajo semanal: `week_start=YYYY-MM-DD`.

Precedencia:
1. Si vienen `from` y `to`, tienen prioridad.
2. Si no, se usa `month`.
3. Si no, se usa `week_start`.

## Componentes principales
- API: `events_service/app/api/routes/*`
- Servicios de dominio: `events_service/app/services/event_service.py`
- Seguridad: `events_service/app/security/*`
- Gateway auth: `events_service/app/gateway/auth_client.py`
- Migraciones: `events_service/alembic/`

