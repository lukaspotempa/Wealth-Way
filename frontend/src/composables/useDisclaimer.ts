import { ref } from 'vue'

// Module-level singleton — shared across all components
const disclaimerAccepted = ref(!!localStorage.getItem('disclaimer_accepted'))

export function useDisclaimer() {
  function accept() {
    localStorage.setItem('disclaimer_accepted', 'true')
    disclaimerAccepted.value = true
  }

  return { disclaimerAccepted, accept }
}
