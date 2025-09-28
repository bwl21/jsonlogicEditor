import type { JsonLogicNode } from '../types/JsonLogic'
import { OPERATORS } from '../types/JsonLogic'

export interface ConversionOption {
  operator: string
  label: string
  description: string
  category: string
}

export function getConversionOptions(currentOperator: string): ConversionOption[] {
  const current = OPERATORS.find(op => op.name === currentOperator)
  if (!current) return []

  // Get operators from same category and compatible categories
  const compatibleOperators = OPERATORS.filter(op => {
    if (op.name === currentOperator) return false
    
    // Same category conversions are always allowed
    if (op.category === current.category) return true
    
    // Cross-category conversions based on logical compatibility
    const currentCat = current.category
    const targetCat = op.category
    
    // Logic operators can convert to comparison and control
    if (currentCat === 'logic' && (targetCat === 'comparison' || targetCat === 'control' || targetCat === 'unary')) return true
    
    // Comparison operators can convert to logic, arithmetic, and unary
    if (currentCat === 'comparison' && (targetCat === 'logic' || targetCat === 'arithmetic' || targetCat === 'unary')) return true
    
    // Arithmetic operators can convert to comparison and unary
    if (currentCat === 'arithmetic' && (targetCat === 'comparison' || targetCat === 'unary')) return true
    
    // Data operators can convert to comparison and string
    if (currentCat === 'data' && (targetCat === 'comparison' || targetCat === 'string' || targetCat === 'unary')) return true
    
    // String operators can convert to data and comparison
    if (currentCat === 'string' && (targetCat === 'data' || targetCat === 'comparison')) return true
    
    // Unary operators can convert to any category (they're flexible)
    if (currentCat === 'unary') return true
    
    // Control operators can convert to logic and comparison
    if (currentCat === 'control' && (targetCat === 'logic' || targetCat === 'comparison')) return true
    
    // Special operators can convert to any category
    if (currentCat === 'special' || targetCat === 'special') return true
    
    return false
  })

  return compatibleOperators.map(op => ({
    operator: op.name,
    label: op.label,
    description: op.description,
    category: op.category
  }))
}

export function convertOperatorNode(node: JsonLogicNode, newOperator: string): JsonLogicNode {
  const currentOp = OPERATORS.find(op => op.name === node.operator)
  const newOp = OPERATORS.find(op => op.name === newOperator)
  
  if (!currentOp || !newOp) {
    // Fallback: just change operator
    return { ...node, operator: newOperator }
  }

  const convertedNode: JsonLogicNode = {
    ...node,
    operator: newOperator,
    arguments: convertArguments(node.arguments || [], currentOp, newOp)
  }

  return convertedNode
}

