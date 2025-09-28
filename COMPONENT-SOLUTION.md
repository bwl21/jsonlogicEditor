# 🧩 Komponentenbasierte OR/AND-Lösung

## 🎯 Problem gelöst

**Vorher:** Komplexe CSS-Selektoren versuchten verschachtelte OR/AND-Layouts zu handhaben
**Nachher:** Dedizierte Vue-Komponenten für jeden Operator-Typ

## 🏗️ Neue Architektur

### **OrOperator.vue** - Horizontales Layout
```vue
<template>
  <div class="or-operator">
    <div class="or-arguments">
      <div class="or-argument">
        [Condition A] OR [Condition B] OR [Condition C]
      </div>
    </div>
  </div>
</template>
```

**Features:**
- ✅ **Immer horizontal** - unabhängig von Verschachtelungstiefe
- ✅ **Orange Styling** - visuell als OR erkennbar
- ✅ **OR-Badges** zwischen Argumenten
- ✅ **Responsive** - stapelt auf mobilen Geräten

### **AndOperator.vue** - Vertikales Layout
```vue
<template>
  <div class="and-operator">
    <div class="and-arguments">
      <div class="and-argument">
        [Condition A]
           AND
        [Condition B]
           AND  
        [Condition C]
      </div>
    </div>
  </div>
</template>
```

**Features:**
- ✅ **Immer vertikal** - klare Trennung der Bedingungen
- ✅ **Blaues Styling** - visuell als AND erkennbar
- ✅ **AND-Badges** zwischen Argumenten
- ✅ **Saubere Struktur** - jede Bedingung in eigener Zeile

### **JsonLogicAtom.vue** - Generische Operatoren
Für alle anderen Operatoren (==, !=, >, <, etc.)

## 🔄 Komponentenauswahl

### **Automatische Erkennung**
```typescript
// In JsonLogicAtom.vue
<OrOperator
  v-if="argument.type === 'expression' && argument.operator === 'or'"
  :node="argument"
/>
<AndOperator
  v-else-if="argument.type === 'expression' && argument.operator === 'and'"
  :node="argument"
/>
<JsonLogicAtom
  v-else-if="argument.type === 'expression'"
  :node="argument"
/>
```

### **In JsonLogicEditor.vue**
```typescript
// Separate Rendering für bessere Performance
<OrOperator v-for="rule in orRules" />
<AndOperator v-for="rule in andRules" />
<JsonLogicAtom v-for="rule in otherRules" />
```

## 🎨 Visuelle Unterschiede

### **OR-Operator (Orange)**
```
┌─────────────────────────────────────────────────────────┐
│ OR                                                 [×]  │
│ ┌─────────┐ OR ┌─────────┐ OR ┌─────────────────────┐   │
│ │ admin   │    │ manager │    │ department == "IT"  │   │
│ └─────────┘    └─────────┘    └─────────────────────┘   │
│ [+ Add Condition]                                       │
└─────────────────────────────────────────────────────────┘
```

### **AND-Operator (Blau)**
```
┌─────────────────────────────────────┐
│ AND                            [×]  │
│ ┌─────────────────────────────────┐ │
│ │ person.isActive == true         │ │
│ └─────────────────────────────────┘ │
│              AND                    │
│ ┌─────────────────────────────────┐ │
│ │ person.email != null            │ │
│ └─────────────────────────────────┘ │
│              AND                    │
│ ┌─────────────────────────────────┐ │
│ │ person.age >= 18                │ │
│ └─────────────────────────────────┘ │
│ [+ Add Condition]                   │
└─────────────────────────────────────┘
```

## 🔧 Technische Vorteile

### **1. Keine komplexen CSS-Selektoren**
```css
/* Vorher: Komplex und fehleranfällig */
.json-logic-atom[data-ui-hint*="horizontal"] > .atom-body > .arguments-container > .argument-wrapper:not(:last-child)::after

/* Nachher: Einfach und zuverlässig */
.or-arguments { flex-direction: row; }
.and-arguments { flex-direction: column; }
```

### **2. Komponentenisolation**
- **OR-Logik** nur in OrOperator.vue
- **AND-Logik** nur in AndOperator.vue
- **Keine Interferenzen** zwischen verschiedenen Operatoren

### **3. Bessere Wartbarkeit**
- **Klare Trennung** der Verantwortlichkeiten
- **Einfache Erweiterung** für neue Operatoren
- **Testbarkeit** jeder Komponente einzeln

### **4. Performance**
- **Weniger DOM-Manipulationen** durch CSS
- **Optimierte Rendering** durch Vue's Reaktivität
- **Kleinere Bundle-Größe** durch Tree-Shaking

## 🚀 Verschachtelung funktioniert perfekt

### **Beispiel: OR innerhalb AND**
```json
{
  "and": [                          // AndOperator (vertikal)
    {"==": [{"var": "person.isActive"}, true]},
    {
      "or": [                       // OrOperator (horizontal)
        {"==": [{"var": "person.role"}, "admin"]},
        {"==": [{"var": "person.department"}, "IT"]}
      ]
    }
  ]
}
```

**Visuelle Darstellung:**
```
┌─────────────────────────────────────┐
│ AND                            [×]  │  ← AndOperator
│ ┌─────────────────────────────────┐ │
│ │ person.isActive == true         │ │
│ └─────────────────────────────────┘ │
│              AND                    │
│ ┌─────────────────────────────────┐ │
│ │ OR                         [×]  │ │  ← OrOperator (verschachtelt)
│ │ ┌─────────┐ OR ┌─────────────┐  │ │
│ │ │ admin   │    │ dept == IT  │  │ │
│ │ └─────────┘    └─────────────┘  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## ✅ Ergebnis

- ✅ **Verschachtelte OR-Operatoren** sind immer horizontal
- ✅ **Verschachtelte AND-Operatoren** sind immer vertikal
- ✅ **Beliebige Verschachtelungstiefe** funktioniert perfekt
- ✅ **Keine störenden Badges** in falschen Bereichen
- ✅ **Sauberer, wartbarer Code** ohne komplexe CSS-Hacks
- ✅ **Bessere Performance** durch optimierte Komponenten

Die komponentenbasierte Lösung ist robust, erweiterbar und löst alle Layout-Probleme zuverlässig!