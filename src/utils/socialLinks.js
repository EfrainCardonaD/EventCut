const SOCIAL_NETWORK_KEYS = ['whatsapp', 'facebook', 'instagram']

export const normalizeSocialLinksPayload = (socialLinks = {}) => {
  const compact = {}

  for (const key of SOCIAL_NETWORK_KEYS) {
    const value = String(socialLinks?.[key] || '').trim()
    if (value) compact[key] = value
  }

  return Object.keys(compact).length ? compact : null
}

