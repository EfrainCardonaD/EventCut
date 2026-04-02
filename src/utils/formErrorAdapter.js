const pushFieldMessage = (acc, field, message) => {
  const normalizedField = String(field || '').trim()
  const normalizedMessage = String(message || '').trim()
  if (!normalizedField || !normalizedMessage) return

  if (!acc[normalizedField]) acc[normalizedField] = []
  acc[normalizedField].push(normalizedMessage)
}

const normalizeObjectDetails = (details) => {
  return Object.entries(details).reduce((acc, [field, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => pushFieldMessage(acc, field, item))
      return acc
    }

    pushFieldMessage(acc, field, value)
    return acc
  }, {})
}

const normalizePydanticDetails = (details) => {
  return details.reduce((acc, item) => {
    if (!item || typeof item !== 'object') return acc

    const loc = Array.isArray(item.loc) ? item.loc : []
    const fieldParts = loc
      .map((part) => String(part || '').trim())
      .filter(Boolean)
      .filter((part) => part !== 'body')

    const field = fieldParts.join('.') || '_form'
    pushFieldMessage(acc, field, item.msg || item.message)
    return acc
  }, {})
}

export const normalizeFieldErrors = (details) => {
  if (!details) return {}

  if (Array.isArray(details)) {
    return normalizePydanticDetails(details)
  }

  if (typeof details === 'object') {
    return normalizeObjectDetails(details)
  }

  if (typeof details === 'string' && details.trim()) {
    return { _form: [details.trim()] }
  }

  return {}
}

