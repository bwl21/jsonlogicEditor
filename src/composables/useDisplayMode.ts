import { ref, computed, watch } from 'vue'

export type DisplayMode = 'collapsed' | 'inplace' | 'full'

export function useDisplayMode(
  initialMode: DisplayMode = 'inplace',
  onModeChange?: (mode: DisplayMode) => void
) {
  const displayMode = ref<DisplayMode>(initialMode)

  // Watch for external changes
  watch(() => displayMode.value, (newMode) => {
    if (onModeChange) {
      onModeChange(newMode)
    }
  })

  // Direct state switching - no toggling
  function setDisplayMode(mode: DisplayMode) {
    displayMode.value = mode
  }

  // Convenience methods
  function collapse() {
    setDisplayMode('collapsed')
  }

  function expand() {
    setDisplayMode('inplace')
  }

  function fullScreen() {
    setDisplayMode('full')
  }

  function exitFullMode() {
    setDisplayMode('inplace')
  }

  // Computed properties for state checking
  const isCollapsed = computed(() => displayMode.value === 'collapsed')
  const isInplace = computed(() => displayMode.value === 'inplace')
  const isFull = computed(() => displayMode.value === 'full')

  return {
    displayMode,
    setDisplayMode,
    collapse,
    expand,
    fullScreen,
    exitFullMode,
    isCollapsed,
    isInplace,
    isFull
  }
}