export interface OperatorClass {
  name: string
  label: string
  component: string
  convertibleTo: string[]
  category: 'logic' | 'comparison' | 'data' | 'control' | 'arithmetic' | 'string'
  description: string
}

export const OPERATOR_CLASSES: OperatorClass[] = [
  {
    name: 'or',
    label: 'OR',
    component: 'OrOperator',
    convertibleTo: ['and'],
    category: 'logic',
    description: 'Logical OR - at least one condition must be true'
  },
  {
    name: 'and',
    label: 'AND', 
    component: 'AndOperator',
    convertibleTo: ['or'],
    category: 'logic',
    description: 'Logical AND - all conditions must be true'
  },
  {
    name: 'comparison',
    label: 'Comparison',
    component: 'ComparisonOperator',
    convertibleTo: ['comparison'],
    category: 'comparison',
    description: 'Comparison operators (==, !=, >, <, etc.)'
  },
  {
    name: 'data',
    label: 'Data Access',
    component: 'DataOperator', 
    convertibleTo: ['data'],
    category: 'data',
    description: 'Data access operators (var, oneof, etc.)'
  }
]

export function getOperatorClass(operator: string): OperatorClass | undefined {
  return OPERATOR_CLASSES.find(cls => cls.name === operator)
}

export function getComponentForOperator(operator: string): string {
  const operatorClass = getOperatorClass(operator)
  return operatorClass?.component || 'JsonLogicAtom'
}

export function getConvertibleOperators(operator: string): string[] {
  const operatorClass = getOperatorClass(operator)
  return operatorClass?.convertibleTo || []
}