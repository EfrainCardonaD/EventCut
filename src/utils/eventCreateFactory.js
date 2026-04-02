import eventsApi from '@/utils/eventsApi'
import { getApiPayload } from '@/utils/apiFactory'
import { toEventCategoryId, validateEventImageUrlLength } from '@/utils/eventFormValidation'
import { normalizeSocialLinksPayload } from '@/utils/socialLinks'

export const ALLOWED_EVENT_IMAGE_TYPES = Object.freeze([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
])

export const isAllowedEventImageType = (fileType) => {
  return ALLOWED_EVENT_IMAGE_TYPES.includes(fileType)
}

const assertEventImageFile = (file) => {
  if (!file) {
    throw new Error('Debes seleccionar una imagen antes de crear el evento.')
  }

  if (!isAllowedEventImageType(file.type)) {
    throw new Error('Formato de imagen no permitido. Usa JPEG, PNG, WEBP, GIF o AVIF.')
  }
}

// `eventsApi` ya incluye la base configurada por `VITE_EVENTS_API_BASE_URL`
// (por ejemplo: http://127.0.0.1:8001). Aquí debemos usar rutas relativas.
const signedUploadPathCandidates = [
  import.meta.env.VITE_EVENTS_UPLOAD_PATH || '/api/v1/events/image-upload-url',
  '/v1/events/image-upload-url',
].filter(Boolean)

const createEventPathCandidates = [
  import.meta.env.VITE_EVENTS_CREATE_PATH || '/api/v1/events',
  '/v1/events',
  '/api/v1/events',
].filter(Boolean)

const updateEventPathTemplateCandidates = [
  import.meta.env.VITE_EVENTS_UPDATE_PATH_TEMPLATE || '/api/v1/events/{event_id}',
  '/v1/events/{event_id}',
  '/api/v1/events/{event_id}',
].filter(Boolean)

const uniquePaths = (paths) => [...new Set(paths)]

const requestWithFallbackPaths = async (method, paths, body, config = {}) => {
  const dedupedPaths = uniquePaths(paths)
  let lastError = null

  for (const path of dedupedPaths) {
    try {
      if (method === 'post') return await eventsApi.post(path, body, config)
      if (method === 'patch') return await eventsApi.patch(path, body, config)
      throw new Error(`Metodo no soportado para fallback: ${method}`)
    } catch (error) {
      const status = error?.response?.status
      if (status !== 404) throw error
      lastError = error
    }
  }

  if (lastError) throw lastError
  throw new Error('No se encontro una ruta valida para completar la operacion.')
}

const extractSignedUploadUrls = (responseData) => {
  const source = responseData || {}
  const uploadUrl = source.upload_url || source.uploadUrl || null
  const publicUrl = source.public_url || source.publicUrl || null

  if (!uploadUrl || !publicUrl) {
    throw new Error('La API no devolvio upload_url y public_url para la imagen del evento.')
  }

  return { uploadUrl, publicUrl }
}

export const requestEventImageUploadUrl = async ({ fileType, fileName } = {}) => {
  if (!fileType) {
    throw new Error('No se pudo determinar el Content-Type de la imagen para firmar la subida.')
  }

  const signaturePayload = {
    content_type: fileType,
    file_name: fileName || undefined,
  }

  const response = await requestWithFallbackPaths('post', signedUploadPathCandidates, signaturePayload, {
    params: {
      content_type: fileType,
    },
  })

  return extractSignedUploadUrls(getApiPayload(response))
}

export const uploadEventImageToCloudflare = async ({ uploadUrl, file }) => {
  if (!uploadUrl) throw new Error('No existe una URL firmada para subir la imagen.')
  assertEventImageFile(file)

  // El PUT usa exactamente el mismo MIME firmado para evitar 403 por desajuste.
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  })

  if (!response.ok) {
    throw new Error(`Fallo la subida de imagen (HTTP ${response.status}).`)
  }
}

export const registerEventWithImageUrl = async (payload) => {
  return requestWithFallbackPaths('post', createEventPathCandidates, payload)
}

const buildUpdatePathCandidates = (eventId) => {
  return updateEventPathTemplateCandidates.map((template) => template.replace('{event_id}', String(eventId)))
}

export const updateEventWithImageUrl = async (eventId, payload) => {
  return requestWithFallbackPaths('patch', buildUpdatePathCandidates(eventId), payload)
}

const normalizeEventRequestBody = (formPayload, imageUrlOverride) => {
  const categoryId = toEventCategoryId(formPayload?.category_id)
  if (!categoryId) {
    throw new Error('Debes seleccionar una categoria')
  }

  const imageUrlLengthError = validateEventImageUrlLength(imageUrlOverride)
  if (imageUrlLengthError) {
    throw new Error(imageUrlLengthError)
  }

  const socialLinks = normalizeSocialLinksPayload(formPayload?.social_links)

  const requestBody = {
    title: String(formPayload?.title || '').trim(),
    description: String(formPayload?.description || '').trim(),
    location: String(formPayload?.location || '').trim(),
    category_id: categoryId,
    start_datetime: formPayload.start_datetime,
    end_datetime: formPayload.end_datetime,
  }

  if (typeof imageUrlOverride !== 'undefined') {
    requestBody.image_url = imageUrlOverride
  }

  if (socialLinks) {
    requestBody.social_links = socialLinks
  }

  if (formPayload?.community_id) {
    requestBody.community_id = String(formPayload.community_id)
  }

  return requestBody
}

export const createEventWithSignedImageUpload = async (formPayload) => {
  assertEventImageFile(formPayload?.imageFile)

  const { uploadUrl, publicUrl } = await requestEventImageUploadUrl({
    fileType: formPayload.imageFile.type,
    fileName: formPayload.imageFile.name,
  })

  // Fase 2: subida directa al proveedor de almacenamiento con PUT y sin token.
  await uploadEventImageToCloudflare({
    uploadUrl,
    file: formPayload.imageFile,
  })

  const requestBody = normalizeEventRequestBody(formPayload, publicUrl)

  const response = await registerEventWithImageUrl(requestBody)

  return {
    response,
    publicUrl,
    createdEvent: getApiPayload(response) || null,
  }
}

export const updateEventWithSignedImageUpload = async (eventId, formPayload) => {
  const imageAction = formPayload?.imageAction || (formPayload?.imageFile ? 'replace' : 'keep')
  let imageUrlOverride

  if (imageAction === 'replace') {
    assertEventImageFile(formPayload?.imageFile)

    const { uploadUrl, publicUrl } = await requestEventImageUploadUrl({
      fileType: formPayload.imageFile.type,
      fileName: formPayload.imageFile.name,
    })

    await uploadEventImageToCloudflare({
      uploadUrl,
      file: formPayload.imageFile,
    })

    imageUrlOverride = publicUrl
  }

  if (imageAction === 'remove') {
    imageUrlOverride = null
  }

  const requestBody = normalizeEventRequestBody(formPayload, imageUrlOverride)
  const response = await updateEventWithImageUrl(eventId, requestBody)

  return {
    response,
    updatedEvent: getApiPayload(response) || null,
  }
}

