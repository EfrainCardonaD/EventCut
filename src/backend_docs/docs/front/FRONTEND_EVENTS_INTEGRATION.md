# Guia de integracion frontend - Events API

## Objetivo
Esta guia resume como consumir el `events_service` desde frontend con lo **ya implementado**.

Incluye:
- Contrato de respuesta (success/error)
- Endpoints para listado, filtros, paginacion y categorias
- Campos nuevos de owner en eventos (`owner_first_name`, `owner_last_name`)
- Endpoints autenticados para CRUD/favoritos/upload de imagen

## Base URL
- Local: `http://127.0.0.1:8001/api`

## Contrato de respuesta

### Exito
```json
{
  "success": true,
  "message": "Eventos obtenidos",
  "data": {}
}
```

### Error
```json
{
  "success": false,
  "message": "Solicitud invalida. Revisa los campos enviados.",
  "data": {
    "code": "VALIDATION_ERROR",
    "details": [],
    "trace_id": "f2a8..."
  }
}
```

## Autenticacion
- Publicos (sin token):
  - `GET /v1/events`
  - `GET /v1/events/{event_id}`
  - `GET /v1/categories`
- Requieren `Authorization: Bearer <token>`:
  - `POST /v1/events`
  - `PATCH /v1/events/{event_id}`
  - `DELETE /v1/events/{event_id}`
  - `POST /v1/events/{event_id}/favorite`
  - `POST /v1/events/image-upload-url`

## 1) Listado de eventos (paginado y filtrable)
`GET /v1/events`

### Query params soportados
- `limit` (int, default `20`, min `1`, max `100`)
- `offset` (int, default `0`)
- `category_id` (int)
- `from` (datetime ISO)
- `to` (datetime ISO)
- `month` (`YYYY-MM`)
- `week_start` (`YYYY-MM-DD`)
- `sort_by` (`start_datetime` | `score`)

### Prioridad de filtros de fecha
1. Si llegan `from` y `to`, se usa ese rango.
2. Si no, y llega `month`, se usa ese mes.
3. Si no, y llega `week_start`, se usa esa semana.

### Orden actual implementado
- `sort_by=start_datetime` -> orden por fecha de inicio **ascendente**.
- `sort_by=score` -> score descendente, y empate por fecha ascendente.

> Nota: hoy no existe `sort_order=desc` en API. Si frontend necesita "mas recientes primero", hay que agregar ese parametro en backend.

### Ejemplos
```http
GET /api/v1/events?limit=20&offset=0
GET /api/v1/events?category_id=4&limit=10&offset=0
GET /api/v1/events?month=2026-03&sort_by=start_datetime
GET /api/v1/events?from=2026-03-01T00:00:00&to=2026-03-31T23:59:59&sort_by=score
```

### Respuesta ejemplo
```json
{
  "success": true,
  "message": "Eventos obtenidos",
  "data": {
    "items": [
      {
        "id": "0d57eaf1-c38f-4952-a908-2efdd5d5c58c",
        "title": "Feria Tech",
        "description": "Networking y charlas",
        "image_url": "https://.../events/banner.jpg",
        "start_datetime": "2026-03-30T00:00:00",
        "end_datetime": "2026-03-30T23:59:59",
        "location": "Centro de Convenciones",
        "owner_id": "96e7a1b3-bddb-405c-936b-94b42983f4be",
        "owner_first_name": "Ana",
        "owner_last_name": "Lopez",
        "category_id": 4,
        "score": 0
      }
    ],
    "total": 1
  }
}
```

`owner_first_name` y `owner_last_name` pueden venir en `null` si el auth-service no responde o no encuentra el usuario.

## 2) Detalle de evento
`GET /v1/events/{event_id}`

Retorna `EventResponse` con los mismos campos del listado (incluyendo owner name).

## 3) Categorias para filtros frontend
`GET /v1/categories`

Sirve para poblar selects/chips de categoria en UI.

## 4) Crear/editar/eliminar evento
- `POST /v1/events`
- `PATCH /v1/events/{event_id}`
- `DELETE /v1/events/{event_id}` (retorna `204 No Content`)

Campos de payload en create/update:
- `title`, `description`, `image_url`, `start_datetime`, `end_datetime`, `location`, `category_id`

## 5) Favoritos
`POST /v1/events/{event_id}/favorite`

Respuesta:
```json
{
  "success": true,
  "message": "Marcado como favorito",
  "data": {
    "event_id": "...",
    "favorited": true
  }
}
```

## 6) Carga de imagen
`POST /v1/events/image-upload-url?content_type=image/png`

`content_type` permitido:
- `image/jpeg`
- `image/png`
- `image/webp`
- `image/gif`
- `image/avif`

Flujo recomendado:
1. Pedir URL prefirmada.
2. Subir binario por `PUT` a `upload_url`.
3. Enviar `public_url` como `image_url` en create/update.

## 7) Manejo de errores recomendado en frontend
Mapeo util por `data.code`:
- `VALIDATION_ERROR`: mostrar errores de campos (`data.details`)
- `FORBIDDEN`: no tiene permisos
- `TOKEN_INVALID` / `TOKEN_EXPIRED`: renovar sesion
- `EVENT_NOT_FOUND`: recurso no existe
- `AUTH_UNAVAILABLE`: reintento y mensaje de servicio temporalmente no disponible

Siempre loguear `trace_id` para soporte.

## 8) Checklist rapido para frontend
- [ ] Listado paginado con `limit` + `offset`
- [ ] Filtro por `category_id`
- [ ] Filtros de fecha (`from/to`, `month`, `week_start`)
- [ ] Orden por `start_datetime` y por `score`
- [ ] Render de owner con fallback si viene `null`
- [ ] Manejo de envelope de error con `code/details/trace_id`

