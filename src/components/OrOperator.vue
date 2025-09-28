<template>
  <div 
    class="or-operator"
    :class="{ 'is-dragging': isDragging }"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
  >
    <!-- Header -->
    <div class="operator-header">
      <div class="drag-handle">⋮⋮</div>
      <span class="operator-label">OR</span>
      <button @click="$emit('delete')" class="delete-btn" title="Delete">×</button>
    </div>

    <!-- Horizontal Arguments -->
    <div class="or-body">
      <div class="or-arguments">
        <div 
          v-for="(argument, index) in localNode.arguments" 
          :key="argument.id"
          class="or-argument"
        >
          <!-- OR Badge (except for last item) -->
          <div v-if="index > 0" class="or-badge">OR</div>
          
          <!-- Argument Content -->
          <div class="argument-content">
            <!-- Recursive JsonLogicAtom for nested expressions -->
            <JsonLogicAtom
              v-if="argument.type === 'expression'"
              :node="argument"
              @update="onArgumentUpdate(index, $event)"
              @delete="onArgumentDelete(index)"
            />
            
            <!-- Variable input -->
            <div v-else-if="argument.type === 'variable'" class="simple-input">
              <span class="input-type-label">var:</span>
              <FieldNameInput
                v-model="argument.value"
                @update:modelValue="onArgumentUpdate(index, argument)"
                placeholder="Field name"
                class="field-input"
              />
              <button @click="onArgumentDelete(index)" class="delete-arg-btn">×</button>
            </div>
            
            <!-- Array input -->
            <div v-else-if="argument.type === 'array'" class="simple-input">
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
            
            <!-- Literal input -->
            <div v-else class="simple-input">
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
                placeholder="Enter value"
                class="value-input"
              />
              <button @click="onArgumentDelete(index)" class="delete-arg-btn">×</button>
            </div>
          </div>
        </div>
        
        <!-- Add new condition button -->
        <div class="add-condition-wrapper">
          <button @click="addArgument" class="add-condition-btn">
            + Add Condition
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { JsonLogicNode } from '../types/JsonLogic'
import JsonLogicAtom from './JsonLogicAtom.vue'
import FieldNameInput from './FieldNameInput.vue'

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

function onArgumentTypeChange(index: number) {
  if (!localNode.value.arguments) return
  
  const argument = localNode.value.arguments[index]
  
  switch (argument.type) {
    case 'variable':
      argument.value = 'person.firstName'
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
.or-operator {
  border: 2px solid #f59e0b;
  border-radius: 8px;
  background: white;
  margin: 8px;
  min-width: 300px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.2s ease;
}

.or-operator:hover {
  border-color: #d97706;
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.or-operator.is-dragging {
  opacity: 0.5;
  transform: rotate(2deg);
}

.operator-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #fef3c7;
  border-bottom: 1px solid #f59e0b;
  border-radius: 6px 6px 0 0;
}

.drag-handle {
  cursor: grab;
  color: #92400e;
  margin-right: 8px;
  font-weight: bold;
}

.drag-handle:active {
  cursor: grabbing;
}

.operator-label {
  flex: 1;
  font-weight: bold;
  color: #92400e;
  font-size: 14px;
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

.or-body {
  padding: 16px;
}

.or-arguments {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 16px;
}

.or-argument {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
  min-width: 250px;
}

.or-badge {
  background: #f59e0b;
  color: white;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
  margin-top: 20px;
  flex-shrink: 0;
}

.argument-content {
  flex: 1;
  min-width: 0;
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
  flex-basis: 100%;
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

.add-condition-btn {
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.add-condition-btn:hover {
  background: #d97706;
}

/* Responsive */
@media (max-width: 768px) {
  .or-arguments {
    flex-direction: column;
  }
  
  .or-argument {
    flex-direction: column;
    align-items: stretch;
  }
  
  .or-badge {
    align-self: center;
    margin-top: 8px;
    margin-bottom: 8px;
  }
}
</style>