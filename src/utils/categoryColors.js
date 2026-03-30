// Colores determinísticos por categoría para etiquetas y acentos UI.
//
// Objetivo de negocio/UX:
// - Cada categoría debe tener un color distinto y consistente en toda la app
//   (cards, modales, chips, etc.)
// - Sin depender de que el backend envíe un color.
// - Con soporte para Dark Mode.
//
// Nota: en Tailwind no podemos construir clases dinámicas tipo `text-${color}-600`
// sin safelist/config adicional. Por eso devolvemos estilos inline (style bindings)
// y, opcionalmente, una clase "ring" fija.

const PALETTE = Object.freeze([
  { key: 'sky', light: '#0284c7', dark: '#38bdf8', softLight: '#e0f2fe', softDark: '#082f49' },
  { key: 'emerald', light: '#059669', dark: '#34d399', softLight: '#d1fae5', softDark: '#022c22' },
  { key: 'violet', light: '#7c3aed', dark: '#a78bfa', softLight: '#ede9fe', softDark: '#2e1065' },
  { key: 'amber', light: '#d97706', dark: '#fbbf24', softLight: '#fef3c7', softDark: '#451a03' },
  { key: 'rose', light: '#e11d48', dark: '#fb7185', softLight: '#ffe4e6', softDark: '#4c0519' },
  { key: 'teal', light: '#0f766e', dark: '#2dd4bf', softLight: '#ccfbf1', softDark: '#042f2e' },
  { key: 'indigo', light: '#4f46e5', dark: '#818cf8', softLight: '#e0e7ff', softDark: '#1e1b4b' },
  { key: 'fuchsia', light: '#c026d3', dark: '#e879f9', softLight: '#fae8ff', softDark: '#4a044e' },
])

const hashString = (value) => {
  const input = String(value ?? '')
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export const getCategoryColorToken = (category) => {
  const id = category?.id ?? category?.category_id ?? category?.categoryId ?? ''
  const name = category?.name ?? category?.category_name ?? category?.categoryName ?? ''
  const seed = `${id}:${name}`
  const index = hashString(seed) % PALETTE.length
  return PALETTE[index]
}

export const getCategoryAccentStyles = ({ category, isDark } = {}) => {
  const token = getCategoryColorToken(category)
  const dark = Boolean(isDark)

  return {
    color: dark ? token.dark : token.light,
  }
}

export const getCategoryChipStyles = ({ category, isDark } = {}) => {
  const token = getCategoryColorToken(category)
  const dark = Boolean(isDark)

  return {
    color: dark ? token.dark : token.light,
    backgroundColor: dark ? token.softDark : token.softLight,
    borderColor: dark ? `${token.dark}44` : `${token.light}33`,
  }
}

