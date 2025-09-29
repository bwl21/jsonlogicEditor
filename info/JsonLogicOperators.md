# Unary Operators



## `!` - negates the result of the sub-expression

Negates the result of the sub-expression.

### Parameters

1. `term`: `JsonLogicExpression` - the term to negate

### Sample

returns true if a is not truthy

```JSON
{
    "!": {
        "var": "a"
    }
}
```



## `!!` - converts the result to a boolean

Negates the result of the sub-expression.

### Parameters

1. `term`: `JsonLogicExpression` - the term to be represented as boolean

### Sample

returns true if a is truthy

```JSON
{
    "!!": {
        "var": "a"
    }
}
```



## `true` - always true

return always true

### Parameters

1. ``: `void` - parameters will all be ignored

### Sample


```JSON
{
    "true": []
}
```



## `false` - always false

return always false

### Parameters

1. ``: `void` - parameters will all be ignored

### Sample


```JSON
{
    "false": []
}
```



## `isnull` - returns 1 if the term is null, 0 otherwise

Investigates if a term is NULL or an empty string


**Caution**: This cannot be used directly as a condition. Please compare with `1` to use as condition.

### Parameters

1. `term`: `JsonLogicExpression` - the term to investigate

### Sample

returns true if `person.birthday` is null. As `person.birthday` is a date, this is not the same as `person.birthday == ""`.

```JSON
{
    "isnull": [
        {
            "var": "person.birthday"
        }
    ]
}
```
returns true if `person.email` is null **or is** an empty string

```JSON
{
    "isnull": [
        {
            "var": "person.email"
        }
    ]
}
```
returns true if `person.email` is null **or is ** an empty string. Note that `var` is used explicitly with an array of one string

```JSON
{
    "isnull": [
        {
            "var": [
                "person.email"
            ]
        }
    ]
}
```
returns true if `person.email` is null as the comparison `==` yields null if one of the operands is null

```JSON
{
    "isnull": [
        {
            "==": [
                {
                    "var": "person.email"
                },
                ""
            ]
        }
    ]
}
```



## `isnotnull` - returns 1 if the term is not null, 0 otherwise

Investigates if a term is not NULL or an empty string


**Caution**: This cannot be used directly as a condition. Please compare with `1` to use as condition.

### Parameters

1. `term`: `JsonLogicExpression` - the term to investigate

### Sample

returns true if `person.birthday` is not null. As `person.birthday` is a date, this is not the same as `person.birthday != ""`

```JSON
{
    "isnotnull": [
        {
            "var": "person.birthday"
        }
    ]
}
```
returns true if `person.email` is not null **and is not** an empty string

```JSON
{
    "isnotnull": [
        {
            "var": "person.email"
        }
    ]
}
```
returns true if `person.email` is not null **and is not** an empty string. Note that `var` is used explicitly with an array of one string

```JSON
{
    "isnotnull": [
        {
            "var": [
                "person.email"
            ]
        }
    ]
}
```
returns false if `person.email` is null as the comparison `==` yields null if one of the operands is null

```JSON
{
    "isnotnull": [
        {
            "==": [
                {
                    "var": "person.email"
                },
                ""
            ]
        }
    ]
}
```



## `t` - converts the result to a string



### Parameters

1. `term`: `string` - the term to be represented as literal string

### Sample


```JSON
{
    "t": [
        "this is a text literal"
    ]
}
```



## `var` - access a database field

Access to a database field. Note,there is a syntactic sugar `{var: "person.firstName"}` for `{var: ["person.firstName"]}`

### Parameters

1. `name`: `string` - name of the database field

### Sample


```JSON
{
    "var": "person.firstName"
}
```



## `dterm` - A term with Description



### Parameters

1.  `description` - structure with the following fields:
    1. `title`: `string` - the title of the term
    1. `stereotype`: `array of string` - an array of strings to be used as stereotype, tu be used eg. by the frontend
