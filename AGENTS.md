# AGENTS.md - Development Session Insights

## Session Overview
**Date:** 2025-09-28  
**Focus:** Universal Operator Conversion System + UI/UX Improvements  
**Agent:** Ona (Claude 4 Sonnet)  

## Key Learnings & Insights

### 1. Vue.js Reactivity Challenges
**Problem:** OR operator was rendering as dropdown instead of proper component  
**Root Cause:** Vue's reactivity system wasn't detecting operator changes for component switching  
**Solution:** 
- Used computed properties for rule filtering instead of inline filtering
- Added deep watching with `watch(rules, () => { nextTick() }, { deep: true })`
- Replaced direct filtering with reactive computed properties

```typescript
// ❌ Problematic approach
<OrOperator v-for="rule in rules.filter(r => r.operator === 'or')" />

// ✅ Working solution  
const orRules = computed(() => rules.value.filter(r => r.operator === 'or'))
<OrOperator v-for="rule in orRules" />
```

### 2. TypeScript Type Safety in Vue Components
**Challenge:** Type errors when using dynamic object access  
**Solution:** Proper type assertions and const assertions

```typescript
// ❌ Type error
testNodes.value[nodeKey] = updatedNode

// ✅ Type safe
(testNodes.value as any)[nodeKey] = updatedNode
// or better: proper interface with index signature
```

### 3. Intelligent Content Preservation Strategy
**Approach:** Multi-layered content extraction for operator conversions
- **Meaningful Values:** Variables, non-empty literals, expressions, arrays
- **Contextual Defaults:** Field-name-based intelligent defaults
- **Cross-Category Logic:** Logic ↔ Comparison ↔ Arithmetic ↔ Data ↔ String

```typescript
function extractMeaningfulValues(args: JsonLogicNode[]): JsonLogicNode[] {
  // Variables are always meaningful
  // Non-empty literals are meaningful  
  // Expressions with operators are meaningful
  // Non-empty arrays are meaningful
}
```

### 4. CSS Horizontal Scrolling Best Practices
**Key Insights:**
- Use `flex-wrap: nowrap` for horizontal scrolling
- `overflow-x: auto` with `overflow-y: visible` prevents vertical clipping
- Custom scrollbar styling improves UX
- `flex: 0 0 auto` prevents flex items from shrinking

```css
.horizontal-container {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  overflow-y: visible;
  gap: 16px;
}

.horizontal-item {
  flex: 0 0 auto;
  min-width: 280px;
  max-width: 400px;
}
```

### 5. Collapsible Component Pattern
**Architecture:** State + Preview + Conditional Rendering
```typescript
const isCollapsed = ref(false)
const showPreview = ref(false)

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}

function onPreviewEnter() {
  if (isCollapsed.value) {
    showPreview.value = true
  }
}
```

### 6. Full-Width Layout Strategy
**Approach:** Conditional container classes
```typescript
<div class="container" :class="{ 'full-width': !showExamples }">
```

```css
.container {
  width: 100%;
  margin: 0 auto;
  padding: 0 20px;
}

.container.full-width {
  max-width: none;
  padding: 0;
}
```

## Technical Decisions & Rationale

### 1. Component Architecture
- **Specialized Components:** OrOperator, AndOperator for complex layouts
- **Generic Component:** JsonLogicAtom for standard operators
- **Consistent Interface:** All components support conversion, collapse, scrolling

### 2. Conversion System Design
- **Universal Utility:** Single `operatorConversion.ts` handles all conversions
- **Category-Based Logic:** Different strategies for different operator categories
- **Content Preservation:** Intelligent extraction and contextual defaults
- **Type Safety:** Full TypeScript support with proper interfaces

### 3. Responsive Design Strategy
- **Desktop First:** Horizontal scrolling for wide content
- **Mobile Adaptive:** Vertical stacking on small screens
- **Touch Friendly:** Larger touch targets and optimized spacing

## Common Pitfalls & Solutions

### 1. Vue Reactivity Issues
**Pitfall:** Inline filtering in templates doesn't always trigger re-renders  
**Solution:** Use computed properties for complex filtering logic

### 2. CSS Overflow Management
**Pitfall:** `overflow: hidden` clips preview popups  
**Solution:** Use `overflow: visible` on containers with absolute positioned children

### 3. TypeScript Dynamic Access
**Pitfall:** Dynamic object property access causes type errors  
**Solution:** Proper type assertions or interface design with index signatures

### 4. Mobile Responsiveness
**Pitfall:** Horizontal scrolling doesn't work well on mobile  
**Solution:** Conditional layout switching based on screen size

## Development Workflow Insights

### 1. Todo System Usage
- **Granular Tasks:** Break complex features into 3-6 specific tasks
- **Sequential Processing:** Use `todo_next` for efficient workflow
- **Clear Descriptions:** Actionable task descriptions improve focus

### 2. Testing Strategy
- **Build Early:** Run `npm run build` frequently to catch TypeScript errors
- **Component Testing:** Keep test components for debugging (ConversionTest.vue)
- **Incremental Development:** Test each feature before moving to next

### 3. Git Commit Strategy
- **Feature-Based Commits:** Group related changes into logical commits
- **Descriptive Messages:** Include technical details and co-author attribution
- **Preserve Debug Tools:** Don't remove debugging components without explicit request

## Performance Considerations

### 1. Vue Reactivity Optimization
- Deep watching can be expensive - use sparingly
- Computed properties are cached and efficient
- Avoid inline functions in templates

### 2. CSS Performance
- Custom scrollbars add minimal overhead
- Transitions should be kept under 300ms
- Use `transform` for animations over position changes

### 3. Component Rendering
- Conditional rendering (`v-if`) is more efficient than `v-show` for rarely shown content
- Key attributes help Vue track components correctly during re-renders

## Future Development Recommendations

### 1. Testing Infrastructure
- Add unit tests for conversion utilities
- Component testing for complex interactions
- E2E tests for user workflows

### 2. Accessibility Improvements
- ARIA labels for collapse/expand states
- Keyboard navigation support
- Screen reader compatibility

### 3. Performance Monitoring
- Bundle size analysis
- Runtime performance profiling
- Memory usage optimization

### 4. User Experience Enhancements
- Undo/redo functionality
- Keyboard shortcuts
- Drag and drop improvements
- Export/import enhancements

## Code Quality Insights

### 1. TypeScript Best Practices
- Use `const assertions` for literal types
- Proper interface design prevents type errors
- Generic functions improve reusability

### 2. Vue 3 Composition API
- Logical grouping of related functionality
- Better TypeScript integration
- Easier testing and reusability

### 3. CSS Architecture
- Component-scoped styles prevent conflicts
- Consistent naming conventions improve maintainability
- Responsive design patterns should be reusable

## Session Metrics
- **Features Implemented:** 8 major features
- **Components Modified:** 6 Vue components
- **Lines Added:** ~669 lines
- **Build Success Rate:** 100% (all builds successful)
- **TypeScript Errors:** 0 (all resolved)
- **Commits Created:** 2 feature commits

## Key Takeaways
1. **Vue Reactivity:** Computed properties > inline filtering for complex logic
2. **TypeScript:** Proper type design prevents runtime errors
3. **CSS Layout:** Flexbox + overflow management enables complex layouts
4. **Component Design:** Consistent interfaces improve maintainability
5. **User Experience:** Collapsible + scrolling dramatically improves usability
6. **Development Process:** Incremental testing prevents integration issues
7. **Debug Tools:** Preserve testing components for future development