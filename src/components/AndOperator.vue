<template>
  <div 
    ref="operatorRef"
    class="and-operator resize-handle-container"
    :class="{ 'is-dragging': isDragging, 'is-hovered': isDirectlyHovered, 'is-resizing': isResizing, 'is-selected': isSelected }"
    :data-display-mode="displayMode"
    :style="resizeStyle"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @click.stop="$emit('select')"
  >
    <!-- Unified Header -->
    <UnifiedOperatorHeader
      operator-label="AND"
      operator-type="logic"
      :conversion-options="conversionOptions"
      :display-mode="displayMode"
      @convert="convertToOperator"
      @delete="$emit('delete')"
      @preview-enter="onPreviewEnter"
      @preview-leave="onPreviewLeave"
      @update:display-mode="displayMode = $event"
    />
    <span v-if="displayMode === 'collapsed'" class="condition-count">({{ localNode.arguments?.length || 0 }} conditions)</span>

    <!-- Preview when collapsed and hovered -->
    <div v-if="displayMode === 'collapsed' && showPreview" class="preview-popup">
      <div class="preview-content">
        <div class="preview-arguments">
          <div 
            v-for="(argument, index) in localNode.arguments?.slice(0, 3)" 
            :key="argument.id"
            class="preview-argument"
          >
            <div v-if="index > 0" class="preview-and-badge">AND</div>
            <div class="preview-text">
              {{ getPreviewText(argument) }}
            </div>
          </div>
          <div v-if="(localNode.arguments?.length || 0) > 3" class="preview-more">
            ... and {{ (localNode.arguments?.length || 0) - 3 }} more
          </div>
        </div>
      </div>
    </div>

    <!-- Vertical Arguments -->
    <div v-if="displayMode === 'inplace'" class="and-body">
      <div class="and-arguments">
        <div 
          v-for="(argument, index) in localNode.arguments" 
          :key="argument.id"
          class="and-argument"
        >
          <!-- Argument Content -->
          <div class="argument-content">
            <!-- Recursive JsonLogicAtom for nested expressions -->
            <JsonLogicAtom
              v-if="argument.type === 'expression'"
              :node="argument"
              :is-selected="isSelected"
              @update="onArgumentUpdate(index, $event)"
              @delete="onArgumentDelete(index)"
              @select="$emit('select')"
            />
            
            <!-- Use LiteralOperator for variables, literals, and arrays -->
            <LiteralOperator
              v-else-if="argument.type === 'variable' || argument.type === 'literal' || argument.type === 'array'"
              :node="argument"
              :is-selected="isSelected"
              @update="onArgumentUpdate(index, $event)"
              @delete="onArgumentDelete(index)"
              @convert="onArgumentUpdate(index, $event)"
              @select="$emit('select')"
            />
            
            <!-- Fallback for unknown argument types -->
            <div v-else class="unknown-argument">
              <span>Unknown argument type: {{ argument.type }}</span>
              <button @click="onArgumentDelete(index)" class="delete-arg-btn">×</button>
            </div>
          </div>
          
          <!-- AND Badge (except for last item) -->
          <div v-if="localNode.arguments && index < localNode.arguments.length - 1" class="and-badge">AND</div>
        </div>
      </div>
      
      <!-- Add new condition button - outside scrollable area -->
      <div class="add-condition-wrapper">
        <button @click="addArgument" class="add-condition-btn">
          + Add Condition
        </button>
      </div>
    </div>

    <!-- Resize handles -->
    <!-- Resize handles - only horizontal -->
    <ResizeHandle
      v-if="displayMode !== 'collapsed'"
      direction="horizontal"
      @resize="onHorizontalResize"
      @resize-start="onResizeStart"
      @resize-end="onResizeEnd"
    />
  </div>

  <!-- Full-screen overlay -->
  <div v-if="displayMode === 'full'" class="fullscreen-overlay" @click.self="exitFullMode">
    <div class="fullscreen-content">
      <div class="fullscreen-header">
        <!-- Display mode buttons in full screen -->
        <DisplayModeButtons v-model="displayMode" />
        
        <h3>AND Expression</h3>
        
        <div class="spacer"></div>
      </div>
      <div class="fullscreen-body">
        <div class="and-conditions">
          <div 
            v-for="(argument, index) in localNode.arguments" 
            :key="argument.id"
            class="and-condition"
          >
            <div class="condition-header">
              <span class="condition-label">Condition {{ index + 1 }}:</span>
            </div>
            
            <!-- Nested expressions -->
            <JsonLogicAtom
              v-if="argument.type === 'expression'"
              :node="argument"
              :is-selected="isSelected"
              @update="onArgumentUpdate(index, $event)"
              @delete="onArgumentDelete(index)"
              @select="$emit('select')"
            />
            
            <!-- Use LiteralOperator for variables, literals, and arrays -->
            <LiteralOperator
              v-else-if="argument.type === 'variable' || argument.type === 'literal' || argument.type === 'array'"
              :node="argument"
              :is-selected="isSelected"
              @update="onArgumentUpdate(index, $event)"
              @delete="onArgumentDelete(index)"
              @convert="onArgumentUpdate(index, $event)"
              @select="$emit('select')"
            />
            
            <!-- Fallback for unknown argument types -->
            <div v-else class="unknown-argument">
              <span>Unknown argument type: {{ argument.type }}</span>
              <button @click="onArgumentDelete(index)" class="delete-arg-btn">×</button>
            </div>
          </div>
          
          <!-- Add new condition button -->
          <div class="add-condition-wrapper">
            <button @click="addArgument" class="add-condition-btn">
              + Add AND Condition
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { JsonLogicNode } from '../types/JsonLogic'
import JsonLogicAtom from './JsonLogicAtom.vue'

