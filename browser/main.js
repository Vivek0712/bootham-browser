// Main process entry point
const { app, BrowserWindow, ipcMain, webContents } = require('electron');
const path = require('path');
const AgentService = require('./agent-service');

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;
let agentService = null;
let agentTabWebContents = null;

/**
 * Creates and configures the main browser window
 * Requirements: 1.1, 1.2, 4.1, 4.3, 2.1, 3.1, 3.2, 3.5, 6.1
 */
function createWindow() {
  // Create the browser window with security-focused configuration
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,      // Requirement 4.3: Prevent Node.js integration in renderer
      contextIsolation: true,       // Requirement 4.1: Enable context isolation for security
      sandbox: false,               // Disable sandbox to allow webview interaction
      webviewTag: true,             // Enable webview tag for browser UI
      preload: path.join(__dirname, 'preload.js')  // Load preload script for IPC
    }
  });

  // Load the React app
  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));

  // Open DevTools for debugging (comment out in production)
  mainWindow.webContents.openDevTools();

  // Suppress ERR_ABORTED errors from webviews (these are normal during navigation)
  mainWindow.webContents.on('console-message', (event, level, message) => {
    if (message.includes('ERR_ABORTED') && message.includes('GUEST_VIEW_MANAGER_CALL')) {
      // Suppress these specific errors as they're expected during webview navigation
      return;
    }
  });

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
  setupAgentIPC();
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

/**
 * Setup IPC handlers for agent communication
 */
function setupAgentIPC() {
  // Initialize agent service
  ipcMain.handle('agent:initialize', async (event, region) => {
    try {
      console.log('[Agent] Initializing agent service with region:', region);
      agentService = new AgentService();
      agentService.initialize(region);
      
      // Set up event callback to send events to renderer
      agentService.setEventCallback((eventData) => {
        console.log('[Agent] Event:', eventData.type);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('agent:event', eventData);
        }
      });
      
      console.log('[Agent] Agent service initialized successfully');
      return { success: true };
    } catch (error) {
      console.error('[Agent] Initialization error:', error);
      return { success: false, error: error.message };
    }
  });

  // Execute agent prompt
  ipcMain.handle('agent:execute', async (event, prompt, agentTabId) => {
    try {
      console.log('[Agent] Execute request received:', { prompt, agentTabId });
      
      if (!agentService) {
        throw new Error('Agent service not initialized');
      }

      // Import webContents from electron
      const { webContents } = require('electron');
      
      // Get all webContents
      const allWebContents = webContents.getAllWebContents();
      
      console.log('[Agent] All WebContents:', allWebContents.map(wc => ({
        id: wc.id,
        type: wc.getType()
      })));
      
      // Find the webview with the agent tab ID
      agentTabWebContents = allWebContents.find(wc => {
        return wc.getType() === 'webview' && wc.id === agentTabId;
      });

      if (!agentTabWebContents) {
        console.error('[Agent] Agent tab not found. Available webviews:', 
          allWebContents.filter(wc => wc.getType() === 'webview').map(wc => wc.id));
        throw new Error(`Agent tab not found. Looking for ID ${agentTabId}`);
      }

      console.log('[Agent] Found agent tab webview:', agentTabWebContents.id);

      // Initialize browser with the webview
      await agentService.initializeBrowser(agentTabWebContents);
      console.log('[Agent] Browser initialized');
      
      // Execute the prompt
      console.log('[Agent] Starting prompt execution...');
      await agentService.executePrompt(prompt);
      console.log('[Agent] Prompt execution completed');
      
      return { success: true };
    } catch (error) {
      console.error('[Agent] Error executing prompt:', error);
      return { success: false, error: error.message };
    }
  });

  // Stop agent execution
  ipcMain.handle('agent:stop', async () => {
    try {
      if (agentService) {
        agentService.stop();
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Respond to user question
  ipcMain.handle('agent:respond', async (event, response) => {
    try {
      if (agentService) {
        agentService.resolveUserResponse(response);
      }
      return { success: true };
    } catch (error) {
      console.error('[Agent] Error responding to user question:', error);
      return { success: false, error: error.message };
    }
  });
}
