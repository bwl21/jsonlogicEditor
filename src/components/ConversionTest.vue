<template>
  <div class="conversion-test">
    <h2>Operator Conversion Test</h2>
    
    <div class="test-section">
      <h3>Test 1: Logic to Comparison</h3>
      <div class="test-case">
        <div class="original">
          <strong>Original (AND):</strong>
          <JsonLogicAtom 
            :node="testNodes.andNode" 
            @update="updateTestNode('andNode', $event)"
          />
        </div>
        <div class="conversion-options">
          <strong>Available conversions:</strong>
          <div class="options">
            <button 
              v-for="option in andConversions" 
              :key="option.operator"
              @click="convertNode('andNode', option.operator)"
              class="conversion-btn"
            >
              {{ option.label }} ({{ option.category }})
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="test-section">
      <h3>Test 2: Comparison to Arithmetic</h3>
      <div class="test-case">
        <div class="original">
          <strong>Original (EQUALS):</strong>
          <JsonLogicAtom 
            :node="testNodes.equalsNode" 
            @update="updateTestNode('equalsNode', $event)"
          />
        </div>
        <div class="conversion-options">
          <strong>Available conversions:</strong>
          <div class="options">
            <button 
              v-for="option in equalsConversions" 
              :key="option.operator"
              @click="convertNode('equalsNode', option.operator)"
              class="conversion-btn"
            >
              {{ option.label }} ({{ option.category }})
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="test-section">
      <h3>Test 3: Data to String</h3>
      <div class="test-case">
        <div class="original">
          <strong>Original (VAR):</strong>
          <JsonLogicAtom 
            :node="testNodes.varNode" 
            @update="updateTestNode('varNode', $event)"
          />
        </div>
        <div class="conversion-options">
          <strong>Available conversions:</strong>
          <div class="options">
            <button 
              v-for="option in varConversions" 
              :key="option.operator"
              @click="convertNode('varNode', option.operator)"
              class="conversion-btn"
            >
              {{ option.label }} ({{ option.category }})
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="test-results">
      <h3>Conversion Results</h3>
      <pre>{{ JSON.stringify(testNodes, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { JsonLogicNode } from '../types/JsonLogic'
import JsonLogicAtom from './JsonLogicAtom.vue'
import { getConversionOptions, convertOperatorNode } from '../utils/operatorConversion'

// Helper functions
function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

function createLiteral(value: any): JsonLogicNode {
  return {
    id: generateId(),
    type: 'literal',
    value: value
  }
}

function createVariable(name: string): JsonLogicNode {
  return {
    id: generateId(),
    type: 'variable',
    value: name
  }
}

// Test nodes
const testNodes = ref({
  andNode: {
    id: generateId(),
    type: 'expression' as const,
    operator: 'and',
    arguments: [
      createVariable('person.isActive'),
      createLiteral(true)
    ]
  },
  equalsNode: {
    id: generateId(),
    type: 'expression' as const,
    operator: '==',
    arguments: [
      createVariable('person.age'),
      createLiteral(25)
    ]
  },
  varNode: {
    id: generateId(),
    type: 'expression' as const,
    operator: 'var',
    arguments: [
      createVariable('person.firstName')
    ]
  }
})

// Conversion options
const andConversions = computed(() => getConversionOptions('and'))
const equalsConversions = computed(() => getConversionOptions('=='))
const varConversions = computed(() => getConversionOptions('var'))

// Methods
function updateTestNode(nodeKey: string, updatedNode: JsonLogicNode) {
  testNodes.value[nodeKey] = updatedNode
}

function convertNode(nodeKey: string, newOperator: string) {
  const originalNode = testNodes.value[nodeKey]
  const convertedNode = convertOperatorNode(originalNode, newOperator)
  testNodes.value[nodeKey] = convertedNode
  
  console.log(`Converted ${originalNode.operator} to ${newOperator}:`, convertedNode)
}
</script>

<style scoped>
.conversion-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-section {
  margin-bottom: 30px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
}

.test-case {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.original {
  padding: 10px;
  background: #f9fafb;
  border-radius: 6px;
}

.conversion-options {
  padding: 10px;
  background: #eff6ff;
  border-radius: 6px;
}

.options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.conversion-btn {
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 12px;
}

.conversion-btn:hover {
  background: #2563eb;
}

.test-results {
  margin-top: 30px;
  padding: 20px;
  background: #f3f4f6;
  border-radius: 8px;
}

.test-results pre {
  background: white;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
}

h2 {
  color: #1f2937;
  margin-bottom: 20px;
}

h3 {
  color: #374151;
  margin-bottom: 15px;
}
</style>