import UnifiedOperatorHeader from './UnifiedOperatorHeader.vue'
import LiteralOperator from './LiteralOperator.vue'
import DisplayModeButtons from './DisplayModeButtons.vue'
import ResizeHandle from './ResizeHandle.vue'
import { getConversionOptions, convertOperatorNode } from '../utils/operatorConversion'
import { useDisplayMode } from '../composables/useDisplayMode'


interface Props {
  node: JsonLogicNode
  isSelected?: boolean
}

interface Emits {
  (e: 'update', node: JsonLogicNode): void
  (e: 'delete'): void
  (e: 'convert', operator: string): void
  (e: 'select'): void
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false
})
const emit = defineEmits<Emits>()

const localNode = ref<JsonLogicNode>({ ...props.node })
const isDragging = ref(false)
const isDirectlyHovered = ref(false)

const showPreview = ref(false)
const operatorRef = ref<HTMLElement>()

// Display mode management
const { displayMode, exitFullMode } = useDisplayMode()

// Simple resize management
const isResizing = ref(false)
const currentWidth = ref(0)

function onResizeStart() {
  isResizing.value = true
  if (operatorRef.value) {
    currentWidth.value = operatorRef.value.getBoundingClientRect().width
  }
}

function onResizeEnd() {
  isResizing.value = false
}

function onHorizontalResize(delta: { x: number; y: number }) {
  if (!operatorRef.value) return
  
  // Add delta to current width (small incremental changes)
  currentWidth.value = Math.max(300, Math.min(1200, currentWidth.value + delta.x))
  operatorRef.value.style.width = `${currentWidth.value}px`
}

const resizeStyle = computed(() => {
  return {} // Let CSS handle default sizing
})

// Watch for external changes
watch(() => props.node, (newNode) => {
  localNode.value = { ...newNode }
}, { deep: true })

// Computed properties
const conversionOptions = computed(() => {
  return getConversionOptions('and')
})



// Methods
function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

function addArgument() {
  if (!localNode.value.arguments) localNode.value.arguments = []
  
  localNode.value.arguments.push({
    id: generateId(),
    type: 'literal',
    value: ''
  })
  
  emit('update', localNode.value)
}

function onArgumentUpdate(index: number, updatedArgument: JsonLogicNode) {
  if (!localNode.value.arguments) return
  
  localNode.value.arguments[index] = updatedArgument
  emit('update', localNode.value)
}

function onArgumentDelete(index: number) {
  if (!localNode.value.arguments) return
  
  localNode.value.arguments.splice(index, 1)
  emit('update', localNode.value)
}



// Drag and drop
function onDragStart(event: DragEvent) {
  isDragging.value = true
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/json', JSON.stringify(localNode.value))
    event.dataTransfer.effectAllowed = 'move'
  }
}

