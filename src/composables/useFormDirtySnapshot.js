import { computed, ref, unref } from 'vue'

const FILE_KEYS = ['name', 'size', 'type']

const normalizeUnknown = (value) => {
  if (value === undefined) return null
  if (value === null) return null

  const type = typeof value

  if (type === 'string') return value.trim()
  if (type === 'number' || type === 'boolean') return value

  if (value instanceof Date) {
    const time = value.getTime()
    return Number.isFinite(time) ? value.toISOString() : null
  }

  // File / Blob handling
  if (typeof File !== 'undefined' && value instanceof File) {
    return FILE_KEYS.reduce((acc, key) => {
      acc[key] = value[key]
      return acc
    }, {})
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeUnknown(item))
  }

  if (type === 'object') {
    const entries = Object.entries(value)
      .filter(([, v]) => typeof v !== 'function')
      .map(([k, v]) => [k, normalizeUnknown(v)])
      .sort(([a], [b]) => a.localeCompare(b))

    return entries.reduce((acc, [k, v]) => {
      acc[k] = v
      return acc
    }, {})
  }

  return null
}

const stableStringify = (value) => JSON.stringify(value)

/**
 * Dirty tracking basado en snapshot normalizado.
 *
 * Uso recomendado:
 * const { takeSnapshot, resetSnapshot, isDirty } = useFormDirtySnapshot({ sourceRef: form })
 * takeSnapshot() al abrir el modal o al entrar a editMode.
 */
export function useFormDirtySnapshot(options = {}) {
  const snapshotRef = ref(null)
  const sourceRef = options.sourceRef

  const takeSnapshot = (value) => {
    const source = value !== undefined ? value : sourceRef ? unref(sourceRef) : undefined
    snapshotRef.value = normalizeUnknown(source)
  }

  const resetSnapshot = () => {
    snapshotRef.value = null
  }

  const isDirty = computed(() => {
    if (!sourceRef) return false
    if (!snapshotRef.value) return false

    const current = normalizeUnknown(unref(sourceRef))
    return stableStringify(current) !== stableStringify(snapshotRef.value)
  })

  const isDirtyValue = (value) => {
    if (!snapshotRef.value) return false
    return stableStringify(normalizeUnknown(value)) !== stableStringify(snapshotRef.value)
  }

  return {
    takeSnapshot,
    resetSnapshot,
    isDirty,
    isDirtyValue,
  }
}

