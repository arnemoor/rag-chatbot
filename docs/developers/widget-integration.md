# AutoRAG Widget Integration Guide

## Overview

The AutoRAG chat widget is a modern web component that can be embedded into any website to provide instant AI-powered support. Built with vanilla JavaScript and Web Components, it offers maximum compatibility and minimal dependencies.

## Quick Integration

### Basic Embedding (30 seconds)
Add these two lines to any HTML page:

```html
<script src="https://autorag-widget.pages.dev/autorag-widget.min.js"></script>
<autorag-widget></autorag-widget>
```

### Advanced Configuration
```html
<script src="https://autorag-widget.pages.dev/autorag-widget.min.js"></script>
<autorag-widget
  language="en"
  category="librarian"
  collection="bookcatalog"
  provider="openai"
  model="gpt-5-mini"
  theme="dark"
  position="bottom-left"
  button-text="Need Help?"
  header-title="Library Assistant"
  width="450px"
  height="650px"
></autorag-widget>
```

## Configuration Options

### Core Configuration

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `language` | string | `'en'` | Interface language: `en`, `de`, `fr`, `it` |
| `category` | string | `'general'` | User role for content filtering |
| `collection` | string | `'bookcatalog'` | Collection documentation to search |
| `provider` | string | `'workers-ai'` | AI provider: `workers-ai`, `openai`, `anthropic` |
| `model` | string | Auto-selected | Specific AI model identifier |

### UI Customization

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `theme` | string | `'light'` | Visual theme: `light`, `dark` |
| `position` | string | `'bottom-right'` | Widget position on screen |
| `button-text` | string | `'Chat with Support'` | Chat button label |
| `header-title` | string | `'Support Assistant'` | Chat window title |
| `width` | string | `'400px'` | Chat window width |
| `height` | string | `'600px'` | Chat window height |
| `z-index` | number | `9999` | CSS z-index for layering |
| `minimized` | boolean | `true` | Start in minimized state |

### Advanced Options

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `api-url` | string | Default API | Custom API endpoint URL |
| `session-storage` | boolean | `true` | Enable chat history persistence |
| `auto-open` | boolean | `false` | Automatically open chat on load |
| `debug` | boolean | `false` | Enable debug logging |

## Integration Methods

### 1. HTML Attributes
Direct attribute configuration on the widget element:

```html
<autorag-widget
  language="de"
  dignity="librarian"
  product="librarywin"
  theme="dark"
  position="bottom-left"
></autorag-widget>
```

### 2. JavaScript Configuration
Global configuration before script loading:

```html
<script>
window.AutoRAGConfig = {
  language: 'fr',
  dignity: 'researcher',
  product: 'scholaraccess',
  provider: 'anthropic',
  model: 'claude-sonnet-4-20250514',
  theme: 'light',
  position: 'top-right',
  buttonText: 'Assistance Académique',
  headerTitle: 'Assistant IA',
  
  // Event callbacks
  onOpen: (sessionId) => {
    console.log('Chat opened:', sessionId);
    analytics.track('Chat Opened', { sessionId });
  },
  onClose: () => {
    console.log('Chat closed');
    analytics.track('Chat Closed');
  },
  onMessage: (data) => {
    console.log('Message exchanged:', data);
    analytics.track('Chat Message', {
      query: data.message,
      response: data.response,
      sessionId: data.sessionId
    });
  },
  onError: (error) => {
    console.error('Widget error:', error);
    errorTracking.captureException(error);
  }
};
</script>
<script src="https://autorag-widget.pages.dev/autorag-widget.min.js"></script>
```

### 3. Programmatic Control
Dynamic widget creation and control:

