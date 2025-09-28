<template>
  <div class="window-buttons">
    <button 
      @click="setDisplayMode('collapsed')" 
      class="window-btn collapse-btn" 
      :class="{ active: displayMode === 'collapsed' }"
      title="Collapse"
    >
      ●
    </button>
    
    <button 
      @click="setDisplayMode('inplace')" 
      class="window-btn inplace-btn" 
      :class="{ active: displayMode === 'inplace' }"
      title="Normal view"
    >
      ●
    </button>
    
    <button 
      @click="setDisplayMode('full')" 
      class="window-btn full-btn" 
      :class="{ active: displayMode === 'full' }"
      title="Full screen"
    >
      ●
    </button>
  </div>
</template>

<script setup lang="ts">
import { useDisplayMode } from '../composables/useDisplayMode'

interface Props {
  modelValue: 'collapsed' | 'inplace' | 'full'
}

interface Emits {
  (e: 'update:modelValue', value: 'collapsed' | 'inplace' | 'full'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { displayMode, setDisplayMode } = useDisplayMode(props.modelValue, (newMode) => {
  emit('update:modelValue', newMode)
})
</script>

<style scoped>
/* macOS-style window buttons */
.window-buttons {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-right: 12px;
}

.window-btn {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  font-size: 8px;
  font-weight: 400;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  opacity: 0.6;
}

.window-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}

.window-btn:active {
  transform: scale(0.9);
}

.window-btn.active {
  opacity: 1;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
}

.collapse-btn {
  background: #ff5f57;
  color: #ff5f57;
}

.inplace-btn {
  background: #ffbd2e;
  color: #ffbd2e;
}

.full-btn {
  background: #28ca42;
  color: #28ca42;
}
</style>