2. `term`: `JsonLogicExpression` - the term itself

### Sample

Illustrate the use of a dterm with description to check two names:

```JSON
{
    "dterm": [
        {
            "title": "firstName is John or lastName is Doe",
            "stereotype": [
                "or-card"
            ]
        },
        {
            "or": [
                {
                    "==": [
                        {
                            "var": "person.firstName"
                        },
                        "John"
                    ]
                },
                {
                    "==": [
                        {
                            "var": "person.lastName"
                        },
                        "Doe"
                    ]
                }
            ]
        }
    ]
}
```
Illustrate the use of a dterm with description to concatenate two names:

```JSON
{
    "dterm": [
        "combine firstName and lastName",
        {
            "concat": [
                {
                    "var": "person.firstName"
                },
                " ",
                {
                    "var": "person.lastName"
                }
            ]
        }
    ]
}
```

# Binary Operators



## `and` - logical and

### UI Hints

`vertical`, `card-list`



### Parameters

1. `term a`: `JsonLogicExpression` - the first term
2. `term b`: `JsonLogicExpression` - the other term

### Sample

returns true if person is John Doe

```JSON
{
    "and": [
        {
            "==": [
                {
                    "var": "person.firstName"
                },
                "John"
            ]
        },
        {
            "==": [
                {
                    "var": "person.lastName"
                },
                "Doe"
            ]
        }
    ]
}
```



## `or` - logical or

### UI Hints

`horizontal`, `card-list`



### Parameters

1. `term a`: `JsonLogicExpression` - the first term
2. `term b`: `JsonLogicExpression` - the other term

### Sample

returns true if firstName is John or lastName is Doe

```JSON
{
    "or": [
        {
            "==": [
                {
                    "var": "person.firstName"
                },
                "John"
            ]
        },
        {
            "==": [
                {
                    "var": "person.lastName"
                },
                "Doe"
            ]
        }
    ]
}
```



## `oneof` - is one of the values in a list

### UI Hints

`card-in-list-of-literals`



### Parameters

1. `needle`: `JsonLogicExpression` - the term to be searched
2. `haystack`: `Array of values` - the list of literal values to be searched in

### Sample

returns true if firstName is one of  `John`, `Jane`

```JSON
{
    "oneof": [
        {
            "var": "person.firstName"
        },
        [
            "John",
            "Jane"
        ]
    ]
}
```



## `oneofs` - is in the result of a query

### UI Hints

`card-in-subquery`



### Parameters

1. `term a`: `JsonLogicExpression` - the first term
2. `query`: `ChurchQuery` - the query which returns the list of values

### Sample

`true` if person is invited to any group but _pjta_info.
note that the first responseField of the subquery is mapped
to the first term of the outer query

```JSON
{
    "oneofs": [
        {
            "var": "person.id"
        },
        {
            "title": "ist noch irgendwo anders eingeladen",
            "primaryEntityAlias": "groupmemberfieldvalue",
            "responseFields": [
                "person.id",
                "person.firstName",
                "person.lastName"
            ],
            "filter": {
                "and": [
                    {
                        "oneof": [
                            {
                                "var": "groupmemberfieldvalue.value"
                            },
                            [
                                "eingeladen"
                            ]
                        ]
                    },
                    {
                        "!==": [
                            {
                                "var": "ctgroup.name"
                            },
                            "_pjta_info"
                        ]
                    }
                ]
            }
        }
    ]
}
```



## `partof` - is part of string

### UI Hints

`card-in-list-of-literals`



### Parameters

1. `needle`: `JsonLogicExpression | string` - the term to be searched
2. `haystack`: `JsonLogicExpression | string` - the string to be searched in

### Sample

returns true if firstName is one of  `John`, `Jane`

```JSON
{
    "partof": [
        {
            "var": "person.firstName"
        },
        "John, George, Paul and Ringo"
    ]
}
```