```javascript
// Wait for script to load
document.addEventListener('DOMContentLoaded', async () => {
  // Load widget script dynamically
  const script = document.createElement('script');
  script.src = 'https://autorag-widget.pages.dev/autorag-widget.min.js';
  script.onload = () => {
    // Create widget programmatically
    const widget = document.createElement('autorag-widget');
    
    // Configure widget
    widget.setAttribute('language', 'en');
    widget.setAttribute('dignity', 'librarian');
    widget.setAttribute('product', 'libraryonline');
    widget.setAttribute('theme', 'dark');
    
    // Add event listeners
    widget.addEventListener('widget-opened', (e) => {
      console.log('Session started:', e.detail.sessionId);
    });
    
    widget.addEventListener('message-sent', (e) => {
      console.log('User query:', e.detail.message);
      console.log('AI response:', e.detail.response);
    });
    
    widget.addEventListener('widget-error', (e) => {
      console.error('Error occurred:', e.detail.error);
    });
    
    // Add to page
    document.body.appendChild(widget);
    
    // Control widget programmatically
    setTimeout(() => {
      widget.expand(); // Auto-open after 3 seconds
    }, 3000);
  };
  
  document.head.appendChild(script);
});
```

## Framework Integration

### React Integration

#### Functional Component
```jsx
import React, { useEffect, useRef, useState } from 'react';

const AutoRAGWidget = ({ 
  language = 'en',
  dignity = 'general',
  product = 'libraryonline',
  theme = 'light',
  onMessage,
  onError 
}) => {
  const widgetRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  
  useEffect(() => {
    // Load widget script
    const loadScript = () => {
      if (document.querySelector('script[src*="autorag-widget"]')) {
        setScriptLoaded(true);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://autorag-widget.pages.dev/autorag-widget.min.js';
      script.async = true;
      script.onload = () => setScriptLoaded(true);
      script.onerror = () => console.error('Failed to load AutoRAG widget');
      document.head.appendChild(script);
    };
    
    loadScript();
  }, []);
  
  useEffect(() => {
    if (!scriptLoaded) return;
    
    // Create widget when script is loaded
    const widget = document.createElement('autorag-widget');
    widget.setAttribute('language', language);
    widget.setAttribute('dignity', dignity);
    widget.setAttribute('product', product);
    widget.setAttribute('theme', theme);
    
    // Event listeners
    if (onMessage) {
      widget.addEventListener('message-sent', onMessage);
    }
    if (onError) {
      widget.addEventListener('widget-error', onError);
    }
    
    document.body.appendChild(widget);
    widgetRef.current = widget;
    
    // Cleanup
    return () => {
      if (widgetRef.current) {
        if (onMessage) {
          widgetRef.current.removeEventListener('message-sent', onMessage);
        }
        if (onError) {
          widgetRef.current.removeEventListener('widget-error', onError);
        }
        widgetRef.current.remove();
        widgetRef.current = null;
      }
    };
  }, [scriptLoaded, language, dignity, product, theme]);
  
  // Widget is appended to body, no render needed
  return null;
};

// Usage in App component
function App() {
  const handleMessage = (event) => {
    const { message, response, sessionId } = event.detail;
    
    // Track in analytics
    gtag('event', 'chat_message', {
      query: message,
      session_id: sessionId
    });
    
    // Store in state for display
    console.log('Chat interaction:', { message, response });
  };
  
  const handleError = (event) => {
    console.error('Widget error:', event.detail.error);
    // Send to error tracking service
  };
  
  return (
    <div className="app">
      <header>
        <h1>My Library Application</h1>
      </header>
      
      <main>
        {/* Your app content */}
      </main>
      
      <AutoRAGWidget
        language="en"
        dignity="librarian"
        product="libraryonline"
        theme="light"
        onMessage={handleMessage}
        onError={handleError}
      />
    </div>
  );
}

export default AutoRAGWidget;
```

