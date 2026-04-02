# Auth Service — Ejemplos (basados en `test_auth.http`)

> Estos ejemplos están alineados a los archivos `.http` del repo.

## Health

```http
GET http://127.0.0.1:8000/api/health
Accept: application/json
```

## Register

```http
POST http://127.0.0.1:8000/api/auth/register
Content-Type: application/json

{
  "username": "juan.perez",
  "email": "juan.perez@universidad.edu.mx",
  "password": "MiContraseña2026!",
  "firstName": "Juan",
  "lastName": "Pérez"
}
```

## Login

```http
POST http://127.0.0.1:8000/api/auth/login
Content-Type: application/json

{
  "username": "juan.perez",
  "password": "MiContraseña2026!"
}
```

## Refresh

```http
POST http://127.0.0.1:8000/api/auth/refresh
Authorization: Bearer <REFRESH_TOKEN>
```

## Logout

```http
POST http://127.0.0.1:8000/api/auth/logout
Authorization: Bearer <ACCESS_TOKEN>
```

## Internal get user (gateway secret)

```http
GET http://127.0.0.1:8000/api/internal/users/<USER_UUID>
X-Gateway-Secret: default-secret-change-me
```

