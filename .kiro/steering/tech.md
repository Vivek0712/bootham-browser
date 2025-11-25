---
inclusion: always
---

# Technology Stack

## Core Technologies

- **Runtime**: Node.js 16+
- **Framework**: Electron 28.x
- **Language**: JavaScript (ES6+)

## Dependencies

- `electron`: Desktop application framework
- `chromium`: Browser engine

## Development Tools

- **Testing**: Jest 29.x with multiple test environments
- **Property Testing**: fast-check for property-based tests
- **Integration Testing**: Spectron for Electron integration tests

## Test Environments

The project uses Jest with multiple configurations:
- `node` environment for main process tests
- `jsdom` environment for renderer process tests
- Separate test suites for unit, property-based, and integration tests

## Common Commands

```bash
# Start the application
npm start

# Run all tests
npm test

# Install dependencies
npm install
```

## Code Style

- Use ES6+ features (const/let, arrow functions, template literals)
- Prefer `const` over `let` when variables won't be reassigned
- Use JSDoc comments for function documentation
- Include requirement references in comments (e.g., `// Requirement 2.1: ...`)
