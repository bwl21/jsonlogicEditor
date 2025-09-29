<template>
  <div 
    ref="operatorRef"
    class="comparison-operator resize-handle-container"
    :class="{ 'is-dragging': isDragging, 'is-hovered': isDirectlyHovered, 'is-resizing': isResizing, 'is-selected': isSelected }"
    :data-display-mode="displayMode"
    :style="resizeStyle"
    draggable="false"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @click.stop="$emit('select')"
  >
    <!-- Unified Header -->
    <UnifiedOperatorHeader
      :operator-label="currentOperator?.label || localNode.operator?.toUpperCase() || 'Comparison'"
      operator-type="comparison"
      :conversion-options="conversionOptions"
      :display-mode="displayMode"
      :hide-on-hover="true"
      :is-parent-hovered="isDirectlyHovered"
      :force-show="showAllHeaders"
      @convert="convertToOperator"
      @delete="$emit('delete')"
      @preview-enter="onPreviewEnter"
      @preview-leave="onPreviewLeave"
      @update:display-mode="displayMode = $event"
    />

    <!-- Preview when collapsed and hovered -->
    <div v-if="displayMode === 'collapsed' && showPreview && localNode.operator" class="preview-popup">
      <div class="preview-content">
        <div class="preview-operator">{{ currentOperator?.label || localNode.operator?.toUpperCase() }}</div>
        <div class="preview-arguments">
          <div 
            v-for="argument in localNode.arguments?.slice(0, 2)" 
            :key="argument.id"
            class="preview-argument"
          >
            <div class="preview-text">
              {{ getPreviewText(argument) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Comparison Arguments -->
    <div v-if="displayMode === 'inplace'" class="comparison-body">
      <div class="comparison-arguments-horizontal">
        <!-- First Argument -->
        <div class="comparison-argument-left">
          <div class="argument-content">
            <!-- Recursive JsonLogicAtom for nested expressions -->
            <JsonLogicAtom
              v-if="localNode.arguments?.[0]?.type === 'expression'"
              :node="localNode.arguments[0]"
              :is-selected="isSelected"
              @update="onArgumentUpdate(0, $event)"
              @delete="onArgumentDelete(0)"
              @select="$emit('select')"
            />
            
            <!-- Use LiteralOperator for variables, literals, and arrays -->
            <LiteralOperator
              v-else-if="localNode.arguments?.[0] && (localNode.arguments[0].type === 'variable' || localNode.arguments[0].type === 'literal' || localNode.arguments[0].type === 'array' || localNode.arguments[0].type === 'string' || localNode.arguments[0].type === 'number' || localNode.arguments[0].type === 'boolean' || localNode.arguments[0].type === 'date')"
              :node="localNode.arguments[0]"
              :is-selected="isSelected"
              @update="onArgumentUpdate(0, $event)"
              @delete="onArgumentDelete(0)"
              @convert="onArgumentUpdate(0, $event)"
              @select="$emit('select')"
            />
          </div>
        </div>

        <!-- Operator Display -->
        <div class="comparison-operator-display">
          {{ currentOperator?.label || localNode.operator }}
        </div>

        <!-- Second Argument -->
        <div class="comparison-argument-right">
          <div class="argument-content">
            <!-- Recursive JsonLogicAtom for nested expressions -->
            <JsonLogicAtom
              v-if="localNode.arguments?.[1]?.type === 'expression'"
              :node="localNode.arguments[1]"
              :is-selected="isSelected"
              @update="onArgumentUpdate(1, $event)"
              @delete="onArgumentDelete(1)"
              @select="$emit('select')"
            />
            
            <!-- Use LiteralOperator for variables, literals, and arrays -->
            <LiteralOperator
              v-else-if="localNode.arguments?.[1] && (localNode.arguments[1].type === 'variable' || localNode.arguments[1].type === 'literal' || localNode.arguments[1].type === 'array' || localNode.arguments[1].type === 'string' || localNode.arguments[1].type === 'number' || localNode.arguments[1].type === 'boolean' || localNode.arguments[1].type === 'date')"
              :node="localNode.arguments[1]"
              :is-selected="isSelected"
              @update="onArgumentUpdate(1, $event)"
              @delete="onArgumentDelete(1)"
              @convert="onArgumentUpdate(1, $event)"
              @select="$emit('select')"
            />
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
        
        <h3>{{ currentOperator?.label || localNode.operator?.toUpperCase() }} Expression</h3>
        
        <div class="spacer"></div>
      </div>
      <div class="fullscreen-body">
        <div class="arguments-container">
          <div 
            v-for="(argument, index) in localNode.arguments" 
            :key="argument.id"
            class="argument-wrapper"
          >
            <div class="argument-label" v-if="getArgumentLabel(index)">
              {{ getArgumentLabel(index) }}:
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { JsonLogicNode, JsonLogicOperator } from '../types/JsonLogic'
import { OPERATORS } from '../types/JsonLogic'
import JsonLogicAtom from './JsonLogicAtom.vue'

import UnifiedOperatorHeader from './UnifiedOperatorHeader.vue'
import LiteralOperator from './LiteralOperator.vue'
import DisplayModeButtons from './DisplayModeButtons.vue'
import ResizeHandle from './ResizeHandle.vue'
import { getConversionOptions, convertOperatorNode } from '../utils/operatorConversion'
import { useDisplayMode } from '../composables/useDisplayMode'
import { useHoverManager, getShowAllHeaders } from '../composables/useHoverManager'

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

// Utility functions
function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

// Use hover manager for proper nested hover handling  
const elementId = `comparison-${localNode.value.id || generateId()}`
const { isDirectlyHovered, onMouseEnter, onMouseLeave } = useHoverManager(elementId)
const showAllHeaders = getShowAllHeaders()

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
  return getConversionOptions(localNode.value.operator || '')
})

