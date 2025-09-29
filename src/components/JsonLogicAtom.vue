<template>
  <!-- Render as OrOperator if root operator is 'or' -->
  <OrOperator
    v-if="localNode.type === 'expression' && localNode.operator === 'or'"
    :node="localNode"
    :is-selected="isSelected"
    @update="$emit('update', $event)"
    @delete="$emit('delete')"
    @convert="$emit('convert', $event)"
    @select="$emit('select')"
  />
  <!-- Render as AndOperator if root operator is 'and' -->
  <AndOperator
    v-else-if="localNode.type === 'expression' && localNode.operator === 'and'"
    :node="localNode"
    :is-selected="isSelected"
    @update="$emit('update', $event)"
    @delete="$emit('delete')"
    @convert="$emit('convert', $event)"
    @select="$emit('select')"
  />
  <!-- Render as ComparisonOperator for comparison operators -->
  <ComparisonOperator
    v-else-if="localNode.type === 'expression' && isComparisonOperator(localNode.operator)"
    :node="localNode"
    :is-selected="isSelected"
    @update="$emit('update', $event)"
    @delete="$emit('delete')"
    @convert="$emit('convert', $event)"
    @select="$emit('select')"
  />
  <!-- Render as LiteralOperator for literal, variable, and array types -->
  <LiteralOperator
    v-else-if="localNode.type === 'literal' || localNode.type === 'variable' || localNode.type === 'array'"
    :node="localNode"
    :is-selected="isSelected"
    @update="$emit('update', $event)"
    @delete="$emit('delete')"
    @convert="$emit('convert', $event)"
    @select="$emit('select')"
  />
  <!-- Default atom rendering for all other cases -->
  <div 
    v-else
    ref="atomRef"
    class="json-logic-atom resize-handle-container"
    :class="{ 'is-dragging': isDragging, 'is-hovered': isDirectlyHovered, 'is-resizing': isResizing, 'is-selected': isSelected }"
    :data-ui-hint="currentOperator?.uiHints?.join(' ')"
    :data-display-mode="displayMode"
    :style="resizeStyle"
    draggable="false"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @click.stop="handleSelect"
  >
    <!-- Header with operator and controls -->
    <div class="atom-header" @mouseenter="onPreviewEnter" @mouseleave="onPreviewLeave">
      <!-- Display mode buttons -->
      <DisplayModeButtons 
        v-if="localNode.operator"
        v-model="displayMode"
      />
      
      <div class="drag-handle">⋮⋮</div>
      
      <div class="operator-wrapper">
        <select 
          v-if="!localNode.operator"
          v-model="localNode.operator" 
          @change="onOperatorChange"
          class="operator-select"
        >
          <option value="">Select operator...</option>
          <optgroup 
            v-for="category in operatorCategories" 
            :key="category"
            :label="category.toUpperCase()"
          >
            <option 
              v-for="op in getOperatorsByCategory(category)"
              :key="op.name"
              :value="op.name"
            >
              {{ op.label }}
            </option>
          </optgroup>
        </select>
        
        <!-- Operator as clickable button when selected -->
        <button 
          v-else
          @click="toggleConversionMenu" 
          class="operator-button"
          :title="showConversionMenu ? 'Close conversion menu' : `Convert ${localNode.operator} to different operator`"
        >
          {{ currentOperator?.label || localNode.operator }}
        </button>
        
        <ConversionMenu
          :is-open="showConversionMenu"
          :options="conversionOptions"
          @close="showConversionMenu = false"
          @convert="convertToOperator"
        />
      </div>
      
      <span v-if="displayMode === 'collapsed' && localNode.operator" class="condition-count">
        ({{ localNode.arguments?.length || 0 }} {{ localNode.arguments?.length === 1 ? 'argument' : 'arguments' }})
      </span>
      
      <button 
        v-if="displayMode !== 'collapsed'"
        @click="$emit('delete')" 
        class="delete-btn" 
        :title="`Delete this ${localNode.operator || 'operator'}`"
      >
        ×
      </button>
    </div>

    <!-- Resize handles - only horizontal -->
    <ResizeHandle
      v-if="displayMode !== 'collapsed'"
      direction="horizontal"
      @resize="onHorizontalResize"
      @resize-start="onResizeStart"
      @resize-end="onResizeEnd"
    />

    <!-- Preview when collapsed and hovered -->
    <div v-if="displayMode === 'collapsed' && showPreview && localNode.operator" class="preview-popup">
      <div class="preview-content">
        <div class="preview-arguments">
          <div 
            v-for="(argument, index) in localNode.arguments?.slice(0, 3)" 
            :key="argument.id"
            class="preview-argument"
          >
            <div class="preview-text">
              {{ getArgumentLabel(index) }}: {{ getPreviewText(argument) }}
            </div>
          </div>
          <div v-if="(localNode.arguments?.length || 0) > 3" class="preview-more">
            ... and {{ (localNode.arguments?.length || 0) - 3 }} more
          </div>
        </div>
    </div>
    </div>

    <!-- Arguments -->
    <div v-if="localNode.operator && displayMode !== 'collapsed'" class="atom-body">
      <div class="arguments-container">
        <div 
          v-for="(argument, index) in localNode.arguments" 
          :key="argument.id"
          class="argument-wrapper"
          @mouseenter="onArgumentMouseEnter(index, $event)"
          @mouseleave="onArgumentMouseLeave(index)"
        >
          <div class="argument-label" v-if="getArgumentLabel(index)">
            {{ getArgumentLabel(index) }}:
          </div>
          
          <!-- Specific operator components for better layout -->
          <OrOperator
            v-if="argument.type === 'expression' && argument.operator === 'or'"
            :node="argument"
            @update="onArgumentUpdate(index, $event)"
            @delete="onArgumentDelete(index)"
            @convert="onArgumentConvert(index, $event)"
          />
          <AndOperator
            v-else-if="argument.type === 'expression' && argument.operator === 'and'"
            :node="argument"
            @update="onArgumentUpdate(index, $event)"
            @delete="onArgumentDelete(index)"
            @convert="onArgumentConvert(index, $event)"
          />
          <!-- Recursive component for other nested expressions -->
          <JsonLogicAtom
            v-else-if="argument.type === 'expression'"
            :node="argument"
            @update="onArgumentUpdate(index, $event)"
            @delete="onArgumentDelete(index)"
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
          
          <!-- Fallback for other argument types -->
          <div v-else class="unknown-argument">
            <span>Unknown argument type: {{ argument.type }}</span>
            <button @click="onArgumentDelete(index)" class="delete-arg-btn">×</button>
          </div>
        </div>
        
        <!-- Add new argument button -->
        <div v-if="canAddMoreArgs" class="add-arg-wrapper">
          <button 
            @click="addArgument" 
            class="add-arg-btn"
          >
            + Add {{ getNextArgumentLabel() }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Full-screen overlay -->
  <div v-if="displayMode === 'full'" class="fullscreen-overlay" @click.self="exitFullMode">
    <div class="fullscreen-content">
      <div class="fullscreen-header">
        <!-- Display mode buttons in full screen -->
        <DisplayModeButtons v-model="displayMode" />
        
        <h3>{{ localNode.operator?.toUpperCase() }} Expression</h3>
        
        <div class="spacer"></div>
      </div>
      <div class="fullscreen-body">
        <div class="arguments-container">
          <div 
            v-for="(argument, index) in localNode.arguments" 
            :key="argument.id"
            class="argument-wrapper"
            @mouseenter="onArgumentMouseEnter(index, $event)"
            @mouseleave="onArgumentMouseLeave(index)"
          >
            <div class="argument-label" v-if="getArgumentLabel(index)">
              {{ getArgumentLabel(index) }}:
            </div>
            
            <!-- Specific operator components for better layout -->
            <OrOperator
              v-if="argument.type === 'expression' && argument.operator === 'or'"
              :node="argument"
              @update="onArgumentUpdate(index, $event)"
              @delete="onArgumentDelete(index)"
              @convert="onArgumentConvert(index, $event)"
            />
            <AndOperator
              v-else-if="argument.type === 'expression' && argument.operator === 'and'"
              :node="argument"
              @update="onArgumentUpdate(index, $event)"
              @delete="onArgumentDelete(index)"
              @convert="onArgumentConvert(index, $event)"
            />
            <!-- Recursive component for other nested expressions -->
            <JsonLogicAtom
              v-else-if="argument.type === 'expression'"
              :node="argument"
              @update="onArgumentUpdate(index, $event)"
              @delete="onArgumentDelete(index)"
              @convert="onArgumentConvert(index, $event)"
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
            <!-- Fallback for other argument types -->
            <div v-else class="unknown-argument">
              <span>Unknown argument type: {{ argument.type }}</span>
              <button @click="onArgumentDelete(index)" class="delete-arg-btn">×</button>
            </div>
          </div>
          
          <!-- Add new argument button -->
          <div v-if="canAddMoreArgs" class="add-arg-wrapper">
            <button 
              @click="addArgument" 
              class="add-arg-btn"
            >
              + Add {{ getNextArgumentLabel() }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import type { JsonLogicNode, JsonLogicOperator } from '../types/JsonLogic'
import { OPERATORS } from '../types/JsonLogic'

import OrOperator from './OrOperator.vue'
import AndOperator from './AndOperator.vue'
import ComparisonOperator from './ComparisonOperator.vue'
import DisplayModeButtons from './DisplayModeButtons.vue'
import ConversionMenu from './ConversionMenu.vue'
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
const atomRef = ref<HTMLElement>()
const hoveredArgumentIndex = ref<number | null>(null)
const showConversionMenu = ref(false)
// Display mode management
const { displayMode, exitFullMode } = useDisplayMode()
const showPreview = ref(false)

// Simple resize management
const isResizing = ref(false)
const currentWidth = ref(0)

function onResizeStart() {
  isResizing.value = true
  if (atomRef.value) {
    currentWidth.value = atomRef.value.getBoundingClientRect().width
  }
}

function onResizeEnd() {
  isResizing.value = false
}

function onHorizontalResize(delta: { x: number; y: number }) {
  if (!atomRef.value) return
  
  // Add delta to current width (small incremental changes)
  currentWidth.value = Math.max(200, Math.min(800, currentWidth.value + delta.x))
  atomRef.value.style.width = `${currentWidth.value}px`
}

const resizeStyle = computed(() => {
  return {} // Let CSS handle default sizing
})

// Watch for external changes
watch(() => props.node, (newNode) => {
  localNode.value = { ...newNode }
}, { deep: true })

// Computed properties
const operatorCategories = computed(() => 
  [...new Set(OPERATORS.map(op => op.category))]
)

const currentOperator = computed(() => 
  OPERATORS.find(op => op.name === localNode.value.operator)
)

const canAddMoreArgs = computed(() => {
  if (!currentOperator.value) return false
  const currentArgs = localNode.value.arguments?.length || 0
  return currentArgs < currentOperator.value.maxArgs
})

const conversionOptions = computed(() => {
  if (!localNode.value.operator) return []
  return getConversionOptions(localNode.value.operator)
})

// Helper function to check if operator is a comparison operator
function isComparisonOperator(operator: string | undefined): boolean {
  if (!operator) return false
  const op = OPERATORS.find(o => o.name === operator)
  return op?.category === 'comparison'
}

// Methods
function getOperatorsByCategory(category: string): JsonLogicOperator[] {
  return OPERATORS.filter(op => op.category === category)
}

function getArgumentLabel(index: number): string {
  if (!currentOperator.value?.argumentLabels) return ''
  return currentOperator.value.argumentLabels[index] || `Argument ${index + 1}`
}

function getNextArgumentLabel(): string {
  if (!currentOperator.value) return 'Argument'
  
  const currentArgs = localNode.value.arguments?.length || 0
  if (currentOperator.value.argumentLabels && currentArgs < currentOperator.value.argumentLabels.length) {
    return currentOperator.value.argumentLabels[currentArgs]
  }
  
  switch (currentOperator.value.category) {
    case 'logic': return 'Condition'
    case 'comparison': return 'Value'
    case 'data': return 'Parameter'
    case 'arithmetic': return 'Number'
    default: return 'Argument'
  }
}



function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

function onOperatorChange() {
  const operator = currentOperator.value
  if (!operator) return

  // Initialize arguments based on operator requirements
  const minArgs = operator.minArgs
  const args: JsonLogicNode[] = []
  
  for (let i = 0; i < minArgs; i++) {
    args.push({
      id: generateId(),
      type: 'literal',
      value: getDefaultValueForArgument(operator, i)
    })
  }
  
  localNode.value.arguments = args
  localNode.value.type = 'expression'
  
  emit('update', localNode.value)
}

function getDefaultValueForArgument(operator: JsonLogicOperator, index: number): any {
  // Provide sensible defaults based on operator and argument position
  switch (operator.name) {
    case 'var':
      return index === 0 ? 'person.firstName' : null // variable name, optional default
    case 'oneof':
    case 'partof':
      return index === 0 ? '' : (index === 1 ? [] : '') // value, array/string
    case '==':
    case '!==':
    case '>':
    case '>=':
    case '<':
    case '<=':
      return index === 0 ? '' : '' // left value, right value
    case 'between':
      return index === 0 ? '' : (index === 1 ? 0 : 100) // value, lower, upper
    case 'if':
      return index === 0 ? true : (index === 1 ? '' : '') // condition, then, else
    case 'and':
    case 'or':
      return true // logical conditions default to true
    case 'concat':
    case 'concatWs':
      return index === 0 && operator.name === 'concatWs' ? ' ' : '' // separator for concatWs
    case 'coalesce':
      return '' // all values start empty
    case 'case':
      return { when: true, then: '' } // case structure
    case 'dterm':
      return index === 0 ? { title: '', stereotype: [] } : true // description, term
    case 'invitation-status':
      return 'has-accepted' // default status
    case 'true':
    case 'false':
      return undefined // no arguments
    default:
      return ''
  }
}

function addArgument() {
  if (!localNode.value.arguments) localNode.value.arguments = []
  
  const operator = currentOperator.value
  const argIndex = localNode.value.arguments.length
  
  localNode.value.arguments.push({
    id: generateId(),
    type: 'literal',
    value: operator ? getDefaultValueForArgument(operator, argIndex) : ''
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





function onArgumentConvert(index: number, newOperator: string) {
  if (!localNode.value.arguments) return
  
  const argument = localNode.value.arguments[index]
  if (argument.type !== 'expression') return
  
  // Convert the operator while keeping all arguments
  const convertedArgument = {
    ...argument,
    operator: newOperator
  }
  
  localNode.value.arguments[index] = convertedArgument
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

// Argument hover management
function onArgumentMouseEnter(index: number, event: MouseEvent) {
  // Check if we're hovering over the argument wrapper itself, not a nested component
  const target = event.target as HTMLElement
  const wrapper = event.currentTarget as HTMLElement
  
  // Only show controls if hovering directly over the argument content, not nested components
  if (target === wrapper || wrapper.contains(target)) {
    const hasNestedComponent = wrapper.querySelector('.json-logic-atom, .or-operator, .and-operator')
    if (!hasNestedComponent || !hasNestedComponent.contains(target)) {
      hoveredArgumentIndex.value = index
    }
  }
}

function onArgumentMouseLeave(index: number) {
  if (hoveredArgumentIndex.value === index) {
    hoveredArgumentIndex.value = null
  }
}

// Conversion functions
function toggleConversionMenu() {
  showConversionMenu.value = !showConversionMenu.value
}

function convertToOperator(newOperator: string) {
  const convertedNode = convertOperatorNode(localNode.value, newOperator)
  localNode.value = convertedNode
  showConversionMenu.value = false
  emit('update', localNode.value)
}

// Display mode functions are provided by useDisplayMode composable

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

function handleSelect() {
  emit('select')
}

// Cleanup on unmount
onUnmounted(() => {
  // No cleanup needed for simple resize
})
</script>

<style scoped>
.json-logic-atom {
  position: relative;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  margin: 8px 2px 8px 0;
  min-width: 200px;
  max-width: calc(100vw - 40px);
  width: auto;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.2s ease;
  overflow: visible;
}

.json-logic-atom.is-resizing {
  user-select: none;
  pointer-events: auto;
  z-index: 1000;
  position: relative;
}

.json-logic-atom.is-selected {
  border: 2px solid #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.json-logic-atom .atom-body {
  padding: 12px;
  overflow: visible;
  height: auto;
  box-sizing: border-box;
}

/* Responsive behavior */
@media (max-width: 768px) {
  .json-logic-atom {
    min-width: 150px;
    margin: 4px 0;
  }
  
  .json-logic-atom[data-display-mode="inplace"] {
    width: 100%;
    max-width: none;
  }
}

@media (max-width: 480px) {
  .json-logic-atom {
    min-width: 120px;
    font-size: 14px;
  }
  
  .atom-header {
    padding: 6px 8px;
  }
  
  .operator-button {
    font-size: 12px;
    padding: 3px 8px;
  }
}

/* Collapsed state - compact horizontal and vertical */
.json-logic-atom[data-display-mode="collapsed"] {
  display: inline-block;
  margin: 4px 8px 4px 0;
  min-width: auto;
  max-width: 300px;
  width: auto;
  flex-shrink: 0;
}

.json-logic-atom[data-display-mode="collapsed"] .atom-header {
  padding: 6px 12px;
  min-height: auto;
}

.json-logic-atom[data-display-mode="collapsed"] .operator-select {
  min-width: 80px;
  font-size: 12px;
  padding: 4px 8px;
}



.json-logic-atom[data-display-mode="collapsed"] .condition-count {
  font-size: 11px;
  margin-left: 8px;
}

.json-logic-atom[data-display-mode="collapsed"] .header-controls {
  gap: 8px;
}

.json-logic-atom[data-display-mode="collapsed"] .convert-btn,
.json-logic-atom[data-display-mode="collapsed"] .delete-btn,
.json-logic-atom[data-display-mode="collapsed"] .expand-btn {
  padding: 4px 8px;
  min-width: 60px;
  font-size: 11px;
}

.json-logic-atom[data-display-mode="collapsed"] .convert-label,
.json-logic-atom[data-display-mode="collapsed"] .delete-label,
.json-logic-atom[data-display-mode="collapsed"] .expand-label {
  font-size: 10px;
}



.json-logic-atom:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.json-logic-atom .header-controls {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.json-logic-atom.is-hovered .header-controls {
  opacity: 1;
}

.json-logic-atom.is-dragging {
  opacity: 0.5;
  transform: rotate(5deg);
}

.atom-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  border-radius: 6px 6px 0 0;
  gap: 8px;
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



.drag-handle {
  cursor: grab;
  color: #64748b;
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
  flex: 1;
  margin-right: 8px;
}

.operator-select {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}

.operator-button {
  background: #f8fafc;
  border: 1px solid #d1d5db;
  color: #374151;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 4px;
  transition: all 0.2s ease;
  flex: 1;
  text-align: left;
}

.operator-button:hover {
  background: #f1f5f9;
  border-color: #9ca3af;
  color: #1f2937;
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

.expand-btn {
  background: #10b981;
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
  min-width: 80px;
  justify-content: center;
}

.expand-btn:hover {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.expand-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
}

.expand-icon {
  font-size: 14px;
  line-height: 1;
}

.expand-label {
  font-size: 12px;
}

.full-btn {
  background: #10b981;
}

.full-btn:hover {
  background: #059669;
}

/* Full-screen overlay */
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
  background: #f8fafc;
}

.fullscreen-header .spacer {
  width: 60px; /* Same width as DisplayModeButtons for centering */
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

.fullscreen-body .arguments-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.fullscreen-body .argument-wrapper {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background: #f9fafb;
}

.fullscreen-body .argument-label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
  font-size: 14px;
}

.fullscreen-body .add-arg-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.fullscreen-body .add-arg-btn {
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

.fullscreen-body .add-arg-btn:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.atom-body {
  padding: 12px;
}

.arguments-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-x: auto;
  overflow-y: visible;
  padding-bottom: 10px;
}

.arguments-container::-webkit-scrollbar {
  height: 6px;
}

.arguments-container::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.arguments-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.arguments-container::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.argument-wrapper {
  position: relative;
}

.argument-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.literal-input, .variable-input {
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

.value-input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
}

.array-input {
  padding: 8px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.array-items {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
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
  margin-top: 4px;
  align-self: flex-start;
}

.delete-item-btn {
  background: #f87171;
  color: white;
  border: none;
  border-radius: 3px;
  width: 18px;
  height: 18px;
  cursor: pointer;
  font-size: 10px;
}

.argument-controls {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.argument-controls.is-visible {
  opacity: 1;
}

.delete-arg-btn {
  background: #f87171;
  color: white;
  border: none;
  border-radius: 4px;
  width: 22px;
  height: 22px;
  cursor: pointer;
  font-size: 12px;
}

.field-name-input-wrapper {
  flex: 1;
}

/* Simplified styling - OR/AND layout handled by dedicated components */
.add-arg-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 12px;
}

/* UI hints for other operators */
.json-logic-atom[data-ui-hint*="card-list"] {
  border-left: 4px solid #6b7280;
}

.json-logic-atom[data-ui-hint*="card-in-list-of-literals"] {
  border-left: 4px solid #10b981;
}

.json-logic-atom[data-ui-hint*="card-in-subquery"] {
  border-left: 4px solid #8b5cf6;
}

.add-arg-btn {
  background: #10b981;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  align-self: flex-start;
}

.add-arg-btn:hover {
  background: #059669;
}



.condition-count {
  color: #64748b;
  font-size: 12px;
  opacity: 0.7;
  margin-left: 8px;
  flex: 1;
}

.preview-popup {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #e2e8f0;
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

.preview-text {
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 4px;
  color: #475569;
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
  .arguments-container {
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
  
  .operator-select {
    min-width: 140px;
    font-size: 13px;
  }
  
  .conversion-menu {
    min-width: 180px;
    right: -10px;
  }
}
</style>