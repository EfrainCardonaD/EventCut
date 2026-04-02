const TITLE_MIN = 3
const TITLE_MAX = 150
const DESCRIPTION_MIN = 5
const DESCRIPTION_MAX = 5000
const LOCATION_MIN = 2
const LOCATION_MAX = 200

const toTrimmed = (value) => String(value || '').trim()

export const toEventCategoryId = (value) => {
  const numeric = Number(value)
  if (!Number.isInteger(numeric) || numeric <= 0) return null
  return numeric
}

export const validateEventTitle = (value) => {
  const title = toTrimmed(value)
  if (!title) return 'El titulo es obligatorio.'
  if (title.length < TITLE_MIN) return 'El titulo debe tener al menos 3 caracteres'
  if (title.length > TITLE_MAX) return 'El titulo no puede exceder los 150 caracteres'
  return ''
}

export const validateEventDescription = (value) => {
  const description = toTrimmed(value)
  if (!description) return 'La descripcion es obligatoria.'
  if (description.length < DESCRIPTION_MIN) return 'La descripcion es muy corta. Debe tener al menos 5 caracteres'
  if (description.length > DESCRIPTION_MAX) return 'La descripcion es demasiado larga (max. 5000 caracteres)'
  return ''
}

export const validateEventLocation = (value) => {
  const location = toTrimmed(value)
  if (!location) return 'La ubicacion es obligatoria.'
  if (location.length < LOCATION_MIN) return 'La ubicacion es muy corta'
  if (location.length > LOCATION_MAX) return 'La ubicacion excede el limite de 200 caracteres'
  return ''
}

export const validateEventCategory = (categoryId, categories = []) => {
  const normalizedId = toEventCategoryId(categoryId)
  if (!normalizedId) return 'Debes seleccionar una categoria'

  const hasMatch = Array.isArray(categories) && categories.some((category) => Number(category?.id) === normalizedId)
  if (!hasMatch) return 'Debes seleccionar una categoria'
  return ''
}

export const validateEventSocialLinks = (socialLinks = {}) => {
  const whatsapp = toTrimmed(socialLinks.whatsapp)
  const facebook = toTrimmed(socialLinks.facebook)
  const instagram = toTrimmed(socialLinks.instagram)

  if (whatsapp && !whatsapp.startsWith('https://wa.me/')) {
    return 'El link de WhatsApp debe iniciar con https://wa.me/'
  }

  if (facebook && !facebook.startsWith('https://facebook.com/') && !facebook.startsWith('https://www.facebook.com/')) {
    return 'El link de Facebook debe iniciar con https://facebook.com/ o https://www.facebook.com/'
  }

  if (instagram && !instagram.startsWith('https://instagram.com/') && !instagram.startsWith('https://www.instagram.com/')) {
    return 'El link de Instagram debe iniciar con https://instagram.com/ o https://www.instagram.com/'
  }

  return ''
}

export const validateEventImageUrlLength = (value) => {
  if (typeof value !== 'string') return ''
  if (value.length > 255) return 'La URL de imagen no puede exceder 255 caracteres.'
  return ''
}

