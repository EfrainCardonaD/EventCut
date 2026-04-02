# Guía de Validación de Formularios en Frontend

Para mantener una sincronía entre el frontend y el backend al momento de crear o actualizar eventos, se deben implementar las siguientes reglas de validación en el formulario (por ejemplo utilizando Yup, Zod, React Hook Form, Formik u otro motor de validación en el cliente):

## Reglas de Validación para Eventos

### `title` (Título del Evento)
- **Tipo:** String
- **Requerido:** Sí.
- **Minimo:** 3 caracteres. (Mostrar error: "El título debe tener al menos 3 caracteres")
- **Máximo:** 150 caracteres. (Mostrar error: "El título no puede exceder los 150 caracteres")

### `description` (Descripción)
- **Tipo:** String
- **Requerido:** Sí.
- **Mínimo:** 5 caracteres. (Mostrar error: "La descripción es muy corta. Debe tener al menos 5 caracteres")
- **Máximo:** 5000 caracteres. (Mostrar error: "La descripción es demasiado larga (máx. 5000 caracteres)")

### `location` (Lugar / Ubicación)
- **Tipo:** String
- **Requerido:** Sí.
- **Mínimo:** 2 caracteres. (Mostrar error: "La ubicación es muy corta")
- **Máximo:** 200 caracteres. (Mostrar error: "La ubicación excede el límite de 200 caracteres")

### `category_id` (Categoría)
- **Tipo:** Número entero
- **Requerido:** Sí.
- **Regla Front:** Debe ser seleccionada una opción válida de la lista cargada desde `/api/v1/categories`. (Mostrar error: "Debes seleccionar una categoría")

### `start_datetime` (Fecha y Hora de Inicio)
- **Tipo:** DateTime (ISO)
- **Requerido:** Sí.
- **Regla Front:** Debe ser una fecha válida. Según la lógica de negocio suele requerirse que no sea un pasado distante (en backend no menor al año 2000), aunque en frontend se sugiere validar que sea mayor o igual a "hoy" para eventos futuros. (Mostrar error: "Debes ingresar una fecha de inicio válida")

### `end_datetime` (Fecha y Hora de Finalización)
- **Tipo:** DateTime (ISO)
- **Requerido:** Sí.
- **Regla Front 1:** Debe ser estrictamente superior a `start_datetime`. (Mostrar error: "La fecha de fin debe ser posterior a la de inicio")
- **Regla Front 2:** La diferencia entre la fecha de fin y la de inicio no debe ser superior a 30 días seguidos. (Mostrar error: "El evento no puede durar más de 30 días consecutivos")

### `image_url` (Imagen)
- **Tipo:** String (URL)
- **Requerido:** Opcional (pero se usa el flujo pre-firmado).
- **Máximo:** 255 caracteres.
- **Regla Front:** Si se envía una URL, el backend validará que el dominio concuerde con el autorizado (host público del CDN provisto para la app). En frontend simplemente hay que asegurarse de no sobreescribir este valor manualmente, sino usar el resultado devuelto al subir la imagen.


## Manejo de Respuesta 422 - Error de Validación en el Backend

El backend ha sido actualizado para que frente a errores devueltos por `Pydantic` o las reglas de validación en los esquemas, este retorne un código de estado `HTTP 422`, e incluya un mensaje amigable compuesto por los campos que fallaron, junto con la información original:

**Ejemplo de respuesta robusta:**

```json
{
  "success": false,
  "message": "Errores de validación: description: El texto debe tener al menos 5 caracteres. | end_datetime: end_datetime debe ser mayor a start_datetime.",
  "data": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
         "type": "string_too_short",
         "loc": ["body", "description"],
         "msg": "El texto debe tener al menos 5 caracteres.",
         "input": "sdfg",
         "ctx": {"min_length": 5}
      }
    ],
    "trace_id": "2d3201b5-5a48-4095-a119-00bbc4cc3634"
  }
}
```

- `USER_BANNED`
