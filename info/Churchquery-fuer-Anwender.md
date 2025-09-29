

## Einführung

Mit ChurchQuery können Abfragen an ChurchTools auf eine einheitliche Weise durchgeführt werden. Diese Abfragen sind übergreifend für alle Module (z. B. Personen, Gruppen usw.) anwendbar.

Technisch gesehen basieren die Abfragen auf Objekten, die als JSON serialisiert werden. Dieses Format wird zwischen Frontend und Backend ausgetauscht und auch gespeichert. Die Benutzeroberfläche baut ebenfalls auf diesem Format auf und stellt eine angepasste Visualisierung bereit.

## Grundprinzipien

Eine Query besteht aus folgenden Bestandteilen:

- **`responseFields`**: Definiert, welche Felder aus welchem Bereich zurückgegeben werden sollen (Select).
- **`filter`**: Auswahlkriterien in Form beliebiger logischer Ausdrücke (und / oder / nicht).
- **`groupBy`**: Gruppierungen und Zusammenfassungen, z. B. wie viele Gruppen eine Person angehört.
- **`computedFields`**: Berechnete Felder, die auf den zurückgegebenen Feldern basieren.
- **`having`**: Filterkriterien, die nach der Gruppierung angewendet werden.

## Ein minimalistisches Beispiel ist

### Titel der Abfrage

```json

{
  "title": "some stuff with groupmembers and groupmemberfields",

```

### Primärer Bereich der Abfrage (Primary Entity)

Im vorliegenden Beispiel arbeitet die Abfrage entlang der Personen.

```json

  "primaryEntityAlias": "person",

```

  Der `primaryEntityAlias` ist der Alias der Primärtabelle. Er wird verwendet, um die Felder zu referenzieren.

### Felder, die von der Abfrage zurückgegeben werden sollen 

```json
  "responseFields": [
    "person.id",
    "person.firstName",
    "person.lastName"
  ],

```
 ResponseFields können wie folgt angegeben werden:

1. **Feldnamen im Format `{entity}.{feldname}`**

   Dies ist eine Referenz auf ein Feld in einem Entity mit Rolle. Der Alias wird automatisch aus dem Feldnamen abgeleitet (syntaktischer Zucker für `{"var": "person.lastName"}`).

2. **Berechneter Wert**

   ```json
   {"alias": "MyPersonLastName", "value": {"var": "person.lastName"}}
   ```

   Der Aliasname **muss** hier angegeben werden.

### Angaben für Testfälle

```json
  "test": {
    "skip": "",
    "count": 5
  },

```

### Angabe eines Dateinamen-Blockes

### Dateinamenblock 

```
 {
   "outfilenamePart": "MyPersonLastName"
```

Dieser Wert wird beispielsweise für den Excel-Export verwendet und dient auch als Dateiname, wenn die Abfrage einen Testfall beschreibt.

### Filterblock

 Der Filterblock definiert die Kriterien zur Datenfilterung. Dies erfolgt über einen JsonLogic-Ausdruck:

  Das ist ein JsonLogic Ausdruck

```json
  "filter": {
    "dterm": [
      "Abfrage nach Einladungsstatus",
      {
        "invitation-status": [
          "is-not-invited"
        ]
      }
    ]
  }
```
### Gruppierung

```json
    {
      "groupBy": [
        "person.id"
      ]
    }
```
Die Angabe mehrerer Felder in der `groupBy`-Klausel ermöglicht detailliertere Gruppierungen und aggregierende Funktionen wie COUNT(), SUM(), AVG() usw.:

Die `groupBy`-Klausel ist optional. Wenn du sie nicht verwendest, werden alle
Aggregationen in berechneten Feldern deaktiviert.

Die `groupBy`-Klausel kann auch leer sein. In diesem Fall werden alle Datensätze aggregiert.

Beachte, dass bei der Verwendung von GROUP BY alle Nicht-Aggregatfelder 
(Felder, die nicht in einer aggregierenden Funktion wie COUNT() verwendet werden) 
in der `groupBy`-Klausel vorhanden sein müssen. Sonst kommt eine Fehlermeldung z.B.: `"message": "Select clause refers to table(s) 'ctgroup' not mentioned the groupBy clause ('person')"`

