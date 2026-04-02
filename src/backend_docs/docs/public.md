# Events Service — Público / General

Base path: `/api`

## Health

### `GET /api/health`
Liveness del servicio.

---

## Categories

### `GET /api/v1/categories`
Devuelve catálogo de categorías.

---

## Events (público)

### `GET /api/v1/events`
Listado de eventos activos con paginación y filtros.

**Query params (principales):**
- `category_id` (int, opcional)
- `from` (datetime ISO, opcional)
- `to` (datetime ISO, opcional)
- `month` (`YYYY-MM`, opcional)
- `week_start` (`YYYY-MM-DD`, opcional)
- `sort_by` (`start_datetime` | `score`, default `start_datetime`)
- `limit` (1..100, default 20)
- `offset` (>=0, default 0)

### `GET /api/v1/events/{event_id}`
Detalle de evento (solo activos). Inactivos → `404`.

---

## Communities (público)

### `GET /api/v1/communities`
Lista comunidades activas.

**Query params:**
- `search` (string, opcional)
- `category_id` (int, opcional)
- `limit`, `offset`

### `GET /api/v1/communities/{community_id}`
Detalle de una comunidad.

### `GET /api/v1/communities/{community_id}/events`
Schedule público de eventos de la comunidad.

**Query params:**
- `from` (datetime ISO, opcional)
- `to` (datetime ISO, opcional)
- `limit`, `offset`