function convertArguments(
  currentArgs: JsonLogicNode[], 
  currentOp: any, 
  newOp: any
): JsonLogicNode[] {
  const minArgs = newOp.minArgs
  const maxArgs = newOp.maxArgs
  
  // Handle different conversion scenarios
  if (currentOp.category === newOp.category) {
    // Same category: preserve arguments, adjust count if needed
    return adjustArgumentCount(currentArgs, minArgs, maxArgs, newOp)
  }
  
  // Cross-category conversions with intelligent content preservation
  if (currentOp.category === 'logic' && newOp.category === 'comparison') {
    return convertLogicToComparison(currentArgs, newOp)
  }
  
  if (currentOp.category === 'comparison' && newOp.category === 'logic') {
    return convertComparisonToLogic(currentArgs, newOp)
  }
  
  if (currentOp.category === 'arithmetic' && newOp.category === 'comparison') {
    return convertArithmeticToComparison(currentArgs, newOp)
  }
  
  if (currentOp.category === 'comparison' && newOp.category === 'arithmetic') {
    return convertComparisonToArithmetic(currentArgs, newOp)
  }
  
  if (newOp.category === 'data') {
    return convertToDataOperator(currentArgs, newOp)
  }
  
  if (newOp.category === 'control') {
    return convertToControlOperator(currentArgs, newOp)
  }
  
  if (newOp.category === 'string') {
    return convertToStringOperator(currentArgs, newOp)
  }
  
  if (newOp.category === 'unary') {
    return convertToUnaryOperator(currentArgs, newOp)
  }
  
  if (newOp.category === 'special') {
    return convertToSpecialOperator(currentArgs, newOp)
  }
  
  // Cross-category conversions for unary operators
  if (currentOp.category === 'unary' && newOp.category !== 'unary') {
    return convertFromUnaryOperator(currentArgs, newOp)
  }
  
  // Additional cross-category conversions
  if (currentOp.category === 'string' && newOp.category === 'data') {
    return convertStringToData(currentArgs, newOp)
  }
  
  if (currentOp.category === 'data' && newOp.category === 'string') {
    return convertDataToString(currentArgs, newOp)
  }
  
  if (currentOp.category === 'logic' && newOp.category === 'arithmetic') {
    return convertLogicToArithmetic(currentArgs, newOp)
  }
  
  if (currentOp.category === 'arithmetic' && newOp.category === 'logic') {
    return convertArithmeticToLogic(currentArgs, newOp)
  }
  
  // Default: adjust argument count with intelligent preservation
  return adjustArgumentCountIntelligently(currentArgs, minArgs, maxArgs, newOp)
}

function adjustArgumentCount(
  args: JsonLogicNode[], 
  minArgs: number, 
  maxArgs: number, 
  newOp: any
): JsonLogicNode[] {
  let result = [...args]
  
  // Remove excess arguments
  if (result.length > maxArgs) {
    result = result.slice(0, maxArgs)
  }
  
  // Add missing arguments
  while (result.length < minArgs) {
    result.push(createDefaultArgument(newOp, result.length))
  }
  
  return result
}

function convertLogicToComparison(args: JsonLogicNode[], newOp: any): JsonLogicNode[] {
  // Extract meaningful values from logic arguments
  const meaningfulValues = extractMeaningfulValues(args)
  
  if (meaningfulValues.length >= 2) {
    // Use first two meaningful values
    return [meaningfulValues[0], meaningfulValues[1]]
  } else if (meaningfulValues.length === 1) {
    // Use the meaningful value as left side, create appropriate right side
    const leftArg = meaningfulValues[0]
    const rightArg = createContextualArgument(newOp, 1, leftArg)
    return [leftArg, rightArg]
  }
  
  // Fallback to defaults
  const leftArg = args[0] || createDefaultArgument(newOp, 0)
  const rightArg = createDefaultArgument(newOp, 1)
  
  return [leftArg, rightArg]
}

function convertComparisonToLogic(args: JsonLogicNode[], newOp: any): JsonLogicNode[] {
  // For logic operators, we can preserve comparison arguments as conditions
  if (args.length >= 2 && (newOp.name === 'and' || newOp.name === 'or')) {
    // Create a comparison expression from the arguments
    const comparisonNode: JsonLogicNode = {
      id: generateId(),
      type: 'expression',
      operator: '==', // Default comparison
      arguments: args.slice(0, 2)
    }
    
    // Add the comparison as first argument, create second condition
    return [
      comparisonNode,
      createDefaultArgument(newOp, 1)
    ]
  }
  
  // For other logic operators, preserve what we can
  if (args.length >= 1) {
    const preservedArgs = args.slice(0, Math.min(args.length, newOp.maxArgs))
    while (preservedArgs.length < newOp.minArgs) {
      preservedArgs.push(createDefaultArgument(newOp, preservedArgs.length))
    }
    return preservedArgs
  }
  
  // Create default logic arguments
  return Array.from({ length: newOp.minArgs }, (_, i) => createDefaultArgument(newOp, i))
}

