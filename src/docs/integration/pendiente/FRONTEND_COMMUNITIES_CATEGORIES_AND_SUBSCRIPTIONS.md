# Guía de integración Frontend: Categorías y suscripciones de Comunidades (events-service)

Esta guía describe cómo consumir desde frontend los cambios añadidos al módulo de Comunidades:

1) **Categoría** asociada a una comunidad (`category_id`).
2) **Suscripciones** usuario–comunidad (endpoint para suscribirse, desuscribirse y listar suscripciones).

> Base path: `/v1/communities`

---

## 0) Requisitos y autenticación

Algunos endpoints requieren autenticación (token JWT). En esos casos, envía el header:

- `Authorization: Bearer <token>`

**Endpoints públicos**: listar comunidades y obtener detalle.

---

## 1) Categorías en Comunidades

### 1.1 Obtener catálogo de categorías

Las categorías se gestionan como catálogo global.

**Request**
- `GET /v1/categories`

**Respuesta (ejemplo)**
```json
{
  "success": true,
  "message": "Categorías obtenidas",
  "data": {
    "items": [
      {"id": 1, "slug": "ingenieria", "name": "Ingeniería"},
      {"id": 2, "slug": "arte", "name": "Arte"}
    ]
  }
}
```

> Nota: el endpoint exacto puede variar según tu router actual. Si tu API ya expone categorías, reutiliza ese endpoint.

---

### 1.2 Crear comunidad con categoría

**Request**
- `POST /v1/communities`
- Auth: **Sí**

Body (ejemplo)
```json
{
  "name": "Comunidad Backend",
  "description": "Espacio para talleres de arquitectura",
  "image_url": "https://cdn.example.com/comunidad/pending/logo.png",
  "contact_email": "contacto@backend.dev",
  "category_id": 1,
  "is_accepted_terms": true,
  "social_links": {
    "instagram": "https://instagram.com/backend",
    "facebook": null,
    "tiktok": null,
    "youtube": null,
    "x": null,
    "website": "https://backend.dev"
  }
}
```

**Respuesta**
- `201 Created`

Campos relevantes:
- `data.category_id` puede ser `null` si no envías categoría.

**Errores**
- `400 CATEGORY_INVALID`: `category_id` no existe.

---

### 1.3 Editar comunidad (cambiar categoría)

**Request**
- `PATCH /v1/communities/{community_id}`
- Auth: **Sí** (solo owner)

Body (ejemplo)
```json
{
  "category_id": 4
}
```

**Errores**
- `400 CATEGORY_INVALID`: categoría inexistente.
- `403 NOT_COMMUNITY_OWNER`: no es el dueño.

---

### 1.4 Listar comunidades filtrando por categoría

**Request**
- `GET /v1/communities?category_id=1&search=Backend&limit=20&offset=0`

**Respuesta**
```json
{
  "success": true,
  "message": "Comunidades obtenidas",
  "data": {
    "items": [
      {
        "id": "c-123",
        "name": "Comunidad Backend",
        "description": "...",
        "image_url": "...",
        "owner_id": "owner-1",
        "owner_first_name": "Ana",
        "owner_last_name": "Lopez",
        "contact_email": "...",
        "category_id": 1,
        "status": "ACTIVE",
        "social_links": {"website": "https://backend.dev"},
        "events_count": 3,
        "created_at": "2026-04-01T10:00:00Z"
      }
    ],
    "total": 1
  }
}
```

---

## 2) Suscripciones a Comunidades

Las suscripciones permiten al usuario marcar comunidades como “mis comunidades” aunque no sea owner.

### 2.1 Suscribirse a una comunidad

**Request**
- `POST /v1/communities/{community_id}/subscribe`
- Auth: **Sí**

**Respuesta**
- `200 OK`

```json
{
  "success": true,
  "message": "Suscripción registrada",
  "data": {
    "community_id": "c-123"
  }
}
```

**Notas de negocio**
- Es **idempotente**: si ya estabas suscrito, responde OK igualmente.
- Requiere que la comunidad esté **ACTIVA** (`COMMUNITY_NOT_ACTIVE` si no lo está).

---

### 2.2 Desuscribirse

**Request**
- `DELETE /v1/communities/{community_id}/subscribe`
- Auth: **Sí**

**Respuesta**
- `204 No Content`

**Notas**
- También es **idempotente**: si no existía la suscripción, devuelve 204 igual.

---

### 2.3 Listar mis comunidades suscritas

**Request**
- `GET /v1/communities/my/subscriptions?limit=20&offset=0`
- Auth: **Sí**

**Respuesta**
```json
{
  "success": true,
  "message": "Mis suscripciones obtenidas",
  "data": {
    "items": [
      {
        "id": "c-123",
        "name": "Comunidad Backend",
        "description": "...",
        "image_url": "...",
        "owner_id": "owner-1",
        "owner_first_name": "Ana",
        "owner_last_name": "Lopez",
        "contact_email": "...",
        "category_id": 1,
        "status": "ACTIVE",
        "social_links": {"website": "https://backend.dev"},
        "events_count": 0,
        "created_at": "2026-04-01T10:00:00Z"
      }
    ],
    "total": 1
  }
}
```

---

## 3) Flujos recomendados en UI

### 3.1 Pantalla “Explorar comunidades”

1) Llamar `GET /v1/categories` para poblar el selector.
2) Llamar `GET /v1/communities` con:
   - `search` (texto)
   - `category_id` (filtro)
   - `limit/offset` (paginación)
3) Renderizar tarjeta:
   - Nombre, imagen, owner_first_name/last_name, conteo de eventos, etc.
4) Botón “Suscribirme”:
   - `POST /v1/communities/{id}/subscribe`

### 3.2 Pantalla “Mis comunidades”

- Owner: `GET /v1/communities/my`
- Suscritas: `GET /v1/communities/my/subscriptions`

> Puedes mostrarlas en tabs separados: “Administradas” vs “Suscritas”.

---

## 4) Códigos de error esperados (resumen)

- `CATEGORY_INVALID` (400): `category_id` no existe.
- `COMMUNITY_NOT_FOUND` (404): comunidad no existe.
- `COMMUNITY_NOT_ACTIVE` (400): comunidad existe pero no está activa.
- `NOT_COMMUNITY_OWNER` (403): intento de editar/eliminar siendo no-owner.
- `UNAUTHORIZED` / `TOKEN_INVALID` / `TOKEN_EXPIRED`: errores de auth.

---

## 5) Notas de compatibilidad

- `category_id` es **opcional** (nullable) para no romper comunidades existentes.
- Suscripciones no afectan ownership: ser suscriptor **no** otorga privilegios de edición.

