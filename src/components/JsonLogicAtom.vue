<template>
  <!-- Render as OrOperator if root operator is 'or' -->
  <OrOperator
    v-if="localNode.type === 'expression' && localNode.operator === 'or'"
    :node="localNode"
    @update="$emit('update', $event)"
    @delete="$emit('delete')"
    @convert="$emit('convert', $event)"
  />
  <!-- Render as AndOperator if root operator is 'and' -->
  <AndOperator
    v-else-if="localNode.type === 'expression' && localNode.operator === 'and'"
    :node="localNode"
    @update="$emit('update', $event)"
    @delete="$emit('delete')"
    @convert="$emit('convert', $event)"
  />
  <!-- Default atom rendering for all other cases -->
  <div 
    v-else
    class="json-logic-atom"
    :class="{ 'is-dragging': isDragging, 'is-hovered': isDirectlyHovered }"
    :data-ui-hint="currentOperator?.uiHints?.join(' ')"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <!-- Header with operator and controls -->
    <div class="atom-header" @mouseenter="onPreviewEnter" @mouseleave="onPreviewLeave">
      <div class="drag-handle">⋮⋮</div>
      
      <button 
        v-if="localNode.operator && localNode.arguments && localNode.arguments.length > 0" 
        @click="toggleCollapse" 
        class="collapse-btn" 
        :title="isCollapsed ? 'Expand' : 'Collapse'"
      >
        {{ isCollapsed ? '▶' : '▼' }}
      </button>
      
      <select 
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
      
      <span v-if="isCollapsed && localNode.operator" class="condition-count">
        ({{ localNode.arguments?.length || 0 }} {{ localNode.arguments?.length === 1 ? 'argument' : 'arguments' }})
      </span>
      
      <div class="header-controls">
        <div class="conversion-dropdown" v-if="conversionOptions.length > 0">
          <button @click="toggleConversionMenu" class="convert-btn" :title="showConversionMenu ? 'Close conversion menu' : `Convert ${localNode.operator || 'operator'} to different type`">
            <span class="convert-icon">⟲</span>
            <span class="convert-label">Convert</span>
          </button>
          <div v-if="showConversionMenu" class="conversion-menu">
            <button 
              v-for="option in conversionOptions"
              :key="option.operator"
              @click="convertToOperator(option.operator)"
              class="conversion-option"
              :title="`Convert to ${option.label}: ${option.description}`"
            >
              <span class="option-label">{{ option.label }}</span>
              <span class="option-category">({{ option.category }})</span>
            </button>
          </div>
        </div>
        <button @click="$emit('delete')" class="delete-btn" :title="`Delete this ${localNode.operator || 'operator'}`">
          <span class="delete-icon">×</span>
          <span class="delete-label">Delete</span>
        </button>
      </div>
    </div>

    <!-- Preview when collapsed and hovered -->
    <div v-if="isCollapsed && showPreview && localNode.operator" class="preview-popup">
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
    <div v-if="localNode.operator && !isCollapsed" class="atom-body">
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
          
          <!-- Variable input with autocomplete -->
          <div v-else-if="argument.type === 'variable'" class="variable-input">
            <span class="input-type-label">var:</span>
            <FieldNameInput
              v-model="argument.value"
              @update:modelValue="onArgumentUpdate(index, argument)"
              placeholder="Field name (e.g., person.firstName)"
              class="field-name-input-wrapper"
            />
            <div class="argument-controls" :class="{ 'is-visible': hoveredArgumentIndex === index }">
              <button @click="onArgumentDelete(index)" class="delete-arg-btn">×</button>
            </div>
          </div>
          
          <!-- Array input -->
          <div v-else-if="argument.type === 'array'" class="array-input">
            <span class="input-type-label">array:</span>
            <div class="array-items">
              <div v-for="(item, itemIndex) in argument.items" :key="itemIndex" class="array-item">
                <input 
                  v-model="item.value" 
                  @input="onArrayItemUpdate(index, itemIndex, item)"
                  placeholder="Array item"
                  class="array-item-input"
                />
                <button @click="removeArrayItem(index, itemIndex)" class="delete-item-btn">×</button>
              </div>
              <button @click="addArrayItem(index)" class="add-item-btn">+ Item</button>
            </div>
            <div class="argument-controls" :class="{ 'is-visible': hoveredArgumentIndex === index }">
              <button @click="onArgumentDelete(index)" class="delete-arg-btn">×</button>
            </div>
          </div>
          
          <!-- Literal input with type selection -->
          <div v-else class="literal-input">
            <select v-model="argument.type" @change="onArgumentTypeChange(index)" class="type-select">
              <option value="literal">Literal</option>
              <option value="variable">Variable</option>
              <option value="array">Array</option>
              <option value="expression">Expression</option>
            </select>
            <input 
              v-if="argument.type === 'literal'"
              v-model="argument.value" 
              @input="onArgumentUpdate(index, argument)"
              :placeholder="getLiteralPlaceholder(argument, index)"
              class="value-input"
              :type="getLiteralInputType(argument)"
            />
            <div class="argument-controls" :class="{ 'is-visible': hoveredArgumentIndex === index }">
              <button @click="onArgumentDelete(index)" class="delete-arg-btn">×</button>
            </div>
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
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { JsonLogicNode, JsonLogicOperator } from '../types/JsonLogic'
import { OPERATORS } from '../types/JsonLogic'
import FieldNameInput from './FieldNameInput.vue'
import OrOperator from './OrOperator.vue'
import AndOperator from './AndOperator.vue'
import { getConversionOptions, convertOperatorNode } from '../utils/operatorConversion'