function onDragEnd() {
  isDragging.value = false
}

// Conversion functions
function convertToOperator(newOperator: string) {
  const convertedNode = convertOperatorNode(localNode.value, newOperator)
  localNode.value = convertedNode
  emit('convert', newOperator)
}

// Collapse management


function onPreviewEnter() {
  if (displayMode.value === 'collapsed') {
    showPreview.value = true
  }
}

function onPreviewLeave() {
  showPreview.value = false
}

function getPreviewText(argument: JsonLogicNode): string {
  if (argument.type === 'variable') {
    return `var: ${argument.value}`
  } else if (argument.type === 'literal') {
    return `${argument.value}`
  } else if (argument.type === 'expression' && argument.operator) {
    return `${argument.operator.toUpperCase()}`
  } else if (argument.type === 'array') {
    return `[${argument.items?.length || 0} items]`
  }
  return 'condition'
}



// Hover management
function onMouseEnter(event: MouseEvent) {
  // Only set hover if this is the direct target, not a child
  if (event.target === event.currentTarget) {
    isDirectlyHovered.value = true
  }
}

function onMouseLeave() {
  isDirectlyHovered.value = false
}

// Display mode functions are provided by useDisplayMode composable
</script>

<style scoped>
.and-operator {
  position: relative;
  border: 2px solid #3b82f6;
  border-radius: 8px;
  background: white;
  margin: 8px 2px 8px 0;
  min-width: 250px;
  max-width: calc(100vw - 40px);
  width: auto;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.2s ease;
  overflow: visible;
}

.and-operator.is-resizing {
  user-select: none;
  pointer-events: auto;
  z-index: 1000;
  position: relative;
}

.and-operator.is-selected {
  border: 2px solid #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.and-operator .and-body {
  padding: 16px;
  padding-right: 8px; /* Space for resize handle */
  overflow: visible;
  height: auto;
  box-sizing: border-box;
}

