<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Convert to...</h3>
        <button @click="closeModal" class="close-btn">×</button>
      </div>
      
      <div class="modal-body">
        <!-- Search -->
        <div class="search-section">
          <input 
            v-model="searchQuery"
            placeholder="Search conversions..."
            class="search-input"
            ref="searchInput"
          />
        </div>
        
        <!-- Categories -->
        <div class="categories-section">
          <div 
            v-for="category in filteredCategories" 
            :key="category.name"
            class="category-group"
          >
            <h4 class="category-title">{{ category.label }}</h4>
            <div class="conversion-options">
              <button
                v-for="option in category.options"
                :key="option.operator"
                @click="selectConversion(option.operator)"
                class="conversion-option"
                :class="{ 'current': option.operator === currentType }"
              >
                <div class="option-header">
                  <span class="option-label">{{ option.label }}</span>
                  <span v-if="option.operator === currentType" class="current-badge">Current</span>
                </div>
                <div class="option-description">{{ option.description }}</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

interface ConversionOption {
  operator: string
  label: string
  description: string
  category: string
}

interface Props {
  isOpen: boolean
  currentType: string
  options: ConversionOption[]
}

interface Emits {
  (e: 'close'): void
  (e: 'convert', operator: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const searchQuery = ref('')
const searchInput = ref<HTMLInputElement>()

// Watch for modal opening to focus search
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      searchInput.value?.focus()
    })
  }
})

const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options
  
  const query = searchQuery.value.toLowerCase()
  return props.options.filter(option => 
    option.label.toLowerCase().includes(query) ||
    option.description.toLowerCase().includes(query)
  )
})

const filteredCategories = computed(() => {
  const categories = new Map<string, { name: string; label: string; options: ConversionOption[] }>()
  
  filteredOptions.value.forEach(option => {
    if (!categories.has(option.category)) {
      categories.set(option.category, {
        name: option.category,
        label: getCategoryLabel(option.category),
        options: []
      })
    }
    categories.get(option.category)!.options.push(option)
  })
  
  return Array.from(categories.values()).sort((a, b) => {
    const order = ['data', 'comparison', 'logic', 'arithmetic', 'string', 'control', 'special']
    return order.indexOf(a.name) - order.indexOf(b.name)
  })
})

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'data': 'Data Types',
    'comparison': 'Comparisons',
    'logic': 'Logic Operations',
    'arithmetic': 'Math Operations',
    'string': 'String Operations',
    'control': 'Control Flow',
    'special': 'Special'
  }
  return labels[category] || category
}

function selectConversion(operator: string) {
  emit('convert', operator)
  closeModal()
}

function closeModal() {
  searchQuery.value = ''
  emit('close')
}

// Handle escape key
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeModal()
  }
}

// Add/remove event listener
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    document.addEventListener('keydown', handleKeydown)
  } else {
    document.removeEventListener('keydown', handleKeydown)
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #374151;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.search-section {
  margin-bottom: 24px;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.categories-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.category-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.conversion-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 8px;
}

.conversion-option {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 16px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.conversion-option:hover {
  border-color: #3b82f6;
  background: #f8fafc;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.conversion-option.current {
  border-color: #10b981;
  background: #f0fdf4;
}

.option-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.option-label {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.current-badge {
  background: #10b981;
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.option-description {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
}

/* Responsive */
@media (max-width: 640px) {
  .modal-overlay {
    padding: 10px;
  }
  
  .modal-content {
    max-height: 90vh;
  }
  
  .modal-header {
    padding: 16px 20px;
  }
  
  .modal-body {
    padding: 16px 20px;
  }
  
  .conversion-options {
    grid-template-columns: 1fr;
  }
}
</style>