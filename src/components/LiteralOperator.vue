<template>
  <div 
    ref="operatorRef"
    class="literal-operator resize-handle-container"
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
      :operator-label="getTypeLabel()"
      operator-type="data"
      :conversion-options="typeOptions"
      :display-mode="displayMode"
      @convert="convertToType"
      @delete="$emit('delete')"
      @preview-enter="onPreviewEnter"
      @preview-leave="onPreviewLeave"
      @update:display-mode="displayMode = $event"
    />

    <!-- Literal Content -->
    <div v-if="displayMode === 'inplace'" class="literal-body">
      <div class="literal-content">
        <!-- Variable input -->
        <div v-if="localNode.type === 'variable'" class="variable-input">
          <FieldNameInput
            v-model="localNode.value"
            @update:modelValue="onValueUpdate"
            placeholder="Field name"
            class="field-input"
          />
        </div>
        
        <!-- Literal input -->
        <div v-else-if="localNode.type === 'literal'" class="literal-input">
          <input 
            v-model="localNode.value" 
            @input="onValueUpdate"
            :placeholder="getPlaceholder()"
            class="value-input"
            :type="getInputType()"
          />
        </div>
        
        <!-- Array input -->
        <div v-else-if="localNode.type === 'array'" class="array-input">
          <div class="array-items">
            <div 
              v-for="(item, index) in localNode.items" 
              :key="item.id"
              class="array-item"
            >
              <input 
                v-model="item.value" 
                @input="onArrayItemUpdate(index, item)"
                class="array-item-input"
                :placeholder="`Item ${index + 1}`"
              />
              <button @click="onArrayItemDelete(index)" class="delete-item-btn">×</button>
            </div>
            <button @click="addArrayItem" class="add-item-btn">+ Add Item</button>
          </div>
        </div>
      </div>
    </div>

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
        
        <h3>{{ getTypeLabel() }}</h3>
        
        <div class="spacer"></div>
      </div>
      <div class="fullscreen-body">
        <!-- Same content as inplace mode -->
        <div class="literal-content">
          <!-- Variable input -->
          <div v-if="localNode.type === 'variable'" class="variable-input">
            <FieldNameInput
              v-model="localNode.value"
              @update:modelValue="onValueUpdate"
              placeholder="Field name"
              class="field-input"
            />
          </div>
          
          <!-- Literal input -->
          <div v-else-if="localNode.type === 'literal'" class="literal-input">
            <input 
              v-model="localNode.value" 
              @input="onValueUpdate"
              :placeholder="getPlaceholder()"
              class="value-input"
              :type="getInputType()"
            />
          </div>
          
          <!-- Array input -->
          <div v-else-if="localNode.type === 'array'" class="array-input">
            <div class="array-items">
              <div 
                v-for="(item, index) in localNode.items" 
                :key="item.id"
                class="array-item"
              >
                <input 
                  v-model="item.value" 
                  @input="onArrayItemUpdate(index, item)"
                  class="array-item-input"
                  :placeholder="`Item ${index + 1}`"
                />
                <button @click="onArrayItemDelete(index)" class="delete-item-btn">×</button>
              </div>
              <button @click="addArrayItem" class="add-item-btn">+ Add Item</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { JsonLogicNode } from '../types/JsonLogic'
import FieldNameInput from './FieldNameInput.vue'
import UnifiedOperatorHeader from './UnifiedOperatorHeader.vue'
import DisplayModeButtons from './DisplayModeButtons.vue'
import ResizeHandle from './ResizeHandle.vue'
import { useDisplayMode } from '../composables/useDisplayMode'

interface Props {
  node: JsonLogicNode
  isSelected?: boolean
}

interface Emits {
  (e: 'update', node: JsonLogicNode): void
  (e: 'delete'): void
  (e: 'select'): void
  (e: 'convert', node: JsonLogicNode): void
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false
})
const emit = defineEmits<Emits>()