# Comparison Operators



## `==` - equal

### UI Hints

`card`



### Parameters

1. `term a`: `JsonLogicExpression` - the first term
2. `term b`: `JsonLogicExpression` - the other term

### Sample

returns true if person's first name is John

```JSON
{
    "==": [
        {
            "var": "person.firstName"
        },
        "John"
    ]
}
```
returns true if group is auto-accept and leader are in sync

```JSON
{
    "==": [
        {
            "var": "ctgroup.informLeader"
        },
        {
            "var": "ctgroup.autoAccept"
        }
    ]
}
```



## `!==` - not equal

### UI Hints

`card`



### Parameters

1. `term a`: `JsonLogicExpression` - the first term
2. `term b`: `JsonLogicExpression` - the other term

### Sample

returns true if person's first name is not John

```JSON
{
    "!==": [
        {
            "var": "person.firstName"
        },
        "John"
    ]
}
```



## `<` - less than

### UI Hints

`card`



### Parameters

1. `term a`: `JsonLogicExpression` - the first term
2. `term b`: `JsonLogicExpression` - the other term

### Sample

returns true if person's first name is less than (i.e. alphabetically before) John

```JSON
{
    "<": [
        {
            "var": "person.firstName"
        },
        "John"
    ]
}
```



## `<=` - less than or equal to

### UI Hints

`card`



### Parameters

1. `term a`: `JsonLogicExpression` - the first term
2. `term b`: `JsonLogicExpression` - the other term

### Sample

returns true if person's first name is less than (i.e. alphabetically before) or equal to John

```JSON
{
    "<=": [
        {
            "var": "person.firstName"
        },
        "John"
    ]
}
```



## `>` - greater than

### UI Hints

`card`



### Parameters

1. `term a`: `JsonLogicExpression` - the first term
2. `term b`: `JsonLogicExpression` - the other term

### Sample

returns true if person's first name is greater than (i.e. alphabetically after) John

```JSON
{
    ">": [
        {
            "var": "person.firstName"
        },
        "John"
    ]
}
```



## `>=` - greater than or equal to

### UI Hints

`card`



### Parameters

1. `term a`: `JsonLogicExpression` - the first term
2. `term b`: `JsonLogicExpression` - the other term

### Sample

returns true if person's first name is greater than (i.e. alphabetically after) or equal to John

```JSON
{
    ">=": [
        {
            "var": "person.firstName"
        },
        "John"
    ]
}
```



## `between` - between two values (including the limits)

### UI Hints

`card`



### Parameters

1. `term a`: `JsonLogicExpression` - the first term
2. `term b`: `JsonLogicExpression` - the lower limit
3. `term c`: `JsonLogicExpression` - the upper limit

### Sample

returns true if person is between John and Robert (including the limits)

```JSON
{
    "between": [
        {
            "var": "person.firstName"
        },
        "John",
        "Robert"
    ]
}
```

# Multi-Argument Operators



## `concat` - concatenates strings



### Parameters

1. `term a`: `JsonLogicExpression` - the first term
2. `...`: `JsonLogicExpression` - the other terms

### Sample

returns e.g. `John Doe (123)`

```JSON
{
    "concat": [
        {
            "var": "person.firstName"
        },
        {
            "var": "person.lastName"
        },
        " (",
        {
            "var": "person.id"
        },
        ")"
    ]
}
```



## `concatWs` - concatenates strings with separator



### Parameters

1. `separator`: `JsonLogicExpression` - the separator
2. `term a`: `JsonLogicExpression` - the first term
3. `...`: `JsonLogicExpression` - the other terms

### Sample

returns e.g. `, John, Doe, 123`

```JSON
{
    "concat": [
        ", ",
        {
            "var": "person.firstName"
        },
        {
            "var": "person.lastName"
        },
        {
            "var": "person.id"
        }
    ]
}
```



## `coalesce` - returns the first non-null value

