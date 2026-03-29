# API del Events Service

Base path: `/api`

## Health
### `GET /api/health`
Verifica disponibilidad del servicio.

Respuesta:
```json
{
  "status": "ok"
}
```

## Categories
### `GET /api/v1/categories`
Retorna catalogo de categorias ordenado por nombre.

Respuesta 200 (ejemplo):
```json
[
  {
    "id": 1,
    "slug": "cinecut",
    "name": "CineCUT"
  },
  {
    "id": 2,
    "slug": "ingenieria",
    "name": "Ingenieria"
  }
]
```

## Events
### `GET /api/v1/events`
Listado de eventos con paginacion y filtros.

Query params:
- `category_id` (int, opcional)
- `from` (datetime ISO 8601, opcional)
- `to` (datetime ISO 8601, opcional)
- `month` (string `YYYY-MM`, opcional)
- `week_start` (date `YYYY-MM-DD`, opcional)
- `sort_by` (`start_datetime` | `score`, default `start_datetime`)
- `limit` (1..100, default 20)
- `offset` (>=0, default 0)

Respuesta 200 (ejemplo):
```json
{
  "items": [
    {
      "id": "8f532a9b-33f7-4a3d-bf09-baad8b33f2f4",
      "title": "Hackathon Ingenieria 2026",
      "description": "Maraton de desarrollo colaborativo",
      "image_url": "https://cdn.example.com/events/hackathon-2026.png",
      "start_datetime": "2026-04-10T14:00:00Z",
      "end_datetime": "2026-04-10T20:00:00Z",
      "location": "Auditorio Principal",
      "owner_id": "4c5d3eb0-9cb8-40b0-8fde-62082a7f8f1c",
      "category_id": 2,
      "score": 18
    }
  ],
  "total": 1
}
```

### `GET /api/v1/events/{event_id}`
Detalle de evento con `score` agregado.

Respuestas:
- `200` evento encontrado
- `404` evento no encontrado

### `POST /api/v1/events` (auth)
Crea evento y asigna `owner_id = current_user.id`.

Body:
```json
{
  "title": "Feria de Proyectos",
  "description": "Exposicion de proyectos estudiantiles",
  "image_url": "https://cdn.example.com/events/feria-proyectos.png",
  "start_datetime": "2026-05-21T15:00:00Z",
  "end_datetime": "2026-05-21T19:00:00Z",
  "location": "Plaza Central",
  "category_id": 2
}
```

Respuestas:
- `201` creado
- `401` token invalido/expirado
- `422` validacion de payload o categoria invalida

### `PATCH /api/v1/events/{event_id}` (auth)
Actualiza campos parciales.

Permisos:
- Owner del evento, o
- `ROLE_ADMIN`, o
- `ROLE_SECURITY_ADMIN`.

Body (ejemplo):
```json
{
  "location": "Laboratorio 2",
  "end_datetime": "2026-05-21T20:00:00Z"
}
```

Respuestas:
- `200` actualizado
- `401` token invalido
- `403` no autorizado
- `404` evento no encontrado
- `422` rango de fechas/categoria invalida

### `DELETE /api/v1/events/{event_id}` (auth)
Elimina un evento.

Permisos:
- Owner, `ROLE_ADMIN` o `ROLE_SECURITY_ADMIN`.

Respuestas:
- `204` eliminado
- `401`, `403`, `404`

### `POST /api/v1/events/{event_id}/favorite` (auth)
Alterna favorito para el usuario actual.

Respuesta 200:
```json
{
  "event_id": "8f532a9b-33f7-4a3d-bf09-baad8b33f2f4",
  "favorited": true
}
```

## Errores estandar
Formato:
```json
{
  "detail": "Mensaje de error"
}
```

Codigos comunes:
- `401`: token invalido/expirado o usuario no valido en auth-service
- `403`: sin permisos
- `404`: recurso no encontrado
- `422`: validacion de negocio/payload
- `503`: auth-service no disponible para validacion remota

## Ejemplos de uso rapido (PowerShell)

```powershell
$base = "http://127.0.0.1:8001"
Invoke-RestMethod -Uri "$base/api/health" -Method Get
Invoke-RestMethod -Uri "$base/api/v1/categories" -Method Get
Invoke-RestMethod -Uri "$base/api/v1/events?month=2026-05&sort_by=score&limit=10" -Method Get
```

Con token:

```powershell
$token = "<ACCESS_TOKEN>"
$headers = @{ Authorization = "Bearer $token" }

Invoke-RestMethod -Uri "$base/api/v1/events" -Method Post -Headers $headers -ContentType "application/json" -Body (@{
  title = "Taller DevOps"
  description = "Sesion practica de despliegue continuo"
  image_url = "https://cdn.example.com/events/devops.png"
  start_datetime = "2026-06-05T15:00:00Z"
  end_datetime = "2026-06-05T18:00:00Z"
  location = "Sala 4"
  category_id = 2
} | ConvertTo-Json)
```

