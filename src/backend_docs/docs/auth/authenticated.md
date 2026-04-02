# Auth Service — Endpoints autenticados (Bearer)

Base path: `/api`

## Obtener perfil autenticado

### `GET /api/auth/me` (auth)
Devuelve el usuario autenticado (claims + rol).

**Headers:**
- `Authorization: Bearer <ACCESS_TOKEN>`

**Respuestas:**
- `200`
- `401` token inválido/expirado

---

## Refresh de tokens

### `POST /api/auth/refresh` (auth — refresh token)
Renueva el par de tokens.

**Headers:**
- `Authorization: Bearer <REFRESH_TOKEN>`

**Respuestas:**
- `200` con nuevo `token` y `refreshToken`
- `400` refresh inválido
- `401` refresh expirado/no válido

---

## Logout

### `POST /api/auth/logout` (auth)
Revoca el token actual (según implementación de revocación).

**Headers:**
- `Authorization: Bearer <ACCESS_TOKEN>`

**Respuestas:**
- `200`
- `401`

---

## Users — perfil propio

### `GET /api/users/me` (auth)
Equivalente funcional a `GET /api/auth/me` pero bajo el módulo users.

**Headers:**
- `Authorization: Bearer <ACCESS_TOKEN>`

**Respuestas:**
- `200`
- `401`

