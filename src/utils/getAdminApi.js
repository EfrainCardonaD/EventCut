let adminApiPromise

export const getAdminApi = async () => {
  if (!adminApiPromise) {
    adminApiPromise = import('@/utils/adminApi')
  }

  const module = await adminApiPromise
  return module.default
}

