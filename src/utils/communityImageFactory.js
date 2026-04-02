import communitiesApi from '@/utils/communitiesApi'
import { getApiPayload } from '@/utils/apiFactory'
import { normalizeSocialLinksPayload } from '@/utils/socialLinks'

export const ALLOWED_COMMUNITY_IMAGE_TYPES = Object.freeze([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
])

export const isAllowedCommunityImageType = (fileType) => {
  return ALLOWED_COMMUNITY_IMAGE_TYPES.includes(fileType)
}

const assertCommunityImageFile = (file) => {
  if (!file) {
    throw new Error('Debes seleccionar una imagen antes de continuar.')
  }

  if (!isAllowedCommunityImageType(file.type)) {
    throw new Error('Formato de imagen no permitido. Usa JPEG, PNG, WEBP, GIF o AVIF.')
  }
}

const uniquePaths = (paths) => [...new Set(paths)]

const requestWithFallbackPaths = async (method, paths, body, config = {}) => {
  const dedupedPaths = uniquePaths(paths)
  let lastError = null

  for (const path of dedupedPaths) {
    try {
      if (method === 'post') return await communitiesApi.post(path, body, config)
      if (method === 'patch') return await communitiesApi.patch(path, body, config)
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

const signedUploadPathCandidates = [
  import.meta.env.VITE_COMMUNITIES_UPLOAD_PATH || '/api/v1/communities/image-upload-url',
  '/v1/communities/image-upload-url',
].filter(Boolean)

const updateCommunityPathTemplateCandidates = [
  import.meta.env.VITE_COMMUNITIES_UPDATE_PATH_TEMPLATE || '/api/v1/communities/{community_id}',
  '/v1/communities/{community_id}',
  '/api/v1/communities/{community_id}',
].filter(Boolean)

// IMPORTANTE: el alta de comunidad se hace en /api/v1/communities del store.
// Para mantenerlo compatible con el back actual, aqui implementamos el flujo:
// 1) firmar upload
// 2) PUT binario
// 3) devolver publicUrl para que el frontend lo mande en el payload de create.

const extractSignedUploadUrls = (responseData) => {
  const source = responseData || {}
  const uploadUrl = source.upload_url || source.uploadUrl || null
  const publicUrl = source.public_url || source.publicUrl || null

  if (!uploadUrl || !publicUrl) {
    throw new Error('La API no devolvio upload_url y public_url para la imagen de la comunidad.')
  }

  return { uploadUrl, publicUrl }
}

export const requestCommunityImageUploadUrl = async ({ fileType, fileName } = {}) => {
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

export const uploadCommunityImageToCloudflare = async ({ uploadUrl, file }) => {
  if (!uploadUrl) throw new Error('No existe una URL firmada para subir la imagen.')
  assertCommunityImageFile(file)

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

export const uploadCommunityImageAndGetPublicUrl = async ({ file } = {}) => {
  assertCommunityImageFile(file)

  const { uploadUrl, publicUrl } = await requestCommunityImageUploadUrl({
    fileType: file.type,
    fileName: file.name,
  })

  await uploadCommunityImageToCloudflare({ uploadUrl, file })
  return publicUrl
}

const buildUpdatePathCandidates = (communityId) => {
  return updateCommunityPathTemplateCandidates.map((template) => template.replace('{community_id}', String(communityId)))
}

export const updateCommunityWithImageUrl = async (communityId, payload) => {
  return requestWithFallbackPaths('patch', buildUpdatePathCandidates(communityId), payload)
}

const normalizeCommunityUpdateBody = (formPayload, imageUrlOverride) => {
  const requestBody = {}

  if (Object.prototype.hasOwnProperty.call(formPayload || {}, 'name')) {
    requestBody.name = String(formPayload?.name || '').trim()
  }

  if (Object.prototype.hasOwnProperty.call(formPayload || {}, 'description')) {
    requestBody.description = String(formPayload?.description || '').trim()
  }

  if (Object.prototype.hasOwnProperty.call(formPayload || {}, 'category_id')) {
    const parsedCategoryId = Number(formPayload?.category_id)
    if (Number.isFinite(parsedCategoryId) && parsedCategoryId > 0) {
      requestBody.category_id = parsedCategoryId
    }
  }

  if (Object.prototype.hasOwnProperty.call(formPayload || {}, 'contact_email')) {
    requestBody.contact_email = String(formPayload?.contact_email || '').trim() || null
  }

  if (Object.prototype.hasOwnProperty.call(formPayload || {}, 'social_links')) {
    const socialLinks = normalizeSocialLinksPayload(formPayload?.social_links)
    requestBody.social_links = socialLinks || null
  }

  if (typeof imageUrlOverride !== 'undefined') {
    requestBody.image_url = imageUrlOverride
  }

  if (formPayload?.previous_image_url) {
    requestBody.previous_image_url = String(formPayload.previous_image_url)
  }

  return requestBody
}

export const updateCommunityWithSignedImageUpload = async (communityId, formPayload) => {
  const imageAction = formPayload?.imageAction || (formPayload?.imageFile ? 'replace' : 'keep')
  let imageUrlOverride

  if (imageAction === 'replace') {
    assertCommunityImageFile(formPayload?.imageFile)

    const { uploadUrl, publicUrl } = await requestCommunityImageUploadUrl({
      fileType: formPayload.imageFile.type,
      fileName: formPayload.imageFile.name,
    })

    await uploadCommunityImageToCloudflare({
      uploadUrl,
      file: formPayload.imageFile,
    })

    imageUrlOverride = publicUrl
  }

  if (imageAction === 'remove') {
    imageUrlOverride = null
  }

  const requestBody = normalizeCommunityUpdateBody(formPayload, imageUrlOverride)
  const response = await updateCommunityWithImageUrl(communityId, requestBody)

  return {
    response,
    updatedCommunity: getApiPayload(response) || null,
  }
}

