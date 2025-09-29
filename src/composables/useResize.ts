import { ref, computed } from 'vue'

export interface ResizeOptions {
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
  initialWidth?: number
  initialHeight?: number
  aspectRatio?: number
  enableHorizontal?: boolean
  enableVertical?: boolean
  enableCorner?: boolean
}

export function useResize(options: ResizeOptions = {}) {
  const {
    minWidth = 200,
    maxWidth = 800,
    minHeight = 100,
    maxHeight = 600,
    initialWidth = 0,
    initialHeight = 0,
    aspectRatio,
    enableHorizontal = true,
    enableVertical = true,
    enableCorner = true
  } = options

  // Use 0 for initial values to let CSS handle default sizing
  const width = ref(initialWidth)
  const height = ref(initialHeight)
  const isResizing = ref(false)
  let elementRef: HTMLElement | null = null

  // Function to initialize from actual element size
  function initializeFromElement(element: HTMLElement) {
    elementRef = element
    if (width.value === 0) {
      const rect = element.getBoundingClientRect()
      width.value = Math.max(minWidth, rect.width)
    }
    if (height.value === 0) {
      const rect = element.getBoundingClientRect()
      height.value = Math.max(minHeight, rect.height)
    }
  }

  const style = computed(() => {
    const styles: Record<string, string> = {}
    
    if (width.value > 0) {
      styles.width = `${width.value}px`
    }
    if (height.value > 0) {
      styles.height = `${height.value}px`
    }
    
    return styles
  })



  function onResizeStart() {
    isResizing.value = true
  }

  function onResizeEnd() {
    isResizing.value = false
  }

  function onHorizontalResize(delta: { x: number; y: number }) {
    if (!enableHorizontal) return
    
    // Initialize width from current element size if not set
    if (width.value === 0 && elementRef) {
      const rect = elementRef.getBoundingClientRect()
      width.value = Math.max(minWidth, rect.width)
    }
    
    const newWidth = Math.max(minWidth, Math.min(maxWidth, width.value + delta.x))
    
    // Only update if there's a meaningful change (reduced threshold for smoother resizing)
    if (Math.abs(newWidth - width.value) >= 3) {
      width.value = newWidth
      
      // Maintain aspect ratio if specified
      if (aspectRatio && height.value > 0) {
        height.value = Math.max(minHeight, Math.min(maxHeight, newWidth / aspectRatio))
      }
    }
  }

  function onVerticalResize(delta: { x: number; y: number }) {
    if (!enableVertical) return
    
    // Initialize height from current element size if not set
    if (height.value === 0) {
      height.value = 200 // fallback default
    }
    
    const newHeight = Math.max(minHeight, Math.min(maxHeight, height.value + delta.y))
    
    // Only update if there's a meaningful change (reduced threshold for smoother resizing)
    if (Math.abs(newHeight - height.value) >= 3) {
      height.value = newHeight
      
      // Maintain aspect ratio if specified
      if (aspectRatio && width.value > 0) {
        width.value = Math.max(minWidth, Math.min(maxWidth, newHeight * aspectRatio))
      }
    }
  }

  function onCornerResize(delta: { x: number; y: number }) {
    if (!enableCorner) return
    
    // Initialize dimensions from current element size if not set
    if (width.value === 0) {
      width.value = 300 // fallback default
    }
    if (height.value === 0) {
      height.value = 200 // fallback default
    }
    
    let newWidth = Math.max(minWidth, Math.min(maxWidth, width.value + delta.x))
    let newHeight = Math.max(minHeight, Math.min(maxHeight, height.value + delta.y))
    
    // Maintain aspect ratio if specified
    if (aspectRatio) {
      const widthBasedHeight = newWidth / aspectRatio
      const heightBasedWidth = newHeight * aspectRatio
      
      // Choose the dimension that results in the smaller change
      if (Math.abs(widthBasedHeight - height.value) < Math.abs(heightBasedWidth - width.value)) {
        newHeight = Math.max(minHeight, Math.min(maxHeight, widthBasedHeight))
      } else {
        newWidth = Math.max(minWidth, Math.min(maxWidth, heightBasedWidth))
      }
    }
    
    // Only update if there's a meaningful change (reduced threshold for smoother resizing)
    if (Math.abs(newWidth - width.value) >= 3 || Math.abs(newHeight - height.value) >= 3) {
      width.value = newWidth
      height.value = newHeight
    }
  }

  function setSize(newWidth: number, newHeight: number) {
    width.value = Math.max(minWidth, Math.min(maxWidth, newWidth))
    height.value = Math.max(minHeight, Math.min(maxHeight, newHeight))
  }

  function resetSize() {
    width.value = initialWidth
    height.value = initialHeight
  }



  return {
    width,
    height,
    isResizing,
    style,
    onResizeStart,
    onResizeEnd,
    onHorizontalResize,
    onVerticalResize,
    onCornerResize,
    setSize,
    resetSize,
    initializeFromElement,
    cleanup: () => {
      elementRef = null
    }
  }
}

export type UseResizeReturn = ReturnType<typeof useResize>