Returns the first non-null value. If all values are null, null is returned

### Parameters

1. `term a`: `JsonLogicExpression` - the first term
2. `term b`: `JsonLogicExpression` - the other term
3. `...`: `JsonLogicExpression` - the next alternative

### Sample

returns the first non-null value of person.firstName, person.lastName or "unknown"

```JSON
{
    "coalesce": [
        {
            "var": "person.firstName"
        },
        {
            "var": "person.lastName"
        },
        "unknown"
    ]
}
```

# Case When Operator



## `case` - case when cascade

Case when cascade. "Returns the corresponding value of first condition which is true is returned.
If no condition is true, null is returned.
The conditions are evaluated in the order they are defined.

### Parameters

1.  `case` - structure with the following fields:
    1. `when`: `JsonLogicExpression` - the condition
    1. `then`: `JsonLogicExpression` - the value to return
2. `...`: `...` - the next condition

### Sample


```JSON
{
    "case": [
        {
            "when": {
                "and": [
                    {
                        "==": [
                            {
                                "var": "groupmemberfieldvalue.value"
                            },
                            "diesmal abgesagt"
                        ]
                    }
                ]
            },
            "then": {
                "var": "ctgroup.name"
            }
        }
    ]
}
```



## `if` - if then else

Returns the second value if first value evaluates to true, otherwise return the third value.

### Parameters

1. `condition`: `JsonLogicExpression` - the condition
2. `then`: `JsonLogicExpression` - the value if condition evaluates to `true`
3. `else`: `JsonLogicExpression` - the value if condition evaluates to `false`

### Sample


```JSON
{
    "if": [
        {
            "var": "person.isSystemUser"
        },
        "system user",
        "regular user"
    ]
}
```

# Person Related Operators



## `invitation-status` - investigate if churchtools

### UI Hints

`card-in-subquery`

Investigate if invitation to ChurchTools is in a particular status.

### Parameters

1. `expextedStatus`: `string` - one of : `has-accepted`, `is-invited`, `is-not-invited`

### Sample


```JSON
{
    "invitation-status": [
        "has-accepted"
    ]
}
```



## `person--group` - is member of groups

Returns Members of Groups

### Parameters

1. `groupExpression`: `JsonLogicExpression` - filter criteria for the groups (can also use `subgroup`)
2. `personExpression`: `JsonLogicExpression` - filter cirteria for the groupmemgers

### Sample

using vanilla expressions

```JSON
{
    "person--group": [
        {
            "oneof": [
                {
                    "var": "grouptype.name"
                },
                [
                    "Kleingruppe",
                    "Dienst"
                ]
            ]
        },
        {
            "oneof": [
                {
                    "var": "role.name"
                },
                [
                    "Leiter"
                ]
            ]
        }
    ]
}
```
using `subgroups`

```JSON
{
    "person--group": [
        {
            "subgroups": [
                {
                    "levelfrom": 0,
                    "levelto": 10
                },
                {
                    "==": [
                        {
                            "var": "ctgroup.id"
                        },
                        154
                    ]
                },
                {
                    "==": [
                        {
                            "var": "groupstatus.name"
                        },
                        "active"
                    ]
                }
            ]
        },
        {
            "==": [
                {
                    "var": "person.id"
                },
                1
            ]
        }
    ]
}
```

# Group Related Operators



## `subgroups` - retrieve ids of subgroups

Retrieve ids of subgroups.

### Parameters

1.  `levels` - structure with the following fields:
    1. `levelfrom`: `integer` - the first level to retrieve; 0 is the group itself
    1. `levelto`: `integer` - the last level to retrieve; 0 is the group itself
2. `parentGroupExpression`: `JsonLogicExpression` - filter to find the parent group
3. `subgGroupExpression`: `JsonLogicExpression` - filter on the subgroups

### Sample