### Berechnete Felder

Du kannst berechnete Felder definieren, die auf den Feldern der Abfrage basieren.

```json
"computedFields": [
  {
    "name": "Name",
    "aggregation": {
      "function": "groupconcat",
      "parameters": {
        "separator": "\n\n"
      }
    },
    "value": {
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
  }
```

Ein berechnetes Feld hat folgende Eigeschaften:

* `name` - der Name des Feldes. Dieser Name wird als Spaltenüberschrift verwendet.
* `aggregation` - die Aggregationsfunktion, die auf die Gruppe angewendet wird. 
Wenn du keine Aggregation verwenden möchtest, kannst du dieses Feld leer lassen.

Wenn dieses Feld fehlt, gilt der Default:

```json
"aggregation": {
  "function": "groupconcat",
  "parameters": {
    "separator": "\n\n"
  }
}
```

* `value`: ein ChurchQuery - Ausdruck für den Wert des Feldes. 

aggregierende Funktionen sind (siehe JsonLogicOperators)

* `groupConcat` - zwei Parameter

   - Expression

   - Separator

* `count` - zählt die Anzahl der Werte in einer Gruppe

* `min` - der kleinste Wert in einer Gruppe

* `max` - der größte Wert in einer Gruppe

* `sum` - die Summe der Werte in einer Gruppe

### Filter nach Gruppierung

Die `having`-Klausel ermöglicht es dir, Filterkriterien auf die Gruppen anzuwenden, 
die durch die `groupBy`-Klausel definiert sind.

Die `having`-Klausel ist ein JsonLogic-Ausdruck, der auf die Gruppen angewendet wird.

```json
 "having": { ">=": [{"var": "devices"},1]}
```

In diesem Beispiel werden nur Gruppen zurückgegeben, die mehr als einen Datensatz enthalten.

Die `having`-Klausel ist optional. Wenn du sie nicht verwendest, werden keine Filter auf die Gruppen angewendet.

Die `having`-Klausel kann auch leer sein. In diesem Fall werden alle Gruppen zurückgegeben.

Auf die berechneten Felder kann in der `having`-Klausel über die `var` - Anweisung zugegriffen werden.

### das Ende der Abfrage 

    ```json
      
    }
    ```

## `Und`-Verknüpfung von Gruppenmitgliedschaften

In ChurchQuery werden alle Informationen zunächst in eine flache Tabelle zusammengeführt.
Für jede Mehrfachbeziehung entsteht ein eigener Datensatz in dieser Tabelle.

```JSON
{
  "# groupBy": [
    "person.id"
  ],
  "filter": {
    "and": [
      {
        "dterm": [
          "Auswahl der Personen nach Gruppenmitgliedschaft",
          {
            "or": [
              {
                "dterm": [
                  {
                    "title": "in gruppe 213",
                    "stereotype": [
                      " groupmembership"
                    ]
                  },
                  {
                    "==": [
                      {
                        "var": "ctgroup.id"
                      },
                      "213"
                    ]
                  }
                ]
              },
              {
                "dterm": [
                  "Auswahl der Personen nach Gruppenmitgliedschaft",
                  {
                    "and": [
                      {
                        "dterm": [
                          {
                            "title": "in gruppe 222",
                            "stereotype": [
                              " groupmembership"
                            ]
                          },
                          {
                            "==": [
                              {
                                "var": "ctgroup.id"
                              },
                              "222"
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "primaryEntityAlias": "person",
  "responseFields": [
    "person.id",
    "person.firstName",
    "person.lastName",
    "ctgroup.id"
  ]
}
```

Diese Abfrage liefert die Gruppenmitlgiedschaften aus Gruppe 213 **ODER**  aus Gruppe 222 sind. Für Luis Hill einen Eintrag in Gruppe 213 und 222. 

