<template>
  <div 
    class="resize-handle"
    :class="[
      `resize-${direction}`, 
      { 
        'is-resizing': isResizing,
        'at-min-size': isAtMinSize,
        'at-max-size': isAtMaxSize
      }
    ]"
    @mousedown="startResize"
    :title="getTitle()"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Props {
  direction: 'horizontal' | 'vertical' | 'corner'
  minSize?: number
  maxSize?: number
  isAtMinSize?: boolean
  isAtMaxSize?: boolean
}

interface Emits {
  (e: 'resize', delta: { x: number; y: number }): void
  (e: 'resize-start'): void
  (e: 'resize-end'): void
}

const props = withDefaults(defineProps<Props>(), {
  minSize: 100,
  maxSize: 2000,
  isAtMinSize: false,
  isAtMaxSize: false
})

const emit = defineEmits<Emits>()

const isResizing = ref(false)
const startPos = ref({ x: 0, y: 0 })
const lastPos = ref({ x: 0, y: 0 })

function startResize(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  
  isResizing.value = true
  startPos.value = { x: event.clientX, y: event.clientY }
  lastPos.value = { x: event.clientX, y: event.clientY }
  
  document.addEventListener('mousemove', handleResize, { passive: false })
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = getCursor()
  document.body.style.userSelect = 'none'
  document.body.style.pointerEvents = 'none'
  
  emit('resize-start')
}

function handleResize(event: MouseEvent) {
  if (!isResizing.value) return
  
  const deltaX = event.clientX - lastPos.value.x
  const deltaY = event.clientY - lastPos.value.y
  
  // Only emit if there's movement
  if (Math.abs(deltaX) >= 1 || Math.abs(deltaY) >= 1) {
    emit('resize', { x: deltaX, y: deltaY })
    
    // Update last position for next delta
    lastPos.value = { x: event.clientX, y: event.clientY }
  }
}

function stopResize() {
  isResizing.value = false
  
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  document.body.style.pointerEvents = ''
  
  emit('resize-end')
}

function getCursor(): string {
  switch (props.direction) {
    case 'horizontal':
      return 'ew-resize'
    case 'vertical':
      return 'ns-resize'
    case 'corner':
      return 'nw-resize'
    default:
      return 'default'
  }
}

function getTitle(): string {
  const baseTitle = `Resize ${props.direction}`
  
  if (props.isAtMinSize && props.isAtMaxSize) {
    return `${baseTitle} (at size limits)`
  } else if (props.isAtMinSize) {
    return `${baseTitle} (at minimum size)`
  } else if (props.isAtMaxSize) {
    return `${baseTitle} (at maximum size)`
  }
  
  return baseTitle
}

onMounted(() => {
  // Cleanup on component unmount
})

onUnmounted(() => {
  if (isResizing.value) {
    stopResize()
  }
})
</script>

<style scoped>
.resize-handle {
  position: absolute;
  z-index: 10;
  opacity: 0;
  background: transparent;
  transition: opacity 0.15s ease;
  pointer-events: auto;
  border: none;
  outline: none;
}

.resize-handle:hover {
  opacity: 0.3;
  background: rgba(59, 130, 246, 0.05);
}

.resize-handle.is-resizing {
  opacity: 0.5;
  background: rgba(59, 130, 246, 0.1);
}

.resize-horizontal {
  right: -2px;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: ew-resize;
}

.resize-vertical {
  left: 0;
  right: 0;
  bottom: -3px;
  height: 6px;
  cursor: ns-resize;
}

.resize-corner {
  right: -2px;
  bottom: -2px;
  width: 8px;
  height: 8px;
  cursor: nw-resize;
}



/* Parent container should have position: relative */
.resize-handle-container {
  position: relative;
  overflow: visible;
}

/* Show resize handles on hover of parent */
.resize-handle-container:hover .resize-handle {
  opacity: 0.3;
}

.resize-handle-container:hover .resize-handle:hover {
  opacity: 0.6;
}

/* Prevent layout shifts during resize */
.resize-handle-container.is-resizing {
  pointer-events: none;
}

.resize-handle-container.is-resizing .resize-handle {
  pointer-events: auto;
}


</style>