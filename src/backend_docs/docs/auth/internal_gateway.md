# Auth Service — Interno / Gateway (X-Gateway-Secret)

Estos endpoints están diseñados para consumo **entre servicios** (por ejemplo, Events Service consultando datos de usuario).

## Autorización

**Header requerido:**
- `X-Gateway-Secret: <secret>`

> El valor proviene de configuración del Auth Service. En `test_auth.http` aparece el default: `default-secret-change-me`.

Base path: `/api/internal`

---

## Current user (interno)

### `GET /api/internal/auth/me`
Devuelve datos del usuario autenticado (requiere además Bearer token válido, y gateway secret).

**Headers:**
- `X-Gateway-Secret: <secret>`
- `Authorization: Bearer <ACCESS_TOKEN>`

**Respuestas:**
- `200` (modelo raw: `InternalAuthUserResponse`)
- `401/404`

---

## Users internos

### `GET /api/internal/users/{id}`
Obtiene un usuario por id.

### `GET /api/internal/users/by-username/{username}`
Obtiene un usuario por username.

### `GET /api/internal/users/summary?ids=<id>&ids=<id>...`
Devuelve un mapa `{ user_id: summary }`.

**Query:**
- `ids` repetible (máx defensivo 100 en implementación)

**Respuestas:**
- `200`
- `404` cuando el recurso puntual no existe (en endpoints por id/username)

