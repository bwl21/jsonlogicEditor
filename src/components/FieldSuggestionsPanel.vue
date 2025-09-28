<template>
  <div class="field-suggestions-panel">
    <div class="panel-header">
      <h3>Available Fields</h3>
      <button @click="$emit('close')" class="close-btn">×</button>
    </div>
    
    <div class="search-section">
      <input 
        v-model="searchTerm"
        placeholder="Search fields..."
        class="search-input"
      />
    </div>
    
    <div class="categories-section">
      <div 
        v-for="category in categories" 
        :key="category.name"
        class="category-group"
      >
        <div 
          class="category-header"
          @click="toggleCategory(category.name)"
          :class="{ 'expanded': expandedCategories.has(category.name) }"
        >
          <span class="category-icon">{{ expandedCategories.has(category.name) ? '▼' : '▶' }}</span>
          <span class="category-name">{{ category.label }}</span>
          <span class="category-count">({{ category.fields.length }})</span>
        </div>
        
        <div v-if="expandedCategories.has(category.name)" class="category-fields">
          <div 
            v-for="field in category.fields" 
            :key="field"
            class="field-item"
            @click="selectField(field)"
            :title="getFieldDescription(field)"
          >
            <span class="field-name">{{ field }}</span>
            <span class="field-type">{{ getFieldType(field) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { FIELD_NAMES } from '../types/JsonLogic'

interface Emits {
  (e: 'close'): void
  (e: 'selectField', field: string): void
}

const emit = defineEmits<Emits>()

const searchTerm = ref('')
const expandedCategories = ref(new Set(['person', 'ctgroup']))

// Computed properties
const categories = computed(() => {
  const filteredFields = searchTerm.value 
    ? FIELD_NAMES.filter(field => 
        field.toLowerCase().includes(searchTerm.value.toLowerCase())
      )
    : FIELD_NAMES

  const categoryMap = new Map<string, string[]>()
  
  filteredFields.forEach(field => {
    const entity = field.split('.')[0]
    if (!categoryMap.has(entity)) {
      categoryMap.set(entity, [])
    }
    categoryMap.get(entity)!.push(field)
  })

  return Array.from(categoryMap.entries()).map(([name, fields]) => ({
    name,
    label: getCategoryLabel(name),
    fields: fields.sort()
  })).sort((a, b) => a.label.localeCompare(b.label))
})

// Methods
function getCategoryLabel(entity: string): string {
  const labels: Record<string, string> = {
    'person': 'Person',
    'ctgroup': 'Group',
    'groupmember': 'Group Member',
    'groupmemberfield': 'Member Fields',
    'groupmemberfieldvalue': 'Field Values',
    'relationship': 'Relationships',
    'transaction': 'Transactions',
    'status': 'Status',
    'role': 'Roles',
    'grouptype': 'Group Types',
    'groupstatus': 'Group Status',
    'language': 'Language',
    'contactlabel': 'Contact Labels',
    'personemail': 'Person Email'
  }
  return labels[entity] || entity.charAt(0).toUpperCase() + entity.slice(1)
}

function getFieldType(field: string): string {
  const fieldName = field.split('.').pop()?.toLowerCase() || ''
  
  if (fieldName.includes('id')) return 'ID'
  if (fieldName.includes('date')) return 'Date'
  if (fieldName.includes('email')) return 'Email'
  if (fieldName.includes('phone') || fieldName.includes('mobile')) return 'Phone'
  if (fieldName.includes('name')) return 'Text'
  if (fieldName.includes('is') || fieldName.includes('auto')) return 'Boolean'
  if (fieldName.includes('amount') || fieldName.includes('number')) return 'Number'
  if (fieldName.includes('note') || fieldName.includes('comment')) return 'Text'
  if (fieldName.includes('status')) return 'Status'
  
  return 'Mixed'
}

function getFieldDescription(field: string): string {
  const descriptions: Record<string, string> = {
    'person.firstName': 'First name of the person',
    'person.lastName': 'Last name of the person',
    'person.email': 'Primary email address',
    'person.birthday': 'Date of birth',
    'person.isActive': 'Whether the person is active',
    'person.isArchived': 'Whether the person is archived',
    'ctgroup.name': 'Name of the group',
    'ctgroup.autoAccept': 'Whether group auto-accepts new members',
    'ctgroup.maxMembers': 'Maximum number of members allowed',
    'groupmember.groupMemberStatus': 'Status of the group membership',
    'groupmemberfieldvalue.value': 'Value of a custom group member field'
  }
  
  return descriptions[field] || `Database field: ${field}`
}

function toggleCategory(categoryName: string) {
  if (expandedCategories.value.has(categoryName)) {
    expandedCategories.value.delete(categoryName)
  } else {
    expandedCategories.value.add(categoryName)
  }
}

function selectField(field: string) {
  emit('selectField', field)
}
</script>

<style scoped>
.field-suggestions-panel {
  width: 350px;
  max-height: 600px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.panel-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 16px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-section {
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.categories-section {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.category-group {
  margin-bottom: 4px;
}

.category-header {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  background: #f9fafb;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.1s ease;
}

.category-header:hover {
  background: #f3f4f6;
}

.category-icon {
  width: 16px;
  font-size: 12px;
  color: #6b7280;
  margin-right: 8px;
}

.category-name {
  flex: 1;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.category-count {
  font-size: 12px;
  color: #6b7280;
}

.category-fields {
  background: white;
}

.field-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 16px 6px 40px;
  cursor: pointer;
  border-bottom: 1px solid #f9fafb;
  transition: background-color 0.1s ease;
}

.field-item:hover {
  background: #f3f4f6;
}

.field-item:last-child {
  border-bottom: none;
}

.field-name {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  color: #1f2937;
  flex: 1;
}

.field-type {
  font-size: 10px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-left: 8px;
}

/* Scrollbar styling */
.categories-section::-webkit-scrollbar {
  width: 6px;
}

.categories-section::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.categories-section::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.categories-section::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>