#### Class Component
```jsx
import React, { Component } from 'react';

class AutoRAGWidget extends Component {
  constructor(props) {
    super(props);
    this.widgetRef = null;
    this.scriptLoaded = false;
  }
  
  componentDidMount() {
    this.loadWidget();
  }
  
  componentWillUnmount() {
    this.removeWidget();
  }
  
  componentDidUpdate(prevProps) {
    // Reload widget if props changed
    const propsChanged = ['language', 'dignity', 'product', 'theme'].some(
      prop => prevProps[prop] !== this.props[prop]
    );
    
    if (propsChanged) {
      this.removeWidget();
      this.loadWidget();
    }
  }
  
  loadWidget = async () => {
    try {
      await this.loadScript();
      this.createWidget();
    } catch (error) {
      console.error('Failed to load AutoRAG widget:', error);
      if (this.props.onError) {
        this.props.onError({ detail: { error: error.message } });
      }
    }
  }
  
  loadScript = () => {
    if (this.scriptLoaded || document.querySelector('script[src*="autorag-widget"]')) {
      this.scriptLoaded = true;
      return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://autorag-widget.pages.dev/autorag-widget.min.js';
      script.async = true;
      script.onload = () => {
        this.scriptLoaded = true;
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  createWidget = () => {
    if (this.widgetRef) return;
    
    const { language, dignity, product, theme, onMessage, onError } = this.props;
    
    const widget = document.createElement('autorag-widget');
    widget.setAttribute('language', language || 'en');
    widget.setAttribute('dignity', dignity || 'general');
    widget.setAttribute('product', product || 'libraryonline');
    widget.setAttribute('theme', theme || 'light');
    
    // Event listeners
    if (onMessage) {
      widget.addEventListener('message-sent', onMessage);
    }
    if (onError) {
      widget.addEventListener('widget-error', onError);
    }
    
    document.body.appendChild(widget);
    this.widgetRef = widget;
  }
  
  removeWidget = () => {
    if (this.widgetRef) {
      const { onMessage, onError } = this.props;
      
      if (onMessage) {
        this.widgetRef.removeEventListener('message-sent', onMessage);
      }
      if (onError) {
        this.widgetRef.removeEventListener('widget-error', onError);
      }
      
      this.widgetRef.remove();
      this.widgetRef = null;
    }
  }
  
  render() {
    return null; // Widget is appended to body
  }
}

export default AutoRAGWidget;
```

### Vue.js Integration

#### Composition API (Vue 3)
```vue
<template>
  <div>
    <!-- Your app content -->
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, watch, ref } from 'vue'

const props = defineProps({
  language: {
    type: String,
    default: 'en'
  },
  dignity: {
    type: String,
    default: 'general'
  },
  product: {
    type: String,
    default: 'libraryonline'
  },
  theme: {
    type: String,
    default: 'light'
  }
})

const emit = defineEmits(['message', 'error'])

const widget = ref(null)
const scriptLoaded = ref(false)

const loadScript = () => {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src*="autorag-widget"]')) {
      scriptLoaded.value = true
      resolve()
      return
    }
    
    const script = document.createElement('script')
    script.src = 'https://autorag-widget.pages.dev/autorag-widget.min.js'
    script.async = true
    script.onload = () => {
      scriptLoaded.value = true
      resolve()
    }
    script.onerror = reject
    document.head.appendChild(script)
  })
}

const createWidget = () => {
  if (widget.value) return
  
  widget.value = document.createElement('autorag-widget')
  widget.value.setAttribute('language', props.language)
  widget.value.setAttribute('dignity', props.dignity)
  widget.value.setAttribute('product', props.product)
  widget.value.setAttribute('theme', props.theme)
  
  // Event listeners
  widget.value.addEventListener('message-sent', (e) => {
    emit('message', e.detail)
  })
  
  widget.value.addEventListener('widget-error', (e) => {
    emit('error', e.detail)
  })
  
  document.body.appendChild(widget.value)
}

const removeWidget = () => {
  if (widget.value) {
    widget.value.remove()
    widget.value = null
  }
}

const updateWidget = () => {
  if (widget.value) {
    widget.value.setAttribute('language', props.language)
    widget.value.setAttribute('dignity', props.dignity)
    widget.value.setAttribute('product', props.product)
    widget.value.setAttribute('theme', props.theme)
  }
}

onMounted(async () => {
  try {
    await loadScript()
    createWidget()
  } catch (error) {
    console.error('Failed to load AutoRAG widget:', error)
    emit('error', { error: error.message })
  }
})

onUnmounted(() => {
  removeWidget()
})

// Watch for prop changes and update widget
watch([() => props.language, () => props.dignity, () => props.product, () => props.theme], () => {
  updateWidget()
})
</script>
```

