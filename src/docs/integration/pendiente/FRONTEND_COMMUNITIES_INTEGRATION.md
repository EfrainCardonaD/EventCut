# Integracion Frontend - Modulo de Comunidades

> Servicio: `events_service`  
> Base URL: `http://127.0.0.1:8001/api`  
> Ultima verificacion contra codigo: 2026-04-01

## 1) Alcance

Cubre endpoints de:
- Comunidades publicas y de owner.
- Solicitudes de eventos a comunidades.
- Endpoints admin relacionados con comunidades y baneos.

## 2) Convenciones de contrato

### Respuesta exitosa

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

### Respuesta de error

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

## 3) Autenticacion

Endpoints protegidos requieren:

```http
Authorization: Bearer <jwt>
```

- Mutaciones usan `get_verified_user` (bloquea usuarios baneados).
- Endpoints admin usan `require_admin`.

## 4) Entidades y tipos de referencia

```ts
type CommunityStatus = "PENDING" | "ACTIVE" | "REJECTED";
type CommunityEventStatus = "PENDING" | "APPROVED" | "REJECTED";

type SocialLinks = {
  whatsapp?: string;
  facebook?: string;
  instagram?: string;
};

type Community = {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  owner_id: string;
  owner_first_name: string | null;
  owner_last_name: string | null;
  contact_email: string;
  status: CommunityStatus;
  social_links: SocialLinks | null;
  events_count: number;
  created_at: string;
};
```

## 5) Endpoints de comunidades