| person__id | person__firstName | person__lastName | ctgroup__id |
|------------|-------------------|------------------|-------------|
| 1          | Luis              | Hill             | 213         |
| 4360       | Charlotte         | Wood             | 213         |
| 1          | Luis              | Hill             | 222         |
| 93         | Test              | Neu              | 222         |

Wenn man nun Personen sucht, die in 213 **UND** in 222 sind, müsste die Filter - Klausel mehrere Datensätze verbinden. 
Der Filter-Ausdruck wirkt aber immer nur auf einen Datensatz. Daher funktionert die **UND** - Verbindung nicht

Die Abfrage liefert also die Eigenschaften für alle existierenden Gruppenmitgliedschaften, 
nicht aber eine boolesche Antwort auf "ist in Gruppe". Das muss explizit ausformuliert werden als `{"oneofs" ...}`

Um das zu erreichen, muss der Term "in gruppe 213" mit dem stereotyp `groupmembership` oder `groupmemberfield` gekennzeichnet sein. 
Das zeigt an, dass das Ziel des Ausdrucks die Gruppenmitgliedschaft als solche ist. 

**Hinweis**: Das UI trägt diese stereotypes automatisch ein.

ChurchQuery führt eine entsprechende Transformation durch.

```json
{
  "dterm": [
    {
      "title": "in gruppe 213",
      "stereotype": [
        "groupmembership"
      ]
    },
    {                <-- gewünschtes Filter
      "==": [
        {
          "var": "ctgroup.id"
        },
        "213"
      ]
    }
  ]
}
```

```json
{
  "dterm": [
    {
      "title": "converted in gruppe 213",
      "stereotype": [
      ]
    },
    {
      "oneofs": [
        {
          "var": "person.id"
        },
        {
          "responseFields": [
            "person.id"
          ],
          "filter": {          <-- gewünschtes Filter
            "==": [
              {
                "var": "ctgroup.id"
              },
              "213"
            ]
          }
        }
      ]
    }
  ]
}
```



### Alternative - `person--group`

Alternativ kann der eingebaute operator `person--group` verwendet werden. Dieser liefert `true` für alle Pesonen auf die der Ausdruck zutrifft. 
Es kommen aber keine Details über die Gruppenmitgliedschaften etc. Daher kann dieser ausdruck auch in **UND** Verknüpfungen verwendet werden, 
da er auf den Pesonendatensatz wirkt und nicht auf die Datensätze der einzelnen Gruppenmitgliedschaften.

```json
{
  " groupBy": [
    "person.id"
  ],
  "filter": {
    "and": [
      {
        "dterm": [
          "Auswahl der Personen nach Gruppenmitgliedschaft",
          {
            "and": [
              {
                "person--group": [
                  {
                    "oneof": [
                      {
                        "var": "ctgroup.id"
                      },
                      [
                        "213"
                      ]
                    ]
                  },
                  {
                    "true": []
                  }
                ]
              },
              {
                "person--group": [
                  {
                    "oneof": [
                      {
                        "var": "ctgroup.id"
                      },
                      [
                        "133"
                      ]
                    ]
                  },
                  {
                    "true": []
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "primaryEntityAlias": "person",
  "responseFields": [
    "person.id",
    "person.firstName",
    "person.lastName"
  ]
}
```

## Filtern nach Werten von Gruppenmitlgiedsfeldern mit Berücksichtigung der Derfault - Werte


