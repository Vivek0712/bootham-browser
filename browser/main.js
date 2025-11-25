// Main process entry point
const { app, BrowserWindow } = require('electron');
const path = require('path');

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;

/**
 * Creates and configures the main browser window
 * Requirements: 1.1, 1.2, 4.1, 4.3, 2.1, 3.1, 3.2, 3.5, 6.1
 */
function createWindow() {
  // Create the browser window with security-focused configuration
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,      // Requirement 4.3: Prevent Node.js integration in renderer
      contextIsolation: true,       // Requirement 4.1: Enable context isolation for security
      sandbox: true,                // Requirement 4.1: Enable Chromium sandboxing
      webviewTag: true              // Enable webview tag for browser UI
    }
  });

  // Load the React app (Requirements: 2.1, 3.1, 3.2, 3.5, 6.1)
  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));

  // Handle window closed event
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle event handlers

/**
 * Initialize the application when ready
 * Requirement 1.1: Create and display BrowserWindow on startup
 */
app.on('ready', () => {
  createWindow();
});

/**
 * Quit when all windows are closed
 * Requirement 1.3: Terminate main process cleanly when window is closed
 */
app.on('window-all-closed', () => {
  // On macOS, applications typically stay active until explicitly quit
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Re-create window on macOS when dock icon is clicked
 * Standard Electron pattern for macOS
 */
app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked and no windows are open
  if (mainWindow === null) {
    createWindow();
  }
});
