<template>
  <div id="app">
    <header class="app-header">
      <div class="container">
        <h1>🧠 JsonLogic Visual Editor</h1>
        <p>Build complex logic rules with an intuitive drag-and-drop interface</p>
      </div>
    </header>

    <main class="app-main">
      <div class="container" :class="{ 'full-width': !showExamples }">
        <!-- Quick Start Examples -->
        <section class="examples-section" v-if="showExamples">
          <h2>Quick Start Examples</h2>
          <div class="examples-grid">
            <div 
              v-for="example in examples" 
              :key="example.name"
              class="example-card"
              @click="loadExample(example)"
            >
              <h3>{{ example.name }}</h3>
              <p>{{ example.description }}</p>
              <pre class="example-code">{{ example.preview }}</pre>
            </div>
          </div>
          <button @click="showExamples = false" class="hide-examples-btn">
            Start Building →
          </button>
        </section>

        <!-- Main Editor -->
        <JsonLogicEditor v-if="!showExamples" ref="editor" />
        
        <!-- Show Examples Button -->
        <button 
          v-if="!showExamples" 
          @click="showExamples = true" 
          class="show-examples-btn"
        >
          📚 View Examples
        </button>
      </div>
    </main>

    <footer class="app-footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-section">
            <h4>About JsonLogic</h4>
            <p>JsonLogic is a format for describing logic as JSON. It's perfect for storing complex business rules in databases and APIs.</p>
            <a href="https://jsonlogic.com" target="_blank" rel="noopener">Learn more →</a>
          </div>
          <div class="footer-section">
            <h4>Features</h4>
            <ul>
              <li>Visual rule builder</li>
              <li>Drag & drop interface</li>
              <li>Real-time JSON export</li>
              <li>Import existing rules</li>
              <li>Nested conditions</li>
            </ul>
          </div>
          <div class="footer-section">
            <h4>Operators Supported</h4>
            <ul>
              <li>Logic: AND, OR, NOT</li>
              <li>Comparison: ==, !=, >, <, >=, <=</li>
              <li>Data: var, in</li>
              <li>More coming soon...</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import JsonLogicEditor from './components/JsonLogicEditor.vue'

const showExamples = ref(true)
const editor = ref()

const examples = [
  {
    name: "Active Person Check",
    description: "Check if person is active and not archived",
    preview: `{
  "and": [
    {"==": [{"var": "person.isActive"}, true]},
    {"==": [{"var": "person.isArchived"}, false]}
  ]
}`,
    jsonLogic: {
      "and": [
        {"==": [{"var": "person.isActive"}, true]},
        {"==": [{"var": "person.isArchived"}, false]}
      ]
    }
  },
  {
    name: "Group Member Status",
    description: "Check if person has specific status in group",
    preview: `{
  "oneof": [
    {"var": "groupmember.groupMemberStatus"},
    ["active", "leader", "co-leader"]
  ]
}`,
    jsonLogic: {
      "oneof": [
        {"var": "groupmember.groupMemberStatus"},
        ["active", "leader", "co-leader"]
      ]
    }
  },
  {
    name: "Person Name Search",
    description: "Find person by partial name match",
    preview: `{
  "or": [
    {"partof": ["John", {"var": "person.firstName"}]},
    {"partof": ["John", {"var": "person.lastName"}]},
    {"partof": ["John", {"var": "person.nickname"}]}
  ]
}`,
    jsonLogic: {
      "or": [
        {"partof": ["John", {"var": "person.firstName"}]},
        {"partof": ["John", {"var": "person.lastName"}]},
        {"partof": ["John", {"var": "person.nickname"}]}
      ]
    }
  },
  {
    name: "Group Auto-Accept Logic",
    description: "Complex group membership rules",
    preview: `{
  "and": [
    {"==": [{"var": "ctgroup.autoAccept"}, true]},
    {"<": [{"var": "ctgroup.maxMembers"}, 50]},
    {"!==": [{"var": "ctgroup.groupStatusId"}, "closed"]}
  ]
}`,
    jsonLogic: {
      "and": [
        {"==": [{"var": "ctgroup.autoAccept"}, true]},
        {"<": [{"var": "ctgroup.maxMembers"}, 50]},
        {"!==": [{"var": "ctgroup.groupStatusId"}, "closed"]}
      ]
    }
  },
  {
    name: "Person Contact Info",
    description: "Check if person has complete contact information",
    preview: `{
  "and": [
    {"isnotnull": [{"var": "person.email"}]},
    {"or": [
      {"isnotnull": [{"var": "person.mobile"}]},
      {"isnotnull": [{"var": "person.phonePrivate"}]}
    ]},
    {"isnotnull": [{"var": "person.street"}]}
  ]
}`,
    jsonLogic: {
      "and": [
        {"isnotnull": [{"var": "person.email"}]},
        {"or": [
          {"isnotnull": [{"var": "person.mobile"}]},
          {"isnotnull": [{"var": "person.phonePrivate"}]}
        ]},
        {"isnotnull": [{"var": "person.street"}]}
      ]
    }
  },
  {
    name: "Group Member Field Value",
    description: "Check custom field values for group members",
    preview: `{
  "and": [
    {"==": [{"var": "groupmemberfield.name"}, "Dietary Requirements"]},
    {"oneof": [
      {"var": "groupmemberfieldvalue.value"},
      ["vegetarian", "vegan", "gluten-free"]
    ]}
  ]
}`,
    jsonLogic: {
      "and": [
        {"==": [{"var": "groupmemberfield.name"}, "Dietary Requirements"]},
        {"oneof": [
          {"var": "groupmemberfieldvalue.value"},
          ["vegetarian", "vegan", "gluten-free"]
        ]}
      ]
    }
  },
  {
    name: "Person Full Name",
    description: "Concatenate person's full name with title",
    preview: `{
  "concat": [
    {"coalesce": [{"var": "person.title"}, ""]},
    " ",
    {"var": "person.firstName"},
    " ",
    {"var": "person.lastName"}
  ]
}`,
    jsonLogic: {
      "concat": [
        {"coalesce": [{"var": "person.title"}, ""]},
        " ",
        {"var": "person.firstName"},
        " ",
        {"var": "person.lastName"}
      ]
    }
  },
  {
    name: "Complex Nested OR/AND",
    description: "Demonstrates deep nesting with horizontal OR and vertical AND",
    preview: `{
  "and": [
    {"==": [{"var": "person.isActive"}, true]},
    {
      "or": [
        {"==": [{"var": "person.role"}, "admin"]},
        {
          "or": [
            {"==": [{"var": "person.department"}, "IT"]},
            {"==": [{"var": "person.department"}, "HR"]}
          ]
        },
        {">=": [{"var": "person.experience"}, 5]}
      ]
    }
  ]
}`,
    jsonLogic: {
      "and": [
        {"==": [{"var": "person.isActive"}, true]},
        {
          "or": [
            {"==": [{"var": "person.role"}, "admin"]},
            {
              "or": [
                {"==": [{"var": "person.department"}, "IT"]},
                {"==": [{"var": "person.department"}, "HR"]}
              ]
            },
            {">=": [{"var": "person.experience"}, 5]}
          ]
        }
      ]
    }
  }
]

