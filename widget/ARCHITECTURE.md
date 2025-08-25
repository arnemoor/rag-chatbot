# AutoRAG Widget Architecture

## Overview

The AutoRAG Widget has been refactored into a modular architecture for better maintainability, testability, and extensibility. The widget is now composed of multiple focused modules that handle specific responsibilities.

## Directory Structure

```
src/
├── autorag-widget.js        # Main web component orchestrator
├── index.js                  # Module exports
├── config-service.js         # Configuration management
├── components/              # UI Components
│   ├── chat-message.js      # Message rendering component
│   └── chat-input.js        # Input field component
├── services/                # Business Logic Services
│   ├── api-service.js       # API communication
│   └── state-manager.js     # State management
├── utils/                   # Utility Modules
│   ├── theme-manager.js     # Theme handling
│   └── language-detector.js # Language detection
└── styles/                  # Styling
    └── widget-styles.js     # Style definitions
```

## Module Descriptions

### Main Component

#### `autorag-widget.js`
The main web component that orchestrates all other modules. It:
- Extends HTMLElement to create a custom web component
- Manages the Shadow DOM for encapsulation
- Coordinates between all services and components
- Handles the widget lifecycle

### Components

#### `components/chat-message.js`
Handles individual message rendering and formatting:
- Creates message elements with proper styling
- Formats messages with markdown support
- Manages loading indicators
- Handles message animations
- Provides XSS protection via DOMPurify

#### `components/chat-input.js`
Manages the input field and send button:
- Creates and manages the input textarea
- Handles send button functionality
- Provides auto-resize capability
- Manages input state (enabled/disabled)
- Handles Enter key submission

### Services

#### `services/api-service.js`
Handles all API communication:
- Sends chat messages to the backend
- Fetches configuration
- Implements retry logic
- Handles timeouts
- Provides error handling

#### `services/state-manager.js`
Manages widget state and persistence:
- Stores message history
- Manages session IDs
- Handles localStorage persistence
- Provides state observers
- Limits message history for memory efficiency

### Utilities

#### `utils/theme-manager.js`
Handles theme switching and preferences:
- Detects system theme preference
- Manages theme toggling
- Persists theme choice
- Watches for system theme changes
- Notifies observers of theme changes

#### `utils/language-detector.js`
Handles language detection and localization:
- Detects browser language
- Manages translations
- Provides localized strings
- Supports multiple languages (en, de, fr, it)

### Styles

#### `styles/widget-styles.js`
Provides all CSS styles for the widget:
- Generates dynamic styles based on configuration
- Handles theme-specific styles
- Provides responsive styles
- Manages animations

### Configuration

#### `config-service.js`
Manages dynamic configuration fetching and caching:
- Fetches configuration from API
- Caches configuration for performance
- Provides fallback defaults
- Handles configuration refresh

## Data Flow

1. **Initialization**:
   - Widget loads configuration from various sources
   - Services and managers are initialized
   - State is restored from localStorage
   - Widget renders based on state

2. **User Interaction**:
   - User clicks button or types message
   - Event is captured by main component
   - Component delegates to appropriate service
   - Service updates state and/or makes API call
   - UI updates based on state change

3. **Message Flow**:
   - User types message in ChatInput
   - ChatInput triggers onSend callback
   - Main component adds user message to state
   - ApiService sends message to backend
   - Response is added to state
   - ChatMessage renders new messages

## State Management

The StateManager maintains a centralized state that includes:
- Message history
- Session ID
- Widget minimized state
- Configuration

State changes trigger observers that update the UI accordingly.

## Event System

The widget dispatches custom events for integration:
- `widget-opened`: When chat is opened
- `widget-closed`: When chat is closed
- `message-sent`: When a message is sent
- `widget-error`: When an error occurs

## Security Considerations

- All user input is sanitized using DOMPurify
- Shadow DOM provides style and DOM isolation
- API calls use proper error handling
- Session IDs are generated securely

## Performance Optimizations

- Message history is limited to prevent memory issues
- Configuration is cached to reduce API calls
- Lazy loading of components when needed
- Efficient DOM manipulation using fragments
- Throttled/debounced operations where appropriate

## Browser Compatibility

The widget uses modern JavaScript features but maintains compatibility with:
- ES2020 target for build output
- Fallbacks for older browser APIs
- Progressive enhancement approach

## Testing Strategy

Each module can be tested independently:
- Unit tests for utilities and services
- Component tests for UI components
- Integration tests for the main widget
- E2E tests for full functionality

## Extension Points

The modular architecture allows for easy extension:
- Add new languages to LanguageDetector
- Create custom themes in ThemeManager
- Add new message types in ChatMessage
- Extend API capabilities in ApiService
- Add new state properties in StateManager

## Build Process

The build process (via `build.js`):
1. Bundles all modules using esbuild
2. Creates minified and debug versions
3. Generates IIFE format for browser compatibility
4. Includes all dependencies (like DOMPurify)

## Future Enhancements

Potential areas for future development:
- WebSocket support for real-time messaging
- File upload capabilities
- Rich message formats (cards, buttons)
- Voice input/output
- Persistent conversation history
- Multi-language model support
- Analytics integration