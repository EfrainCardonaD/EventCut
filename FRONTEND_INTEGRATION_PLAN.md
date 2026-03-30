# Plan de Integracion Frontend (Events Service)

## Objetivo
Alinear el frontend con el nuevo contrato de respuestas del `events_service`:

- Exito: `{ "success": true, "message": "...", "data": ... }`
- Error: `{ "success": false, "message": "...", "data": { "code": "...", "details": ..., "trace_id": "..." } }`

Adicionalmente, considerar politica **fail-closed**: si la validacion remota con auth-service falla, endpoints protegidos responden error y no permiten operacion.

## 1) Cambios que impactan al frontend

### 1.1 Shape de exito (breaking change)
Antes varios endpoints retornaban payload plano. Ahora retornan envelope.

- `GET /api/health`
  - Antes: `{ "status": "ok" }`
  - Ahora: `{ "success": true, "message": "Servicio operativo", "data": { "status": "ok" } }`

- `GET /api/v1/categories`
  - Antes: `Category[]`
  - Ahora: `{ "success": true, "message": "Categorias obtenidas", "data": Category[] }`

- `GET /api/v1/events`
  - Antes: `{ "items": [...], "total": 1 }`
  - Ahora: `{ "success": true, "message": "Eventos obtenidos", "data": { "items": [...], "total": 1 } }`

- `GET /api/v1/events/{event_id}`, `POST`, `PATCH`, `POST favorite`, `POST image-upload-url`
  - Ahora retornan envelope `success/message/data`.

- `DELETE /api/v1/events/{event_id}`
  - Se mantiene `204 No Content` (sin body).

### 1.2 Shape de error (breaking change)
Antes: `{"detail":"..."}`.
Ahora: envelope de error con `code`, `details`, `trace_id`.

## 2) Integracion recomendada en frontend

### 2.1 Adapter unico de HTTP
Centralizar parseo de respuestas para no tocar cada pantalla.

Reglas:
1. Si status es `204`, retornar `null`.
2. Si response contiene `success` y `data`, devolver `response.data.data` como payload de negocio.
3. Si response no contiene envelope (compatibilidad temporal), devolver `response.data` tal cual.
4. En error, leer en orden:
   - `error.response.data.message`
   - `error.response.data.data.code`
   - `error.response.data.data.details`
   - `error.response.data.data.trace_id`

### 2.2 Propagacion de trace id
- Enviar `X-Trace-Id` desde frontend por request (UUID).
- Si backend responde `X-Trace-Id`, registrarlo en logs/telemetria del cliente.
- Mostrar `trace_id` en UI de error tecnico para soporte.

### 2.3 Mapeo UX por codigo
Mapa sugerido de errores backend -> UX frontend:

- `TOKEN_EXPIRED`: redirigir a login + mensaje "Tu sesion expiro".
- `TOKEN_INVALID`: limpiar sesion + login.
- `FORBIDDEN`: toast "No tienes permisos para esta accion".
- `AUTH_UNAVAILABLE`: pantalla/toast "Servicio de autenticacion no disponible" + retry.
- `VALIDATION_ERROR`: mostrar errores de campos desde `details`.
- `EVENT_NOT_FOUND`: mensaje de recurso no encontrado + volver al listado.

## 3) Plan de migracion por fases

### Fase 0: Preparacion (1 dia)
- Implementar adapter HTTP unico.
- Agregar utilidades para `message/code/details/trace_id`.
- Instrumentar logs de errores por endpoint.

### Fase 1: Lecturas (1-2 dias)
- Migrar consumo de:
  - `GET /api/health`
  - `GET /api/v1/categories`
  - `GET /api/v1/events`
  - `GET /api/v1/events/{id}`
- Ajustar listas y detalle para leer `data` interno.

### Fase 2: Escrituras (1-2 dias)
- Migrar:
  - `POST /api/v1/events`
  - `PATCH /api/v1/events/{id}`
  - `DELETE /api/v1/events/{id}`
  - `POST /api/v1/events/{id}/favorite`
  - `POST /api/v1/events/image-upload-url`
- Asegurar manejo de `204` en delete.

### Fase 3: Errores y auth (1 dia)
- Implementar mapeo UX por `code`.
- Manejar `503 AUTH_UNAVAILABLE` para modo fail-closed.
- Pruebas de expiracion de token y token invalido.

### Fase 4: Cierre (0.5-1 dia)
- QA completo.
- Revisar telemetria y errores de parseo.
- Remover fallback legacy si no hay incidencias.

## 4) Checklist QA frontend
- [ ] Listado de eventos renderiza correctamente.
- [ ] Filtros (`month`, `week_start`, `from/to`) funcionan.
- [ ] Crear/editar/eliminar evento reflejan cambios en UI.
- [ ] Favoritos alterna estado visual y backend.
- [ ] Errores de validacion muestran mensajes utiles.
- [ ] Auth expirada invalida sesion y redirige.
- [ ] `AUTH_UNAVAILABLE` muestra mensaje y opcion de reintento.
- [ ] `trace_id` visible en logs de errores.

## 5) Riesgos y rollback
- Riesgo principal: componentes que asumen payload plano.
- Mitigacion: adapter unico + fallback temporal legacy.
- Rollback rapido: habilitar parser legacy en adapter por feature flag.

## 6) Criterio de done
- 100% de llamados del modulo eventos pasan por adapter.
- 0 errores de parseo de contrato en consola/telemetria.
- Flujos CRUD + favoritos + errores criticos validados por QA.

