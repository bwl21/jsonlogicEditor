<template>
  <div 
    class="unified-operator-header" 
    :class="{ 'header-hidden': hideOnHover && !isParentHovered && !forceShow }"
    @mouseenter="onHeaderEnter" 
    @mouseleave="onHeaderLeave"
  >
    <!-- Display mode buttons -->
    <DisplayModeButtons v-model="displayMode" />
    
    <div class="drag-handle">⋮⋮</div>
    
    <div class="operator-wrapper">
      <button 
        @click="toggleConversionMenu" 
        class="operator-button"
        :class="operatorButtonClass"
        :title="showConversionMenu ? 'Close conversion menu' : `Convert ${operatorLabel} to different operator`"
      >
        {{ operatorLabel }}
      </button>
      
      <ConversionModal
        :is-open="showConversionMenu"
        :current-type="getCurrentType()"
        :options="conversionOptions"
        @convert="$emit('convert', $event)"
        @close="showConversionMenu = false"
      />
    </div>
    
    <div class="spacer"></div>
    
    <button @click="$emit('delete')" class="delete-btn">
      ×
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import DisplayModeButtons from './DisplayModeButtons.vue'
import ConversionModal from './ConversionModal.vue'

interface Props {
  operatorLabel: string
  operatorType: 'comparison' | 'logic' | 'data' | 'expression'
  conversionOptions: Array<{
    operator: string
    label: string
    description: string
    category: string
  }>
  displayMode: 'inplace' | 'collapsed' | 'full'
  showPreview?: boolean
  hideOnHover?: boolean
  isParentHovered?: boolean
  forceShow?: boolean
}

interface Emits {
  (e: 'convert', operator: string): void
  (e: 'delete'): void
  (e: 'preview-enter'): void
  (e: 'preview-leave'): void
  (e: 'update:displayMode', mode: 'inplace' | 'collapsed' | 'full'): void
}

const props = withDefaults(defineProps<Props>(), {
  showPreview: false,
  hideOnHover: false,
  isParentHovered: false,
  forceShow: false
})

const emit = defineEmits<Emits>()

const showConversionMenu = ref(false)
const isHovered = ref(false)

// Use displayMode from props and emit changes
const displayMode = computed({
  get: () => props.displayMode,
  set: (value) => emit('update:displayMode', value)
})

const operatorButtonClass = computed(() => {
  switch (props.operatorType) {
    case 'comparison': return 'operator-button-comparison'
    case 'logic': return props.operatorLabel === 'OR' ? 'operator-button-or' : 'operator-button-and'
    case 'data': return 'operator-button-data'
    default: return 'operator-button-default'
  }
})

function toggleConversionMenu() {
  showConversionMenu.value = !showConversionMenu.value
}

function onPreviewEnter() {
  emit('preview-enter')
}

function onPreviewLeave() {
  emit('preview-leave')
}

function onHeaderEnter() {
  isHovered.value = true
  onPreviewEnter()
}

function onHeaderLeave() {
  isHovered.value = false
  onPreviewLeave()
}

function getCurrentType(): string {
  // Try to determine current type from operator label
  const label = props.operatorLabel.toLowerCase()
  
  // Data types
  if (label === 'string') return 'string'
  if (label === 'number') return 'number'
  if (label === 'boolean') return 'boolean'
  if (label === 'date') return 'date'
  if (label === 'variable') return 'variable'
  if (label === 'array') return 'array'
  if (label === 'literal') return 'literal'
  
  // Operators
  if (label === 'equals') return '=='
  if (label === 'not equals') return '!='
  if (label === 'greater than') return '>'
  if (label === 'less than') return '<'
  if (label === 'greater or equal') return '>='
  if (label === 'less or equal') return '<='
  if (label === 'and') return 'and'
  if (label === 'or') return 'or'
  
  return label
}
</script>

<style scoped>
.unified-operator-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
  border-radius: 6px 6px 0 0;
  gap: 8px;
  transition: all 0.3s ease;
}

.unified-operator-header.header-hidden {
  opacity: 0;
  height: 0;
  min-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin: 0;
  border-bottom: none;
  overflow: hidden;
}

.drag-handle {
  cursor: grab;
  color: #6b7280;
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
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid;
  transition: all 0.2s ease;
}

.operator-button:hover {
  transform: translateY(-1px);
}

/* Operator type specific styles */
.operator-button-comparison {
  background: #ede9fe;
  border-color: #8b5cf6;
  color: #7c3aed;
}

.operator-button-comparison:hover {
  background: #ddd6fe;
  border-color: #7c3aed;
}

.operator-button-or {
  background: #fef3c7;
  border-color: #f59e0b;
  color: #d97706;
}

.operator-button-or:hover {
  background: #fde68a;
  border-color: #d97706;
}

.operator-button-and {
  background: #dbeafe;
  border-color: #3b82f6;
  color: #2563eb;
}

.operator-button-and:hover {
  background: #bfdbfe;
  border-color: #2563eb;
}

.operator-button-data {
  background: #d1fae5;
  border-color: #10b981;
  color: #059669;
}

.operator-button-data:hover {
  background: #a7f3d0;
  border-color: #059669;
}

.operator-button-default {
  background: #f3f4f6;
  border-color: #9ca3af;
  color: #374151;
}

.operator-button-default:hover {
  background: #e5e7eb;
  border-color: #6b7280;
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

/* Responsive adjustments */
@media (max-width: 768px) {
  .unified-operator-header {
    padding: 6px 8px;
  }
  
  .operator-button {
    font-size: 12px;
    padding: 3px 8px;
  }
}
</style>