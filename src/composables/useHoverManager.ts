import { ref, computed } from 'vue'

// Global hover state management - stack of hovered elements (deepest first)
const hoverStack = ref<string[]>([])

// Global toggle for showing all headers
const showAllHeaders = ref(false)

export function toggleAllHeaders() {
  showAllHeaders.value = !showAllHeaders.value
}

export function getShowAllHeaders() {
  return showAllHeaders
}

export function useHoverManager(elementId: string) {
  const isDirectlyHovered = ref(false)

  function onMouseEnter(event: MouseEvent) {
    // Check if we're hovering over a child operator element
    const target = event.target as HTMLElement
    const currentTarget = event.currentTarget as HTMLElement
    
    // Find the closest operator element to the target
    const closestOperator = target.closest('.literal-operator, .comparison-operator, .or-operator, .and-operator')
    
    // Only claim the hover if this element is the closest operator to the target
    if (closestOperator === currentTarget) {
      // Remove this element from stack if it exists, then add it to the front
      const index = hoverStack.value.indexOf(elementId)
      if (index > -1) {
        hoverStack.value.splice(index, 1)
      }
      hoverStack.value.unshift(elementId)
    }
    
    isDirectlyHovered.value = true
  }

  function onMouseLeave() {
    // Remove this element from the hover stack
    const index = hoverStack.value.indexOf(elementId)
    if (index > -1) {
      hoverStack.value.splice(index, 1)
    }
    
    isDirectlyHovered.value = false
  }

  // Show header if this is the first (deepest) element in the stack OR if all headers are enabled
  const shouldShowHeader = computed(() => {
    return showAllHeaders.value || hoverStack.value[0] === elementId
  })

  return {
    isDirectlyHovered: shouldShowHeader,
    onMouseEnter,
    onMouseLeave
  }
}