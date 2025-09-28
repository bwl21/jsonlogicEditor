<template>
  <div 
    class="json-logic-atom"
    :class="{ 'is-dragging': isDragging }"
    :data-ui-hint="currentOperator?.uiHints?.join(' ')"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
  >
    <!-- Header with operator and controls -->
    <div class="atom-header">
      <div class="drag-handle">⋮⋮</div>
      
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
      
      <button @click="$emit('delete')" class="delete-btn" title="Delete">×</button>
    </div>

    <!-- Arguments -->
    <div v-if="localNode.operator" class="atom-body">
      <div class="arguments-container">
        <div 
          v-for="(argument, index) in localNode.arguments" 
          :key="argument.id"
          class="argument-wrapper"
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
          />
          <AndOperator
            v-else-if="argument.type === 'expression' && argument.operator === 'and'"
            :node="argument"
            @update="onArgumentUpdate(index, $event)"
            @delete="onArgumentDelete(index)"
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
            <button @click="onArgumentDelete(index)" class="delete-arg-btn">×</button>
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
            <button @click="onArgumentDelete(index)" class="delete-arg-btn">×</button>
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
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { JsonLogicNode, JsonLogicOperator } from '../types/JsonLogic'
import { OPERATORS } from '../types/JsonLogic'
import FieldNameInput from './FieldNameInput.vue'
import OrOperator from './OrOperator.vue'
import AndOperator from './AndOperator.vue'

interface Props {
  node: JsonLogicNode
}

interface Emits {
  (e: 'update', node: JsonLogicNode): void
  (e: 'delete'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localNode = ref<JsonLogicNode>({ ...props.node })
const isDragging = ref(false)

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
.json-logic-atom {
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  margin: 8px;
  min-width: 200px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.2s ease;
}

.json-logic-atom:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
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
  border-radius: 4px;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}

.delete-btn:hover {
  background: #dc2626;
}

.atom-body {
  padding: 12px;
}

.arguments-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
</style>