function convertToDataOperator(args: JsonLogicNode[], newOp: any): JsonLogicNode[] {
  // Try to find variable references in existing arguments
  const variableArgs = extractVariableReferences(args)
  const literalArgs = extractLiteralValues(args)
  
  if (newOp.name === 'var' && variableArgs.length > 0) {
    return [variableArgs[0]]
  }
  
  if (newOp.name === 'oneof' && variableArgs.length > 0) {
    // Use existing literal values to populate the array if available
    const arrayItems = literalArgs.length > 0 
      ? literalArgs.map(val => ({ id: generateId(), type: 'literal' as const, value: val.value }))
      : [{ id: generateId(), type: 'literal' as const, value: '' }]
    
    return [
      variableArgs[0],
      {
        id: generateId(),
        type: 'array',
        items: arrayItems
      }
    ]
  }
  
  if (newOp.name === 'partof' && variableArgs.length > 0) {
    // Similar to oneof but for array membership
    const arrayItems = literalArgs.length > 0 
      ? literalArgs.map(val => ({ id: generateId(), type: 'literal' as const, value: val.value }))
      : [{ id: generateId(), type: 'literal' as const, value: '' }]
    
    return [
      variableArgs[0],
      {
        id: generateId(),
        type: 'array',
        items: arrayItems
      }
    ]
  }
  
  // Default data operator arguments
  return Array.from({ length: newOp.minArgs }, (_, i) => createDefaultArgument(newOp, i))
}

function extractVariableReferences(args: JsonLogicNode[]): JsonLogicNode[] {
  const variables: JsonLogicNode[] = []
  
  function findVariables(node: JsonLogicNode) {
    if (node.type === 'variable') {
      variables.push(node)
    } else if (node.type === 'expression' && node.arguments) {
      node.arguments.forEach(findVariables)
    } else if (node.type === 'array' && node.items) {
      node.items.forEach(findVariables)
    }
  }
  
  args.forEach(findVariables)
  return variables
}

function extractLiteralValues(args: JsonLogicNode[]): JsonLogicNode[] {
  const literals: JsonLogicNode[] = []
  
  function findLiterals(node: JsonLogicNode) {
    if (node.type === 'literal' && node.value !== '' && node.value !== null && node.value !== undefined) {
      literals.push(node)
    } else if (node.type === 'expression' && node.arguments) {
      node.arguments.forEach(findLiterals)
    } else if (node.type === 'array' && node.items) {
      node.items.forEach(findLiterals)
    }
  }
  
  args.forEach(findLiterals)
  return literals
}

function extractMeaningfulValues(args: JsonLogicNode[]): JsonLogicNode[] {
  const meaningful: JsonLogicNode[] = []
  
  function findMeaningful(node: JsonLogicNode) {
    // Variables are always meaningful
    if (node.type === 'variable') {
      meaningful.push(node)
    }
    // Non-empty literals are meaningful
    else if (node.type === 'literal' && node.value !== '' && node.value !== null && node.value !== undefined) {
      meaningful.push(node)
    }
    // Non-empty arrays are meaningful
    else if (node.type === 'array' && node.items && node.items.length > 0) {
      meaningful.push(node)
    }
    // Expressions with operators are meaningful
    else if (node.type === 'expression' && node.operator) {
      meaningful.push(node)
    }
    
    // Recursively search in nested structures
    if (node.type === 'expression' && node.arguments) {
      node.arguments.forEach(findMeaningful)
    } else if (node.type === 'array' && node.items) {
      node.items.forEach(findMeaningful)
    }
  }
  
  args.forEach(findMeaningful)
  return meaningful
}

