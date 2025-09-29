<template>
  <div class="json-logic-editor" @click="clearSelection">
    <div class="editor-header">
      <div class="header-title">
        <h2>JsonLogic Visual Editor</h2>
        <div class="keyboard-shortcuts">
          <span class="shortcut-hint">Ctrl+Z: Undo | Ctrl+Y / Ctrl+Shift+Z: Redo</span>
          <span v-if="isUndoRedoOperation" class="operation-indicator">⟳ Processing...</span>
        </div>
      </div>
      <div class="header-controls">
        <div class="undo-redo-group">
          <button 
            @click="performUndo" 
            :disabled="!canUndo"
            :title="canUndo ? `Undo: ${undoDescription}` : 'Nothing to undo'"
            class="undo-btn"
          >
            ↶ Undo
          </button>
          <button 
            @click="performRedo" 
            :disabled="!canRedo"
            :title="canRedo ? `Redo: ${redoDescription}` : 'Nothing to redo'"
            class="redo-btn"
          >
            ↷ Redo
          </button>
        </div>
        <div class="editor-actions">
          <button @click="addNewRule" class="add-rule-btn">+ Add Rule</button>
          <button @click="exportJson" class="export-btn">Export JSON</button>
          <button @click="importJson" class="import-btn">Import JSON</button>
          <button @click="clearAll" class="clear-btn">Clear All</button>
          <div class="debug-dropdown">
            <button @click="toggleDebugInfo" class="debug-btn" :class="{ active: showDebugInfo }">
              🐛 Debug
            </button>
            
            <!-- Debug Popup -->
            <div v-if="showDebugInfo" class="debug-popup">
              <div class="debug-popup-header">
                <h4>Undo/Redo Debug</h4>
                <button @click="showDebugInfo = false" class="close-debug-btn">×</button>
              </div>
              
              <div class="debug-stats">
                <div class="debug-stat">
                  <label>History:</label>
                  <span>{{ debugStats.current + 1 }} / {{ debugStats.total }} (max: {{ debugStats.maxSize }})</span>
                </div>
                <div class="debug-stat">
                  <label>Storage:</label>
                  <span>{{ Math.round(debugStats.storageSize / 1024) }} KB</span>
                </div>
                <div class="debug-stat">
                  <label>Can Undo:</label>
                  <span :class="{ 'status-yes': debugStats.canUndo, 'status-no': !debugStats.canUndo }">
                    {{ debugStats.canUndo ? 'Yes' : 'No' }}
                  </span>
                </div>
                <div class="debug-stat">
                  <label>Can Redo:</label>
                  <span :class="{ 'status-yes': debugStats.canRedo, 'status-no': !debugStats.canRedo }">
                    {{ debugStats.canRedo ? 'Yes' : 'No' }}
                  </span>
                </div>
                <div class="debug-stat">
                  <label>Current:</label>
                  <span>{{ undoRedoManager.getCurrentDescription() }}</span>
                </div>
              </div>
              
              <div class="debug-actions">
                <button @click="undoRedoManager.clearHistory(); updateUndoRedoState()" class="debug-clear-btn">
                  Clear History
                </button>
                <button @click="runUndoRedoTest" class="debug-test-btn">
                  Run Test
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main editing area -->
    <div 
      class="editor-canvas"
      @drop="onDrop"
      @dragover="onDragOver"
      @dragenter="onDragEnter"
      :class="{ 'drag-over': isDragOver }"
    >
      <div v-if="rules.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <h3>No rules yet</h3>
        <p>Click "Add Rule" to start building your JsonLogic expression</p>
      </div>

      <div v-else class="rules-container">
        <!-- Debug info -->
        <!-- <div style="background: #f0f0f0; padding: 10px; margin: 10px; font-family: monospace; font-size: 12px;">
          Debug: {{ rules.map(r => ({ id: r.id, operator: r.operator, type: r.type })) }}
        </div> -->
        
        <!-- Use specific operator components for better layout -->
        <OrOperator
          v-for="rule in orRules"
          :key="rule.id"
          :node="rule"
          :is-selected="isComponentSelected(rule.id)"
          @update="onRuleUpdate(rules.findIndex(r => r.id === rule.id), $event)"
          @delete="onRuleDelete(rules.findIndex(r => r.id === rule.id))"
          @convert="onRuleConvert(rules.findIndex(r => r.id === rule.id), $event)"
          @select="selectComponent(rule.id)"
        />
        <AndOperator
          v-for="rule in andRules"
          :key="rule.id"
          :node="rule"
          :is-selected="isComponentSelected(rule.id)"
          @update="onRuleUpdate(rules.findIndex(r => r.id === rule.id), $event)"
          @delete="onRuleDelete(rules.findIndex(r => r.id === rule.id))"
          @convert="onRuleConvert(rules.findIndex(r => r.id === rule.id), $event)"
          @select="selectComponent(rule.id)"
        />
        <!-- Generic component for other operators -->
        <JsonLogicAtom
          v-for="rule in otherRules"
          :key="rule.id"
          :node="rule"
          :is-selected="isComponentSelected(rule.id)"
          @update="onRuleUpdate(rules.findIndex(r => r.id === rule.id), $event)"
          @delete="onRuleDelete(rules.findIndex(r => r.id === rule.id))"
          @select="selectComponent(rule.id)"
        />
      </div>
    </div>



    <!-- JSON Output Panel -->
    <div class="output-panel" v-if="showOutput">
      <div class="panel-header">
        <h3>Generated JsonLogic</h3>
        <button @click="showOutput = false" class="close-panel-btn">×</button>
      </div>
      <pre class="json-output">{{ formattedJson }}</pre>
      <div class="panel-actions">
        <button @click="copyToClipboard" class="copy-btn">Copy to Clipboard</button>
        <button @click="validateJson" class="validate-btn">Validate</button>
      </div>
    </div>

    <!-- Import Modal -->
    <div v-if="showImportModal" class="modal-overlay" @click="showImportModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Import JsonLogic</h3>
          <button @click="showImportModal = false" class="close-modal-btn">×</button>
        </div>
        <div class="modal-body">
          <textarea 
            v-model="importText" 
            placeholder="Paste your JsonLogic JSON here..."
            class="import-textarea"
          ></textarea>
        </div>
        <div class="modal-actions">
          <button @click="showImportModal = false" class="cancel-btn">Cancel</button>
          <button @click="processImport" class="import-confirm-btn">Import</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import JsonLogicAtom from './JsonLogicAtom.vue'