/* Responsive behavior */
@media (max-width: 768px) {
  .and-operator {
    min-width: 200px;
    margin: 4px 0;
  }
  
  .and-operator[data-display-mode="inplace"] {
    width: 100%;
    max-width: none;
  }
  
  .and-arguments {
    gap: 8px;
  }
  
  .and-argument {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .and-operator {
    min-width: 150px;
    font-size: 14px;
  }
  
  .operator-header {
    padding: 6px 8px;
  }
  
  .operator-button {
    font-size: 12px;
    padding: 3px 8px;
  }
}

/* Collapsed state - compact horizontal */
.and-operator[data-display-mode="collapsed"] {
  display: inline-block;
  margin: 4px 8px 4px 0;
  min-width: auto;
  max-width: 300px;
  width: auto;
  flex-shrink: 0;
}

.and-operator .header-controls {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.and-operator.is-hovered .header-controls {
  opacity: 1;
}

.and-operator:hover {
  border-color: #2563eb;
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.and-operator.is-dragging {
  opacity: 0.5;
  transform: rotate(2deg);
}

.operator-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #dbeafe;
  border-bottom: 1px solid #3b82f6;
  border-radius: 6px 6px 0 0;
}



.drag-handle {
  cursor: grab;
  color: #1e40af;
  margin-right: 8px;
  font-weight: bold;
}

.drag-handle:active {
  cursor: grabbing;
}

.collapse-btn {
  background: rgba(30, 64, 175, 0.1);
  border: 1px solid rgba(30, 64, 175, 0.2);
  color: #1e40af;
  cursor: pointer;
  font-size: 14px;
  padding: 6px 10px;
  border-radius: 6px;
  margin-right: 12px;
  transition: all 0.2s ease;
  font-weight: 500;
  min-width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.collapse-btn:hover {
  background: rgba(30, 64, 175, 0.2);
  border-color: rgba(30, 64, 175, 0.3);
  transform: translateY(-1px);
}

.operator-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  margin-right: 12px;
}

.operator-button {
  background: #dbeafe;
  border: 1px solid #3b82f6;
  color: #1e40af;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  padding: 4px 12px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.operator-button:hover {
  background: #bfdbfe;
  border-color: #2563eb;
  color: #1e3a8a;
}

.condition-count {
  color: #1e40af;
  font-size: 12px;
  opacity: 0.7;
  margin-left: 8px;
  flex: 1;
}

.delete-btn {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  margin-left: auto;
  opacity: 0.7;
}

.delete-btn:hover {
  background: #dc2626;
  opacity: 1;
  transform: scale(1.1);
}

.delete-btn:active {
  transform: scale(0.9);
}

.conversion-dropdown {
  position: relative;
}

.convert-btn {
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  min-width: 90px;
  justify-content: center;
}

.convert-btn:hover {
  background: #7c3aed;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.convert-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3);
}

.convert-icon {
  font-size: 14px;
  line-height: 1;
}

.convert-label {
  font-size: 12px;
}



.and-body {
  padding: 16px;
}

.and-arguments {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: visible;
  padding-bottom: 10px;
  height: auto;
}



.and-argument {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.argument-content {
  width: 100%;
}

.and-badge {
  background: #3b82f6;
  color: white;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: bold;
  text-align: center;
  align-self: center;
  white-space: nowrap;
}

.simple-input {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.input-type-label {
  font-size: 11px;
  font-weight: 600;
  color: #3b82f6;
  background: #eff6ff;
  padding: 2px 6px;
  border-radius: 3px;
  min-width: 35px;
  text-align: center;
}

.type-select {
  padding: 4px 6px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  min-width: 90px;
  font-size: 12px;
}

.value-input, .field-input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
}

.array-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.array-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.array-item-input {
  flex: 1;
  padding: 4px 6px;
  border: 1px solid #d1d5db;
  border-radius: 3px;
  font-size: 13px;
}

.add-item-btn {
  background: #059669;
  color: white;
  border: none;
  border-radius: 3px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 11px;
  align-self: flex-start;
}

.delete-item-btn, .delete-arg-btn {
  background: #f87171;
  color: white;
  border: none;
  border-radius: 3px;
  width: 20px;
  height: 20px;
  cursor: pointer;
  font-size: 12px;
  flex-shrink: 0;
}

.add-condition-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 12px;
  margin-bottom: 8px;
  padding-right: 8px; /* Space for resize handle */
}

.add-condition-btn {
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.add-condition-btn:hover {
  background: #2563eb;
}

.preview-popup {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #3b82f6;
  border-top: none;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 100;
  max-height: 200px;
  overflow-y: auto;
}

.preview-content {
  padding: 12px;
}

.preview-arguments {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-argument {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.preview-and-badge {
  background: #3b82f6;
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: bold;
}

.preview-text {
  background: #dbeafe;
  padding: 4px 8px;
  border-radius: 4px;
  color: #1e40af;
  font-family: monospace;
  flex: 1;
}

.preview-more {
  color: #6b7280;
  font-style: italic;
  font-size: 11px;
  text-align: center;
  padding: 4px;
}

/* Responsive */
@media (max-width: 768px) {
  .and-arguments {
    overflow-x: visible;
  }
  
  .header-controls {
    gap: 12px;
  }
  
  .collapse-btn {
    font-size: 14px;
    padding: 8px 12px;
    min-width: 40px;
  }
  
  .convert-btn, .delete-btn {
    padding: 10px 14px;
    min-width: 100px;
    font-size: 14px;
  }
  
  .convert-label, .delete-label {
    font-size: 13px;
  }
  
  .condition-count {
    font-size: 12px;
  }
  
  .conversion-menu {
    min-width: 180px;
    right: -10px;
  }
}

/* Full-screen overlay styles */
.fullscreen-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.fullscreen-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 90vw;
  max-height: 90vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.fullscreen-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 2px solid #e5e7eb;
  background: #dbeafe;
}

.fullscreen-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.exit-full-btn {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.exit-full-btn:hover {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.exit-icon {
  font-size: 18px;
  line-height: 1;
}

.exit-label {
  font-size: 13px;
}

.fullscreen-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: white;
}

.and-conditions {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.and-condition {
  border: 2px solid #3b82f6;
  border-radius: 8px;
  padding: 16px;
  background: #dbeafe;
}

.condition-header {
  margin-bottom: 12px;
}

.condition-label {
  font-weight: 600;
  color: #1e40af;
  font-size: 14px;
}

.add-condition-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.add-condition-btn {
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.add-condition-btn:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.fullscreen-header .spacer {
  width: 60px;
}
</style>