const localNode = ref<JsonLogicNode>({ ...props.node })
const isDragging = ref(false)
const isDirectlyHovered = ref(false)

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
  currentWidth.value = Math.max(200, Math.min(600, currentWidth.value + delta.x))
  operatorRef.value.style.width = `${currentWidth.value}px`
}

const resizeStyle = computed(() => {
  return {} // Let CSS handle default sizing
})

// Watch for external changes
watch(() => props.node, (newNode) => {
  localNode.value = { ...newNode }
}, { deep: true })

// Type conversion options
const typeOptions = computed(() => {
  return [
    { operator: 'literal', label: 'Literal', description: 'Static value', category: 'data' },
    { operator: 'variable', label: 'Variable', description: 'Database field', category: 'data' },
    { operator: 'array', label: 'Array', description: 'List of values', category: 'data' },
    { operator: '==', label: 'Equals', description: 'Compare two values for equality', category: 'comparison' },
    { operator: '!=', label: 'Not Equals', description: 'Compare two values for inequality', category: 'comparison' },
    { operator: '>', label: 'Greater Than', description: 'Check if first value is greater', category: 'comparison' },
    { operator: '<', label: 'Less Than', description: 'Check if first value is less', category: 'comparison' },
    { operator: '>=', label: 'Greater or Equal', description: 'Check if first value is greater or equal', category: 'comparison' },
    { operator: '<=', label: 'Less or Equal', description: 'Check if first value is less or equal', category: 'comparison' },
    { operator: 'and', label: 'AND', description: 'All conditions must be true', category: 'logic' },
    { operator: 'or', label: 'OR', description: 'At least one condition must be true', category: 'logic' }
  ]
})

// Utility functions
function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

function getTypeLabel(): string {
  switch (localNode.value.type) {
    case 'variable': return 'Variable'
    case 'array': return 'Array'
    case 'literal': 
    default: return 'Literal'
  }
}

function getPlaceholder(): string {
  return 'Enter value'
}

function getInputType(): string {
  const value = localNode.value.value
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'checkbox'
  return 'text'
}

function onValueUpdate() {
  emit('update', localNode.value)
}

function onPreviewEnter() {
  // Preview functionality can be added here if needed
}

function onPreviewLeave() {
  // Preview functionality can be added here if needed
}



function convertToType(newType: string) {
  // Convert the node type
  switch (newType) {
    case 'variable':
      localNode.value.type = 'variable'
      localNode.value.value = ''
      delete localNode.value.items
      delete localNode.value.operator
      delete localNode.value.arguments
      break
    case 'array':
      localNode.value.type = 'array'
      localNode.value.items = [{ id: generateId(), type: 'literal', value: '' }]
      delete localNode.value.value
      delete localNode.value.operator
      delete localNode.value.arguments
      break
    case 'literal':
      localNode.value.type = 'literal'
      localNode.value.value = ''
      delete localNode.value.items
      delete localNode.value.operator
      delete localNode.value.arguments
      break
    // Expression conversions
    case '==':
    case '!=':
    case '>':
    case '<':
    case '>=':
    case '<=':
    case 'and':
    case 'or':
      // Convert to expression
      const currentValue = localNode.value.value || ''
      localNode.value.type = 'expression'
      localNode.value.operator = newType
      localNode.value.arguments = [
        {
          id: generateId(),
          type: 'literal',
          value: currentValue
        },
        {
          id: generateId(),
          type: 'literal',
          value: ''
        }
      ]
      delete localNode.value.value
      delete localNode.value.items
      break
    default:
      localNode.value.type = 'literal'
      localNode.value.value = ''
      delete localNode.value.items
      delete localNode.value.operator
      delete localNode.value.arguments
      break
  }
  
  emit('update', localNode.value)
  emit('convert', localNode.value)
}