interface Props {
  node: JsonLogicNode
}

interface Emits {
  (e: 'update', node: JsonLogicNode): void
  (e: 'delete'): void
  (e: 'convert', operator: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localNode = ref<JsonLogicNode>({ ...props.node })
const isDragging = ref(false)
const isDirectlyHovered = ref(false)
const hoveredArgumentIndex = ref<number | null>(null)
const showConversionMenu = ref(false)
const isCollapsed = ref(false)
const showPreview = ref(false)

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

function getLiteralPlaceholder(argument: JsonLogicNode, index: number): string {
  if (argument.type === 'variable') return 'Field name'
  
  // Provide context-specific placeholders based on current operator and argument position
  const operator = currentOperator.value
  if (operator?.argumentLabels && operator.argumentLabels[index]) {
    const label = operator.argumentLabels[index].toLowerCase()
    if (label.includes('status')) return 'e.g., has-accepted, is-invited'
    if (label.includes('separator')) return 'e.g., ", " or " - "'
    if (label.includes('email')) return 'e.g., john@example.com'
    if (label.includes('name')) return 'e.g., John, Admin'
    if (label.includes('age')) return 'e.g., 18, 65'
    if (label.includes('date')) return 'e.g., 2023-01-01'
  }
  
  return 'Enter value (text, number, true/false)'
}

function getLiteralInputType(argument: JsonLogicNode): string {
  if (typeof argument.value === 'number') return 'number'
  if (typeof argument.value === 'boolean') return 'checkbox'
  return 'text'
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

function onArgumentTypeChange(index: number) {
  if (!localNode.value.arguments) return
  
  const argument = localNode.value.arguments[index]
  
  // Reset value based on new type
  switch (argument.type) {
    case 'variable':
      argument.value = ''
      break
    case 'array':
      argument.items = [{ id: generateId(), type: 'literal', value: '' }]
      delete argument.value
      break
    case 'expression':
      argument.operator = ''
      argument.arguments = []
      delete argument.value
      break
    case 'literal':
    default:
      argument.value = ''
      delete argument.items
      delete argument.operator
      delete argument.arguments
      break
  }
  
  emit('update', localNode.value)
}

function addArrayItem(argumentIndex: number) {
  if (!localNode.value.arguments) return
  
  const argument = localNode.value.arguments[argumentIndex]
  if (argument.type !== 'array') return
  
  if (!argument.items) argument.items = []
  
  argument.items.push({
    id: generateId(),
    type: 'literal',
    value: ''
  })
  
  emit('update', localNode.value)
}

function removeArrayItem(argumentIndex: number, itemIndex: number) {
  if (!localNode.value.arguments) return
  
  const argument = localNode.value.arguments[argumentIndex]
  if (argument.type !== 'array' || !argument.items) return
  
  argument.items.splice(itemIndex, 1)
  emit('update', localNode.value)
}

function onArrayItemUpdate(argumentIndex: number, itemIndex: number, updatedItem: JsonLogicNode) {
  if (!localNode.value.arguments) return
  
  const argument = localNode.value.arguments[argumentIndex]
  if (argument.type !== 'array' || !argument.items) return
  
  argument.items[itemIndex] = updatedItem
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

// Collapse management
function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}

function onPreviewEnter() {
  if (isCollapsed.value) {
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
</script>

<style scoped>
.json-logic-atom {
  position: relative;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  margin: 8px 0;
  min-width: 200px;
  width: 100%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.2s ease;
  overflow: visible;
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
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto;
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

.conversion-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 2px solid #64748b;
  border-radius: 8px;
  box-shadow: 0 8px 25px rgba(100, 116, 139, 0.15);
  z-index: 1000;
  min-width: 160px;
  max-height: 250px;
  overflow-y: auto;
  backdrop-filter: blur(10px);
}

.conversion-menu::before {
  content: '';
  position: absolute;
  top: -8px;
  right: 20px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid #64748b;
}

.conversion-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  padding: 10px 14px;
  text-align: left;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 12px;
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.2s ease;
}

.conversion-option:hover {
  background: #f1f5f9;
  transform: translateX(4px);
}

.conversion-option:active {
  background: #e2e8f0;
  transform: translateX(2px);
}

.conversion-option:last-child {
  border-bottom: none;
}

.option-label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 2px;
}

.option-category {
  font-size: 10px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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

.operator-select {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  margin-right: 8px;
}

.delete-btn {
  background: #ef4444;
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

.delete-btn:hover {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.delete-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
}

.delete-icon {
  font-size: 16px;
  line-height: 1;
}

.delete-label {
  font-size: 12px;
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

.collapse-btn {
  background: rgba(100, 116, 139, 0.1);
  border: 1px solid rgba(100, 116, 139, 0.2);
  color: #64748b;
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
  background: rgba(100, 116, 139, 0.2);
  border-color: rgba(100, 116, 139, 0.3);
  transform: translateY(-1px);
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