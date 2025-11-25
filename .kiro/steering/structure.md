---
inclusion: always
---

# Project Structure

## Directory Layout

```
.
├── browser/              # Browser application code
│   ├── main.js          # Main process entry point (Electron main)
│   ├── renderer.js      # Renderer process script (UI logic)
│   ├── browser.html     # Browser UI markup and styles
│   ├── *.test.js        # Unit tests
│   ├── *.property.test.js  # Property-based tests
│   └── integration.test.js # Integration tests
├── assets/              # Application assets (icons, images)
├── .kiro/
│   ├── specs/          # Feature specifications and design docs
│   └── steering/       # AI assistant guidance documents
├── node_modules/        # Dependencies (not committed)
├── package.json         # Project metadata and dependencies
├── jest.config.js       # Test configuration
└── README.md           # Project documentation
```

## File Organization Conventions

### Main Process (`browser/main.js`)
- Application lifecycle management
- Window creation and configuration
- Security settings (context isolation, sandboxing)
- Platform-specific behavior (macOS dock handling)

### Renderer Process (`browser/renderer.js`)
- UI event handlers
- Webview interaction logic
- URL normalization and navigation
- Navigation button state management

### UI (`browser/browser.html`)
- Inline styles for simplicity
- Toolbar with navigation controls
- Webview container for content display
- Content Security Policy headers

### Testing
- Test files are co-located with implementation files
- Naming convention: `<module>.test.js` for unit tests
- Property-based tests: `<module>.property.test.js`
- Integration tests: `integration.test.js`

## Key Patterns

- **Global window reference**: Main process keeps reference to prevent garbage collection
- **Event-driven architecture**: Webview events drive UI updates
- **Security-first**: Context isolation, sandboxing, and CSP enabled by default
- **Requirement traceability**: Comments reference specific requirements from specs