function addArrayItem() {
  if (localNode.value.type !== 'array') return
  
  if (!localNode.value.items) localNode.value.items = []
  
  localNode.value.items.push({
    id: generateId(),
    type: 'literal',
    value: ''
  })
  
  emit('update', localNode.value)
}

function onArrayItemUpdate(index: number, updatedItem: JsonLogicNode) {
  if (localNode.value.type !== 'array' || !localNode.value.items) return
  
  localNode.value.items[index] = updatedItem
  emit('update', localNode.value)
}

function onArrayItemDelete(index: number) {
  if (localNode.value.type !== 'array' || !localNode.value.items) return
  
  localNode.value.items.splice(index, 1)
  emit('update', localNode.value)
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
</script>

<style scoped>
.literal-operator {
  position: relative;
  border: 2px solid #10b981;
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

.literal-operator.is-resizing {
  user-select: none;
  pointer-events: auto;
  z-index: 1000;
  position: relative;
}

.literal-operator.is-selected {
  border: 2px solid #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.literal-operator .literal-body {
  padding: 12px;
  padding-right: 8px; /* Space for resize handle */
  overflow: visible;
  height: auto;
  box-sizing: border-box;
}

/* Responsive behavior */
@media (max-width: 768px) {
  .literal-operator {
    min-width: 150px;
    margin: 4px 0;
  }
  
  .literal-operator[data-display-mode="inplace"] {
    width: 100%;
    max-width: none;
  }
}

@media (max-width: 480px) {
  .literal-operator {
    min-width: 120px;
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

/* Collapsed state */
.literal-operator[data-display-mode="collapsed"] {
  display: inline-block;
  margin: 4px 8px 4px 0;
  min-width: auto;
  max-width: 200px;
  width: auto;
  border-radius: 20px;
}

.literal-operator[data-display-mode="collapsed"] .operator-header {
  padding: 8px 16px;
  border-radius: 18px;
}

.literal-operator[data-display-mode="collapsed"] .operator-button {
  background: #059669;
  border-color: #047857;
  color: white;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
}

/* Header */
.operator-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
  border-radius: 6px 6px 0 0;
}

.drag-handle {
  cursor: grab;
  color: #059669;
  margin-right: 8px;
  font-weight: bold;
}

.drag-handle:active {
  cursor: grabbing;
}

.operator-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  margin-right: 12px;
}

.operator-button {
  background: #d1fae5;
  border: 1px solid #10b981;
  color: #059669;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.operator-button:hover {
  background: #a7f3d0;
  border-color: #059669;
  transform: translateY(-1px);
}

.spacer {
  flex: 1;
}

.delete-btn {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #dc2626;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  background: #fecaca;
  transform: translateY(-1px);
}

/* Content */
.literal-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.variable-input, .literal-input {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #f9fafb;
}

.input-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  min-width: 40px;
}

.field-input, .value-input {
  flex: 1;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 6px 8px;
  font-size: 14px;
}

/* Array inputs */
.array-input {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 12px;
  background: #f9fafb;
}

.array-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.array-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: white;
}

.array-item-input {
  flex: 1;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 4px 6px;
  font-size: 14px;
}

.delete-item-btn {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #dc2626;
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.delete-item-btn:hover {
  background: #fecaca;
}

.add-item-btn {
  background: #d1fae5;
  border: 1px solid #10b981;
  color: #059669;
  cursor: pointer;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 4px;
  margin-top: 8px;
  transition: all 0.2s ease;
}

.add-item-btn:hover {
  background: #a7f3d0;
}

/* Fullscreen */
.fullscreen-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fullscreen-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90%;
  overflow: auto;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
}

.fullscreen-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 8px 8px 0 0;
}

.fullscreen-header h3 {
  margin: 0;
  color: #374151;
  font-size: 18px;
}

.fullscreen-header .spacer {
  width: 60px;
}

.fullscreen-body {
  padding: 20px;
}
</style>