import OrOperator from './OrOperator.vue'
import AndOperator from './AndOperator.vue'
import type { JsonLogicNode } from '../types/JsonLogic'
import { undoRedoManager } from '../utils/undoRedoManager'

const rules = ref<JsonLogicNode[]>([])
const isDragOver = ref(false)
const showOutput = ref(false)
const showImportModal = ref(false)
const importText = ref('')
const selectedComponentId = ref<string | null>(null)

// Undo/Redo state
const canUndo = ref(false)
const canRedo = ref(false)
const undoDescription = ref('')
const redoDescription = ref('')
const isUndoRedoOperation = ref(false)
const showDebugInfo = ref(false)
let saveStateTimeout: number | null = null

// Computed properties
const formattedJson = computed(() => {
  if (rules.value.length === 0) return '{}'
  
  if (rules.value.length === 1) {
    return JSON.stringify(convertToJsonLogic(rules.value[0]), null, 2)
  }
  
  // Multiple rules - wrap in AND
  return JSON.stringify({
    and: rules.value.map(rule => convertToJsonLogic(rule))
  }, null, 2)
})

const orRules = computed(() => rules.value.filter(r => r.operator === 'or'))
const andRules = computed(() => rules.value.filter(r => r.operator === 'and'))
const otherRules = computed(() => rules.value.filter(r => r.operator !== 'or' && r.operator !== 'and'))

const debugStats = computed(() => undoRedoManager.getHistoryStats())

