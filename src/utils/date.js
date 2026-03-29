export const parseDateOnlyLocal = (isoDate) => {
  if (!isoDate || typeof isoDate !== 'string') return null

  const parts = isoDate.split('-').map(Number)
  if (parts.length !== 3) return null

  const [year, month, day] = parts
  if (!year || !month || !day) return null

  const parsed = new Date(year, month - 1, day)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

