# Operacion y despliegue

## Requisitos
- Python 3.11+
- MySQL 8+
- `auth-service` activo

## Variables de entorno
Archivo recomendado: `events_service/.env`

| Variable | Default | Descripcion |
|---|---|---|
| `APP_NAME` | `events-service` | Nombre de servicio |
| `APP_ENV` | `dev` | Entorno de ejecucion |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Origenes CORS |
| `TRUSTED_HOSTS` | `localhost,127.0.0.1` | Hosts permitidos |
| `APP_FORCE_HTTPS` | `false` | Fuerza redireccion HTTPS |
| `JWT_SECRET_KEY` | `change-me` | Secreto JWT compartido con auth-service |
| `JWT_ISSUER` | `microservices-app` | Issuer JWT compartido |
| `AUTH_SERVICE_BASE_URL` | `http://127.0.0.1:8000` | Base URL de auth-service |
| `APP_GATEWAY_SECRET` | `default-secret-change-me` | Secreto para endpoint interno en auth-service |
| `AUTH_REMOTE_VALIDATION_ENABLED` | `true` | Habilita introspeccion remota de usuario |
| `MYSQL_HOST` | `localhost` | Host MySQL |
| `MYSQL_PORT` | `3306` | Puerto MySQL |
| `MYSQL_DB` | `eventcut_events_db` | Schema dedicado de eventos |
| `MYSQL_USER` | `root` | Usuario MySQL |
| `MYSQL_PASSWORD` | `root` | Password MySQL |
| `MYSQL_POOL_SIZE` | `20` | Pool base SQLAlchemy |
| `MYSQL_MAX_OVERFLOW` | `10` | Overflow del pool |

## Levantar en local
1) Copiar configuracion:

```powershell
Copy-Item "events_service/.env.example" "events_service/.env"
```

2) Crear schema si no existe:

```powershell
python -c "import pymysql; c=pymysql.connect(host='localhost',port=3306,user='root',password='sasa',autocommit=True); cur=c.cursor(); cur.execute('CREATE DATABASE IF NOT EXISTS eventcut_events_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'); cur.close(); c.close()"
```

3) Ejecutar migraciones:

```powershell
alembic -c "events_service/alembic.ini" upgrade head
```

4) Seed de categorias:

```powershell
python -c "from events_service.app.db.session import SessionLocal; from events_service.app.db.init_db import seed_categories; db=SessionLocal(); print(seed_categories(db)); db.close()"
```

5) Arrancar servicio:

```powershell
uvicorn events_service.main:app --host 127.0.0.1 --port 8001 --reload
```

## Integracion obligatoria con auth-service
En `auth-service` debe existir endpoint interno:
- `GET /api/internal/auth/me`
- Protegido por header `X-Gateway-Secret`

El `events_service` lo usa cuando `AUTH_REMOTE_VALIDATION_ENABLED=true`.

## Verificaciones operativas

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8001/" -Method Get
Invoke-RestMethod -Uri "http://127.0.0.1:8001/api/health" -Method Get
Invoke-RestMethod -Uri "http://127.0.0.1:8001/api/v1/categories" -Method Get
Invoke-RestMethod -Uri "http://127.0.0.1:8001/api/v1/events?limit=5" -Method Get
```

## Pruebas automatizadas

```powershell
python -m pytest "events_service/tests" -q
```

Suite actual: filtros de calendario, permisos y favoritos.

## CI/CD recomendado
Pipeline minimo:
1. Instalar dependencias.
2. Correr tests `events_service/tests`.
3. Ejecutar migraciones `alembic upgrade head` sobre entorno destino.
4. Desplegar aplicacion.

## Runbook de incidentes
### 1) `503 Auth-service no disponible para validacion`
- Verificar que `AUTH_SERVICE_BASE_URL` sea correcto.
- Verificar que `auth-service` responda `GET /api/internal/auth/me`.
- Verificar `APP_GATEWAY_SECRET` compartido.

### 2) `401 Token invalido`
- Revisar `JWT_SECRET_KEY` y `JWT_ISSUER` en ambos servicios.
- Verificar expiracion del access token.

### 3) `500` al consultar categorias o eventos
- Confirmar migraciones aplicadas (`alembic current`).
- Verificar que el schema `MYSQL_DB` exista y sea el correcto.

### 4) Mismatch de entorno por `.env`
El servicio lee `.env` y `events_service/.env`. Mantener valores de `events_service/.env` como fuente de verdad para este servicio.