#### Options API (Vue 2/3)
```vue
<template>
  <div>
    <!-- Your app content -->
  </div>
</template>

<script>
export default {
  name: 'AutoRAGWidget',
  props: {
    language: {
      type: String,
      default: 'en'
    },
    dignity: {
      type: String, 
      default: 'general'
    },
    product: {
      type: String,
      default: 'libraryonline'
    },
    theme: {
      type: String,
      default: 'light'
    }
  },
  
  data() {
    return {
      widget: null,
      scriptLoaded: false
    }
  },
  
  async mounted() {
    try {
      await this.loadScript()
      this.createWidget()
    } catch (error) {
      console.error('Failed to load AutoRAG widget:', error)
      this.$emit('error', { error: error.message })
    }
  },
  
  beforeUnmount() {
    this.removeWidget()
  },
  
  watch: {
    language() { this.updateWidget() },
    dignity() { this.updateWidget() },
    product() { this.updateWidget() },
    theme() { this.updateWidget() }
  },
  
  methods: {
    loadScript() {
      return new Promise((resolve, reject) => {
        if (document.querySelector('script[src*="autorag-widget"]')) {
          this.scriptLoaded = true
          resolve()
          return
        }
        
        const script = document.createElement('script')
        script.src = 'https://autorag-widget.pages.dev/autorag-widget.min.js'
        script.async = true
        script.onload = () => {
          this.scriptLoaded = true
          resolve()
        }
        script.onerror = reject
        document.head.appendChild(script)
      })
    },
    
    createWidget() {
      if (this.widget) return
      
      this.widget = document.createElement('autorag-widget')
      this.widget.setAttribute('language', this.language)
      this.widget.setAttribute('dignity', this.dignity)
      this.widget.setAttribute('product', this.product)
      this.widget.setAttribute('theme', this.theme)
      
      // Event listeners
      this.widget.addEventListener('message-sent', (e) => {
        this.$emit('message', e.detail)
      })
      
      this.widget.addEventListener('widget-error', (e) => {
        this.$emit('error', e.detail)
      })
      
      document.body.appendChild(this.widget)
    },
    
    removeWidget() {
      if (this.widget) {
        this.widget.remove()
        this.widget = null
      }
    },
    
    updateWidget() {
      if (this.widget) {
        this.widget.setAttribute('language', this.language)
        this.widget.setAttribute('dignity', this.dignity)
        this.widget.setAttribute('product', this.product)
        this.widget.setAttribute('theme', this.theme)
      }
    }
  }
}
</script>
```

### Angular Integration

```typescript
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-autorag-widget',
  template: ''
})
export class AutoragWidgetComponent implements OnInit, OnDestroy, OnChanges {
  @Input() language: string = 'en';
  @Input() dignity: string = 'general';
  @Input() product: string = 'libraryonline';
  @Input() theme: string = 'light';
  
  @Output() message = new EventEmitter<any>();
  @Output() error = new EventEmitter<any>();
  
  private widget: any;
  private scriptLoaded: boolean = false;
  
  async ngOnInit() {
    try {
      await this.loadScript();
      this.createWidget();
    } catch (error) {
      console.error('Failed to load AutoRAG widget:', error);
      this.error.emit({ error: error.message });
    }
  }
  
  ngOnDestroy() {
    this.removeWidget();
  }
  
  ngOnChanges(changes: SimpleChanges) {
    if (this.widget) {
      this.updateWidget();
    }
  }
  
  private loadScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.scriptLoaded || document.querySelector('script[src*="autorag-widget"]')) {
        this.scriptLoaded = true;
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://autorag-widget.pages.dev/autorag-widget.min.js';
      script.async = true;
      script.onload = () => {
        this.scriptLoaded = true;
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  private createWidget(): void {
    if (this.widget) return;
    
    this.widget = document.createElement('autorag-widget');
    this.widget.setAttribute('language', this.language);
    this.widget.setAttribute('dignity', this.dignity);
    this.widget.setAttribute('product', this.product);
    this.widget.setAttribute('theme', this.theme);
    
    // Event listeners
    this.widget.addEventListener('message-sent', (e: CustomEvent) => {
      this.message.emit(e.detail);
    });
    
    this.widget.addEventListener('widget-error', (e: CustomEvent) => {
      this.error.emit(e.detail);
    });
    
    document.body.appendChild(this.widget);
  }
  
  private removeWidget(): void {
    if (this.widget) {
      this.widget.remove();
      this.widget = null;
    }
  }
  
  private updateWidget(): void {
    if (this.widget) {
      this.widget.setAttribute('language', this.language);
      this.widget.setAttribute('dignity', this.dignity);
      this.widget.setAttribute('product', this.product);
      this.widget.setAttribute('theme', this.theme);
    }
  }
}
```

