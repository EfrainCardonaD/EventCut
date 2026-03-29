# Guía Frontend – Auth Service (FastAPI)

Esta guía documenta **todo el flujo de autenticación** y endpoints para que el frontend integre:
- Registro y verificación de email
- Login
- Refresh token (renovación de sesión)
- Logout
- Obtener usuario actual (`/me`)
- Recuperación de contraseña
- Consideraciones de RBAC (roles)

> Base URL local: `http://127.0.0.1:8000`
>
> Prefijo API: **`/api`**

---

## 1) Convenciones generales

### 1.1 Formato estándar de respuesta
La API responde con un wrapper consistente (`RestResponse`). Ejemplo:

```json
{
  "success": true,
  "message": "...",
  "data": { }
}
```

En errores, FastAPI puede responder con el formato estándar:

```json
{ "detail": "..." }
```

### 1.2 Headers
- JSON:
  - `Content-Type: application/json`
- Endpoints protegidos:
  - `Authorization: Bearer <ACCESS_TOKEN>`

### 1.3 Tokens
El backend emite **dos tokens**:
- `token` → *Access token* (corto) para autorizar requests.
- `refreshToken` → *Refresh token* (largo) para renovar sesión.

> Importante: **no intercambiar** tokens.
> - El access token se usa en `Authorization`.
> - El refresh token se envía en `Authorization` al endpoint `/auth/refresh`.

### 1.4 Roles (RBAC)
El backend utiliza roles estilo Spring Security:
- `ROLE_ADMIN`
- `ROLE_SECURITY_ADMIN`
- `ROLE_USER`

En el frontend normalmente se presenta como `ADMIN/SECURITY_ADMIN/USER`, pero el backend guarda y valida internamente con prefijo `ROLE_`.

Rutas protegidas de ejemplo:
- `GET /api/users` requiere `ROLE_ADMIN` o `ROLE_SECURITY_ADMIN`
- `PATCH /api/users/{user_id}/role` requiere `ROLE_ADMIN`

---

## 2) Flujo recomendado de autenticación (Frontend)

Checklist de implementación:
1. **Register** → `POST /api/auth/register`
2. Usuario recibe email de verificación (si correo habilitado) y confirma con token:
   - `POST /api/auth/verify/email/confirm`
3. **Login** → `POST /api/auth/login` (hasta verificar email, login puede fallar)
4. Guardar tokens:
   - Guardar `accessToken` en memoria (recomendado) o almacenamiento seguro.
   - Guardar `refreshToken` en almacenamiento seguro (idealmente httpOnly cookie; si no, usar storage controlado).
5. En cada request protegida:
   - enviar `Authorization: Bearer <accessToken>`
6. Si el backend responde 401 por expiración:
   - llamar **refresh** y reintentar request original.
7. **Logout** → `POST /api/auth/logout`

---

## 3) Endpoints de Auth

### 3.1 Registrar usuario
**POST** ` /api/auth/register`

Request:
```json
{
  "username": "juan.perez",
  "email": "juan.perez@universidad.edu.mx",
  "password": "MiContraseña2026!",
  "firstName": "Juan",
  "lastName": "Pérez"
}
```

Reglas relevantes:
- `username`: 3–50 caracteres
- `password`: 8–128 y debe ser fuerte (mayúsculas, minúsculas, número y símbolo; ver validación en backend)

Response (201):
```json
{
  "success": true,
  "message": "Usuario registrado. Revisa tu correo para verificar tu cuenta.",
  "data": {
    "id": "<uuid>",
    "username": "juan.perez",
    "email": "juan.perez@universidad.edu.mx"
  }
}
```

Notas:
- El backend intenta enviar correo de verificación, pero **no bloquea** el registro si falla el SMTP.

---

### 3.2 Reenviar verificación de email
**POST** `/api/auth/verify/email/resend?email=<email>`

Ejemplo:
```
POST /api/auth/verify/email/resend?email=juan.perez@universidad.edu.mx
```

Response (200):
```json
{
  "success": true,
  "message": "Si el correo existe y no está verificado, se ha enviado un nuevo enlace.",
  "data": null
}
```

Notas de seguridad:
- Responde 200 aunque el email no exista (evita enumeración).

---

### 3.3 Confirmar verificación de email
**POST** `/api/auth/verify/email/confirm`

Request:
```json
{
  "token": "<TOKEN_DEL_CORREO>"
}
```

Response (200):
```json
{
  "success": true,
  "message": "Email verificado exitosamente. Ya puedes iniciar sesión.",
  "data": null
}
```

---

### 3.4 Login
**POST** `/api/auth/login`

Request:
```json
{
  "username": "juan.perez",
  "password": "MiContraseña2026!"
}
```

Notas:
- El campo `username` acepta **username o email**.