// Watch for operator changes to force re-render
watch(rules, () => {
  // Force reactivity update when rules change
  nextTick()
  
  // Save state for undo/redo (with debouncing for general edits)
  if (!isUndoRedoOperation.value) {
    saveCurrentStateDebounced('Edit rules', 1000)
  }
}, { deep: true })

// Update undo/redo button states
function updateUndoRedoState() {
  canUndo.value = undoRedoManager.canUndo()
  canRedo.value = undoRedoManager.canRedo()
  undoDescription.value = undoRedoManager.getUndoDescription()
  redoDescription.value = undoRedoManager.getRedoDescription()
}

function toggleDebugInfo() {
  showDebugInfo.value = !showDebugInfo.value
}

function runUndoRedoTest() {
  console.log('🧪 Running Undo/Redo Test...')
  
  // Clear existing rules
  rules.value = []
  saveCurrentState('Test: Clear all')
  
  // Add first rule
  addNewRule()
  console.log('✅ Added first rule')
  
  // Add second rule
  addNewRule()
  console.log('✅ Added second rule')
  
  // Test undo
  performUndo()
  console.log('↶ Undid last action - should have 1 rule:', rules.value.length === 1 ? '✅' : '❌')
  
  // Test undo again
  performUndo()
  console.log('↶ Undid again - should have 0 rules:', rules.value.length === 0 ? '✅' : '❌')
  
  // Test redo
  performRedo()
  console.log('↷ Redid action - should have 1 rule:', rules.value.length === 1 ? '✅' : '❌')
  
  // Test redo again
  performRedo()
  console.log('↷ Redid again - should have 2 rules:', rules.value.length === 2 ? '✅' : '❌')
  
  console.log('🧪 Test completed! Check console for results.')
  alert('Undo/Redo test completed! Check browser console for detailed results.')
}

// Methods
function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

function addNewRule() {
  const newRule: JsonLogicNode = {
    id: generateId(),
    type: 'expression',
    operator: '',
    arguments: []
  }
  
  rules.value.push(newRule)
  saveCurrentState('Add new rule')
}

// Undo/Redo functions
function saveCurrentState(description: string) {
  undoRedoManager.saveState(rules.value, description)
  updateUndoRedoState()
}

function saveCurrentStateDebounced(description: string, delay: number = 500) {
  if (saveStateTimeout) {
    clearTimeout(saveStateTimeout)
  }
  
  saveStateTimeout = window.setTimeout(() => {
    saveCurrentState(description)
    saveStateTimeout = null
  }, delay)
}

function performUndo() {
  try {
    const previousState = undoRedoManager.undo()
    if (previousState) {
      isUndoRedoOperation.value = true
      rules.value = previousState.rules
      updateUndoRedoState()
      
      // Reset flag after Vue updates
      nextTick(() => {
        isUndoRedoOperation.value = false
      })
      
      console.log('↶ Undo successful:', previousState.description)
    }
  } catch (error) {
    console.error('Undo failed:', error)
    isUndoRedoOperation.value = false
  }
}

function performRedo() {
  try {
    const nextState = undoRedoManager.redo()
    if (nextState) {
      isUndoRedoOperation.value = true
      rules.value = nextState.rules
      updateUndoRedoState()
      
      // Reset flag after Vue updates
      nextTick(() => {
        isUndoRedoOperation.value = false
      })
      
      console.log('↷ Redo successful:', nextState.description)
    }
  } catch (error) {
    console.error('Redo failed:', error)
    isUndoRedoOperation.value = false
  }
}

function onRuleUpdate(index: number, updatedRule: JsonLogicNode) {
  const oldRule = rules.value[index]
  rules.value[index] = updatedRule
  
  // Don't save state during undo/redo operations
  if (!isUndoRedoOperation.value) {
    // Determine what changed for better description
    let description = 'Update rule'
    if (oldRule.operator !== updatedRule.operator) {
      description = `Change operator to ${updatedRule.operator}`
    } else if (oldRule.arguments?.length !== updatedRule.arguments?.length) {
      description = 'Modify arguments'
    }
    
    saveCurrentState(description)
  }
}