### Svelte Integration

```svelte
<script>
  import { onMount, onDestroy } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  
  // Props
  export let language = 'en';
  export let dignity = 'general';
  export let product = 'libraryonline';
  export let theme = 'light';
  
  // Event dispatcher
  const dispatch = createEventDispatcher();
  
  let widget = null;
  let scriptLoaded = false;
  
  // Reactive updates
  $: if (widget) {
    updateWidget();
  }
  
  async function loadScript() {
    if (scriptLoaded || document.querySelector('script[src*="autorag-widget"]')) {
      scriptLoaded = true;
      return;
    }
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://autorag-widget.pages.dev/autorag-widget.min.js';
      script.async = true;
      script.onload = () => {
        scriptLoaded = true;
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  function createWidget() {
    if (widget) return;
    
    widget = document.createElement('autorag-widget');
    widget.setAttribute('language', language);
    widget.setAttribute('dignity', dignity);
    widget.setAttribute('product', product);
    widget.setAttribute('theme', theme);
    
    // Event listeners
    widget.addEventListener('message-sent', (e) => {
      dispatch('message', e.detail);
    });
    
    widget.addEventListener('widget-error', (e) => {
      dispatch('error', e.detail);
    });
    
    document.body.appendChild(widget);
  }
  
  function removeWidget() {
    if (widget) {
      widget.remove();
      widget = null;
    }
  }
  
  function updateWidget() {
    if (!widget) return;
    
    widget.setAttribute('language', language);
    widget.setAttribute('dignity', dignity);
    widget.setAttribute('product', product);
    widget.setAttribute('theme', theme);
  }
  
  onMount(async () => {
    try {
      await loadScript();
      createWidget();
    } catch (error) {
      console.error('Failed to load AutoRAG widget:', error);
      dispatch('error', { error: error.message });
    }
  });
  
  onDestroy(() => {
    removeWidget();
  });
</script>

<!-- Widget is appended to body, no template needed -->
```

## CMS Integration

### WordPress Plugin