ChurchTools trägt die Werte der Gruppenmitgliedsfelder erst dan in die Datenbank (`groupemmberfieldvalue.value` ein, wenn sie wirklichv vorhanden sind.
Die Default-Werte werden nicht in `groupmemherifeldvaulue.value` eingetragen.

Wenn man nach Werten von Gruppenmitgliedsfeldern filtern will, muss man also die Defaultwerte explizit abfragen. Dazu kann man  `coalesce` Operator verwenden:

  ```json
  {
    "coalesce": [
      {
        "var": "groupmemberfieldvalue.value"
      },
      {
        "var": "groupmemberfield.defaultValue"
      }
    ]
  }

```

**Hinweis**: Das UI fügt diese Techniken automatisch ein.


## Konsolidierung von Gruppenmitgliedschaften

Um eine Konsolidierung von Eigenschaften zu erreichen sind folgende Schritte notwendg

1. Personen (allgemeinder Entities) filtern, die überhaupt ausgegeben werden sollen, und einen Datensatz in der Ausgabe begründen
2. Nach diesen Personen gruppieren in der `groupBy` Klausel
3. mit den GroupBy - Funktionen die konsolidierten Daten aufsammeln.
4. Dabei sind **alle**  dazu gejointen Datensätze aktiv, nicht nur die, welche über das initiale Filter angesprochen werden. 
   In anderen Worten: wenn z.b. eine Person gesucht wird die in 213 UND in 222 ist, so sind in den computedFields dennoch alle 
   anderen Gruppenmitlgiedschaften wieder vorhanden. Das ermöglicht es, die Daten aus allen Gruppenmitgliedsschaften zu aggregieren.
5. Das bedeutet auch, dass man ggf. nocheinmal entsprechend filtern muss, um die aggregierten Daten einzugrenzen. 
   Dazu gibt es zwei Möglichkeiten:
   1. Ein weiteres Filter in `filter` einfügen, welche nach den relevanten Daten sucht. Dabei kann es auch vorkommen, 
      dass dieses Filter wieder Personen entfernt, wenn kein passender Datensatz gefunden wird.
   
      In der Praxis bedeutet das oft, dass Teile aus dem `filter` für die Personen im Filter für die berechneten 
      Felder wiederholt werden müssen. Ggf. ist der Stereotyp `groupmembership` bzw `groupmemberfield` an dieser Stelle zu 
      erntfernen, weil dieser auf die Gruppenmitgliedschaften abzielt, nicht auf den Wert der Gruppenmitgliedschaftsfelder.
   2. mit einem `case` bzw. `if` im `value` term filtern. Dabei muss ein Leerstring als Default-wert verwendet werden, 
      sonst wird der Datensatz wieder herausgefiltert.

### weiteres Filter vor der Konsolidierung

```json
{
  "groupBy": [
    "person.id"
  ],
  "filter": {
    "and": [
      {
        "dterm": [
          "Auswahl der Personen nach Gruppenmitgliedschaft",
          {
            "and": [
              {
                "dterm": [
                  {
                    "title": "in gruppe 213",
                    "stereotype": [
                      "groupmembership"
                    ]
                  },
                  {
                    "==": [
                      {
                        "var": "ctgroup.id"
                      },
                      "213"
                    ]
                  }
                ]
              },
              {
                "dterm": [
                  "Auswahl der Personen nach Gruppenmitgliedschaft",
                  {
                    "and": [
                      {
                        "dterm": [
                          {
                            "title": "in gruppe 222",
                            "stereotype": [
                              "groupmembership"
                            ]
                          },
                          {
                            "==": [
                              {
                                "var": "ctgroup.id"
                              },
                              "222"
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "dterm": [
          {
            "title": "filter für die Konsolidierung"
          },
          {
            "oneof": [
              {
                "var": "ctgroup.id"
              },
              [
                1,
                213,
                222,
                392
              ]
            ]
          }
        ]
      }
    ]
  },
  "computedFields": [
    {
      "name": "konsolidierung",
      "value": {
        "var": "ctgroup.id"
      }
    }
  ],
  "primaryEntityAlias": "person",
  "responseFields": [
    "person.id",
    "person.firstName",
    "person.lastName",
    "konsolidierung"
  ]
}
```
Diese Abfrage liefert
* Luis Hill der in Gruppe  `222` **UND** in `213` ist
* Anzeige der Gruppenmitgliedschaften 1, 213, 222, 392 die über das Filter für die Konsolidierung ausgewält wurden.

| person__id | person__firstName | person__lastName | konsolidierung                           |
|------------|-------------------|------------------|------------------------------------------|
| 1          | Luis              | Hill             | 1          213          222          392 |

### Filter in der Konsolidierung und Formatierung der Ausgabe

```json
{
  "groupBy": [
    "person.id"
  ],
  "filter": {
    "and": [
      {
        "dterm": [
          "Auswahl der Personen nach Gruppenmitgliedschaft",
          {
            "and": [
              {
                "dterm": [
                  {
                    "title": "in gruppe 213",
                    "stereotype": [
                      "groupmembership"
                    ]
                  },
                  {
                    "==": [
                      {
                        "var": "ctgroup.id"
                      },
                      "213"
                    ]
                  }
                ]
              },
              {
                "dterm": [
                  "Auswahl der Personen nach Gruppenmitgliedschaft",
                  {
                    "and": [
                      {
                        "dterm": [
                          {
                            "title": "in gruppe 222",
                            "stereotype": [
                              "groupmembership"
                            ]
                          },
                          {
                            "==": [
                              {
                                "var": "ctgroup.id"
                              },
                              "222"
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "dterm": [
          {
            "title": "filter für die Konsolidierung"
          },
          {
            "oneof": [
              {
                "var": "ctgroup.id"
              },
              [
                1,
                213,
                222,
                392
              ]
            ]
          }
        ]
      }
    ]
  },
  "computedFields": [
    {
      "name": "konsolidierung",
      "value": {
        "var": "ctgroup.id"
      }
    },
    {
      "name": "GruppenmitgliedsfelderIn222",
      "aggregation": {
        "function": "groupconcat",
        "parameters": {
          "separator": "\n"
        }
      },
      "value": {
        "if": [
          {
            "==": [
              222,
              {
                "var": "ctgroup.id"
              }
            ]
          },
          {
            "concat": [
              "* ",
              {
                "var": "groupmemberfield.name"
              },
              ": ",
              {
                "var": "groupmemberfieldvalue.value"
              }
            ]
          },
          ""
        ]
      }
    }
  ],
  "primaryEntityAlias": "person",
  "responseFields": [
    "person.id",
    "person.firstName",
    "person.lastName",
    "konsolidierung",
    "GruppenmitgliedsfelderIn222"
  ]
}
```

Hier wird ein computed Field `Gruppenmitgliedsfelder in 222` definiert:

* Es liefert nur Inhalt für `ctgroupid == 222` über die If-Klausel

* Es verwendet die Aggregationsfunktion `groupconcat` mit dem Separator `\n` sodass die Einträge zeilenweise in das Feld konsolidiert werden.

* Als Wert wird ein Listenmarker `* `, der Name des Gruppenmitlgiedsfeldes, ein `: ` sowie der Wert des Gruppenmitlgiedsfeldes konkateniert.

  **Hinweis**: wenn kein Wert für das Gruppenmtigliedsfeld existiert, kommt überhaupt kein Eintrag. Wenn man fehlende Felder oder den Defaultwert ausgegben will, kann man das mit `coalesce` erreichen.

  ```json
  {
    "coalesce": [
      {
        "var": "groupmemberfieldvalue.value"
      },
      {
        "var": "groupmemberfield.defaultValue"
      },
      "fehlt"
    ]
  }
  ```

  | person__id | person__firstName | person__lastName | konsolidierung                           | GruppenmitgliedsfelderIn222                                                                                                                                                                                                                     |
  |------------|-------------------|------------------|------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
  | 1          | Luis              | Hill             | 1          213          222          392 | * Allergien: lklkkl     * ddddd: fehlt     * Ein Datum test: fehlt     * Eine Nummer: 1     * Eine Nummer: 2     * Foto-Einverständnis: 1     * Kommentar: fehlt     * neues_feld geändert: fehlt     * Select: Option 1     * test feld: fehlt |


## (upcoming) Referenzen auf felder

* Feld in einem Entity

  `person.firstName`
  `@person.firstName`

* Feld in einem Entity mit Rolle

  `donator.@person.firstName`     
  `costCenter.group.gropmember.@person.firstName`

   `account.@account.number`
   `contraAccount.@account.number`

* Feld in einem Entity mit Rolle und Feldname
  
  



