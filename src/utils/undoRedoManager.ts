import type { JsonLogicNode } from '../types/JsonLogic'

export interface EditorState {
  rules: JsonLogicNode[]
  timestamp: number
  description: string
}

export class UndoRedoManager {
  private static readonly STORAGE_KEY = 'jsonlogic-editor-history'
  private static readonly MAX_HISTORY_SIZE = 100
  
  private history: EditorState[] = []
  private currentIndex: number = -1
  private isUndoRedoOperation: boolean = false

  constructor() {
    this.loadFromSessionStorage()
  }

  /**
   * Save current state to history
   */
  saveState(rules: JsonLogicNode[], description: string = 'Edit'): void {
    // Don't save state during undo/redo operations
    if (this.isUndoRedoOperation) {
      return
    }

    // Don't save if state hasn't changed
    if (this.history.length > 0 && this.currentIndex >= 0) {
      const currentState = this.history[this.currentIndex]
      if (this.statesEqual(currentState.rules, rules)) {
        return
      }
    }

    // Remove any states after current index (when user makes new change after undo)
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1)
    }

    // Add new state
    const newState: EditorState = {
      rules: this.deepClone(rules),
      timestamp: Date.now(),
      description
    }

    this.history.push(newState)
    this.currentIndex = this.history.length - 1

    // Limit history size
    if (this.history.length > UndoRedoManager.MAX_HISTORY_SIZE) {
      this.history = this.history.slice(-UndoRedoManager.MAX_HISTORY_SIZE)
      this.currentIndex = this.history.length - 1
    }

    this.saveToSessionStorage()
  }

  /**
   * Undo last operation
   */
  undo(): EditorState | null {
    if (!this.canUndo()) {
      return null
    }

    this.isUndoRedoOperation = true
    this.currentIndex--
    const state = this.history[this.currentIndex]
    this.saveToSessionStorage()
    
    // Reset flag after a short delay to allow for state updates
    setTimeout(() => {
      this.isUndoRedoOperation = false
    }, 10)

    return {
      ...state,
      rules: this.deepClone(state.rules)
    }
  }

  /**
   * Redo last undone operation
   */
  redo(): EditorState | null {
    if (!this.canRedo()) {
      return null
    }

    this.isUndoRedoOperation = true
    this.currentIndex++
    const state = this.history[this.currentIndex]
    this.saveToSessionStorage()
    
    // Reset flag after a short delay to allow for state updates
    setTimeout(() => {
      this.isUndoRedoOperation = false
    }, 10)

    return {
      ...state,
      rules: this.deepClone(state.rules)
    }
  }

  /**
   * Check if undo is possible
   */
  canUndo(): boolean {
    return this.currentIndex > 0
  }

  /**
   * Check if redo is possible
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1
  }

  /**
   * Get current state description for UI
   */
  getCurrentDescription(): string {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return this.history[this.currentIndex].description
    }
    return 'Initial state'
  }

  /**
   * Get undo description for UI
   */
  getUndoDescription(): string {
    if (this.canUndo()) {
      return this.history[this.currentIndex - 1].description
    }
    return ''
  }

  /**
   * Get redo description for UI
   */
  getRedoDescription(): string {
    if (this.canRedo()) {
      return this.history[this.currentIndex + 1].description
    }
    return ''
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    this.history = []
    this.currentIndex = -1
    this.saveToSessionStorage()
  }

  /**
   * Get history stats for debugging
   */
  getHistoryStats(): { 
    total: number; 
    current: number; 
    canUndo: boolean; 
    canRedo: boolean;
    storageSize: number;
    maxSize: number;
  } {
    return {
      total: this.history.length,
      current: this.currentIndex,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      storageSize: this.getStorageSize(),
      maxSize: UndoRedoManager.MAX_HISTORY_SIZE
    }
  }

  /**
   * Get approximate storage size in bytes
   */
  getStorageSize(): number {
    try {
      const data = sessionStorage.getItem(UndoRedoManager.STORAGE_KEY)
      return data ? new Blob([data]).size : 0
    } catch (error) {
      return 0
    }
  }

  /**
   * Check if storage is getting full and cleanup if needed
   */
  private checkStorageHealth(): void {
    try {
      // Test if we can still write to session storage
      const testKey = 'test-storage-health'
      sessionStorage.setItem(testKey, 'test')
      sessionStorage.removeItem(testKey)
    } catch (error) {
      // Storage is full, reduce history size
      console.warn('Session storage is full, reducing history size')
      this.history = this.history.slice(-Math.floor(UndoRedoManager.MAX_HISTORY_SIZE * 0.7))
      this.currentIndex = Math.min(this.currentIndex, this.history.length - 1)
      this.saveToSessionStorage()
    }
  }

  /**
   * Deep clone object to prevent reference issues
   */
  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj))
  }

  /**
   * Compare two states for equality
   */
  private statesEqual(state1: JsonLogicNode[], state2: JsonLogicNode[]): boolean {
    return JSON.stringify(state1) === JSON.stringify(state2)
  }

  /**
   * Save history to session storage
   */
  private saveToSessionStorage(): void {
    try {
      const data = {
        history: this.history,
        currentIndex: this.currentIndex,
        version: '1.0', // For future compatibility
        savedAt: Date.now()
      }
      sessionStorage.setItem(UndoRedoManager.STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save undo/redo history to session storage:', error)
      // Try to recover by reducing history size
      this.checkStorageHealth()
    }
  }

  /**
   * Load history from session storage
   */
  private loadFromSessionStorage(): void {
    try {
      const data = sessionStorage.getItem(UndoRedoManager.STORAGE_KEY)
      if (data) {
        const parsed = JSON.parse(data)
        this.history = parsed.history || []
        this.currentIndex = parsed.currentIndex ?? -1
        
        // Validate loaded data
        if (this.currentIndex >= this.history.length) {
          this.currentIndex = this.history.length - 1
        }
      }
    } catch (error) {
      console.warn('Failed to load undo/redo history from session storage:', error)
      this.history = []
      this.currentIndex = -1
    }
  }
}

// Export singleton instance
export const undoRedoManager = new UndoRedoManager()