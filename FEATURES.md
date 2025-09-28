# 🚀 JsonLogic Visual Editor - Enhanced Features

## 📋 Neue Operatoren (basierend auf Dokumentation)

### Unäre Operatoren
- **`!`** - NOT: Negiert das Ergebnis
- **`!!`** - To Boolean: Konvertiert zu Boolean
- **`true`/`false`** - Konstante Werte
- **`isnull`/`isnotnull`** - Null-Checks
- **`t`** - Text Literal

### Logische Operatoren
- **`and`** - Logisches UND (alle Bedingungen müssen wahr sein)
- **`or`** - Logisches ODER (mindestens eine Bedingung muss wahr sein)

### Vergleichsoperatoren
- **`==`** - Gleich
- **`!==`** - Ungleich
- **`<`, `<=`, `>`, `>=`** - Vergleiche
- **`between`** - Zwischen zwei Werten (inklusive)

### Datenoperatoren
- **`var`** - Datenbankfeld-Zugriff
- **`oneof`** - Wert ist in Liste enthalten
- **`oneofs`** - Wert ist in Subquery-Ergebnis enthalten
- **`partof`** - Teil eines Strings

### String-Operatoren
- **`concat`** - Strings verketten
- **`concatWs`** - Strings mit Separator verketten
- **`coalesce`** - Ersten nicht-null Wert zurückgeben

### Kontrollfluss
- **`if`** - If-Then-Else Bedingungen
- **`case`** - Case-When Kaskade

### Spezielle Operatoren
- **`dterm`** - Term mit Beschreibung
- **`invitation-status`** - ChurchTools Einladungsstatus

## 🎯 Feldnamen-Autocomplete

### Verfügbare Entitäten
- **Person**: `person.firstName`, `person.lastName`, `person.email`, etc.
- **Gruppe**: `ctgroup.name`, `ctgroup.autoAccept`, `ctgroup.maxMembers`, etc.
- **Gruppenmitglied**: `groupmember.groupMemberStatus`, `groupmember.memberStartDate`, etc.
- **Feldwerte**: `groupmemberfieldvalue.value`, `groupmemberfield.name`, etc.
- **Beziehungen**: `relationship.personAId`, `relationship__personA.firstName`, etc.
- **Transaktionen**: `transaction.amount`, `transaction__donator.firstName`, etc.
- **Status & Rollen**: `status.name`, `role.name`, etc.

### Autocomplete-Features
- **Intelligente Suche**: Filtert Felder basierend auf Eingabe
- **Kategorisierung**: Felder nach Entitäten gruppiert
- **Typ-Erkennung**: Automatische Erkennung von Feldtypen (ID, Date, Email, etc.)
- **Keyboard-Navigation**: Pfeiltasten, Enter, Escape
- **Kontextuelle Platzhalter**: Spezifische Beispiele je nach Operator

## 🎨 UI-Verbesserungen

### UI-Hints aus Dokumentation
- **`vertical`/`horizontal`**: Layout-Orientierung für Argumente
- **`card-list`**: Spezielle Darstellung für Listen
- **`card-in-list-of-literals`**: Für `oneof`-Operatoren
- **`card-in-subquery`**: Für `oneofs`-Operatoren

### Visuelle Indikatoren
- **Farbkodierte Ränder**: Verschiedene Farben je nach Operator-Typ
- **Argument-Labels**: Spezifische Beschriftungen für jeden Operator
- **Typ-Badges**: Visuelle Kennzeichnung von Feldtypen

## 📝 Erweiterte Beispiele

### 1. Person-Validierung
```json
{
  "and": [
    {"==": [{"var": "person.isActive"}, true]},
    {"isnotnull": [{"var": "person.email"}]},
    {"or": [
      {"isnotnull": [{"var": "person.mobile"}]},
      {"isnotnull": [{"var": "person.phonePrivate"}]}
    ]}
  ]
}
```

### 2. Gruppen-Logik
```json
{
  "and": [
    {"==": [{"var": "ctgroup.autoAccept"}, true]},
    {"<": [{"var": "ctgroup.maxMembers"}, 50]},
    {"oneof": [
      {"var": "ctgroup.groupStatusId"},
      ["active", "open", "recruiting"]
    ]}
  ]
}
```

### 3. String-Operationen
```json
{
  "concat": [
    {"coalesce": [{"var": "person.title"}, ""]},
    " ",
    {"var": "person.firstName"},
    " ",
    {"var": "person.lastName"}
  ]
}
```

### 4. Bedingte Klassifizierung
```json
{
  "if": [
    {"isnull": [{"var": "person.birthday"}]},
    "Unknown Age",
    {
      "if": [
        {">=": [{"var": "person.birthday"}, "2005-01-01"]},
        "Youth",
        "Adult"
      ]
    }
  ]
}
```

## 🔧 Technische Verbesserungen

### Typsicherheit
- Vollständige TypeScript-Integration
- Typisierte Operator-Definitionen
- Validierte Feldnamen-Liste

### Performance
- Lazy Loading von Feldvorschlägen
- Optimierte Rendering für große Regelsets
- Effiziente Drag & Drop-Implementierung

### Benutzerfreundlichkeit
- Kontextuelle Hilfe und Tooltips
- Intelligente Standardwerte
- Fehlerbehandlung und Validierung

## 🎯 Verwendung

### Feldnamen eingeben
1. Wähle "Variable" als Argument-Typ
2. Beginne mit der Eingabe (z.B. "person.")
3. Wähle aus den Autocomplete-Vorschlägen
4. Oder verwende das Feldvorschläge-Panel

### Komplexe Regeln erstellen
1. Starte mit einem logischen Operator (`and`, `or`)
2. Füge Vergleichsoperatoren als Argumente hinzu
3. Verwende Feldnamen für Datenbankzugriffe
4. Kombiniere mit String- und Kontrollfluss-Operatoren

### Best Practices
- Verwende `isnotnull`/`isnull` für Null-Checks
- Nutze `coalesce` für Fallback-Werte
- Kombiniere `oneof` für Listen-Checks
- Verwende `partof` für String-Suchen

## 🚀 Live Demo

Die erweiterte Version läuft unter:
[JsonLogic Visual Editor](https://3000--01999007-e021-77ae-8ee7-a8d537e59e85.eu-central-1-01.gitpod.dev)

Teste alle neuen Features direkt im Browser!