```JSON
{
    "subgroups": [
        {
            "levelfrom": 0,
            "levelto": 3
        },
        {
            "dterm": [
                "(Veranstaltungen oder Dienste) mit (ROM oder Predigt) im Titel",
                {
                    "and": [
                        {
                            "oneof": [
                                {
                                    "var": "grouptype.shorty"
                                },
                                [
                                    "VA",
                                    "DT"
                                ]
                            ]
                        },
                        {
                            "or": [
                                {
                                    "partof": [
                                        "Rom",
                                        {
                                            "var": [
                                                "ctgroup.name"
                                            ]
                                        }
                                    ]
                                },
                                {
                                    "partof": [
                                        "Predigt",
                                        {
                                            "var": [
                                                "ctgroup.name"
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            "==": [
                                {
                                    "var": [
                                        "ctgroup.groupStatusId"
                                    ]
                                },
                                1
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "dterm": [
                "die ihrerseits Verteiler sind sind",
                {
                    "==": [
                        {
                            "var": "grouptype.shorty"
                        },
                        "VL"
                    ]
                }
            ]
        }
    ]
}
```

# Aggregate Operators



## `count` - count all non-null values



### Parameters

1. `distinct`: `boolean` - count distinct values

### Sample


```JSON
{
    "aggregate": {
        "function": "count",
        "parameters": {
            "distinct": true
        }
    }
}
```



## `groupconcat` - Concatenates the values of the group

Concatenates the values of the group. The values are separated by `separator`. 
By default distinct values are concatenated orderd ascending.

### Parameters

1. `separator`: `string` - separator between the values
2. `distinct`: `boolean` - distinct values
3. `orderDirection`: `string` - order direction of the values (ASC | DESC)

### Sample


```JSON
{
    "aggregation": {
        "function": "groupconcat",
        "parameters": {
            "separator": "\n\n",
            "distinct": true,
            "orderDirection": "ASC"
        }
    }
}
```



## `max` -  maximum of several values



### Parameters



### Sample


```JSON
{
    "aggregation": {
        "function": "max"
    }
}
```



## `min` -  minimum of several values



### Parameters



### Sample


```JSON
{
    "aggregation": {
        "function": "min"
    }
}
```



## `sum` -  summarize values



### Parameters



### Sample


```JSON
{
    "aggregation": {
        "function": "sum"
    }
}
```

# Date Functions



## `ct_date` - convert a date expression to a date



### Parameters

1. `date`: `string` - a valid Carbon::parse - argument, e.g. one of `now`, `today`, `yesterday`, `tomorrow`

### Sample

returns the current date

```JSON
{
    "ct_date": [
        "now"
    ]
}
```



## `dateTimeDiff` - difference of two given dates



### Parameters

1. `date1`: `JsonLogicExpression` - expression representing the earlier date
2. `date2`: `JsonLogicExpression` - expression representing the latter date
3. `unit`: `string` - unit of result of `YEAR`, `MONTH`, `DAY`, `HOUR`, `MINUTE`, `SECOND`

### Sample

number of years from person's birthday to now - which in fact is the current age of the person

```JSON
{
    "dateTimeDiff": [
        {
            "var": "person.birthday"
        },
        {
            "ct_date": [
                "now"
            ]
        },
        "YEAR"
    ]
}
```



## `dateTimeAdd` - add a duration to a date



### Parameters

1. `date`: `JsonLogicExpression` - expression representing the date
2. `duration`: `integer` - duration to add
3. `unit`: `string` - unit of duration of `YEAR`, `MONTH`, `DAY`, `HOUR`, `MINUTE`, `SECOND`

### Sample

add 1 month to the birthday of a persn

```JSON
{
    "dateTimeAdd": [
        {
            "var": "person.birthday"
        },
        "1",
        "MONTH"
    ]
}
```



## `nextAnniversary` - next anniversary of a date



### Parameters