function createContextualArgument(operator: any, index: number, relatedArg?: JsonLogicNode): JsonLogicNode {
  const id = generateId()
  
  // Create contextual defaults based on the related argument
  if (relatedArg) {
    // If related arg is a variable, create appropriate comparison value
    if (relatedArg.type === 'variable') {
      const fieldName = relatedArg.value as string
      
      // Age-related fields get numeric defaults
      if (fieldName.includes('age') || fieldName.includes('Age')) {
        return { id, type: 'literal', value: 18 }
      }
      
      // Date fields get date defaults
      if (fieldName.includes('date') || fieldName.includes('Date') || fieldName.includes('birthday')) {
        return { id, type: 'literal', value: '2000-01-01' }
      }
      
      // Boolean fields get boolean defaults
      if (fieldName.includes('is') || fieldName.includes('Is') || fieldName.includes('has') || fieldName.includes('Has')) {
        return { id, type: 'literal', value: true }
      }
      
      // ID fields get numeric defaults
      if (fieldName.includes('id') || fieldName.includes('Id') || fieldName.includes('ID')) {
        return { id, type: 'literal', value: 1 }
      }
      
      // String fields get string defaults
      return { id, type: 'literal', value: '' }
    }
    
    // If related arg is a literal, create similar type
    if (relatedArg.type === 'literal') {
      const value = relatedArg.value
      if (typeof value === 'number') {
        return { id, type: 'literal', value: value + 1 }
      }
      if (typeof value === 'boolean') {
        return { id, type: 'literal', value: !value }
      }
      if (typeof value === 'string') {
        return { id, type: 'literal', value: '' }
      }
    }
  }
  
  // Fallback to standard defaults
  return createDefaultArgument(operator, index)
}

function createDefaultArgument(operator: any, index: number): JsonLogicNode {
  const id = generateId()
  
  // Create contextual defaults based on operator and position
  switch (operator.name) {
    case 'var':
      return { id, type: 'variable', value: 'person.firstName' }
    
    case 'oneof':
    case 'partof':
      if (index === 0) {
        return { id, type: 'variable', value: 'person.firstName' }
      } else {
        return {
          id,
          type: 'array',
          items: [{ id: generateId(), type: 'literal', value: '' }]
        }
      }
    
    case '==':
    case '!=':
    case '>':
    case '>=':
    case '<':
    case '<=':
      if (index === 0) {
        return { id, type: 'variable', value: 'person.age' }
      } else {
        return { id, type: 'literal', value: 18 }
      }
    
    case 'between':
      if (index === 0) {
        return { id, type: 'variable', value: 'person.age' }
      } else if (index === 1) {
        return { id, type: 'literal', value: 18 }
      } else {
        return { id, type: 'literal', value: 65 }
      }
    
    case 'if':
      if (index === 0) {
        return { id, type: 'literal', value: true }
      } else if (index === 1) {
        return { id, type: 'literal', value: 'yes' }
      } else {
        return { id, type: 'literal', value: 'no' }
      }
    
    case 'and':
    case 'or':
      return { id, type: 'literal', value: true }
    
    case 'concat':
    case 'concatWs':
      if (index === 0 && operator.name === 'concatWs') {
        return { id, type: 'literal', value: ' ' }
      }
      return { id, type: 'variable', value: 'person.firstName' }
    
    // Arithmetic operators
    case '+':
    case '-':
    case '*':
    case '/':
    case '%':
      if (index === 0) {
        return { id, type: 'variable', value: 'person.age' }
      } else {
        return { id, type: 'literal', value: 1 }
      }
    
    // Unary operators
    case '!':
    case '!!':
      return { id, type: 'literal', value: true }
    
    case 'isnull':
    case 'isnotnull':
      return { id, type: 'variable', value: 'person.email' }
    
    // String operators
    case 'substr':
      if (index === 0) {
        return { id, type: 'variable', value: 'person.firstName' }
      } else if (index === 1) {
        return { id, type: 'literal', value: 0 }
      } else {
        return { id, type: 'literal', value: 3 }
      }
    
    case 'strlen':
      return { id, type: 'variable', value: 'person.firstName' }
    
    // Array operators
    case 'map':
    case 'filter':
    case 'reduce':
      if (index === 0) {
        return {
          id,
          type: 'array' as const,
          items: [{ id: generateId(), type: 'literal' as const, value: '' }]
        }
      } else {
        return { id, type: 'expression' as const, operator: '==', arguments: [] }
      }
    
    case 'all':
    case 'none':
    case 'some':
      if (index === 0) {
        return {
          id,
          type: 'array' as const,
          items: [{ id: generateId(), type: 'literal' as const, value: true }]
        }
      } else {
        return { id, type: 'literal' as const, value: true }
      }
    
    default:
      return { id, type: 'literal', value: '' }
  }
}