```php
<?php
/**
 * Plugin Name: AutoRAG Chat Widget
 * Description: Add AI-powered chat support to your WordPress site
 * Version: 1.0.0
 */

class AutoRAGPlugin {
    public function __construct() {
        add_action('wp_footer', [$this, 'render_widget']);
        add_action('admin_menu', [$this, 'admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_scripts']);
    }
    
    public function enqueue_scripts() {
        wp_enqueue_script(
            'autorag-widget',
            'https://autorag-widget.pages.dev/autorag-widget.min.js',
            [],
            '1.0.0',
            true
        );
    }
    
    public function render_widget() {
        $options = get_option('autorag_options', []);
        $language = substr(get_locale(), 0, 2);
        
        $dignity = $options['dignity'] ?? 'general';
        $product = $options['product'] ?? 'libraryonline';
        $theme = $options['theme'] ?? 'light';
        $position = $options['position'] ?? 'bottom-right';
        
        echo sprintf(
            '<autorag-widget language="%s" dignity="%s" product="%s" theme="%s" position="%s"></autorag-widget>',
            esc_attr($language),
            esc_attr($dignity),
            esc_attr($product),
            esc_attr($theme),
            esc_attr($position)
        );
    }
    
    public function admin_menu() {
        add_options_page(
            'AutoRAG Settings',
            'AutoRAG Chat',
            'manage_options',
            'autorag-settings',
            [$this, 'admin_page']
        );
    }
    
    public function register_settings() {
        register_setting('autorag_options', 'autorag_options');
        
        add_settings_section(
            'autorag_main',
            'AutoRAG Configuration',
            null,
            'autorag-settings'
        );
        
        add_settings_field(
            'product',
            'Product',
            [$this, 'product_field'],
            'autorag-settings',
            'autorag_main'
        );
        
        add_settings_field(
            'dignity',
            'User Role',
            [$this, 'dignity_field'],
            'autorag-settings',
            'autorag_main'
        );
        
        add_settings_field(
            'theme',
            'Theme',
            [$this, 'theme_field'],
            'autorag-settings',
            'autorag_main'
        );
    }
    
    public function admin_page() {
        ?>
        <div class="wrap">
            <h1>AutoRAG Chat Settings</h1>
            <form method="post" action="options.php">
                <?php
                settings_fields('autorag_options');
                do_settings_sections('autorag-settings');
                submit_button();
                ?>
            </form>
        </div>
        <?php
    }
    
    public function product_field() {
        $options = get_option('autorag_options', []);
        $value = $options['product'] ?? 'libraryonline';
        ?>
        <select name="autorag_options[product]">
            <option value="libraryonline" <?php selected($value, 'libraryonline'); ?>>LibraryOnline</option>
            <option value="librarywin" <?php selected($value, 'librarywin'); ?>>Librarywin</option>
            <option value="knowledgehub" <?php selected($value, 'knowledgehub'); ?>>KnowledgeHub</option>
            <option value="scholaraccess" <?php selected($value, 'scholaraccess'); ?>>ScholarAccess</option>
            <option value="general" <?php selected($value, 'general'); ?>>General</option>
        </select>
        <?php
    }
    
    public function dignity_field() {
        $options = get_option('autorag_options', []);
        $value = $options['dignity'] ?? 'general';
        ?>
        <select name="autorag_options[dignity]">
            <option value="librarian" <?php selected($value, 'librarian'); ?>>Librarian</option>
            <option value="researcher" <?php selected($value, 'researcher'); ?>>Researcher</option>
            <option value="administrator" <?php selected($value, 'administrator'); ?>>Administrator</option>
            <option value="general" <?php selected($value, 'general'); ?>>General</option>
        </select>
        <?php
    }
    
    public function theme_field() {
        $options = get_option('autorag_options', []);
        $value = $options['theme'] ?? 'light';
        ?>
        <select name="autorag_options[theme]">
            <option value="light" <?php selected($value, 'light'); ?>>Light</option>
            <option value="dark" <?php selected($value, 'dark'); ?>>Dark</option>
        </select>
        <?php
    }
}

new AutoRAGPlugin();
?>
```

### Drupal Module

```php
<?php
/**
 * @file
 * AutoRAG Chat Widget module.
 */

use Drupal\Core\Form\FormStateInterface;

/**
 * Implements hook_page_attachments().
 */
function autorag_page_attachments(array &$attachments) {
  $config = \Drupal::config('autorag.settings');
  
  if ($config->get('enabled')) {
    // Add widget script
    $attachments['#attached']['html_head'][] = [
      [
        '#tag' => 'script',
        '#attributes' => [
          'src' => 'https://autorag-widget.pages.dev/autorag-widget.min.js',
          'async' => TRUE,
        ],
      ],
      'autorag_widget_script'
    ];
    
    // Add widget element
    $language = \Drupal::languageManager()->getCurrentLanguage()->getId();
    $attachments['#attached']['html_head'][] = [
      [
        '#tag' => 'autorag-widget',
        '#attributes' => [
          'language' => $language,
          'dignity' => $config->get('dignity') ?: 'general',
          'product' => $config->get('product') ?: 'libraryonline',
          'theme' => $config->get('theme') ?: 'light',
        ],
      ],
      'autorag_widget'
    ];
  }
}

/**
 * Implements hook_form_FORM_ID_alter().
 */
function autorag_form_system_site_information_settings_alter(&$form, FormStateInterface $form_state) {
  $config = \Drupal::config('autorag.settings');
  
  $form['autorag'] = [
    '#type' => 'fieldset',
    '#title' => t('AutoRAG Chat Settings'),
    '#weight' => 50,
  ];
  
  $form['autorag']['enabled'] = [
    '#type' => 'checkbox',
    '#title' => t('Enable AutoRAG Chat Widget'),
    '#default_value' => $config->get('enabled'),
  ];
  
  $form['autorag']['product'] = [
    '#type' => 'select',
    '#title' => t('Product'),
    '#default_value' => $config->get('product'),
    '#options' => [
      'libraryonline' => t('LibraryOnline'),
      'librarywin' => t('Librarywin'),
      'knowledgehub' => t('KnowledgeHub'),
      'scholaraccess' => t('ScholarAccess'),
      'general' => t('General'),
    ],
  ];
  
  $form['autorag']['dignity'] = [
    '#type' => 'select',
    '#title' => t('User Role'),
    '#default_value' => $config->get('dignity'),
    '#options' => [
      'librarian' => t('Librarian'),
      'researcher' => t('Researcher'),
      'administrator' => t('Administrator'),
      'general' => t('General'),
    ],
  ];
  
  $form['#submit'][] = 'autorag_form_system_site_information_settings_submit';
}

/**
 * Submit handler for AutoRAG settings.
 */
function autorag_form_system_site_information_settings_submit($form, FormStateInterface $form_state) {
  $config = \Drupal::configFactory()->getEditable('autorag.settings');
  $config->set('enabled', $form_state->getValue('enabled'))
    ->set('product', $form_state->getValue('product'))
    ->set('dignity', $form_state->getValue('dignity'))
    ->save();
}
?>
```

