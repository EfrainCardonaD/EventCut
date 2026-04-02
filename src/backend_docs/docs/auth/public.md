# Auth Service — Público / General

Base path: `/api`

## Health

### `GET /api/health`
Liveness simple del servicio.

**Respuesta (ejemplo):**
```json
{ "status": "ok" }
```

---

## Registro

### `POST /api/auth/register`
Crea un usuario y dispara (si está habilitado) correo de verificación.

**Body (JSON):**
```json
{
  "username": "juan.perez",
  "email": "juan.perez@universidad.edu.mx",
  "password": "MiContraseña2026!",
  "firstName": "Juan",
  "lastName": "Pérez"
}
```

**Respuestas:**
- `201` creado
- `422` validación

---

## Login

### `POST /api/auth/login`
Autentica un usuario y devuelve `token` + `refreshToken`.

> `username` suele aceptar **username o email** (ver README del repo).

**Body (JSON, según `test_auth.http`):**
```json
{
  "username": "juan.perez",
  "password": "MiContraseña2026!"
}
```

**Body (form-url-encoded, usado en `events_service/test_communities.http`):**

```text
username=juan.perez@universidad.edu.mx&password=MiContraseña2026!
```

**Respuestas:**
- `200` OK
- `401` credenciales inválidas / usuario inactivo / email no verificado (según reglas de negocio)

---

## Verificación de email

Ruta base: `/api/auth/verify`

### `POST /api/auth/verify/email/resend?email=...`
Reenvía token de verificación si el correo existe y no está verificado.

**Respuestas:**
- `200` siempre (no filtra existencia para evitar enumeración)

### `POST /api/auth/verify/email/confirm`
Confirma token de verificación.

**Body:**
```json
{ "token": "PEGAR_TOKEN_AQUI" }
```

**Respuestas:**
- `200` verificado
- `400/422` token inválido/expirado

---

## Recuperación de contraseña

### `POST /api/auth/forgot`
Envía enlace/token de recuperación si el email existe y está verificado.

**Body:**
```json
{ "email": "juan.perez@universidad.edu.mx" }
```

**Respuestas:**
- `200` siempre (anti-enumeración)

### `POST /api/auth/reset`
Resetea contraseña usando token.

**Body:**
```json
{
  "token": "PEGAR_RESET_TOKEN_AQUI",
  "newPassword": "NuevaContraseña2026!"
}
```

**Respuestas:**
- `200` contraseña actualizada
- `400/422` token inválido/expirado