function onRuleDelete(index: number) {
  rules.value.splice(index, 1)
  saveCurrentState('Delete rule')
}

function onRuleConvert(index: number, newOperator: string) {
  if (index < 0 || index >= rules.value.length) return
  
  // Convert the operator while keeping all arguments and structure
  const convertedRule = {
    ...rules.value[index],
    operator: newOperator
  }
  
  rules.value[index] = convertedRule
  saveCurrentState(`Convert to ${newOperator}`)
}

function clearAll() {
  if (confirm('Are you sure you want to clear all rules?')) {
    rules.value = []
    saveCurrentState('Clear all rules')
  }
}

// Drag and Drop
function onDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

function onDragEnter(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = true
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = false
  
  if (event.dataTransfer) {
    try {
      const data = event.dataTransfer.getData('application/json')
      const droppedNode: JsonLogicNode = JSON.parse(data)
      
      // Add as new rule if dropped on canvas
      const newRule = { ...droppedNode, id: generateId() }
      rules.value.push(newRule)
      saveCurrentState('Drop rule')
    } catch (error) {
      console.error('Failed to parse dropped data:', error)
    }
  }
}

// Selection management
function selectComponent(componentId: string) {
  selectedComponentId.value = componentId
}

function clearSelection() {
  selectedComponentId.value = null
}

function isComponentSelected(componentId: string): boolean {
  return selectedComponentId.value === componentId
}

// JSON Export/Import
function exportJson() {
  showOutput.value = true
}

function importJson() {
  showImportModal.value = true
  importText.value = ''
}

function processImport() {
  try {
    const parsed = JSON.parse(importText.value)
    const converted = convertFromJsonLogic(parsed)
    
    if (Array.isArray(converted)) {
      rules.value = converted
    } else {
      rules.value = [converted]
    }
    
    showImportModal.value = false
    saveCurrentState('Import JSON')
  } catch (error) {
    alert('Invalid JSON format. Please check your input.')
  }
}

function copyToClipboard() {
  navigator.clipboard.writeText(formattedJson.value).then(() => {
    alert('JSON copied to clipboard!')
  })
}

function validateJson() {
  try {
    JSON.parse(formattedJson.value)
    alert('JSON is valid!')
  } catch (error) {
    alert('JSON is invalid: ' + error)
  }
}

// Conversion functions
function convertToJsonLogic(node: JsonLogicNode): any {
  switch (node.type) {
    case 'literal':
      return parseLiteralValue(node.value)
    
    case 'variable':
      return { var: node.value }
    
    case 'array':
      if (node.items) {
        return node.items.map(item => convertToJsonLogic(item))
      }
      return []
    
    case 'expression':
      if (node.operator && node.arguments) {
        const args = node.arguments.map(arg => convertToJsonLogic(arg))
        
        // Special handling for single-argument operators
        if (args.length === 1 && ['!', 'var'].includes(node.operator)) {
          return { [node.operator]: args[0] }
        }
        
        return { [node.operator]: args }
      }
      return null
    
    default:
      return null
  }
}

function parseLiteralValue(value: any): any {
  if (value === null || value === undefined || value === '') {
    return value
  }
  
  if (typeof value === 'string') {
    // Try to parse as boolean
    if (value.toLowerCase() === 'true') return true
    if (value.toLowerCase() === 'false') return false
    if (value.toLowerCase() === 'null') return null
    
    // Try to parse as number
    const numValue = Number(value)
    if (!isNaN(numValue) && value.trim() !== '') {
      return numValue
    }
  }
  
  return value
}