const currentOperator = computed((): JsonLogicOperator | undefined => {
  return OPERATORS.find(op => op.name === localNode.value.operator)
})

// Argument management
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







function getArgumentLabel(index: number): string {
  return currentOperator.value?.argumentLabels?.[index] || `Argument ${index + 1}`
}



function convertToOperator(newOperator: string) {
  const convertedNode = convertOperatorNode(localNode.value, newOperator)
  emit('update', convertedNode)
}

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

// Hover management is now handled by useHoverManager composable

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
.comparison-operator {
  position: relative;
  border: 2px solid #8b5cf6;
  border-radius: 8px;
  background: white;
  margin: 8px 2px 8px 0;
  width: auto;
  max-width: 100%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.2s ease;
  overflow: visible;
}

.comparison-operator.is-resizing {
  user-select: none;
  pointer-events: auto;
  z-index: 1000;
  position: relative;
}

.comparison-operator.is-selected {
  border: 2px solid #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.comparison-operator .comparison-body {
  padding: 12px;
  padding-right: 8px; /* Space for resize handle */
  overflow: visible;
  height: auto;
  box-sizing: border-box;
}

/* Responsive behavior */
@media (max-width: 768px) {
  .comparison-operator {
    margin: 4px 0;
  }
  
  .comparison-arguments-horizontal {
    gap: 8px;
    padding: 8px;
  }
  
  .comparison-operator-display {
    font-size: 13px;
    padding: 6px 8px;
  }
}

@media (max-width: 480px) {
  .comparison-operator {
    font-size: 14px;
  }
  
  .operator-header {
    padding: 6px 8px;
  }
  
  .operator-button {
    font-size: 12px;
    padding: 3px 8px;
  }
  
  .comparison-operator-display {
    font-size: 12px;
    padding: 4px 8px;
  }
}

/* Collapsed state */
.comparison-operator[data-display-mode="collapsed"] {
  display: inline-block;
  margin: 4px 8px 4px 0;
  min-width: auto;
  max-width: 300px;
  width: auto;
  border-radius: 20px;
}

.comparison-operator[data-display-mode="collapsed"] .operator-header {
  padding: 8px 16px;
  border-radius: 18px;
}

.comparison-operator[data-display-mode="collapsed"] .operator-button {
  background: #a855f7;
  border-color: #7c3aed;
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
  color: #7c3aed;
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
  background: #ede9fe;
  border: 1px solid #8b5cf6;
  color: #7c3aed;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.operator-button:hover {
  background: #ddd6fe;
  border-color: #7c3aed;
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

/* Arguments - Horizontal Layout */
.comparison-arguments-horizontal {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  overflow-x: auto;
  overflow-y: visible;
  min-width: 0;
}

.comparison-arguments-horizontal::-webkit-scrollbar {
  height: 6px;
}

.comparison-arguments-horizontal::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 3px;
}

.comparison-arguments-horizontal::-webkit-scrollbar-thumb {
  background: #8b5cf6;
  border-radius: 3px;
}

.comparison-arguments-horizontal::-webkit-scrollbar-thumb:hover {
  background: #7c3aed;
}

.comparison-argument-left,
.comparison-argument-right {
  flex: 0 0 auto;
}

.comparison-operator-display {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #7c3aed;
  color: white;
  font-weight: bold;
  font-size: 14px;
  padding: 8px 12px;
  border-radius: 6px;
  flex-shrink: 0;
  text-align: center;
  white-space: nowrap;
}

/* Legacy arguments for fullscreen mode */
.comparison-arguments {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: visible;
  padding-bottom: 8px;
  height: auto;
}

.comparison-argument {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.argument-label {
  font-weight: 600;
  color: #374151;
  font-size: 12px;
  margin-bottom: 2px;
}

.argument-content {
  position: relative;
}

/* Input styles */
.simple-input, .literal-input {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #f9fafb;
}

.input-type-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  min-width: 30px;
}

.field-input, .value-input {
  flex: 1;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 6px 8px;
  font-size: 14px;
}

.type-select {
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 6px 8px;
  font-size: 14px;
  background: white;
}

.delete-arg-btn, .delete-array-item-btn {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #dc2626;
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.delete-arg-btn:hover, .delete-array-item-btn:hover {
  background: #fecaca;
}

/* Array inputs */
.array-input {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 12px;
  background: #f9fafb;
}

.array-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 8px;
  display: block;
}

.array-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
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

.add-array-item-btn {
  background: #ede9fe;
  border: 1px solid #8b5cf6;
  color: #7c3aed;
  cursor: pointer;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 4px;
  margin-top: 8px;
  transition: all 0.2s ease;
}

.add-array-item-btn:hover {
  background: #ddd6fe;
}

/* Preview popup */
.preview-popup {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #8b5cf6;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1000;
  margin-top: 4px;
}

.preview-content {
  padding: 12px;
}

.preview-operator {
  font-weight: bold;
  color: #7c3aed;
  margin-bottom: 8px;
}

.preview-arguments {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-argument {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-text {
  font-size: 12px;
  color: #6b7280;
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
  max-width: 800px;
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

.arguments-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.argument-wrapper {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 16px;
  background: #f9fafb;
}
</style>