1. `date`: `JsonLogicExpression` - expression representing the date
2. `fromDate`: `JsonLogicExpression` - expression representing the starting day from which to seek the upcoming anniversary.

### Sample

next anniversary of the person from now

```JSON
{
    "nextAnniversary": [
        {
            "var": "person.birthday"
        },
        {
            "ct_date": [
                "now"
            ]
        }
    ]
}
```



## `dateFormat` - format a date

See https://www.php.net/manual/en/function.date.php for details on the format string
supported placeholders:  `Y` `m` `d` `h` `i` `s`

### Parameters

1. `date`: `JsonLogicExpression` - expression representing the date
2. `format`: `string` - format string as used by PHPs `date` function

### Sample

format the current date

```JSON
{
    "dateFormat": [
        {
            "ct_date": [
                "now"
            ]
        },
        "Y-m-d"
    ]
}
```



## `isJubilee` - Yield 1 if the next anniversary of the given date is a decade jubilee. Otherwise yield 0

A jubilee is a date which is a multiple of the jubileeInteval, e.g. 10, 20,


**Caution**: This cannot be used directly as a condition. Please compare with `1` to use as condition.

### Parameters

1. `date`: `JsonLogicExpression` - expression representing the date
2. `fromDate`: `JsonLogicExpression` - expression representing the starting day from which we seek the next anniversary.
3. `jubileeInterval`: `integer` - the jubilee to check for, e.g. `10` for every 10th anniversary

### Sample

check if the current date is a jubilee

```JSON
{
    "isJubilee": [
        {
            "var": "person.birthday"
        },
        {
            "ct_date": [
                "now"
            ]
        },
        10
    ]
}
```



## `isDateBetween` - return 1 if the given date is between two other dates



**Caution**: This cannot be used directly as a condition. Please compare with `1` to use as condition.

### Parameters

1. `date`: `JsonLogicExpression` - expression representing the date
2. `fromDate`: `string` - the lower bound of the interval
3. `toDate`: `string` - the upper bound of the interval

### Sample

check if the current date in the first quarter of 2021

```JSON
{
    "isDateBetween": [
        {
            "ct_date": [
                "now"
            ]
        },
        "2021-01-01",
        "2021-03-31"
    ]
}
```

# Preferred Joins



## account





### account -> accountingperiod as accountingPeriod



- account

- accountingperiod as accountingPeriod



## groupmember





### groupmember -> ctgroup as group



- groupmember

- ctgroup as group



### groupmember -> role as role



- groupmember

- role as role



### groupmember -> person as person



- groupmember

- person as person



### groupmember -> grouptype as groupType



- groupmember

- ctgroup as group

- grouptype as groupType



### groupmember -> groupmemberfield as id



- groupmember

- ctgroup as group

- groupmemberfield as id



### groupmember -> groupmemberfieldvalue as person



- groupmember

- groupmemberfieldvalue as person



### groupmember -> person as person



- groupmember as groupmember

- person as person



## person





### person -> avatar as avatar



- person

- avatar as avatar



### person -> familyavatar as familyAvatar



- person

- familyavatar as familyAvatar



### person -> device as device



- person

- device as device



### person -> transaction as donation



- person

- transaction as donation



### person -> status as status



- person

- status as status



### person -> relationship as relationship



- person

- relationship as relationship



### person -> ctgroup as group



- person

- groupmember as groupmember

- ctgroup as group



### person -> grouptype as groupType



- person

- groupmember as groupmember

- ctgroup as group

- grouptype as groupType



### person -> groupmemberfield as id



- person

- groupmember as groupmember

- ctgroup as group

- groupmemberfield as id



### person -> accountingperiod as accountingPeriod



- person

- transaction as donation

- account as account

- accountingperiod as accountingPeriod



### person -> groupmember as groupmember



- person

- groupmember as groupmember



### person -> groupmemberfield as groupId



- person

- groupmember as person

- groupmemberfield as groupId



