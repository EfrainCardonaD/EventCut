# Guia de integracion frontend: imagenes de eventos

## Objetivo
Esta guia describe como integrar imagenes en eventos sin cambiar el contrato actual del frontend.

El backend ahora usa una estrategia en dos fases:
1. Subida temporal a `events/pending/...`.
2. Confirmacion al persistir el evento (promocion a `events/...`).

Con esto se mejora la consistencia entre bucket y base de datos.

## Contrato vigente (sin migracion)
No cambian los endpoints ni el campo principal:
- `POST /api/v1/events/image-upload-url`
- `POST /api/v1/events`
- `PATCH /api/v1/events/{event_id}`
- Campo `image_url` en create/update

El frontend puede seguir igual.

## Flujo recomendado

### 1) Solicitar URL de carga
`POST /api/v1/events/image-upload-url?content_type=image/png`

Respuesta esperada:
- `upload_url`: URL prefirmada para PUT del binario
- `file_key`: clave temporal (`events/pending/...`)
- `public_url`: URL que debes enviar como `image_url` en create/update

### 2) Subir binario al bucket
Subir la imagen por `PUT` a `upload_url` con el mismo `Content-Type` solicitado.

### 3) Crear o actualizar evento
Enviar `image_url = public_url` en:
- `POST /api/v1/events`
- `PATCH /api/v1/events/{event_id}`

Si el payload es valido, backend promueve la imagen a `events/...` y persiste el evento.

## Comportamiento ante errores

### Error 422 de validacion
Si create/update falla por validacion (por ejemplo, descripcion demasiado corta), backend intenta limpiar la imagen temporal (`events/pending/...`) en el handler de validacion.

Notas:
- La limpieza es best effort.
- Si por latencia/fallo de storage no se logra borrar en ese instante, se recomienda una politica TTL/lifecycle en bucket para `events/pending/`.

### Error al persistir BD despues de promover
Si backend ya promovio imagen y falla `commit`, se ejecuta compensacion para borrar la imagen promovida y evitar huerfanos.

## Reglas de UX recomendadas
- Tratar la carga de imagen como paso previo al submit del formulario.
- Si el submit devuelve 422, mostrar error de campo y permitir reintento.
- En reintento, pedir nueva URL de carga y volver a subir archivo (evita usar URLs vencidas).

## Checklist rapido QA frontend
- [ ] Crear evento con imagen valida.
- [ ] Editar evento reemplazando imagen.
- [ ] Editar evento enviando `image_url: null` para eliminar imagen.
- [ ] Forzar 422 en create/update y verificar que no queden archivos permanentes.
- [ ] Reintentar submit tras 422 con nueva subida.

## Ejemplo rapido (PowerShell)
```powershell
$base = "http://127.0.0.1:8001"
$token = "<ACCESS_TOKEN>"
$headers = @{ Authorization = "Bearer $token" }

# 1) Pedir URL de carga
$upload = Invoke-RestMethod -Uri "$base/api/v1/events/image-upload-url?content_type=image/png" -Method Post -Headers $headers

# 2) Subir archivo
Invoke-RestMethod -Uri $upload.data.upload_url -Method Put -ContentType "image/png" -InFile ".\banner.png"

# 3) Crear evento con image_url devuelta
$body = @{
  title = "Taller Backend"
  description = "Sesion tecnica de integracion"
  image_url = $upload.data.public_url
  start_datetime = "2026-06-05T15:00:00Z"
  end_datetime = "2026-06-05T18:00:00Z"
  location = "Sala 4"
  category_id = 2
} | ConvertTo-Json

Invoke-RestMethod -Uri "$base/api/v1/events" -Method Post -Headers $headers -ContentType "application/json" -Body $body
```

