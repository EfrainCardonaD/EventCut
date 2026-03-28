export function initTheme() {
  try {
    const isDark =
      localStorage.theme === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)

    if (isDark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')

    return document.documentElement.classList.contains('dark')
  } catch {
    // Fallback: preferencia del sistema
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    return prefersDark
  }
}

export function toggleTheme() {
  const html = document.documentElement
  const isDark = html.classList.contains('dark')

  if (isDark) {
    html.classList.remove('dark')
    try {
      localStorage.theme = 'light'
    } catch {}
  } else {
    html.classList.add('dark')
    try {
      localStorage.theme = 'dark'
    } catch {}
  }

  return !isDark
}

