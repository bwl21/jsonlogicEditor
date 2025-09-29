// Represents any JsonLogic expression value
export type JsonLogicValue = string | number | boolean | null | JsonLogicExpression | JsonLogicValue[]

// Core JsonLogic expression - matches the actual JsonLogic format
export interface JsonLogicExpression {
  [operator: string]: JsonLogicValue | JsonLogicValue[]
}

// Available field names from the database schema
export const FIELD_NAMES = [
  // Person fields
  'person.id', 'person.firstName', 'person.lastName', 'person.email', 'person.birthday',
  'person.isActive', 'person.isArchived', 'person.isSystemUser', 'person.mobile', 'person.phonePrivate',
  'person.street', 'person.city', 'person.zip', 'person.country', 'person.sexId', 'person.statusId',
  'person.campusId', 'person.familyStatusId', 'person.job', 'person.nickname', 'person.title',
  'person.dateOfBaptism', 'person.dateOfBelonging', 'person.dateOfEntry', 'person.dateOfResign',
  'person.lastLogin', 'person.createdDate', 'person.modifiedDate',

  // Group fields
  'ctgroup.id', 'ctgroup.name', 'ctgroup.groupTypeId', 'ctgroup.groupStatusId', 'ctgroup.groupCategoryId',
  'ctgroup.autoAccept', 'ctgroup.informLeader', 'ctgroup.maxMembers', 'ctgroup.allowWaitinglist',
  'ctgroup.visibility', 'ctgroup.startDate', 'ctgroup.endDate', 'ctgroup.meetingTime', 'ctgroup.weekday',
  'ctgroup.campusId', 'ctgroup.targetGroupId', 'ctgroup.note', 'ctgroup.createdDate', 'ctgroup.modifiedDate',

  // Group member fields
  'groupmember.id', 'groupmember.groupId', 'groupmember.groupMemberStatus', 'groupmember.memberStartDate',
  'groupmember.memberEndDate', 'groupmember.waitingListPosition', 'groupmember.comment',
  'groupmember.followUpStep', 'groupmember.createdDate', 'groupmember.modifiedDate',

  // Group member field values
  'groupmemberfieldvalue.groupMemberFieldId', 'groupmemberfieldvalue.value',

  // Group member fields
  'groupmemberfield.id', 'groupmemberfield.groupId', 'groupmemberfield.name', 'groupmemberfield.defaultValue',
  'groupmemberfield.requiredInRegistrationForm', 'groupmemberfield.useInRegistrationForm',

  // Status and roles
  'status.id', 'status.name', 'status.isMember', 'status.isSearchable', 'status.shorty',
  'role.id', 'role.name', 'role.shorty', 'role.type', 'role.isDefault', 'role.isHidden',

  // Group types and status
  'grouptype.id', 'grouptype.name', 'grouptype.namePlural', 'grouptype.shorty', 'grouptype.color',
  'grouptype.isLeaderNecessary', 'grouptype.availableForNewPerson',
  'groupstatus.id', 'groupstatus.name',

  // Relationships
  'relationship.id', 'relationship.personAId', 'relationship.personBId',
  'relationship__personA.firstName', 'relationship__personA.lastName', 'relationship__personA.email',
  'relationship__personB.firstName', 'relationship__personB.lastName', 'relationship__personB.email',
  'relationshiptype.id', 'relationshiptype.name', 'relationshiptype.degreeNameA', 'relationshiptype.degreeNameB',

  // Transactions and donations
  'transaction.id', 'transaction.amount', 'transaction.documentDate', 'transaction.documentNumber',
  'transaction.donatorId', 'transaction.note', 'transaction.createdDate',
  'transaction__donator.firstName', 'transaction__donator.lastName', 'transaction__donator.email',

  // Common lookup fields
  'language.code', 'language.name',
  'contactlabel.name', 'contactlabel.isDefault',
  'personemail.email', 'personemail.isDefault'
]

// Internal representation for the visual editor
export interface JsonLogicNode {
  id: string
  type: 'expression' | 'variable' | 'literal' | 'array' | 'string' | 'number' | 'boolean' | 'date'
  
  // For expressions (operators)
  operator?: string
  arguments?: JsonLogicNode[]
  
