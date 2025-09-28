<template>
  <div class="json-logic-editor">
    <div class="editor-header">
      <h2>JsonLogic Visual Editor</h2>
      <div class="header-controls">
        <button @click="addNewRule" class="add-rule-btn">+ Add Rule</button>
        <button @click="exportJson" class="export-btn">Export JSON</button>
        <button @click="importJson" class="import-btn">Import JSON</button>
        <button @click="clearAll" class="clear-btn">Clear All</button>
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
        <!-- Use specific operator components for better layout -->
        <OrOperator
          v-for="rule in rules.filter(r => r.operator === 'or')"
          :key="rule.id"
          :node="rule"
          @update="onRuleUpdate(rules.findIndex(r => r.id === rule.id), $event)"
          @delete="onRuleDelete(rules.findIndex(r => r.id === rule.id))"
        />
        <AndOperator
          v-for="rule in rules.filter(r => r.operator === 'and')"
          :key="rule.id"
          :node="rule"
          @update="onRuleUpdate(rules.findIndex(r => r.id === rule.id), $event)"
          @delete="onRuleDelete(rules.findIndex(r => r.id === rule.id))"
        />
        <!-- Generic component for other operators -->
        <JsonLogicAtom
          v-for="rule in rules.filter(r => r.operator !== 'or' && r.operator !== 'and')"
          :key="rule.id"
          :node="rule"
          @update="onRuleUpdate(rules.findIndex(r => r.id === rule.id), $event)"
          @delete="onRuleDelete(rules.findIndex(r => r.id === rule.id))"
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
import { ref, computed } from 'vue'
import JsonLogicAtom from './JsonLogicAtom.vue'
import OrOperator from './OrOperator.vue'
import AndOperator from './AndOperator.vue'
import type { JsonLogicNode } from '../types/JsonLogic'

const rules = ref<JsonLogicNode[]>([])
const isDragOver = ref(false)
const showOutput = ref(false)
const showImportModal = ref(false)
const importText = ref('')

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
}

function onRuleUpdate(index: number, updatedRule: JsonLogicNode) {
  rules.value[index] = updatedRule
}

function onRuleDelete(index: number) {
  rules.value.splice(index, 1)
}

function clearAll() {
  if (confirm('Are you sure you want to clear all rules?')) {
    rules.value = []
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
    } catch (error) {
      console.error('Failed to parse dropped data:', error)
    }
  }
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
</script>

<style scoped>
.json-logic-editor {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e5e7eb;
}

.editor-header h2 {
  margin: 0;
  color: #1f2937;
}

.header-controls {
  display: flex;
  gap: 12px;
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

.editor-canvas {
  min-height: 400px;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 20px;
  background: #f9fafb;
  transition: all 0.2s ease;
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