function convertArithmeticToComparison(args: JsonLogicNode[], newOp: any): JsonLogicNode[] {
  // Arithmetic operations often result in numeric values, good for comparisons
  if (args.length >= 2) {
    // Use the arithmetic expression as left side of comparison
    const arithmeticExpr: JsonLogicNode = {
      id: generateId(),
      type: 'expression',
      operator: '+', // Default arithmetic operator
      arguments: args.slice(0, 2)
    }
    
    return [arithmeticExpr, { id: generateId(), type: 'literal', value: 0 }]
  }
  
  // Fallback to meaningful values
  const meaningfulValues = extractMeaningfulValues(args)
  if (meaningfulValues.length >= 1) {
    return [meaningfulValues[0], createContextualArgument(newOp, 1, meaningfulValues[0])]
  }
  
  return [createDefaultArgument(newOp, 0), createDefaultArgument(newOp, 1)]
}

function convertComparisonToArithmetic(args: JsonLogicNode[], newOp: any): JsonLogicNode[] {
  // Extract numeric values from comparison for arithmetic
  const numericValues = args.filter(arg => 
    arg.type === 'literal' && typeof arg.value === 'number'
  )
  
  if (numericValues.length >= 2) {
    return numericValues.slice(0, 2)
  }
  
  // Use variables that might contain numeric values
  const variables = extractVariableReferences(args)
  const numericVariables = variables.filter(v => 
    typeof v.value === 'string' && (
      v.value.includes('age') || 
      v.value.includes('count') || 
      v.value.includes('amount') ||
      v.value.includes('id') ||
      v.value.includes('Id')
    )
  )
  
  if (numericVariables.length >= 1) {
    const result = [numericVariables[0]]
    if (numericVariables.length >= 2) {
      result.push(numericVariables[1])
    } else {
      result.push({ id: generateId(), type: 'literal', value: 1 })
    }
    return result
  }
  
  // Fallback to defaults
  return Array.from({ length: newOp.minArgs }, (_, i) => createDefaultArgument(newOp, i))
}

function convertToControlOperator(args: JsonLogicNode[], newOp: any): JsonLogicNode[] {
  if (newOp.name === 'if') {
    // For 'if' operator: condition, then, else
    const meaningfulValues = extractMeaningfulValues(args)
    
    if (meaningfulValues.length >= 1) {
      // Use first meaningful value as condition
      const condition = meaningfulValues[0]
      const thenValue = meaningfulValues.length >= 2 ? meaningfulValues[1] : { id: generateId(), type: 'literal' as const, value: 'yes' }
      const elseValue = meaningfulValues.length >= 3 ? meaningfulValues[2] : { id: generateId(), type: 'literal' as const, value: 'no' }
      
      return [condition, thenValue, elseValue]
    }
  }
  
  // Default control operator arguments
  return Array.from({ length: newOp.minArgs }, (_, i) => createDefaultArgument(newOp, i))
}

function convertToStringOperator(args: JsonLogicNode[], newOp: any): JsonLogicNode[] {
  // Extract string-like values and variables
  const stringValues = args.filter(arg => 
    arg.type === 'literal' && typeof arg.value === 'string' ||
    arg.type === 'variable'
  )
  
  if (newOp.name === 'concat' || newOp.name === 'concatWs') {
    if (newOp.name === 'concatWs') {
      // First argument is separator
      const separator = { id: generateId(), type: 'literal' as const, value: ' ' }
      const stringArgs = stringValues.length > 0 ? stringValues : [
        { id: generateId(), type: 'variable' as const, value: 'person.firstName' },
        { id: generateId(), type: 'variable' as const, value: 'person.lastName' }
      ]
      return [separator, ...stringArgs]
    } else {
      // Regular concat
      return stringValues.length > 0 ? stringValues : [
        { id: generateId(), type: 'variable' as const, value: 'person.firstName' },
        { id: generateId(), type: 'variable' as const, value: 'person.lastName' }
      ]
    }
  }
  
  // Default string operator arguments
  return Array.from({ length: newOp.minArgs }, (_, i) => createDefaultArgument(newOp, i))
}

