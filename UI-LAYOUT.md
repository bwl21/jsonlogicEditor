# 🎨 UI Layout Verbesserungen

## Horizontale vs. Vertikale Darstellung

### OR-Operatoren (Horizontal)
```
┌─────────────────────────────────────────────────────────┐
│ OR                                                 [×]  │
│ ┌─────────────────┐ OR ┌─────────────────┐ OR ┌──────┐ │
│ │ Condition A     │    │ Condition B     │    │ ...  │ │
│ │ person.isActive │    │ person.isAdmin  │    │      │ │
│ └─────────────────┘    └─────────────────┘    └──────┘ │
│ [+ Add Condition]                                       │
└─────────────────────────────────────────────────────────┘
```

**Vorteile:**
- Visuelle Darstellung der ODER-Logik
- Kompakte Darstellung bei wenigen Bedingungen
- Intuitive Lesbarkeit: "A ODER B ODER C"

### AND-Operatoren (Vertikal)
```
┌─────────────────────────────────────┐
│ AND                            [×]  │
│ ┌─────────────────────────────────┐ │
│ │ Condition A                     │ │
│ │ person.isActive == true         │ │
│ └─────────────────────────────────┘ │
│              AND                    │
│ ┌─────────────────────────────────┐ │
│ │ Condition B                     │ │
│ │ person.email != null            │ │
│ └─────────────────────────────────┘ │
│              AND                    │
│ ┌─────────────────────────────────┐ │
│ │ Condition C                     │ │
│ │ person.status == "active"       │ │
│ └─────────────────────────────────┘ │
│ [+ Add Condition]                   │
└─────────────────────────────────────┘
```

**Vorteile:**
- Klare Trennung der UND-Bedingungen
- Bessere Lesbarkeit bei komplexen Bedingungen
- Vertikaler Fluss entspricht logischer Reihenfolge

## Visuelle Indikatoren

### Operator-Badges
- **OR**: Orange Badge zwischen horizontalen Argumenten
- **AND**: Blaue Badge zwischen vertikalen Argumenten

### Farbkodierung
- **Logic Operators** (`and`, `or`): Blauer linker Rand
- **Data Operators** (`oneof`, `partof`): Grüner linker Rand  
- **Special Operators** (`oneofs`): Violetter linker Rand

### Responsive Verhalten
- **Horizontal Layout**: Automatischer Umbruch bei schmalen Bildschirmen
- **Minimum Width**: 250px pro Argument für Lesbarkeit
- **Flexible Gaps**: 16px Abstand zwischen Argumenten

## CSS-Implementierung

```css
/* Horizontale Darstellung für OR */
.json-logic-atom[data-ui-hint*="horizontal"] .arguments-container {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 16px;
}

/* OR-Badge zwischen Argumenten */
.json-logic-atom[data-ui-hint*="horizontal"] .argument-wrapper:not(:last-child)::after {
  content: "OR";
  position: absolute;
  right: -24px;
  top: 50%;
  background: #f59e0b;
  color: white;
  /* ... weitere Styles */
}

/* Vertikale Darstellung für AND */
.json-logic-atom[data-ui-hint*="vertical"] .arguments-container {
  flex-direction: column;
}

/* AND-Badge zwischen Argumenten */
.json-logic-atom[data-ui-hint*="vertical"] .argument-wrapper:not(:last-child)::after {
  content: "AND";
  display: block;
  text-align: center;
  background: #3b82f6;
  color: white;
  /* ... weitere Styles */
}
```

## Anwendung

### Automatische Erkennung
Das Layout wird automatisch basierend auf den UI-Hints des Operators angewendet:

- **OR-Operator**: `uiHints: ['horizontal', 'card-list']`
- **AND-Operator**: `uiHints: ['vertical', 'card-list']`

### Beispiel-Regeln

**Horizontale OR-Regel:**
```json
{
  "or": [
    {"==": [{"var": "person.role"}, "admin"]},
    {"==": [{"var": "person.role"}, "moderator"]},
    {"==": [{"var": "person.department"}, "IT"]}
  ]
}
```

**Vertikale AND-Regel:**
```json
{
  "and": [
    {"==": [{"var": "person.isActive"}, true]},
    {"isnotnull": [{"var": "person.email"}]},
    {">=": [{"var": "person.age"}, 18]}
  ]
}
```

Die visuelle Darstellung macht die Logik-Struktur sofort erkennbar und verbessert die Benutzerfreundlichkeit erheblich!