## Event Handling

### Available Events

| Event Name | Description | Event Detail |
|------------|-------------|--------------|
| `widget-loaded` | Widget script loaded and initialized | `{ version, timestamp }` |
| `widget-opened` | Chat interface opened | `{ sessionId, timestamp }` |
| `widget-closed` | Chat interface closed | `{ sessionId, duration }` |
| `message-sent` | Message exchange completed | `{ message, response, sessionId, citations }` |
| `widget-error` | Error occurred in widget | `{ error, errorType, sessionId }` |
| `session-started` | New chat session started | `{ sessionId, config }` |
| `session-ended` | Chat session ended | `{ sessionId, duration, messageCount }` |

### Event Usage Examples

```javascript
// Get widget reference
const widget = document.querySelector('autorag-widget');

// Listen for widget events
widget.addEventListener('widget-opened', (event) => {
  console.log('Chat opened:', event.detail);
  
  // Track in analytics
  gtag('event', 'chat_widget_opened', {
    event_category: 'engagement',
    event_label: 'support_chat',
    session_id: event.detail.sessionId
  });
  
  // Show help hint
  showChatHint();
});

widget.addEventListener('message-sent', (event) => {
  const { message, response, sessionId, citations } = event.detail;
  
  console.log('Message exchange:', {
    userQuery: message,
    aiResponse: response,
    sources: citations,
    session: sessionId
  });
  
  // Track engagement
  analytics.track('Chat Message', {
    query_length: message.length,
    response_length: response.length,
    citation_count: citations.length,
    session_id: sessionId
  });
  
  // Store conversation for analysis
  storeConversation({
    query: message,
    response: response,
    timestamp: new Date().toISOString(),
    sessionId: sessionId
  });
});

widget.addEventListener('widget-error', (event) => {
  const { error, errorType, sessionId } = event.detail;
  
  console.error('Widget error:', error);
  
  // Send to error tracking
  Sentry.captureException(new Error(`AutoRAG Widget Error: ${error}`), {
    tags: {
      component: 'autorag-widget',
      error_type: errorType
    },
    extra: {
      session_id: sessionId,
      user_agent: navigator.userAgent
    }
  });
  
  // Show user-friendly error message
  showErrorToast('Chat temporarily unavailable. Please try again.');
});

widget.addEventListener('widget-closed', (event) => {
  const { sessionId, duration } = event.detail;
  
  // Track session completion
  analytics.track('Chat Session Ended', {
    session_id: sessionId,
    duration_seconds: duration / 1000,
    timestamp: new Date().toISOString()
  });
});
```

## Customization and Styling

### CSS Custom Properties
The widget supports CSS custom properties for advanced styling:

