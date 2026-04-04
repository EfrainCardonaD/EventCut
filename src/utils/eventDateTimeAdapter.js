// Adaptador UI <-> Base de datos para datetimes estrictos.
//
// Objetivo:
// - La UI trabaja con fechas/horas flexibles (toggles, campos vacíos)
// - Justo antes del submit se convierte al formato estrictamente esperado por la BD:
//   YYYY-MM-DD HH:MM:SS
// - Al editar, se hace el proceso inverso y se detecta automáticamente "Todo el día".
//
// NOTA: Evitamos `new Date("YYYY-MM-DD HH:MM:SS")` porque no es un formato ISO estándar
// y su parseo puede variar entre navegadores. Todo se hace por split.

const pad2 = (value) => String(value).padStart(2, '0')
const MAX_EVENT_DURATION_MS = 30 * 24 * 60 * 60 * 1000

const toLocalDateOnly = (value) => {
  return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`
}

const parseLocalDateTimeParts = (date, timeHms) => {
  if (!isValidDateOnly(date) || !isValidTimeOnly(timeHms)) return null
  const [year, month, day] = date.split('-').map(Number)
  const [hours, minutes, seconds] = normalizeTimeToHms(timeHms, '00:00:00').split(':').map(Number)
  const parsed = new Date(year, month - 1, day, hours, minutes, seconds)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export const isValidDateOnly = (date) => {
  return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
}

export const isValidTimeOnly = (time) => {
  // Acepta HH:mm o HH:mm:ss
  return typeof time === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(time)
}

export const normalizeTimeToHms = (time, fallback) => {
  if (!time) return fallback
  if (!isValidTimeOnly(time)) return fallback
  const [hh, mm, ss] = time.split(':')
  return `${pad2(hh)}:${pad2(mm)}:${pad2(ss ?? '00')}`
}

export const formatDbDateTime = (date, timeHms) => {
  if (!isValidDateOnly(date)) return null
  const time = normalizeTimeToHms(timeHms, null)
  if (!time) return null
  return `${date} ${time}`
}

export const parseDbDateTime = (value) => {
  if (!value || typeof value !== 'string') return null

  const trimmed = value.trim()
  // Soporta: "YYYY-MM-DD HH:MM:SS" y también ISO básico "YYYY-MM-DDTHH:MM:SS..."
  const candidate = trimmed.includes('T') ? trimmed.replace('T', ' ') : trimmed

  const [datePart, timePartRaw] = candidate.split(' ')
  if (!isValidDateOnly(datePart)) return null

  const timePart = (timePartRaw || '').trim()
  const time = normalizeTimeToHms(timePart, null)
  if (!time) return null

  return {
    date: datePart,
    time,
    hhmm: time.slice(0, 5),
  }
}

export const isAllDayRange = ({ startDate, startTimeHms, endDate, endTimeHms }) => {
  return startDate === endDate && startTimeHms === '00:00:00' && endTimeHms === '23:59:59'
}

// Modelo UX esperado:
// {
//   date: 'YYYY-MM-DD' (obligatorio)
//   allDay: boolean
//   startTime: 'HH:MM' | '' | null
//   endTime: 'HH:MM' | '' | null
//   hasEndDate: boolean
//   endDate: 'YYYY-MM-DD' | '' | null
// }
export const uiToDbStrict = (ux) => {
  const date = ux?.date
  const hasEndDate = Boolean(ux?.hasEndDate)
  const endDate = hasEndDate ? ux?.endDate : date
  const now = new Date()
  const today = toLocalDateOnly(now)

  if (!isValidDateOnly(date)) {
    return { ok: false, error: 'Selecciona una fecha valida para el evento.' }
  }

  if (!isValidDateOnly(endDate)) {
    return { ok: false, error: 'Selecciona una fecha de finalizacion valida.' }
  }

  if (endDate < date) {
    return { ok: false, error: 'La fecha de finalizacion no puede ser anterior a la de inicio.' }
  }

  if (date < today) {
    return { ok: false, error: 'No puedes crear o editar eventos en una fecha que ya paso.' }
  }

  const allDay = Boolean(ux?.allDay)

  // defaults por convencion
  const startHms = allDay ? '00:00:00' : normalizeTimeToHms(ux?.startTime, '00:00:00')
  const endHms = allDay ? '23:59:59' : normalizeTimeToHms(ux?.endTime, '23:59:59')

  // Validacion de horas solo cuando es mismo dia y no es all-day.
  if (!allDay && date === endDate && ux?.startTime && ux?.endTime) {
    // Comparación lexicográfica funciona en HH:MM / HH:MM:SS con pad2.
    const startComparable = normalizeTimeToHms(ux.startTime, '00:00:00')
    const endComparable = normalizeTimeToHms(ux.endTime, '00:00:00')

    if (endComparable < startComparable) {
      return { ok: false, error: 'La hora de fin no puede ser anterior a la hora de inicio.' }
    }

    if (endComparable === startComparable) {
      return { ok: false, error: 'La hora de fin debe ser posterior a la hora de inicio.' }
    }
  }

  const start = formatDbDateTime(date, startHms)
  const end = formatDbDateTime(endDate, endHms)

  if (!start || !end) {
    return { ok: false, error: 'No se pudo construir la fecha/hora del evento.' }
  }

  const startDate = parseLocalDateTimeParts(date, startHms)
  const endDateTime = parseLocalDateTimeParts(endDate, endHms)
  if (!startDate || !endDateTime) {
    return { ok: false, error: 'Debes ingresar una fecha de inicio valida' }
  }

  if (startDate.getTime() <= now.getTime()) {
    return { ok: false, error: 'La fecha y hora de inicio deben ser posteriores a la hora actual.' }
  }

  const durationMs = endDateTime.getTime() - startDate.getTime()
  if (durationMs <= 0) {
    return { ok: false, error: 'La fecha de fin debe ser posterior a la de inicio' }
  }

  if (durationMs > MAX_EVENT_DURATION_MS) {
    return { ok: false, error: 'El evento no puede durar mas de 30 dias consecutivos' }
  }

  return {
    ok: true,
    value: {
      start_datetime: start,
      end_datetime: end,
    },
  }
}

export const dbToUiModel = ({ start_datetime, end_datetime } = {}) => {
  const start = parseDbDateTime(start_datetime)
  const end = parseDbDateTime(end_datetime)

  if (!start || !end) {
    return {
      date: '',
      allDay: false,
      startTime: '',
      endTime: '',
      hasEndDate: false,
      endDate: '',
    }
  }

  const hasEndDate = start.date !== end.date
  const allDay = isAllDayRange({
    startDate: start.date,
    startTimeHms: start.time,
    endDate: end.date,
    endTimeHms: end.time,
  })

  return {
    date: start.date,
    allDay,
    startTime: allDay ? '' : start.hhmm,
    endTime: allDay ? '' : end.hhmm,
    hasEndDate,
    endDate: hasEndDate ? end.date : '',
  }
}