### 5.0 Carga de imagen para comunidad (recomendado)
- `POST /v1/communities/image-upload-url?content_type=image/png`
- Auth: requerida (`Bearer`)
- `content_type` permitido: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/avif`

Respuesta `200`:

```json
{
  "success": true,
  "message": "URL de carga generada",
  "data": {
    "upload_url": "https://...",
    "file_key": "comunidad/pending/abc123.png",
    "public_url": "https://cdn.tudominio.com/comunidad/pending/abc123.png"
  }
}
```

Flujo recomendado:
1. Pedir URL prefirmada en `image-upload-url`.
2. Subir binario por `PUT` a `upload_url` con el mismo `Content-Type`.
3. Enviar `image_url = public_url` en `POST /v1/communities` o `PATCH /v1/communities/{community_id}`.
4. Backend promueve de `comunidad/pending/...` a `comunidad/...` al persistir.

Notas:
- Si el create/update falla con `422`, backend intenta limpiar la imagen temporal (best effort).
- Si falla persistencia luego de promover, se aplica compensación para borrar la imagen final promovida.

### 5.1 Crear comunidad
- `POST /v1/communities`
- Auth: requerida

Body:

```json
{
  "name": "Runners Monterrey",
  "description": "Comunidad de corredores del area metropolitana",
  "image_url": "https://cdn.example.com/comunidad/pending/logo.png",
  "contact_email": "contacto@runnersmty.com",
  "is_accepted_terms": true,
  "social_links": {
    "whatsapp": "https://wa.me/528112345678",
    "facebook": "https://facebook.com/runnersmty",
    "instagram": "https://instagram.com/runnersmty"
  }
}
```

Respuesta `201`: `ApiResponse<Community>` con `status=PENDING`.

Validaciones relevantes:
- `name`: 3..100, unico en comunidades activas.
- `description`: 5..2000.
- `contact_email`: email valido.
- `is_accepted_terms`: debe ser `true`.
- Validaciones de prefijo en `social_links`.

### 5.2 Listar comunidades activas
- `GET /v1/communities`
- Auth: publica
- Query params: `search`, `limit`, `offset`

Respuesta `200`:

```json
{
  "success": true,
  "message": "Comunidades obtenidas",
  "data": {
    "items": [],
    "total": 0
  }
}
```

### 5.3 Listar comunidades del usuario autenticado
- `GET /v1/communities/my`
- Auth: requerida
- Query params: `limit`, `offset`

Devuelve comunidades propias (`PENDING`, `ACTIVE`, `REJECTED`) no eliminadas.

### 5.4 Obtener detalle de comunidad
- `GET /v1/communities/{community_id}`
- Auth: publica

### 5.5 Actualizar comunidad (owner)
- `PATCH /v1/communities/{community_id}`
- Auth: requerida (owner)

Campos actualizables:
- `name`, `description`, `image_url`, `contact_email`, `social_links`.

### 5.6 Eliminar comunidad (owner)
- `DELETE /v1/communities/{community_id}`
- Auth: requerida (owner)
- Respuesta: `204 No Content` (soft delete)

## 6) Schedule y solicitudes de eventos

### 6.1 Schedule publico de comunidad
- `GET /v1/communities/{community_id}/events`
- Auth: publica
- Query params: `from`, `to`, `limit`, `offset`
- Solo devuelve eventos con solicitud `APPROVED`.

### 6.2 Solicitar union de evento a comunidad
- `POST /v1/communities/{community_id}/events/{event_id}/request`
- Auth: requerida
- Restriccion: solo owner del evento.
- Body: no requerido.

Respuesta `201`:

```json
{
  "success": true,
  "message": "Solicitud enviada al dueno de la comunidad",
  "data": {
    "request_id": "uuid",
    "community_id": "uuid",
    "event_id": "uuid",
    "status": "PENDING",
    "requested_by": "uuid",
    "created_at": "2026-04-01T10:00:00Z"
  }
}
```

### 6.3 Listar solicitudes de una comunidad (owner)
- `GET /v1/communities/{community_id}/requests`
- Auth: requerida (owner comunidad)
- Query params: `status`, `limit`, `offset`

Respuesta `200` (estructura real):

```json
{
  "success": true,
  "message": "Solicitudes obtenidas",
  "data": {
    "items": [
      {
        "request_id": "uuid",
        "event": {
          "id": "uuid",
          "title": "Carrera 10K",
          "start_datetime": "2026-05-15T07:00:00Z",
          "owner_id": "uuid",
          "owner_first_name": "Nombre",
          "owner_last_name": "Apellido"
        },
        "status": "PENDING",
        "created_at": "2026-04-01T10:00:00Z"
      }
    ],
    "total": 1
  }
}
```

### 6.4 Aprobar o rechazar solicitud (owner)
- `PATCH /v1/communities/{community_id}/requests/{request_id}`
- Auth: requerida (owner comunidad)

Body:

```json
{ "action": "APPROVE" }
```

```json
{
  "action": "REJECT",
  "rejection_reason": "No cumple lineamientos"
}
```

## 7) Endpoints admin relacionados

### 7.1 Moderacion de comunidades
- `GET /v1/admin/communities`
- `PATCH /v1/admin/communities/{community_id}/status`

Body para cambio de estado:

```json
{ "action": "ACTIVATE" }
```

```json
{
  "action": "REJECT",
  "rejection_reason": "Motivo"
}
```

### 7.2 Baneos de usuarios
- `POST /v1/admin/users/{user_id}/ban`
- `DELETE /v1/admin/users/{user_id}/ban`
- `GET /v1/admin/users/banned`
- `GET /v1/admin/users/{user_id}/ban-status`

## 8) Errores a mapear en frontend

| Code | HTTP | Caso |
|---|---:|---|
| `USER_BANNED` | 403 | Usuario suspendido en mutaciones protegidas |
| `COMMUNITY_NOT_FOUND` | 404 | Comunidad inexistente/no activa |
| `COMMUNITY_NOT_ACTIVE` | 400 | Comunidad no activa para operacion |
| `NOT_COMMUNITY_OWNER` | 403 | Usuario no owner de comunidad |
| `NOT_EVENT_OWNER` | 403 | Usuario no owner del evento |
| `EVENT_ALREADY_REQUESTED` | 409 | Solicitud ya existente |
| `DUPLICATE_COMMUNITY_NAME` | 409 | Nombre duplicado |
| `TERMS_NOT_ACCEPTED` | 400 | Terminos no aceptados |
| `REQUEST_NOT_FOUND` | 404 | Solicitud inexistente |
| `FORBIDDEN` | 403 | Sin permisos admin |
| `VALIDATION_ERROR` | 422/400 | Error de validacion |
| `STORAGE_MISCONFIGURED` | 503 | Storage no configurado |
| `STORAGE_UNAVAILABLE` | 503 | Falla temporal de storage/presigned |

## 9) Matriz minima de cobertura de integracion

- [ ] Crear comunidad con terminos aceptados.
- [ ] Rechazo de comunidad sin terminos (`TERMS_NOT_ACCEPTED`).
- [ ] Rechazo por nombre duplicado (`DUPLICATE_COMMUNITY_NAME`).
- [ ] Subida de imagen por `image-upload-url` + `PUT` + create community.
- [ ] Actualizacion de imagen en `PATCH /v1/communities/{community_id}`.
- [ ] Forzar `422` en create/update con `image_url` y validar cleanup best effort.
- [ ] Flujo admin `PENDING -> ACTIVE`.
- [ ] Crear evento con `community_id` y gestionar solicitud.
- [ ] Aprobacion/rechazo de solicitud por owner de comunidad.
- [ ] Bloqueo de mutaciones para usuario baneado (`USER_BANNED`).
- [ ] Validacion de prefijos de `social_links`.