```css
autorag-widget {
  /* Colors */
  --autorag-primary-color: #1e40af;
  --autorag-primary-hover: #1e3a8a;
  --autorag-background: #ffffff;
  --autorag-text-color: #1f2937;
  --autorag-border-color: #e5e7eb;
  --autorag-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  
  /* Typography */
  --autorag-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --autorag-font-size: 14px;
  --autorag-line-height: 1.5;
  
  /* Layout */
  --autorag-border-radius: 12px;
  --autorag-button-size: 60px;
  --autorag-z-index: 9999;
  
  /* Animation */
  --autorag-transition: all 0.3s ease;
  --autorag-animation-duration: 0.3s;
}

/* Dark theme overrides */
autorag-widget[theme="dark"] {
  --autorag-background: #1f2937;
  --autorag-text-color: #f9fafb;
  --autorag-border-color: #374151;
  --autorag-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

/* Custom brand colors */
.library-theme autorag-widget {
  --autorag-primary-color: #059669;
  --autorag-primary-hover: #047857;
}

.enterprise-theme autorag-widget {
  --autorag-primary-color: #7c3aed;
  --autorag-primary-hover: #6d28d9;
  --autorag-border-radius: 8px;
}
```

### Widget States
```css
/* Loading state */
autorag-widget[loading] {
  --autorag-primary-color: #9ca3af;
  pointer-events: none;
}

/* Error state */
autorag-widget[error] {
  --autorag-primary-color: #dc2626;
}

/* Minimized state */
autorag-widget[minimized] {
  /* Button only visible */
}

/* Expanded state */
autorag-widget[expanded] {
  /* Full chat interface visible */
}
```

## Performance Optimization

### Lazy Loading
```javascript
// Lazy load widget on user interaction
class LazyAutoRAGLoader {
  constructor(options = {}) {
    this.options = {
      loadOnIdle: true,
      loadOnInteraction: true,
      loadOnScroll: false,
      ...options
    };
    
    this.loaded = false;
    this.init();
  }
  
  init() {
    if (this.options.loadOnIdle) {
      this.loadOnIdle();
    }
    
    if (this.options.loadOnInteraction) {
      this.loadOnInteraction();
    }
    
    if (this.options.loadOnScroll) {
      this.loadOnScroll();
    }
  }
  
  loadOnIdle() {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => this.loadWidget(), { timeout: 5000 });
    } else {
      setTimeout(() => this.loadWidget(), 3000);
    }
  }
  
  loadOnInteraction() {
    const events = ['mousedown', 'touchstart', 'keydown'];
    const loadOnce = () => {
      this.loadWidget();
      events.forEach(event => {
        document.removeEventListener(event, loadOnce);
      });
    };
    
    events.forEach(event => {
      document.addEventListener(event, loadOnce, { passive: true, once: true });
    });
  }
  
  loadOnScroll() {
    let scrolled = false;
    const handleScroll = () => {
      if (!scrolled && window.scrollY > 200) {
        scrolled = true;
        this.loadWidget();
        window.removeEventListener('scroll', handleScroll);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
  }
  
  async loadWidget() {
    if (this.loaded) return;
    
    try {
      this.loaded = true;
      await this.loadScript();
      this.createWidget();
    } catch (error) {
      console.error('Failed to load AutoRAG widget:', error);
      this.loaded = false;
    }
  }
  
  loadScript() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://autorag-widget.pages.dev/autorag-widget.min.js';
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  createWidget() {
    const widget = document.createElement('autorag-widget');
    Object.entries(this.options.config || {}).forEach(([key, value]) => {
      widget.setAttribute(key, value);
    });
    document.body.appendChild(widget);
  }
}

// Usage
new LazyAutoRAGLoader({
  loadOnIdle: true,
  loadOnInteraction: true,
  config: {
    language: 'en',
    dignity: 'librarian',
    product: 'libraryonline',
    theme: 'light'
  }
});
```

### Resource Optimization
```html
<!-- Preload widget script for faster loading -->
<link rel="preload" href="https://autorag-widget.pages.dev/autorag-widget.min.js" as="script">

<!-- DNS prefetch for faster connections -->
<link rel="dns-prefetch" href="//your-widget-name.pages.dev">
<link rel="dns-prefetch" href="//your-worker-name.your-subdomain.workers.dev">

<!-- Optional: Preconnect for even faster loading -->
<link rel="preconnect" href="https://autorag-widget.pages.dev" crossorigin>
```

This comprehensive widget integration guide provides everything needed to successfully embed and customize the AutoRAG chat widget across different platforms and frameworks.