### person -> fieldtype as fieldType



- person

- groupmember as groupmember

- groupmemberfield as groupId

- fieldtype as fieldType



### person -> groupmemberfieldvalue as person



- person

- groupmemberfieldvalue as person



### person -> groupmemberfield as groupId



- person

- groupmember as groupmember

- groupmemberfield as groupId



### person -> role as role



- person

- groupmember as groupmember

- role as role



### person -> costcenter as costCenter



- person

- transaction as donation

- costcenter as costCenter



### person -> relationship__personA as personA



- person

- relationship as relationship

- relationship__personA as personA



### person -> relationship__personB as personB



- person

- relationship as relationship

- relationship__personB as personB



## ctgroup





### ctgroup -> groupmemberfield as id



- ctgroup

- groupmemberfield as id



### ctgroup -> fieldtype as fieldType



- ctgroup

- groupmember as groupmember

- groupmemberfield as groupId

- fieldtype as fieldType



### ctgroup -> groupmemberfieldvalue as person



- ctgroup

- groupmember as groupmember

- groupmemberfieldvalue as person



### ctgroup -> person as person



- ctgroup

- groupmember as groupmember

- person as person



### ctgroup -> groupmember as groupmember



- ctgroup

- groupmember as groupmember



### ctgroup -> grouptype as groupType



- ctgroup

- grouptype as groupType



### ctgroup -> groupstatus as groupStatus



- ctgroup

- groupstatus as groupStatus



### ctgroup -> groupmemberfieldvalue as person



- ctgroup

- groupmember as id

- groupmemberfieldvalue as person



## groupmemberfield





### groupmemberfield -> ctgroup as group



- groupmemberfield

- ctgroup as group



### groupmemberfield -> grouptype as groupType



- groupmemberfield

- ctgroup as group

- grouptype as groupType



### groupmemberfield -> groupmemberfieldvalue as id



- groupmemberfield

- groupmemberfieldvalue as id



### groupmemberfield -> person as person



- groupmemberfield

- groupmemberfieldvalue as id

- person as person



### groupmemberfield -> fieldtype as fieldType



- groupmemberfield

- fieldtype as fieldType



### groupmemberfield -> person as person



- groupmemberfield

- ctgroup as group

- groupmember as groupmember

- person as person



### groupmemberfield -> groupmember as groupmember



- groupmemberfield

- ctgroup as group

- groupmember as groupmember



## groupmemberfieldvalue





### groupmemberfieldvalue -> ctgroup as group



- groupmemberfieldvalue

- groupmemberfield as groupMemberField

- ctgroup as group



### groupmemberfieldvalue -> groupmemberfield as groupMemberField



- groupmemberfieldvalue

- groupmemberfield as groupMemberField



### groupmemberfieldvalue -> role as role



- groupmemberfieldvalue

- person as person

- groupmember as groupmember

- role as role



### groupmemberfieldvalue -> grouptype as groupType



- groupmemberfieldvalue

- groupmemberfield as groupMemberField

- ctgroup as group

- grouptype as groupType



### groupmemberfieldvalue -> person as person



- groupmemberfieldvalue

- person as person



## relationship





### relationship -> relationship__personA as personA



- relationship

- relationship__personA as personA



### relationship -> relationship__personB as personB



- relationship

- relationship__personB as personB



### relationship -> relationshiptype as relationshipType



- relationship

- relationshiptype as relationshipType



## transaction





### transaction -> account as account



- transaction

- account as account



### transaction -> costcenter as costCenter



- transaction

- costcenter as costCenter



### transaction -> transaction__donatorSpouse as donatorSpouseId



- transaction

- transaction__donatorSpouse as donatorSpouseId



### transaction -> transaction__donator as donatorId



- transaction

- transaction__donator as donatorId



## translation





### translation -> translationkey as key



- translation

- translationkey as key



### translation -> language as language



- translation

- language as language