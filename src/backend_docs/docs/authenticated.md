# Events Service — Endpoints autenticados (Bearer)

Base path: `/api`

> En este servicio se valida el token contra Auth Service y además se verifica baneo/estado en middleware/dependencies.

## Headers
- `Authorization: Bearer <ACCESS_TOKEN>`

---

## Events (auth)

### `POST /api/v1/events`
Crea evento. `owner_id = current_user.id`.

### `PATCH /api/v1/events/{event_id}`
Actualiza campos parciales.

**Permisos:** owner del evento o admin.

### `DELETE /api/v1/events/{event_id}`
Soft delete (desactiva).

**Respuestas:**
- `204` sin body

### `POST /api/v1/events/{event_id}/favorite`
Alterna favorito del usuario.

### `POST /api/v1/events/image-upload-url`
Devuelve URL pre-firmada para subir imagen.

**Query:**
- `content_type`: `image/jpeg|image/png|image/webp|image/gif|image/avif`

---

## Communities (auth)

### `POST /api/v1/communities`
Solicita crear comunidad (queda `PENDING`).

### `GET /api/v1/communities/my`
Lista comunidades del usuario autenticado.

### `PATCH /api/v1/communities/{community_id}`
Actualiza comunidad. **Solo owner**.

### `DELETE /api/v1/communities/{community_id}`
Soft delete comunidad. **Solo owner**.

### `POST /api/v1/communities/image-upload-url`
URL pre-firmada para imagen de comunidad.

---

## Suscripciones a comunidades (auth)

### `POST /api/v1/communities/{community_id}/subscribe`
Suscribe (idempotente).

### `DELETE /api/v1/communities/{community_id}/subscribe`
Desuscribe (idempotente). Responde `204`.

### `GET /api/v1/communities/my/subscriptions`
Lista mis suscripciones.

---

## Requests: vincular evento ↔ comunidad (auth)

### `POST /api/v1/communities/{community_id}/events/{event_id}/request`
Solicita agregar un **evento** a una **comunidad**.

### `GET /api/v1/communities/{community_id}/requests`
Lista solicitudes de eventos hacia una comunidad.

**Permisos:** solo owner de la comunidad.

Query:
- `status` (PENDING/APPROVED/REJECTED según enum)
- `limit`, `offset`

### `PATCH /api/v1/communities/{community_id}/requests/{request_id}`
Aprueba o rechaza. Solo owner.

Body:
```json
{ "action": "APPROVE" }
```

Rechazo:
```json
{ "action": "REJECT", "rejection_reason": "..." }
```

