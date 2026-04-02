# Tests de Integracion - Modulo de Comunidades

> Fecha de ejecucion: 2026-04-01  
> Servicios probados: Auth (`8000`) y Events (`8001`)  
> Resultado global: `19/19` PASS

## 1) Objetivo

Validar contrato funcional de comunidades, solicitudes evento-comunidad, permisos admin y baneo de usuarios.

## 2) Precondiciones

- Auth Service disponible en `http://127.0.0.1:8000`.
- Events Service disponible en `http://127.0.0.1:8001`.
- Tokens validos para:
  - Usuario normal.
  - Usuario con rol admin.

## 3) Casos ejecutados

| # | Caso | Endpoint | Resultado esperado |
|---|---|---|---|
| 1 | Crear comunidad (usuario) | `POST /api/v1/communities` | `201`, comunidad `PENDING` |
| 2 | Listar comunidades publicas antes de aprobar | `GET /api/v1/communities` | `200`, lista sin comunidad `PENDING` |
| 3 | Admin lista pendientes | `GET /api/v1/admin/communities?status=PENDING` | `200`, incluye comunidad |
| 4 | Admin activa comunidad | `PATCH /api/v1/admin/communities/{id}/status` | `200`, estado `ACTIVE` |
| 5 | Listado publico post-aprobacion | `GET /api/v1/communities` | `200`, comunidad visible |
| 6 | Crear evento con `social_links` y `community_id` | `POST /api/v1/events` | `201`, evento creado + solicitud `PENDING` |
| 7 | Owner lista solicitudes | `GET /api/v1/communities/{id}/requests?status=PENDING` | `200`, solicitud visible |
| 8 | Schedule antes de aprobar solicitud | `GET /api/v1/communities/{id}/events` | `200`, sin eventos |
| 9 | Owner aprueba solicitud | `PATCH /api/v1/communities/{id}/requests/{request_id}` | `200`, solicitud `APPROVED` |
| 10 | Schedule despues de aprobar | `GET /api/v1/communities/{id}/events` | `200`, evento visible |
| 11 | Admin banea usuario | `POST /api/v1/admin/users/{user_id}/ban` | `200`, baneo activo |
| 12 | Listar baneados | `GET /api/v1/admin/users/banned` | `200`, usuario en lista |
| 13 | Usuario baneado crea evento | `POST /api/v1/events` | `403`, `USER_BANNED` |
| 14 | Admin desbanea usuario | `DELETE /api/v1/admin/users/{user_id}/ban` | `200` |
| 15 | Usuario desbaneado crea evento | `POST /api/v1/events` | `201` |
| 16 | Crear comunidad sin aceptar terminos | `POST /api/v1/communities` | `400`, `TERMS_NOT_ACCEPTED` |
| 17 | Crear comunidad con nombre duplicado | `POST /api/v1/communities` | `409`, `DUPLICATE_COMMUNITY_NAME` |
| 18 | Usuario sin rol admin cambia estado | `PATCH /api/v1/admin/communities/{id}/status` | `403`, `FORBIDDEN` |
| 19 | Social link invalido | `POST /api/v1/communities` | `422`, `VALIDATION_ERROR` |

## 4) Validaciones puntuales confirmadas

- El contrato de respuesta usa `ApiResponse` (`success`, `message`, `data`).
- En listado de solicitudes de comunidad, el campo correcto es `request_id` (no `id`).
- Mensaje de listado de comunidades segun backend: `"Comunidades obtenidas"`.
- Baneo bloquea mutaciones protegidas en eventos/comunidades.
- Prefijos de `social_links` son validados por backend.

## 5) Evidencia de resultado

| Metricas | Valor |
|---|---:|
| Total tests | 19 |
| Exitosos | 19 |
| Fallidos | 0 |
| Cobertura funcional objetivo | 100% |

## 6) Riesgos residuales

- No cubre carga concurrente (race conditions) en solicitudes duplicadas.
- No cubre pruebas de performance ni resiliencia de servicios externos.
- No cubre expiracion de token durante flujos largos.