function convertFromJsonLogic(json: any): JsonLogicNode {
  // Handle primitive values
  if (typeof json === 'string' || typeof json === 'number' || typeof json === 'boolean' || json === null) {
    return {
      id: generateId(),
      type: 'literal',
      value: json
    }
  }
  
  // Handle arrays
  if (Array.isArray(json)) {
    return {
      id: generateId(),
      type: 'array',
      items: json.map(item => convertFromJsonLogic(item))
    }
  }
  
  // Handle objects (JsonLogic expressions)
  if (typeof json === 'object' && json !== null) {
    const operators = Object.keys(json)
    
    if (operators.length === 1) {
      const operator = operators[0]
      const args = json[operator]
      
      // Special case for 'var' operator
      if (operator === 'var') {
        if (typeof args === 'string') {
          return {
            id: generateId(),
            type: 'variable',
            value: args
          }
        }
        // If var has array arguments [path, default], create expression
        if (Array.isArray(args)) {
          return {
            id: generateId(),
            type: 'expression',
            operator: 'var',
            arguments: args.map(arg => convertFromJsonLogic(arg))
          }
        }
      }
      
      // Regular operator with arguments
      const argumentNodes = Array.isArray(args) 
        ? args.map(arg => convertFromJsonLogic(arg))
        : [convertFromJsonLogic(args)]
      
      return {
        id: generateId(),
        type: 'expression',
        operator,
        arguments: argumentNodes
      }
    }
  }
  
  // Fallback for unknown structures
  return {
    id: generateId(),
    type: 'literal',
    value: JSON.stringify(json)
  }
}

// Keyboard shortcuts
function handleKeydown(event: KeyboardEvent) {
  // Check if we're in an input field - don't interfere with normal typing
  const target = event.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
    return
  }
  
  const isCtrlOrCmd = event.ctrlKey || event.metaKey
  
  // Ctrl+Z or Cmd+Z for undo (without Shift)
  if (isCtrlOrCmd && event.key.toLowerCase() === 'z' && !event.shiftKey) {
    event.preventDefault()
    performUndo()
    return
  }
  
  // Ctrl+Y or Cmd+Y for redo
  if (isCtrlOrCmd && event.key.toLowerCase() === 'y') {
    event.preventDefault()
    performRedo()
    return
  }
  
  // Ctrl+Shift+Z or Cmd+Shift+Z for redo (alternative)
  if (isCtrlOrCmd && event.key.toLowerCase() === 'z' && event.shiftKey) {
    event.preventDefault()
    performRedo()
    return
  }
}

// Public methods for parent component
function loadJsonLogic(jsonLogic: any) {
  try {
    const converted = convertFromJsonLogic(jsonLogic)
    
    if (Array.isArray(converted)) {
      rules.value = converted
    } else {
      rules.value = [converted]
    }
    
    saveCurrentState('Load example')
    console.log('Loaded example with rules:', rules.value)
  } catch (error) {
    console.error('Failed to load JsonLogic example:', error)
  }
}

// Expose methods to parent
defineExpose({
  loadJsonLogic
})

// Lifecycle hooks
onMounted(() => {
  // Add keyboard event listener
  document.addEventListener('keydown', handleKeydown)
  
  // Initialize undo/redo state
  updateUndoRedoState()
  
  // Save initial state if rules exist
  if (rules.value.length > 0) {
    saveCurrentState('Initial state')
  }
})

