# Seguridad

## Autenticacion en endpoints protegidos
Los endpoints de escritura (`POST`, `PATCH`, `DELETE`, `favorite`) usan:
1. JWT local (`HS256`) con `JWT_SECRET_KEY` y `JWT_ISSUER`.
2. Validacion de claims requeridos: `sub`, `username`, `email`, `role`.
3. Tipo de token: solo `access`.

## Validacion remota con gateway
Si `AUTH_REMOTE_VALIDATION_ENABLED=true`, se consulta `auth-service` con:
- `Authorization: Bearer <token>`
- `X-Gateway-Secret: <APP_GATEWAY_SECRET>`

Endpoint remoto esperado:
- `GET /api/internal/auth/me`

Beneficio:
- Permite bloquear acciones si usuario no existe o esta inactivo en auth-service.

## Matriz de permisos
| Endpoint | Publico | ROLE_USER | ROLE_ADMIN | ROLE_SECURITY_ADMIN |
|---|---:|---:|---:|---:|
| `GET /api/v1/categories` | Si | Si | Si | Si |
| `GET /api/v1/events` | Si | Si | Si | Si |
| `GET /api/v1/events/{id}` | Si | Si | Si | Si |
| `POST /api/v1/events` | No | Si | Si | Si |
| `PATCH /api/v1/events/{id}` | No | Solo owner | Si | Si |
| `DELETE /api/v1/events/{id}` | No | Solo owner | Si | Si |
| `POST /api/v1/events/{id}/favorite` | No | Si | Si | Si |

## Hardening recomendado
- Cambiar secretos por defecto (`JWT_SECRET_KEY`, `APP_GATEWAY_SECRET`).
- Usar TLS y `APP_FORCE_HTTPS=true` en produccion.
- Limitar `CORS_ALLOWED_ORIGINS` y `TRUSTED_HOSTS` al dominio real.
- Mantener expiracion corta de access token en auth-service.
- Rotar secretos periodicamente.

## Controles de integridad
- PK compuesta en favoritos evita duplicados por usuario-evento.
- FK con `ON DELETE CASCADE` limpia favoritos de eventos borrados.
- `score` calculado por agregacion evita condiciones de carrera por contadores manuales.

