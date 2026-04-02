# Convenciones comunes (Auth + Events)

## Base URLs (local)

- Auth Service: `http://127.0.0.1:8000`
- Events Service: `http://127.0.0.1:8001`

Ambos exponen bajo el prefijo: `.../api/...`

---

## Autenticación

### Bearer Token (JWT)
Los endpoints marcados como **(auth)** requieren:

- Header: `Authorization: Bearer <ACCESS_TOKEN>`

El `ACCESS_TOKEN` se obtiene desde Auth Service (`POST /api/auth/login`).

### Gateway Secret (solo interno)
Algunos endpoints internos del Auth Service están protegidos por un secreto compartido.

- Header: `X-Gateway-Secret: <secret>`

> Estos endpoints no deben exponerse públicamente.

---

## Roles y permisos

En este repo se usan roles con prefijo `ROLE_`.

- `ROLE_ADMIN`: administrador (gestión y moderación).
- `ROLE_SECURITY_ADMIN`: administrador de seguridad (especialmente lectura/listados sensibles).

Reglas típicas:
- Endpoints de **admin**: requieren `ROLE_ADMIN`.
- Algunos listados (Auth Service) aceptan `ROLE_ADMIN` o `ROLE_SECURITY_ADMIN`.
- En Events Service, ciertos recursos se controlan por **owner** (dueño) o por admin.

---

## Contratos de respuesta

### Auth Service (`RestResponse`)
En Auth Service los endpoints públicos/autenticados suelen responder:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

En error:

```json
{
  "success": false,
  "message": "...",
  "data": {
    "code": "...",
    "details": {}
  }
}
```

> Nota: algunos endpoints **internos** pueden responder modelos “raw” sin wrapper.

### Events Service (`ApiResponse`)
Events Service responde con el wrapper:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

En error (ejemplo típico):

```json
{
  "success": false,
  "message": "...",
  "data": {
    "code": "VALIDATION_ERROR",
    "details": [],
    "trace_id": "..."
  }
}
```

**Excepción**: `DELETE` de algunos recursos devuelve `204 No Content` sin body.

---

## Paginación

Convención general (cuando aplica):
- `limit` (1..100)
- `offset` (>=0)

La respuesta suele incluir:

```json
{
  "items": [],
  "total": 0
}
```

---

## Formatos de fecha/hora

- `datetime`: ISO 8601 (ej: `2026-05-21T15:00:00Z`)
- `date`: `YYYY-MM-DD`
- Mes: `YYYY-MM`