onUnmounted(() => {
  // Remove keyboard event listener
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.json-logic-editor {
  width: 100%;
  min-height: 100vh;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  box-sizing: border-box;
  overflow-x: auto;
}

/* Prevent interference during resize operations */
.json-logic-editor:has(.is-resizing) {
  pointer-events: none;
}

.json-logic-editor:has(.is-resizing) .is-resizing {
  pointer-events: auto;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e5e7eb;
}

.header-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.editor-header h2 {
  margin: 0;
  color: #1f2937;
}

.keyboard-shortcuts {
  display: flex;
  align-items: center;
}

.shortcut-hint {
  font-size: 12px;
  color: #6b7280;
  background: rgba(107, 114, 128, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  font-family: monospace;
}

.operation-indicator {
  font-size: 12px;
  color: #059669;
  background: rgba(5, 150, 105, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  font-family: monospace;
  margin-left: 8px;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

.undo-redo-group {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.editor-actions {
  display: flex;
  gap: 12px;
}

.undo-btn, .redo-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 13px;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.9);
  color: #374151;
  min-width: 70px;
}

.undo-btn:hover:not(:disabled), .redo-btn:hover:not(:disabled) {
  background: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.undo-btn:disabled, .redo-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: rgba(255, 255, 255, 0.3);
  color: #9ca3af;
}

.add-rule-btn, .export-btn, .import-btn, .clear-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.add-rule-btn {
  background: #10b981;
  color: white;
}

.add-rule-btn:hover {
  background: #059669;
}

.export-btn {
  background: #3b82f6;
  color: white;
}

.export-btn:hover {
  background: #2563eb;
}

.import-btn {
  background: #8b5cf6;
  color: white;
}

.import-btn:hover {
  background: #7c3aed;
}

.clear-btn {
  background: #ef4444;
  color: white;
}

.clear-btn:hover {
  background: #dc2626;
}

.debug-btn {
  background: #6b7280;
  color: white;
}

.debug-btn:hover {
  background: #4b5563;
}

.debug-btn.active {
  background: #059669;
}

.debug-btn.active:hover {
  background: #047857;
}

.debug-dropdown {
  position: relative;
}

.debug-popup {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 2px solid #6b7280;
  border-radius: 8px;
  box-shadow: 0 8px 25px rgba(107, 114, 128, 0.15);
  z-index: 1000;
  min-width: 280px;
  max-width: 400px;
  backdrop-filter: blur(10px);
  margin-top: 8px;
}

.debug-popup::before {
  content: '';
  position: absolute;
  top: -8px;
  right: 20px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid #6b7280;
}

.debug-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 6px 6px 0 0;
}

.debug-popup-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.close-debug-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 18px;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-debug-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.debug-popup .debug-stats {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.debug-popup .debug-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: #f9fafb;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.debug-popup .debug-stat label {
  font-weight: 600;
  color: #374151;
  font-size: 12px;
}

.debug-popup .debug-stat span {
  font-family: monospace;
  font-size: 11px;
  color: #6b7280;
}

.debug-popup .status-yes {
  color: #059669 !important;
  font-weight: 600;
}

.debug-popup .status-no {
  color: #dc2626 !important;
  font-weight: 600;
}

.debug-popup .debug-actions {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 6px 6px;
}

.debug-popup .debug-clear-btn,
.debug-popup .debug-test-btn {
  flex: 1;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.debug-popup .debug-clear-btn {
  background: #ef4444;
  color: white;
}

.debug-popup .debug-clear-btn:hover {
  background: #dc2626;
}

.debug-popup .debug-test-btn {
  background: #3b82f6;
  color: white;
}

.debug-popup .debug-test-btn:hover {
  background: #2563eb;
}

.editor-canvas {
  min-height: 400px;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 20px;
  background: #f9fafb;
  transition: all 0.2s ease;
  overflow: visible;
}

.editor-canvas.drag-over {
  border-color: #3b82f6;
  background: #eff6ff;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  color: #374151;
}

.rules-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  overflow: visible;
  padding-bottom: 10px;
}

.rules-container::-webkit-scrollbar {
  height: 8px;
}

.rules-container::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.rules-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.rules-container::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.output-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 400px;
  max-height: 80vh;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
  z-index: 1000;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 8px 8px 0 0;
}

.panel-header h3 {
  margin: 0;
  color: #1f2937;
}

.close-panel-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6b7280;
}

.json-output {
  padding: 16px;
  margin: 0;
  background: #1f2937;
  color: #f9fafb;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  overflow: auto;
  max-height: 400px;
}

.panel-actions {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid #e5e7eb;
}

.copy-btn, .validate-btn {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.copy-btn:hover, .validate-btn:hover {
  background: #f3f4f6;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
}

.close-modal-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
}

.modal-body {
  padding: 20px;
}

.import-textarea {
  width: 100%;
  height: 200px;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-family: monospace;
  resize: vertical;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}

.cancel-btn, .import-confirm-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn {
  background: #f3f4f6;
  color: #374151;
}

.import-confirm-btn {
  background: #3b82f6;
  color: white;
}


</style>