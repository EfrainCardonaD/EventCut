# Auth Service — Admin

Base path: `/api`

Roles implicados:
- Listado: `ROLE_ADMIN` o `ROLE_SECURITY_ADMIN`
- Cambio de rol: `ROLE_ADMIN`

---

## Listar usuarios

### `GET /api/users?limit=...&offset=...` (admin/security_admin)
Lista usuarios (paginado).

**Headers:**
- `Authorization: Bearer <ACCESS_TOKEN>`

**Query:**
- `limit` (1..100, default 50)
- `offset` (>=0, default 0)

**Respuestas:**
- `200`
- `401`
- `403` sin rol

---

## Cambiar rol de usuario

### `PATCH /api/users/{user_id}/role` (admin)
Actualiza el rol del usuario.

**Headers:**
- `Authorization: Bearer <ACCESS_TOKEN>`

**Body:**
```json
{ "role": "SECURITY_ADMIN" }
```

> En respuesta se normaliza removiendo prefijo `ROLE_`.

**Respuestas:**
- `200`
- `401`
- `403`
- `404` usuario no encontrado (si aplica en service)