function adjustArgumentCountIntelligently(
  args: JsonLogicNode[], 
  minArgs: number, 
  maxArgs: number, 
  newOp: any
): JsonLogicNode[] {
  // Preserve meaningful values first
  const meaningfulValues = extractMeaningfulValues(args)
  let result = meaningfulValues.slice(0, maxArgs)
  
  // Fill remaining slots with contextual defaults
  while (result.length < minArgs) {
    const lastArg = result[result.length - 1]
    result.push(createContextualArgument(newOp, result.length, lastArg))
  }
  
  return result
}

function convertToUnaryOperator(args: JsonLogicNode[], newOp: any): JsonLogicNode[] {
  // Unary operators take one argument
  const meaningfulValues = extractMeaningfulValues(args)
  
  if (meaningfulValues.length > 0) {
    return [meaningfulValues[0]]
  }
  
  // Create appropriate default based on unary operator type
  if (newOp.name === '!' || newOp.name === '!!' || newOp.name === 'isnull' || newOp.name === 'isnotnull') {
    return [{ id: generateId(), type: 'variable' as const, value: 'person.isActive' }]
  }
  
  if (newOp.name === 't') {
    return [{ id: generateId(), type: 'variable' as const, value: 'person.firstName' }]
  }
  
  return [createDefaultArgument(newOp, 0)]
}

function convertToSpecialOperator(args: JsonLogicNode[], newOp: any): JsonLogicNode[] {
  // Special operators might have unique argument patterns
  const meaningfulValues = extractMeaningfulValues(args)
  
  // Preserve meaningful values up to the operator's limits
  const result = meaningfulValues.slice(0, newOp.maxArgs)
  
  // Fill remaining required arguments
  while (result.length < newOp.minArgs) {
    result.push(createDefaultArgument(newOp, result.length))
  }
  
  return result
}

function convertFromUnaryOperator(args: JsonLogicNode[], newOp: any): JsonLogicNode[] {
  // Converting from unary to multi-argument operator
  const unaryArg = args[0]
  
  if (!unaryArg) {
    return Array.from({ length: newOp.minArgs }, (_, i) => createDefaultArgument(newOp, i))
  }
  
  // Use the unary argument as the first argument
  const result = [unaryArg]
  
  // Add contextual arguments based on the target operator
  if (newOp.category === 'comparison') {
    // Add a comparison value
    result.push(createContextualArgument(newOp, 1, unaryArg))
  } else if (newOp.category === 'logic') {
    // Add another condition
    result.push(createDefaultArgument(newOp, 1))
  } else if (newOp.category === 'arithmetic') {
    // Add a numeric value
    result.push({ id: generateId(), type: 'literal' as const, value: 1 })
  }
  
  // Fill remaining required arguments
  while (result.length < newOp.minArgs) {
    result.push(createDefaultArgument(newOp, result.length))
  }
  
  return result.slice(0, newOp.maxArgs)
}

function convertStringToData(args: JsonLogicNode[], newOp: any): JsonLogicNode[] {
  // String operations often work with variables, good for data operators
  const variables = extractVariableReferences(args)
  
  if (newOp.name === 'var' && variables.length > 0) {
    return [variables[0]]
  }
  
  if ((newOp.name === 'oneof' || newOp.name === 'partof') && variables.length > 0) {
    // Extract string literals to populate array
    const literals = extractLiteralValues(args)
    const arrayItems = literals.length > 0 
      ? literals.map(lit => ({ id: generateId(), type: 'literal' as const, value: lit.value }))
      : [{ id: generateId(), type: 'literal' as const, value: '' }]
    
    return [
      variables[0],
      { id: generateId(), type: 'array' as const, items: arrayItems }
    ]
  }
  
  return Array.from({ length: newOp.minArgs }, (_, i) => createDefaultArgument(newOp, i))
}

