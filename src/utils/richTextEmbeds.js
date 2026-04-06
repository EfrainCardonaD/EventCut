const IMAGE_URL_PATTERN = /\.(?:jpg|jpeg|png|gif|webp|avif|svg)(?:\?[^\s<>"']*)?$/i
const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi

const normalizeUrl = (rawUrl = '') => {
  const value = String(rawUrl || '').trim()
  if (!value) return null

  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    return parsed.toString()
  } catch {
    return null
  }
}

export const isImageUrl = (rawUrl = '') => {
  const normalized = normalizeUrl(rawUrl)
  if (!normalized) return false
  return IMAGE_URL_PATTERN.test(normalized)
}

export const extractYouTubeId = (rawUrl = '') => {
  const normalized = normalizeUrl(rawUrl)
  if (!normalized) return null

  try {
    const url = new URL(normalized)
    const host = url.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      return url.pathname.split('/').filter(Boolean)[0] || null
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (url.pathname === '/watch') return url.searchParams.get('v')
      if (url.pathname.startsWith('/embed/')) return url.pathname.split('/')[2] || null
      if (url.pathname.startsWith('/shorts/')) return url.pathname.split('/')[2] || null
    }
  } catch {
    return null
  }

  return null
}

export const buildEmbedFromUrl = (rawUrl = '') => {
  const normalized = normalizeUrl(rawUrl)
  if (!normalized) return null

  if (isImageUrl(normalized)) {
    return {
      type: 'image',
      url: normalized,
      src: normalized,
      key: `img:${normalized}`,
    }
  }

  const youtubeId = extractYouTubeId(normalized)
  if (youtubeId) {
    return {
      type: 'youtube',
      url: normalized,
      id: youtubeId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
      key: `yt:${youtubeId}`,
    }
  }

  return {
    type: 'link',
    url: normalized,
    href: normalized,
    key: `link:${normalized}`,
  }
}

export const extractUrlsFromText = (text = '') => {
  const source = String(text || '')
  const matches = source.match(URL_PATTERN) || []
  const unique = new Set()

  for (const candidate of matches) {
    const normalized = normalizeUrl(candidate)
    if (normalized) unique.add(normalized)
  }

  return [...unique.values()]
}

export const extractUrlsFromHtml = (html = '') => {
  if (typeof document === 'undefined') return []

  const container = document.createElement('div')
  container.innerHTML = String(html || '')

  const urls = new Set()

  container.querySelectorAll('a[href]').forEach((anchor) => {
    const normalized = normalizeUrl(anchor.getAttribute('href') || '')
    if (normalized) urls.add(normalized)
  })

  container.querySelectorAll('img[src]').forEach((img) => {
    const normalized = normalizeUrl(img.getAttribute('src') || '')
    if (normalized) urls.add(normalized)
  })

  for (const url of extractUrlsFromText(container.textContent || '')) {
    urls.add(url)
  }

  return [...urls.values()]
}

