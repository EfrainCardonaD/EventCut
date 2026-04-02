# Guia de Actualizacion Frontend v2.0 (Contrato API)

> Fecha: 2026-04-01  
> Objetivo: migrar cliente frontend a contratos actuales de `events_service`

## 1) Cambios obligatorios de tipos

### 1.1 Evento

```ts
type SocialLinks = {
  whatsapp?: string;
  facebook?: string;
  instagram?: string;
};

type Event = {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  start_datetime: string;
  end_datetime: string;
  location: string;
  owner_id: string;
  owner_first_name: string | null;
  owner_last_name: string | null;
  category_id: number;
  score: number;
  social_links: SocialLinks | null;
};

type EventCreate = {
  title: string;
  description: string;
  image_url?: string | null;
  start_datetime: string;
  end_datetime: string;
  location: string;
  category_id: number;
  social_links?: SocialLinks;
  community_id?: string;
};

type EventUpdate = Partial<Omit<EventCreate, "community_id">>;
```

Nota: el backend no expone `community_associations` en `EventResponse`.

### 1.2 Comunidad

```ts
type CommunityStatus = "PENDING" | "ACTIVE" | "REJECTED";
type CommunityEventStatus = "PENDING" | "APPROVED" | "REJECTED";

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

## 2) Cambios obligatorios de cliente API

### 2.1 Base URLs
- Auth service: `http://127.0.0.1:8000/api`
- Events service: `http://127.0.0.1:8001/api`

### 2.2 Endpoints a consumir (nuevos/actualizados)

- Eventos:
  - `GET /v1/events`
  - `GET /v1/events/{event_id}`
  - `POST /v1/events`
  - `PATCH /v1/events/{event_id}`
  - `DELETE /v1/events/{event_id}`
- Comunidades:
  - `GET /v1/communities`
  - `GET /v1/communities/my`
  - `GET /v1/communities/{community_id}`
  - `POST /v1/communities`
  - `PATCH /v1/communities/{community_id}`
  - `DELETE /v1/communities/{community_id}`
  - `GET /v1/communities/{community_id}/events`
  - `POST /v1/communities/{community_id}/events/{event_id}/request`
  - `GET /v1/communities/{community_id}/requests`
  - `PATCH /v1/communities/{community_id}/requests/{request_id}`
- Admin:
  - `GET /v1/admin/communities`
  - `PATCH /v1/admin/communities/{community_id}/status`
  - `POST /v1/admin/users/{user_id}/ban`
  - `DELETE /v1/admin/users/{user_id}/ban`
  - `GET /v1/admin/users/banned`
  - `GET /v1/admin/users/{user_id}/ban-status`

## 3) Reglas de validacion a reflejar en frontend

- `EventCreate.title`: 3..150
- `EventCreate.description`: 5..5000
- `EventCreate.location`: 2..200
- `EventCreate.end_datetime > start_datetime`
- Duracion maxima del evento: 30 dias
- `CommunityCreate.name`: 3..100
- `CommunityCreate.description`: 5..2000
- `CommunityCreate.is_accepted_terms` debe ser `true`
- `social_links.whatsapp` inicia con `https://wa.me/`
- `social_links.facebook` inicia con `https://facebook.com/` o `https://www.facebook.com/`
- `social_links.instagram` inicia con `https://instagram.com/` o `https://www.instagram.com/`

## 4) Manejo de errores (obligatorio)

### 4.1 Codigos esperados

```ts
const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  FORBIDDEN: "FORBIDDEN",
  USER_BANNED: "USER_BANNED",
  COMMUNITY_NOT_FOUND: "COMMUNITY_NOT_FOUND",
  COMMUNITY_NOT_ACTIVE: "COMMUNITY_NOT_ACTIVE",
  NOT_COMMUNITY_OWNER: "NOT_COMMUNITY_OWNER",
  NOT_EVENT_OWNER: "NOT_EVENT_OWNER",
  EVENT_ALREADY_REQUESTED: "EVENT_ALREADY_REQUESTED",
  DUPLICATE_COMMUNITY_NAME: "DUPLICATE_COMMUNITY_NAME",
  TERMS_NOT_ACCEPTED: "TERMS_NOT_ACCEPTED",
  REQUEST_NOT_FOUND: "REQUEST_NOT_FOUND",
} as const;
```

### 4.2 Contrato de error

```ts
type ApiError = {
  success: false;
  message: string;
  data: {
    code: string;
    details?: unknown;
    trace_id?: string;
  };
};
```

### 4.3 Regla operativa recomendada
- Guardar `trace_id` en logging cliente para soporte.
- Tratar `422` como error de validacion de campos.
- Tratar `403 USER_BANNED` como bloqueo de mutaciones.

## 5) Ajustes de autorizacion

- Endpoints admin requieren rol admin (`ROLE_ADMIN` o `ROLE_SECURITY_ADMIN`).
- Endpoints de owner de comunidad deben considerar `403 NOT_COMMUNITY_OWNER`.
- Mutaciones de eventos/comunidades pueden fallar por `USER_BANNED`.

## 6) Plan de migracion tecnico

1. Actualizar tipos TS de `Event`, `Community`, respuestas y errores.
2. Actualizar capa API a rutas `PATCH` reales (evitar `PUT` en eventos).
3. Incorporar nuevos endpoints de comunidades y admin.
4. Mapear y centralizar `data.code` para manejo de errores.
5. Ajustar validaciones de formularios al contrato backend.
6. Ejecutar pruebas de regresion de flujos criticos.

## 7) Casos criticos de verificacion

- [ ] Crear evento con `social_links` validos.
- [ ] Error `422 VALIDATION_ERROR` con links invalidos.
- [ ] Crear comunidad con `is_accepted_terms=true`.
- [ ] Error `400 TERMS_NOT_ACCEPTED`.
- [ ] Error `409 DUPLICATE_COMMUNITY_NAME`.
- [ ] Flujo solicitud de evento a comunidad y aprobacion owner.
- [ ] Flujo baneo/desbaneo con endpoints admin.
- [ ] Bloqueo de mutacion por `USER_BANNED`.
