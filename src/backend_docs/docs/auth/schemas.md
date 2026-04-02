# Auth Service — Esquemas (resumen)

> Esta sección resume DTOs principales; para detalle exacto ver `app/schemas/*`.

## Auth
- `RegisterRequest`: username, email, password, firstName, lastName
- `TokenPairData`: token, refreshToken, user
- `LoginRequest`: username, password

## Verify
- `VerifyEmailConfirmRequest`: token

## Password recovery
- `ForgotPasswordRequest`: email
- `ResetPasswordRequest`: token, newPassword

## Users
- `UpdateUserRoleRequest`: role (ej: `SECURITY_ADMIN`)
- `CurrentUser`, `UserResponse`, `UserSummaryResponse`