function convertDataToString(args: JsonLogicNode[], newOp: any): JsonLogicNode[] {
  // Data operators often have variables, good for string operations
  const variables = extractVariableReferences(args)
  
  if (newOp.name === 'concat') {
    return variables.length >= 2 ? variables.slice(0, 2) : [
      variables[0] || { id: generateId(), type: 'variable' as const, value: 'person.firstName' },
      { id: generateId(), type: 'variable' as const, value: 'person.lastName' }
    ]
  }
  
  if (newOp.name === 'concatWs') {
    const separator = { id: generateId(), type: 'literal' as const, value: ' ' }
    const stringVars = variables.length > 0 ? variables : [
      { id: generateId(), type: 'variable' as const, value: 'person.firstName' },
      { id: generateId(), type: 'variable' as const, value: 'person.lastName' }
    ]
    return [separator, ...stringVars]
  }
  
  if (newOp.name === 'substr' || newOp.name === 'strlen') {
    return variables.length > 0 ? [variables[0]] : [
      { id: generateId(), type: 'variable' as const, value: 'person.firstName' }
    ]
  }
  
  return Array.from({ length: newOp.minArgs }, (_, i) => createDefaultArgument(newOp, i))
}

function convertLogicToArithmetic(args: JsonLogicNode[], newOp: any): JsonLogicNode[] {
  // Logic operations can be converted to arithmetic by extracting numeric values
  const numericValues = args.filter(arg => 
    arg.type === 'literal' && typeof arg.value === 'number'
  )
  
  if (numericValues.length >= 2) {
    return numericValues.slice(0, 2)
  }
  
  // Look for variables that might contain numbers
  const variables = extractVariableReferences(args)
  const numericVars = variables.filter(v => 
    typeof v.value === 'string' && (
      v.value.includes('age') || v.value.includes('count') || 
      v.value.includes('amount') || v.value.includes('id')
    )
  )
  
  if (numericVars.length >= 1) {
    const result = [numericVars[0]]
    if (numericVars.length >= 2) {
      result.push(numericVars[1])
    } else {
      result.push({ id: generateId(), type: 'literal' as const, value: 1 })
    }
    return result.slice(0, newOp.maxArgs)
  }
  
  // Default numeric arguments
  return Array.from({ length: Math.min(newOp.minArgs, 2) }, (_, i) => 
    i === 0 
      ? { id: generateId(), type: 'variable' as const, value: 'person.age' }
      : { id: generateId(), type: 'literal' as const, value: 1 }
  )
}

function convertArithmeticToLogic(args: JsonLogicNode[], newOp: any): JsonLogicNode[] {
  // Arithmetic operations can be wrapped in logic conditions
  if (args.length >= 2 && (newOp.name === 'and' || newOp.name === 'or')) {
    // Create comparison expressions from arithmetic arguments
    const condition1: JsonLogicNode = {
      id: generateId(),
      type: 'expression' as const,
      operator: '>',
      arguments: [args[0], { id: generateId(), type: 'literal' as const, value: 0 }]
    }
    
    const condition2: JsonLogicNode = args[1] ? {
      id: generateId(),
      type: 'expression' as const,
      operator: '>',
      arguments: [args[1], { id: generateId(), type: 'literal' as const, value: 0 }]
    } : { id: generateId(), type: 'literal' as const, value: true }
    
    return [condition1, condition2]
  }
  
  // For other logic operators, use meaningful values
  const meaningfulValues = extractMeaningfulValues(args)
  const result = meaningfulValues.slice(0, newOp.maxArgs)
  
  while (result.length < newOp.minArgs) {
    result.push({ id: generateId(), type: 'literal' as const, value: true })
  }
  
  return result
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}