function loadExample(example: any) {
  showExamples.value = false
  // Wait for editor to be mounted, then load the example
  setTimeout(() => {
    if (editor.value && editor.value.loadJsonLogic) {
      editor.value.loadJsonLogic(example.jsonLogic)
    } else {
      console.log('Loading example:', example.jsonLogic)
    }
  }, 100)
}
</script>

<style>
/* Global styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  color: #333;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  width: 100%;
  overflow-x: visible;
}

.container {
  width: 100%;
  margin: 0 auto;
  padding: 0 20px;
  overflow: visible;
}

.container.full-width {
  max-width: none;
  padding: 0;
  overflow: visible;
}

.app-header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 40px 0;
  text-align: center;
  color: white;
}

.app-header h1 {
  font-size: 3rem;
  margin-bottom: 10px;
  font-weight: 700;
}

.app-header p {
  font-size: 1.2rem;
  opacity: 0.9;
}

.app-main {
  padding: 40px 0;
  min-height: calc(100vh - 200px);
}

.examples-section {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  margin-bottom: 40px;
}

.examples-section h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #1f2937;
  font-size: 2rem;
}

.examples-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.example-card {
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f9fafb;
}

.example-card:hover {
  border-color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
}

.example-card h3 {
  color: #1f2937;
  margin-bottom: 8px;
  font-size: 1.2rem;
}

.example-card p {
  color: #6b7280;
  margin-bottom: 12px;
  font-size: 0.9rem;
}

.example-code {
  background: #1f2937;
  color: #f9fafb;
  padding: 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', monospace;
}

.hide-examples-btn {
  display: block;
  margin: 0 auto;
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.hide-examples-btn:hover {
  background: #2563eb;
}

.show-examples-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 20px;
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  transition: all 0.2s ease;
}

.show-examples-btn:hover {
  background: #7c3aed;
  transform: translateY(-2px);
}

.app-footer {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 40px 0;
  margin-top: 60px;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
}

.footer-section h4 {
  margin-bottom: 15px;
  color: #f9fafb;
  font-size: 1.1rem;
}

.footer-section p {
  color: #d1d5db;
  margin-bottom: 10px;
  line-height: 1.6;
}

.footer-section ul {
  list-style: none;
}

.footer-section li {
  color: #d1d5db;
  margin-bottom: 5px;
  padding-left: 15px;
  position: relative;
}

.footer-section li:before {
  content: "→";
  position: absolute;
  left: 0;
  color: #3b82f6;
}

.footer-section a {
  color: #60a5fa;
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer-section a:hover {
  color: #93c5fd;
}

/* Responsive design */
@media (max-width: 768px) {
  .app-header h1 {
    font-size: 2rem;
  }
  
  .app-header p {
    font-size: 1rem;
  }
  
  .examples-grid {
    grid-template-columns: 1fr;
  }
  
  .footer-content {
    grid-template-columns: 1fr;
    text-align: center;
  }
}
</style>