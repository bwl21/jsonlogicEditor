<template>
  <div class="field-name-input">
    <input 
      ref="inputRef"
      v-model="localValue" 
      @input="onInput"
      @focus="showSuggestions = true"
      @blur="onBlur"
      @keydown="onKeyDown"
      :placeholder="placeholder"
      class="field-input"
      autocomplete="off"
    />
    
    <!-- Suggestions dropdown -->
    <div v-if="showSuggestions && filteredFields.length > 0" class="suggestions-dropdown">
      <div 
        v-for="(field, index) in filteredFields" 
        :key="field"
        :class="['suggestion-item', { 'highlighted': index === highlightedIndex }]"
        @mousedown="selectField(field)"
        @mouseenter="highlightedIndex = index"
      >
        <span class="field-name">{{ field }}</span>
        <span class="field-category">{{ getFieldCategory(field) }}</span>
      </div>
      
      <div v-if="filteredFields.length === 0 && localValue" class="no-suggestions">
        No matching fields found
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { FIELD_NAMES } from '../types/JsonLogic'

interface Props {
  modelValue: string
  placeholder?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Enter field name (e.g., person.firstName)'
})

const emit = defineEmits<Emits>()

const inputRef = ref<HTMLInputElement>()
const localValue = ref(props.modelValue)
const showSuggestions = ref(false)
const highlightedIndex = ref(-1)

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  localValue.value = newValue
})

// Computed properties
const filteredFields = computed(() => {
  if (!localValue.value) return FIELD_NAMES.slice(0, 20) // Show first 20 when empty
  
  const searchTerm = localValue.value.toLowerCase()
  return FIELD_NAMES
    .filter(field => field.toLowerCase().includes(searchTerm))
    .slice(0, 10) // Limit to 10 suggestions
})

// Methods
function onInput() {
  emit('update:modelValue', localValue.value)
  showSuggestions.value = true
  highlightedIndex.value = -1
}

function onBlur() {
  // Delay hiding to allow click on suggestions
  setTimeout(() => {
    showSuggestions.value = false
  }, 150)
}

function onKeyDown(event: KeyboardEvent) {
  if (!showSuggestions.value || filteredFields.value.length === 0) return
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      highlightedIndex.value = Math.min(highlightedIndex.value + 1, filteredFields.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1)
      break
    case 'Enter':
      event.preventDefault()
      if (highlightedIndex.value >= 0) {
        selectField(filteredFields.value[highlightedIndex.value])
      }
      break
    case 'Escape':
      showSuggestions.value = false
      highlightedIndex.value = -1
      break
  }
}

function selectField(field: string) {
  localValue.value = field
  emit('update:modelValue', field)
  showSuggestions.value = false
  highlightedIndex.value = -1
  
  nextTick(() => {
    inputRef.value?.focus()
  })
}

function getFieldCategory(field: string): string {
  const parts = field.split('.')
  if (parts.length >= 2) {
    const entity = parts[0]
    switch (entity) {
      case 'person': return 'Person'
      case 'ctgroup': return 'Group'
      case 'groupmember': return 'Member'
      case 'groupmemberfield': return 'Member Field'
      case 'groupmemberfieldvalue': return 'Field Value'
      case 'relationship': return 'Relationship'
      case 'transaction': return 'Transaction'
      case 'status': return 'Status'
      case 'role': return 'Role'
      case 'grouptype': return 'Group Type'
      case 'groupstatus': return 'Group Status'
      default: return 'Other'
    }
  }
  return 'Field'
}
</script>

<style scoped>
.field-name-input {
  position: relative;
  width: 100%;
}

.field-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  font-family: 'Monaco', 'Menlo', monospace;
}

.field-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-top: none;
  border-radius: 0 0 6px 6px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.suggestion-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.1s ease;
}

.suggestion-item:hover,
.suggestion-item.highlighted {
  background-color: #f3f4f6;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.field-name {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  color: #1f2937;
  font-weight: 500;
}

.field-category {
  font-size: 11px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.no-suggestions {
  padding: 12px;
  text-align: center;
  color: #6b7280;
  font-size: 13px;
  font-style: italic;
}

/* Scrollbar styling */
.suggestions-dropdown::-webkit-scrollbar {
  width: 6px;
}

.suggestions-dropdown::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.suggestions-dropdown::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.suggestions-dropdown::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>