Response (200):
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "data": {
    "token": "<ACCESS_TOKEN>",
    "refreshToken": "<REFRESH_TOKEN>",
    "user": {
      "id": "<uuid>",
      "username": "juan.perez",
      "email": "juan.perez@universidad.edu.mx",
      "firstName": "Juan",
      "lastName": "Pérez",
      "role": "USER",
      "enabled": true,
      "emailVerified": true
    }
  }
}
```

---

### 3.5 Obtener usuario actual (2 variantes)

#### Variante A: `GET /api/auth/me`
**GET** `/api/auth/me`

Header:
```
Authorization: Bearer <ACCESS_TOKEN>
```

Response (200):
```json
{
  "success": true,
  "message": "Usuario autenticado",
  "data": {
    "id": "<uuid>",
    "username": "juan.perez",
    "email": "juan.perez@universidad.edu.mx",
    "firstName": "Juan",
    "lastName": "Pérez",
    "role": "USER",
    "enabled": true,
    "emailVerified": true
  }
}
```

#### Variante B: `GET /api/users/me`
Misma respuesta/uso. Puedes unificar en frontend usando solo una.

---

### 3.6 Refresh token (renovar sesión)
**POST** `/api/auth/refresh`

Header:
```
Authorization: Bearer <REFRESH_TOKEN>
```

Response (200):
```json
{
  "success": true,
  "message": "Token renovado exitosamente",
  "data": {
    "token": "<NUEVO_ACCESS_TOKEN>",
    "refreshToken": "<NUEVO_REFRESH_TOKEN>",
    "user": { "...": "..." }
  }
}
```

Notas:
- Si el refresh token fue revocado/expiró, responderá 401.
- Estrategia frontend recomendada:
  - si el access token expira → llamar refresh → actualizar tokens → reintentar request.

---

### 3.7 Logout
**POST** `/api/auth/logout`

Header:
```
Authorization: Bearer <ACCESS_TOKEN>
```

Response (200):
```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente",
  "data": null
}
```

Notas:
- El backend revoca el access token actual.
- Recomendación frontend: limpiar tokens locales.

---

## 4) Recuperación de contraseña

### 4.1 Solicitar email de recuperación
**POST** `/api/auth/forgot`

Request:
```json
{ "email": "juan.perez@universidad.edu.mx" }
```

Response (200):
```json
{
  "success": true,
  "message": "Si el correo existe y está verificado, se ha enviado un enlace de restablecimiento",
  "data": null
}
```

Notas de seguridad:
- Responde 200 siempre.

---

### 4.2 Confirmar reset de contraseña
**POST** `/api/auth/reset`

Request:
```json
{
  "token": "<TOKEN_DEL_CORREO>",
  "newPassword": "NuevaContraseña2026!"
}
```

Response (200):
```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente",
  "data": null
}
```

---

## 5) Endpoints de usuarios (para UI de administración)

### 5.1 Listar usuarios (admin / security admin)
**GET** `/api/users?limit=50&offset=0`

Header:
```
Authorization: Bearer <ACCESS_TOKEN>
```

Access control:
- Requiere `ROLE_ADMIN` o `ROLE_SECURITY_ADMIN`

Response:
- `data`: lista de `UserResponse`

---

### 5.2 Actualizar rol de un usuario (solo admin)
**PATCH** `/api/users/{user_id}/role`

Header:
```
Authorization: Bearer <ACCESS_TOKEN>
```

Request:
```json
{ "role": "ADMIN" }
```

Notas:
- El backend normaliza a `ROLE_ADMIN`.
- Requiere `ROLE_ADMIN`.

---

## 6) Manejo de errores recomendado (Frontend)

### 6.1 Códigos típicos
- `400`: request inválido (token inválido, validación)
- `401`: no autenticado (token faltante/expirado/revocado)
- `403`: autenticado pero sin permisos
- `409`: conflicto (usuario/email ya existe) *(si el backend lo devuelve en esos casos)*
- `500`: error interno (reportar)

### 6.2 Interceptor / middleware HTTP (ejemplo de lógica)
Pseudo-flujo:
1. Request → agrega `Authorization` con access token.
2. Si response 401:
   - intenta refresh (una sola vez)
   - si refresh ok → actualiza tokens → reintenta
   - si refresh falla → redirige a login y limpia sesión

---

## 7) OpenAPI / Swagger

La documentación viva está en:
- Swagger UI: `http://127.0.0.1:8000/docs`
- OpenAPI JSON: `http://127.0.0.1:8000/openapi.json`

---

## 8) Checklist de integración

- [ ] Pantalla de registro con validaciones (password fuerte)
- [ ] Pantalla de “verifica tu correo” + resend
- [ ] Pantalla de login
- [ ] Guardado seguro de tokens + estrategia de refresh
- [ ] Logout
- [ ] Pantalla de perfil (GET /auth/me o /users/me)
- [ ] Recuperación de contraseña (forgot/reset)
- [ ] (Opcional) UI Admin: listar usuarios, actualizar roles

