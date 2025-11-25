---
inclusion: always
---

# Product Overview

Minimal Electron Browser is a lightweight desktop browser application built with Electron. It provides basic web browsing functionality including URL navigation, back/forward history, and page reload capabilities.

## Core Features

- URL navigation with automatic HTTPS protocol prepending
- Browser history navigation (back/forward)
- Page reload functionality
- Secure sandboxed browsing environment
- Clean, minimal UI with address bar and navigation controls

## Architecture

The application follows Electron's standard two-process architecture:
- **Main process**: Manages application lifecycle and window creation
- **Renderer process**: Handles UI and user interactions with the webview

Security is a priority with context isolation, sandboxing, and disabled Node.js integration in the renderer process.
