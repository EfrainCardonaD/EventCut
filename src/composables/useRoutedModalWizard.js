import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const asIntOr = (value, fallback) => {
  const n = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

const omitKeys = (query, keysToOmit) => {
  const next = { ...query }
  for (const key of keysToOmit) {
    // eslint-disable-next-line no-prototype-builtins
    if (next.hasOwnProperty(key)) delete next[key]
  }
  return next
}

/**
 * Estado de modal+wizzard controlado por route.query.
 *
 * Convención por defecto:
 * - modalParam: "modal"  (valor == modalKey)
 * - stepParam:  "step"   (1..N)
 * - idParam:    "eventId" (opcional)
 */
export function useRoutedModalWizard(options) {
  const {
    modalKey,
    modalParam = 'modal',
    stepParam = 'step',
    idParam = 'eventId',
    defaultStep = 1,
    totalSteps = 1,
    id = undefined,
    isDirty = () => false,
    canClose = () => true,
    isBlocked = () => false,
    stepHistoryMode = 'push',
  } = options || {}

  if (!modalKey) {
    throw new Error('useRoutedModalWizard: "modalKey" es obligatorio')
  }

  const route = useRoute()
  const router = useRouter()

  const isOpen = computed(() => route.query?.[modalParam] === modalKey)

  const step = computed({
    get: () => {
      if (!isOpen.value) return defaultStep
      return asIntOr(route.query?.[stepParam], defaultStep)
    },
    set: (value) => {
      const nextStep = Math.min(totalSteps, Math.max(1, asIntOr(value, defaultStep)))
      const nextQuery = {
        ...route.query,
        [modalParam]: modalKey,
        [stepParam]: String(nextStep),
      }

      if (id !== undefined && id !== null && String(id).trim()) {
        nextQuery[idParam] = String(id)
      }

      if (stepHistoryMode === 'replace') {
        router.replace({ query: nextQuery })
      } else {
        router.push({ query: nextQuery })
      }
    },
  })

  const open = ({ step: openStep = defaultStep, id: openId } = {}) => {
    const nextQuery = {
      ...route.query,
      [modalParam]: modalKey,
      [stepParam]: String(asIntOr(openStep, defaultStep)),
    }

    const finalId = openId !== undefined ? openId : id
    if (finalId !== undefined && finalId !== null && String(finalId).trim()) {
      nextQuery[idParam] = String(finalId)
    }

    router.push({ query: nextQuery })
  }

  const close = () => {
    const nextQuery = omitKeys(route.query || {}, [modalParam, stepParam, idParam])
    router.push({ query: nextQuery })
  }

  const prevStep = () => {
    if (step.value <= 1) return
    step.value = step.value - 1
  }

  const nextStep = () => {
    if (step.value >= totalSteps) return
    step.value = step.value + 1
  }

  /**
   * Cierre centralizado.
   *
   * Nota: para "back/gesture" el comportamiento natural es que el usuario haga back
   * y el historial cambie el step/modal. Aquí solo se estandarizan cierres explícitos
   * (botón, Escape, click fuera, etc.) y se decide si requiere confirm por dirty.
   */
  const requestClose = (reason = 'close') => {
    if (isBlocked()) {
      return { allowed: false, blocked: true }
    }

    if (!canClose()) {
      return { allowed: false, blocked: true }
    }

    // En modales tipo wizard, back puede ser "prev step" antes de cerrar
    if (reason === 'back') {
      if (step.value > 1) {
        return {
          allowed: true,
          action: 'PREV_STEP',
          run: () => prevStep(),
        }
      }

      if (isDirty()) {
        return {
          allowed: false,
          needsConfirm: true,
          action: 'CLOSE',
          confirm: () => close(),
        }
      }

      return { allowed: true, action: 'CLOSE', run: () => close() }
    }

    // Cierre explícito (close button / escape / outside / cancel)
    if (isDirty()) {
      return {
        allowed: false,
        needsConfirm: true,
        action: 'CLOSE',
        confirm: () => close(),
      }
    }

    return {
      allowed: true,
      action: 'CLOSE',
      run: () => close(),
    }
  }

  return {
    isOpen,
    step,
    open,
    close,
    prevStep,
    nextStep,
    requestClose,
  }
}

