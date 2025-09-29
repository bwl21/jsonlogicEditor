<template>
  <div v-if="isOpen" class="conversion-menu">
    <div class="search-section">
      <input
        ref="searchInput"
        v-model="searchTerm"
        type="text"
        placeholder="Search operators..."
        class="search-input"
        @keydown.escape="$emit('close')"
      />
    </div>
    <div class="conversion-options">
      <div
        v-for="option in filteredOptions"
        :key="option.operator"
        class="conversion-option"
        @click="$emit('convert', option.operator)"
      >
        <div class="option-header">
          <span class="option-label">{{ option.label }}</span>
          <span class="option-operator">{{ option.operator }}</span>
        </div>
        <div class="option-description">{{ option.description }}</div>
        <div class="option-category">{{ option.category }}</div>
      </div>
      <div v-if="filteredOptions.length === 0" class="no-results">
        No operators found matching "{{ searchTerm }}"
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

interface ConversionOption {
  label: string
  operator: string
  category: string
  description: string
}

interface Props {
  isOpen: boolean
  options: ConversionOption[]
}

interface Emits {
  (e: 'close'): void
  (e: 'convert', operator: string): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

const searchTerm = ref('')
const searchInput = ref<HTMLInputElement | null>(null)

const filteredOptions = computed(() => {
  if (!searchTerm.value.trim()) {
    return props.options
  }
  
  const search = searchTerm.value.toLowerCase()
  return props.options.filter(option => 
    option.label.toLowerCase().includes(search) ||
    option.operator.toLowerCase().includes(search) ||
    option.category.toLowerCase().includes(search) ||
    option.description.toLowerCase().includes(search)
  )
})

// Auto-focus search input when menu opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    searchTerm.value = ''
    nextTick(() => {
      searchInput.value?.focus()
    })
  }
})
</script>

<style scoped>
.conversion-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 300px;
  max-height: 400px;
  overflow: hidden;
}

.search-section {
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.search-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 14px;
  outline: none;
}

.search-input:focus {
  border-color: #007acc;
  box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
}

.conversion-options {
  max-height: 320px;
  overflow-y: auto;
}

.conversion-option {
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.conversion-option:hover {
  background-color: #f5f5f5;
}

.conversion-option:last-child {
  border-bottom: none;
}

.option-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.option-label {
  font-weight: 500;
  color: #333;
}

.option-operator {
  font-family: monospace;
  background-color: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
  color: #666;
}

.option-description {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.option-category {
  font-size: 11px;
  color: #999;
  text-transform: uppercase;
}

.no-results {
  padding: 16px;
  text-align: center;
  color: #999;
  font-style: italic;
}
</style>