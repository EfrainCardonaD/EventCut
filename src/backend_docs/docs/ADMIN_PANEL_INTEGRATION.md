# Panel Admin - Integracion Tecnica

> Version de contrato: 2.0  
> Servicio: Events Service (`/api/v1/admin/*`)  
> Ultima verificacion contra codigo: 2026-04-01

## 1) Alcance

Este documento define la integracion tecnica para operaciones administrativas del `events_service`:
- Moderacion de comunidades.
- Gestion de baneos de usuarios.
- Requisitos de autorizacion y manejo de errores.

No incluye recomendaciones de UI/UX ni decisiones de estilos visuales.

## 2) Autenticacion y autorizacion

- Header requerido en endpoints admin:

```http
Authorization: Bearer <token_jwt>
```

- Dependencia backend: `require_admin`.
- Roles permitidos por backend (`is_admin_role`):
  - `ROLE_ADMIN`
  - `ROLE_SECURITY_ADMIN`
- El backend normaliza roles sin prefijo (`ADMIN`, `SECURITY_ADMIN`) a formato `ROLE_*`.

## 3) Contrato de respuesta

### Exito

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "message": "...",
  "data": {
    "code": "ERROR_CODE",
    "details": {},
    "trace_id": "uuid"
  }
}
```

## 4) Endpoints admin

Base URL: `http://127.0.0.1:8001/api/v1/admin`

### 4.1 Banear usuario

- Metodo: `POST /users/{user_id}/ban`
- Body:

```json
{
  "reason": "Violacion de terminos"
}
```

- Validaciones:
  - `reason`: 5-500 caracteres.
  - No permite banearse a si mismo (`400`, `VALIDATION_ERROR`).

- Respuesta `200`:

```json
{
  "success": true,
  "message": "Usuario baneado exitosamente",
  "data": {
    "user_id": "uuid",
    "reason": "Violacion de terminos",
    "banned_by": "admin_uuid",
    "banned_at": "2026-04-01T08:30:00Z",
    "is_active": true
  }
}
```

### 4.2 Desbanear usuario

- Metodo: `DELETE /users/{user_id}/ban`
- Respuesta `200`:

```json
{
  "success": true,
  "message": "Usuario desbaneado exitosamente",
  "data": {
    "user_id": "uuid",
    "message": "Usuario desbaneado exitosamente"
  }
}
```

- Si el usuario no tiene baneo activo: `400`, `VALIDATION_ERROR`.

### 4.3 Listar usuarios baneados

- Metodo: `GET /users/banned`
- Query params:
  - `limit` (1..100, default 20)
  - `offset` (>=0, default 0)
  - `include_inactive` (`false` por defecto)

- Respuesta `200`:

```json
{
  "success": true,
  "message": "Usuarios baneados obtenidos",
  "data": {
    "items": [
      {
        "user_id": "uuid",
        "reason": "Violacion de terminos",
        "banned_by": "admin_uuid",
        "banned_at": "2026-04-01T08:30:00Z",
        "is_active": true
      }
    ],
    "total": 1
  }
}
```

### 4.4 Consultar estado de baneo

- Metodo: `GET /users/{user_id}/ban-status`
- Respuesta `200` con usuario no baneado:

```json
{
  "success": true,
  "message": "El usuario no esta baneado",
  "data": null
}
```

### 4.5 Listar comunidades para moderacion

- Metodo: `GET /communities`
- Query params:
  - `status`: `PENDING | ACTIVE | REJECTED` (opcional)
  - `limit` (1..100)
  - `offset` (>=0)

- Respuesta `200`:

```json
{
  "success": true,
  "message": "Comunidades obtenidas",
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Runners Monterrey",
        "owner_id": "uuid",
        "contact_email": "contacto@runnersmty.com",
        "status": "PENDING",
        "is_accepted_terms": true,
        "created_at": "2026-04-01T10:00:00Z"
      }
    ],
    "total": 1
  }
}
```

### 4.6 Cambiar estado de comunidad

- Metodo: `PATCH /communities/{community_id}/status`
- Body:

```json
{
  "action": "ACTIVATE"
}
```

```json
{
  "action": "REJECT",
  "rejection_reason": "No cumple politicas"
}
```

- Reglas:
  - Solo comunidades en estado `PENDING`.
  - `REJECT` requiere `rejection_reason`.

- Respuesta `200`:

```json
{
  "success": true,
  "message": "Comunidad activada exitosamente",
  "data": {
    "id": "uuid",
    "status": "ACTIVE"
  }
}
```

## 5) Errores relevantes para panel admin

| Code | HTTP | Escenario |
|---|---:|---|
| `FORBIDDEN` | 403 | Token sin rol admin valido |
| `VALIDATION_ERROR` | 400/422 | Reglas de negocio o payload invalido |
| `COMMUNITY_NOT_FOUND` | 404 | Comunidad inexistente/inactiva |
| `USER_BANNED` | 403 | Usuario suspendido intentando mutacion |

Notas:
- En validaciones de esquema (Pydantic), la API devuelve `422` con `code=VALIDATION_ERROR`.
- Los endpoints admin usan tambien `400` para validaciones de dominio (por ejemplo, ban self o rechazo sin razon).

## 6) Flujos operativos (backend)

### 6.1 Moderacion de comunidad
1. `GET /admin/communities?status=PENDING`
2. `PATCH /admin/communities/{id}/status` con `ACTIVATE` o `REJECT`
3. Verificar estado final en listado admin o detalle publico de comunidad.

### 6.2 Baneo de usuario
1. `POST /admin/users/{user_id}/ban`
2. Operaciones de escritura del usuario deben devolver `403 USER_BANNED`.
3. `DELETE /admin/users/{user_id}/ban` para revertir.

## 7) Checklist tecnico de integracion

- [ ] Consumir endpoints admin sobre `/api/v1/admin`.
- [ ] Validar rol admin antes de habilitar acciones sensibles.
- [ ] Mapear `data.code` para control de errores.
- [ ] Soportar paginacion (`limit`, `offset`) en listados.
- [ ] Registrar `trace_id` en logs cliente para soporte.
- [ ] Validar contrato con pruebas de integracion automatizadas.
