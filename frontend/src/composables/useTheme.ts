import { ref, watch } from 'vue'

const isDark = ref(false)

export function useTheme() {
  function initTheme() {
    const saved = localStorage.getItem('finance-journey-theme')
    if (saved) {
      isDark.value = saved === 'dark'
    }
    // Default is light mode as per requirements
    applyTheme()
  }

  function toggleTheme() {
    isDark.value = !isDark.value
    applyTheme()
  }

  function applyTheme() {
    const html = document.documentElement
    if (isDark.value) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
    localStorage.setItem('finance-journey-theme', isDark.value ? 'dark' : 'light')
  }

  watch(isDark, () => {
    applyTheme()
  })

  return {
    isDark,
    toggleTheme,
    initTheme,
  }
}