  // For literals and variables
  value?: any
  
  // For arrays
  items?: JsonLogicNode[]
}

export interface JsonLogicOperator {
  name: string
  label: string
  minArgs: number
  maxArgs: number
  category: 'unary' | 'logic' | 'comparison' | 'arithmetic' | 'data' | 'control' | 'string' | 'special'
  description: string
  argumentLabels?: string[]
  uiHints?: string[]
}

export const OPERATORS: JsonLogicOperator[] = [
  // Unary operators
  { 
    name: '!', 
    label: 'NOT', 
    minArgs: 1, 
    maxArgs: 1, 
    category: 'unary',
    description: 'Negates the result of the sub-expression',
    argumentLabels: ['Term'],
    uiHints: ['card']
  },
  { 
    name: '!!', 
    label: 'To Boolean', 
    minArgs: 1, 
    maxArgs: 1, 
    category: 'unary',
    description: 'Converts the result to a boolean',
    argumentLabels: ['Term'],
    uiHints: ['card']
  },
  { 
    name: 'true', 
    label: 'Always True', 
    minArgs: 0, 
    maxArgs: 0, 
    category: 'unary',
    description: 'Always returns true',
    argumentLabels: [],
    uiHints: ['card']
  },
  { 
    name: 'false', 
    label: 'Always False', 
    minArgs: 0, 
    maxArgs: 0, 
    category: 'unary',
    description: 'Always returns false',
    argumentLabels: [],
    uiHints: ['card']
  },
  { 
    name: 'isnull', 
    label: 'Is Null', 
    minArgs: 1, 
    maxArgs: 1, 
    category: 'unary',
    description: 'Returns 1 if the term is null or empty string, 0 otherwise',
    argumentLabels: ['Term'],
    uiHints: ['card']
  },
  { 
    name: 'isnotnull', 
    label: 'Is Not Null', 
    minArgs: 1, 
    maxArgs: 1, 
    category: 'unary',
    description: 'Returns 1 if the term is not null and not empty string, 0 otherwise',
    argumentLabels: ['Term'],
    uiHints: ['card']
  },
  { 
    name: 't', 
    label: 'Text Literal', 
    minArgs: 1, 
    maxArgs: 1, 
    category: 'unary',
    description: 'Converts the result to a string literal',
    argumentLabels: ['Text'],
    uiHints: ['card']
  },

  // Logic operators
  { 
    name: 'and', 
    label: 'AND', 
    minArgs: 2, 
    maxArgs: Infinity, 
    category: 'logic',
    description: 'Logical AND - all conditions must be true',
    argumentLabels: ['Condition A', 'Condition B'],
    uiHints: ['vertical', 'card-list']
  },
  { 
    name: 'or', 
    label: 'OR', 
    minArgs: 2, 
    maxArgs: Infinity, 
    category: 'logic',
    description: 'Logical OR - at least one condition must be true',
    argumentLabels: ['Condition A', 'Condition B'],
    uiHints: ['horizontal', 'card-list']
  },

  // Comparison operators
  { 
    name: '==', 
    label: 'Equals', 
    minArgs: 2, 
    maxArgs: 2, 
    category: 'comparison',
    description: 'Values are equal',
    argumentLabels: ['Left Value', 'Right Value'],
    uiHints: ['card']
  },
  { 
    name: '!==', 
    label: 'Not Equals', 
    minArgs: 2, 
    maxArgs: 2, 
    category: 'comparison',
    description: 'Values are not equal',
    argumentLabels: ['Left Value', 'Right Value'],
    uiHints: ['card']
  },
  { 
    name: '<', 
    label: 'Less Than', 
    minArgs: 2, 
    maxArgs: 2, 
    category: 'comparison',
    description: 'Left value is less than right value',
    argumentLabels: ['Left Value', 'Right Value'],
    uiHints: ['card']
  },
  { 
    name: '<=', 
    label: 'Less or Equal', 
    minArgs: 2, 
    maxArgs: 2, 
    category: 'comparison',
    description: 'Left value is less than or equal to right value',
    argumentLabels: ['Left Value', 'Right Value'],
    uiHints: ['card']
  },
  { 
    name: '>', 
    label: 'Greater Than', 
    minArgs: 2, 
    maxArgs: 2, 
    category: 'comparison',
    description: 'Left value is greater than right value',
    argumentLabels: ['Left Value', 'Right Value'],
    uiHints: ['card']
  },
  { 
    name: '>=', 
    label: 'Greater or Equal', 
    minArgs: 2, 
    maxArgs: 2, 
    category: 'comparison',
    description: 'Left value is greater than or equal to right value',
    argumentLabels: ['Left Value', 'Right Value'],
    uiHints: ['card']
  },
  { 
    name: 'between', 
    label: 'Between', 
    minArgs: 3, 
    maxArgs: 3, 
    category: 'comparison',
    description: 'Value is between two limits (inclusive)',
    argumentLabels: ['Value', 'Lower Limit', 'Upper Limit'],
    uiHints: ['card']
  },

  // Data operators
  { 
    name: 'var', 
    label: 'Variable', 
    minArgs: 1, 
    maxArgs: 1, 
    category: 'data',
    description: 'Access a database field',
    argumentLabels: ['Field Name'],
    uiHints: ['card']
  },
  { 
    name: 'oneof', 
    label: 'One Of', 
    minArgs: 2, 
    maxArgs: 2, 
    category: 'data',
    description: 'Check if value is one of the values in a list',
    argumentLabels: ['Value', 'List of Values'],
    uiHints: ['card-in-list-of-literals']
  },
  { 
    name: 'oneofs', 
    label: 'One Of (Subquery)', 
    minArgs: 2, 
    maxArgs: 2, 
    category: 'data',
    description: 'Check if value is in the result of a query',
    argumentLabels: ['Value', 'Query'],
    uiHints: ['card-in-subquery']
  },
  { 
    name: 'partof', 
    label: 'Part Of String', 
    minArgs: 2, 
    maxArgs: 2, 
    category: 'data',
    description: 'Check if needle is part of haystack string',
    argumentLabels: ['Needle', 'Haystack'],
    uiHints: ['card-in-list-of-literals']
  },

  // String operators
  { 
    name: 'concat', 
    label: 'Concatenate', 
    minArgs: 2, 
    maxArgs: Infinity, 
    category: 'string',
    description: 'Concatenates strings',
    argumentLabels: ['String A', 'String B'],
    uiHints: ['card']
  },
  { 
    name: 'concatWs', 
    label: 'Concatenate with Separator', 
    minArgs: 3, 
    maxArgs: Infinity, 
    category: 'string',
    description: 'Concatenates strings with separator',
    argumentLabels: ['Separator', 'String A', 'String B'],
    uiHints: ['card']
  },
  { 
    name: 'coalesce', 
    label: 'Coalesce', 
    minArgs: 2, 
    maxArgs: Infinity, 
    category: 'string',
    description: 'Returns the first non-null value',
    argumentLabels: ['Value A', 'Value B'],
    uiHints: ['card']
  },

  // Control flow
  { 
    name: 'if', 
    label: 'If-Then-Else', 
    minArgs: 3, 
    maxArgs: 3, 
    category: 'control',
    description: 'Returns second value if condition is true, otherwise third value',
    argumentLabels: ['Condition', 'Then Value', 'Else Value'],
    uiHints: ['card']
  },
  { 
    name: 'case', 
    label: 'Case When', 
    minArgs: 1, 
    maxArgs: Infinity, 
    category: 'control',
    description: 'Case when cascade - returns value of first true condition',
    argumentLabels: ['Case'],
    uiHints: ['card']
  },

  // Special operators
  { 
    name: 'dterm', 
    label: 'Described Term', 
    minArgs: 2, 
    maxArgs: 2, 
    category: 'special',
    description: 'A term with description and UI hints',
    argumentLabels: ['Description', 'Term'],
    uiHints: ['card']
  },
  { 
    name: 'invitation-status', 
    label: 'Invitation Status', 
    minArgs: 1, 
    maxArgs: 1, 
    category: 'special',
    description: 'Investigate ChurchTools invitation status',
    argumentLabels: ['Expected Status'],
    uiHints: ['card-in-subquery']
  }
]