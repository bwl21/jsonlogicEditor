<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Select Field</h3>
        <button @click="closeModal" class="close-btn">×</button>
      </div>
      
      <div class="modal-body">
        <!-- Search -->
        <div class="search-section">
          <input 
            v-model="searchQuery"
            placeholder="Search fields..."
            class="search-input"
            ref="searchInput"
          />
        </div>
        
        <!-- Field Categories -->
        <div class="categories-section">
          <div 
            v-for="category in filteredCategories" 
            :key="category.name"
            class="category-group"
          >
            <h4 class="category-title">{{ category.label }}</h4>
            <div class="field-options">
              <button
                v-for="field in category.fields"
                :key="field"
                @click="selectField(field)"
                class="field-option"
                :class="{ 'current': field === currentValue }"
              >
                <div class="field-header">
                  <span class="field-name">{{ field }}</span>
                  <span v-if="field === currentValue" class="current-badge">Current</span>
                </div>
                <div class="field-description">{{ getFieldDescription(field) }}</div>
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
import { FIELD_NAMES } from '../types/JsonLogic'

interface Props {
  isOpen: boolean
  currentValue?: string
}

interface Emits {
  (e: 'close'): void
  (e: 'select', field: string): void
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

const filteredFields = computed(() => {
  if (!searchQuery.value) return FIELD_NAMES
  
  const query = searchQuery.value.toLowerCase()
  return FIELD_NAMES.filter(field => 
    field.toLowerCase().includes(query)
  )
})

const filteredCategories = computed(() => {
  const categories = new Map<string, { name: string; label: string; fields: string[] }>()
  
  filteredFields.value.forEach(field => {
    const category = getFieldCategory(field)
    if (!categories.has(category)) {
      categories.set(category, {
        name: category,
        label: getCategoryLabel(category),
        fields: []
      })
    }
    categories.get(category)!.fields.push(field)
  })
  
  return Array.from(categories.values()).sort((a, b) => {
    const order = [
      'person', 'ctgroup', 'groupmember', 'groupmemberfield', 'groupmemberfieldvalue',
      'relationship', 'relationship__personA', 'relationship__personB', 'relationshiptype',
      'transaction', 'transaction__donator', 'transaction__donatorSpouse',
      'status', 'role', 'grouptype', 'groupstatus',
      'account', 'accountingperiod', 'costcenter',
      'avatar', 'familyavatar', 'contactlabel', 'personemail',
      'device', 'fieldtype', 'language', 'translation', 'translationkey',
      'other'
    ]
    const aIndex = order.indexOf(a.name)
    const bIndex = order.indexOf(b.name)
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
  })
})

function getFieldCategory(field: string): string {
  const parts = field.split('.')
  if (parts.length >= 2) {
    return parts[0]
  }
  return 'other'
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'account': 'Accounts',
    'accountingperiod': 'Accounting Periods',
    'avatar': 'Avatars',
    'contactlabel': 'Contact Labels',
    'costcenter': 'Cost Centers',
    'ctgroup': 'Groups',
    'device': 'Devices',
    'familyavatar': 'Family Avatars',
    'fieldtype': 'Field Types',
    'groupmember': 'Group Members',
    'groupmemberfield': 'Member Fields',
    'groupmemberfieldvalue': 'Field Values',
    'groupstatus': 'Group Status',
    'grouptype': 'Group Types',
    'language': 'Languages',
    'person': 'Persons',
    'personemail': 'Person Emails',
    'relationship': 'Relationships',
    'relationship__personA': 'Related Person A',
    'relationship__personB': 'Related Person B',
    'relationshiptype': 'Relationship Types',
    'role': 'Roles',
    'status': 'Status',
    'transaction': 'Transactions',
    'transaction__donator': 'Transaction Donator',
    'transaction__donatorSpouse': 'Donator Spouse',
    'translation': 'Translations',
    'translationkey': 'Translation Keys',
    'other': 'Other'
  }
  return labels[category] || category
}

function getFieldDescription(field: string): string {
  const parts = field.split('.')
  if (parts.length >= 2) {
    const entity = parts[0]
    const property = parts.slice(1).join('.')
    
    // Common field descriptions
    const commonDescriptions: Record<string, string> = {
      'id': 'Unique identifier',
      'name': 'Name or title',
      'createdDate': 'Date when record was created',
      'modifiedDate': 'Date when record was last modified',
      'createdPid': 'ID of person who created this record',
      'modifiedPid': 'ID of person who last modified this record',
      'isActive': 'Whether the record is active',
      'isArchived': 'Whether the record is archived',
      'email': 'Email address',
      'firstName': 'First name',
      'lastName': 'Last name',
      'birthday': 'Date of birth',
      'mobile': 'Mobile phone number',
      'street': 'Street address',
      'city': 'City name',
      'zip': 'Postal code',
      'country': 'Country name',
      'startDate': 'Start date',
      'endDate': 'End date',
      'amount': 'Monetary amount',
      'note': 'Additional notes or comments',
      'sortKey': 'Sort order key'
    }
    
    // Specific field descriptions
    const specificDescriptions: Record<string, string> = {
      'person.sexId': 'Gender identifier',
      'person.statusId': 'Person status identifier',
      'person.campusId': 'Campus identifier',
      'person.familyStatusId': 'Family status identifier',
      'person.dateOfBaptism': 'Date of baptism',
      'person.dateOfBelonging': 'Date of belonging to church',
      'person.dateOfEntry': 'Date of entry',
      'person.dateOfResign': 'Date of resignation',
      'person.lastLogin': 'Last login date',
      'ctgroup.groupTypeId': 'Group type identifier',
      'ctgroup.groupStatusId': 'Group status identifier',
      'ctgroup.autoAccept': 'Automatically accept new members',
      'ctgroup.maxMembers': 'Maximum number of members',
      'ctgroup.allowWaitinglist': 'Allow waiting list',
      'ctgroup.visibility': 'Group visibility setting',
      'ctgroup.meetingTime': 'Regular meeting time',
      'ctgroup.weekday': 'Meeting weekday',
      'groupmember.groupMemberStatus': 'Member status in group',
      'groupmember.memberStartDate': 'Date when membership started',
      'groupmember.memberEndDate': 'Date when membership ended',
      'groupmember.waitingListPosition': 'Position on waiting list',
      'transaction.documentDate': 'Document date',
      'transaction.documentNumber': 'Document number',
      'transaction.donatorId': 'Donator person identifier'
    }
    
    return specificDescriptions[field] || commonDescriptions[property] || `${property} from ${entity}`
  }
  return 'Field value'
}

function selectField(field: string) {
  emit('select', field)
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
  max-width: 700px;
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

.field-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 8px;
}

.field-option {
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

.field-option:hover {
  border-color: #3b82f6;
  background: #f8fafc;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.field-option.current {
  border-color: #10b981;
  background: #f0fdf4;
}

.field-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.field-name {
  font-family: 'Monaco', 'Menlo', monospace;
  font-weight: 600;
  color: #374151;
  font-size: 13px;
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

.field-description {
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
  
  .field-options {
    grid-template-columns: 1fr;
  }
}
</style>