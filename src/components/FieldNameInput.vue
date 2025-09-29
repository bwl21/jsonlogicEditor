<template>
  <div class="field-name-input">
    <div class="input-container">
      <input 
        ref="inputRef"
        v-model="localValue" 
        @input="onInput"
        :placeholder="placeholder"
        class="field-input"
        autocomplete="off"
      />
      <button 
        @click="openModal"
        class="select-field-btn"
        type="button"
        title="Select field from list"
      >
        📋
      </button>
    </div>
    
    <!-- Field Selection Modal -->
    <FieldSelectionModal
      :is-open="showModal"
      :current-value="localValue"
      @close="closeModal"
      @select="selectField"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import FieldSelectionModal from './FieldSelectionModal.vue'

interface Props {
  modelValue: string
  placeholder?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Type or click 📋 to select field (e.g., person.firstName)'
})

const emit = defineEmits<Emits>()

const inputRef = ref<HTMLInputElement>()
const localValue = ref(props.modelValue)
const showModal = ref(false)

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  localValue.value = newValue
})

// Methods
function onInput() {
  emit('update:modelValue', localValue.value)
}

function openModal() {
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

function selectField(field: string) {
  localValue.value = field
  emit('update:modelValue', field)
  closeModal()
}
</script>

<style scoped>
.field-name-input {
  position: relative;
  width: 100%;
}

.input-container {
  display: flex;
  align-items: center;
  position: relative;
}

.field-input {
  flex: 1;
  padding: 6px 8px;
  padding-right: 36px; /* Space for button */
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  font-family: 'Monaco', 'Menlo', monospace;
  background: white;
}

.field-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.field-input:hover {
  border-color: #9ca3af;
}

.select-field-btn {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #6b7280;
  border-radius: 3px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.select-field-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.select-field-btn:active {
  transform: translateY(-50%) scale(0.95);
}
</style>