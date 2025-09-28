# 🧠 JsonLogic Visual Editor

Ein visueller Editor für JsonLogic-Regeln mit Drag & Drop-Funktionalität und verschachtelten Ausdrücken.

## 🎯 Features

- **Visuelle Regel-Erstellung**: Erstelle komplexe JsonLogic-Regeln ohne JSON zu schreiben
- **Verschachtelte Boxen**: Jeder Operator wird als verschachtelte Box dargestellt
- **Drag & Drop**: Bewege Regeln per Drag & Drop
- **Argument-basierte Struktur**: Korrekte JsonLogic-Syntax mit Argumenten als Arrays
- **Real-time Export**: Sofortige JSON-Ausgabe
- **Import/Export**: Lade bestehende JsonLogic-Regeln
- **Responsive Design**: Funktioniert auf Desktop und Mobile

## 🏗️ JsonLogic Argument-Struktur

JsonLogic verwendet eine spezifische Struktur, bei der jeder Operator ein Array von Argumenten erhält:

```json
{
  "operator": [argument1, argument2, ...]
}
```

### Beispiele

#### Einfache Vergleiche
```json
// age >= 18
{">=": [{"var": "age"}, 18]}

// name == "John"
{"==": [{"var": "name"}, "John"]}
```

#### Logische Operatoren
```json
// AND: age >= 18 AND status == "active"
{
  "and": [
    {">=": [{"var": "age"}, 18]},
    {"==": [{"var": "status"}, "active"]}
  ]
}

// OR: role == "admin" OR department == "IT"
{
  "or": [
    {"==": [{"var": "role"}, "admin"]},
    {"==": [{"var": "department"}, "IT"]}
  ]
}
```

#### Verschachtelte Ausdrücke
```json
// Komplexe Geschäftslogik
{
  "and": [
    {">=": [{"var": "age"}, 21]},
    {"==": [{"var": "country"}, "US"]},
    {
      "or": [
        {"==": [{"var": "membership"}, "premium"]},
        {">=": [{"var": "score"}, 85]}
      ]
    }
  ]
}
```

#### Bedingte Logik (If-Then-Else)
```json
// Altersklassifizierung
{
  "if": [
    {">=": [{"var": "age"}, 65]},
    "senior",
    {
      "if": [
        {">=": [{"var": "age"}, 18]},
        "adult", 
        "minor"
      ]
    }
  ]
}
```

#### Array-Operationen
```json
// Überprüfe ob Wert in Array enthalten ist
{
  "in": [
    {"var": "department"}, 
    ["IT", "Engineering", "DevOps"]
  ]
}

// Negation mit Array-Check
{
  "!": [
    {"in": [{"var": "status"}, ["suspended", "terminated"]]}
  ]
}
```

#### Arithmetische Operationen
```json
// Gesamteinkommen > 50000
{
  ">": [
    {"+": [{"var": "salary"}, {"var": "bonus"}]},
    50000
  ]
}
```

## 🚀 Entwicklung

### Installation
```bash
npm install
```

### Entwicklungsserver starten
```bash
npm run dev
```

### Build für Produktion
```bash
npm run build
```

## 🎨 Komponentenarchitektur

### JsonLogicEditor (Hauptkomponente)
- Verwaltet die Liste der Regeln
- Drag & Drop-Container
- Export/Import-Funktionalität
- Beispiel-Templates

### JsonLogicAtom (Regel-Komponente)
- Einzelne JsonLogic-Expression
- Operator-Auswahl
- Dynamische Argument-Verwaltung
- Rekursive Verschachtelung
- Drag & Drop-Handle

### Argument-Typen
- **Expression**: Verschachtelte JsonLogic-Operatoren
- **Variable**: `{"var": "path"}` - Zugriff auf Daten
- **Literal**: Primitive Werte (String, Number, Boolean)
- **Array**: Listen von Werten

## 📋 Unterstützte Operatoren

### Logik
- `and` - Alle Bedingungen müssen wahr sein
- `or` - Mindestens eine Bedingung muss wahr sein  
- `!` - Negation

### Vergleiche
- `==` - Gleich
- `!=` - Ungleich
- `>` - Größer als
- `>=` - Größer oder gleich
- `<` - Kleiner als
- `<=` - Kleiner oder gleich

### Daten
- `var` - Variable aus Datenkontext
- `in` - Wert in Array enthalten

### Kontrolle
- `if` - Bedingte Ausdrücke (If-Then-Else)

### Arithmetik
- `+` - Addition
- `-` - Subtraktion
- `*` - Multiplikation
- `/` - Division

## 🔧 Verwendung

1. **Regel hinzufügen**: Klicke auf "+ Add Rule"
2. **Operator wählen**: Wähle einen Operator aus dem Dropdown
3. **Argumente konfigurieren**: 
   - Literal: Direkte Werte eingeben
   - Variable: Variablenpfad eingeben
   - Expression: Verschachtelte Operatoren erstellen
   - Array: Listen von Werten erstellen
4. **Verschachteln**: Wähle "Expression" als Argument-Typ für Verschachtelung
5. **Export**: Klicke auf "Export JSON" für das finale JsonLogic

## 📖 JsonLogic Dokumentation

Mehr über JsonLogic: [https://jsonlogic.com](https://jsonlogic.com)

## 🤝 Beitragen

Contributions sind willkommen! Bitte erstelle einen Pull Request oder öffne ein Issue.

## 📄 Lizenz

MIT License