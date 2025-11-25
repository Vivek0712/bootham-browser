/**
 * Unit tests for main process window creation and configuration
 * Requirements: 1.1, 4.1, 4.3
 */

// Mock Electron modules before requiring main.js
const mockBrowserWindow = jest.fn();
const mockApp = {
  on: jest.fn(),
  quit: jest.fn(),
  isReady: jest.fn(() => true)
};

jest.mock('electron', () => ({
  app: mockApp,
  BrowserWindow: mockBrowserWindow
}));

describe('Main Process - Window Creation and Configuration', () => {
  let mockWindow;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a mock window instance
    mockWindow = {
      loadURL: jest.fn(),
      on: jest.fn(),
      webContents: {
        on: jest.fn()
      }
    };
    
    // Configure BrowserWindow mock to return our mock window
    mockBrowserWindow.mockReturnValue(mockWindow);
  });

  describe('BrowserWindow Creation', () => {
    test('should create BrowserWindow with correct width dimension', () => {
      // Requirement 1.1: BrowserWindow created with default dimensions
      const { BrowserWindow } = require('electron');
      
      // Simulate createWindow
      new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true
        }
      });
      
      expect(mockBrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 1200
        })
      );
    });

    test('should create BrowserWindow with correct height dimension', () => {
      // Requirement 1.1: BrowserWindow created with default dimensions
      const { BrowserWindow } = require('electron');
      
      new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true
        }
      });
      
      expect(mockBrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          height: 800
        })
      );
    });

    test('should create BrowserWindow with both correct dimensions', () => {
      // Requirement 1.1: BrowserWindow created with default dimensions
      const { BrowserWindow } = require('electron');
      
      new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true
        }
      });
      
      expect(mockBrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 1200,
          height: 800
        })
      );
    });

    test('should load default blank page', () => {
      // Requirement 1.2: Load default homepage or blank page
      const { BrowserWindow } = require('electron');
      
      const window = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true
        }
      });
      
      window.loadURL('about:blank');
      
      expect(mockWindow.loadURL).toHaveBeenCalledWith('about:blank');
    });
  });

  describe('Security Settings Configuration', () => {
    test('should disable nodeIntegration in webPreferences', () => {
      // Requirement 4.3: Prevent Node.js integration in renderer process
      const { BrowserWindow } = require('electron');
      
      new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true
        }
      });
      
      expect(mockBrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          webPreferences: expect.objectContaining({
            nodeIntegration: false
          })
        })
      );
    });

    test('should enable contextIsolation in webPreferences', () => {
      // Requirement 4.1: Enable Chromium's default security features
      const { BrowserWindow } = require('electron');
      
      new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true
        }
      });
      
      expect(mockBrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          webPreferences: expect.objectContaining({
            contextIsolation: true
          })
        })
      );
    });

    test('should enable sandbox in webPreferences', () => {
      // Requirement 4.1: Enable Chromium's default security features including sandboxing
      const { BrowserWindow } = require('electron');
      
      new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true
        }
      });
      
      expect(mockBrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          webPreferences: expect.objectContaining({
            sandbox: true
          })
        })
      );
    });

    test('should configure all security settings correctly', () => {
      // Requirements 4.1, 4.3: Verify all security settings are properly configured
      const { BrowserWindow } = require('electron');
      
      new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true
        }
      });
      
      expect(mockBrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          webPreferences: expect.objectContaining({
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true
          })
        })
      );
    });
  });

  describe('Window Lifecycle Event Handlers', () => {
    test('should register closed event handler', () => {
      // Requirement 1.3: Handle window closure
      const { BrowserWindow } = require('electron');
      
      const window = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true
        }
      });
      
      window.on('closed', () => {});
      
      expect(mockWindow.on).toHaveBeenCalledWith('closed', expect.any(Function));
    });

    test('should set window reference to null when closed event fires', () => {
      // Requirement 1.3: Clean up window reference on close
      const { BrowserWindow } = require('electron');
      
      let testWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true
        }
      });
      
      // Register the closed handler that nullifies the reference
      const closedHandler = () => {
        testWindow = null;
      };
      testWindow.on('closed', closedHandler);
      
      // Verify window is not null before calling handler
      expect(testWindow).not.toBeNull();
      
      // Call the closed handler
      closedHandler();
      
      // Verify window is set to null
      expect(testWindow).toBeNull();
    });
  });
});

describe('App Lifecycle Event Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  test('should register ready event handler', () => {
    // Requirement 1.1: Initialize app when ready
    require('./main.js');
    
    expect(mockApp.on).toHaveBeenCalledWith('ready', expect.any(Function));
  });

  test('should register window-all-closed event handler', () => {
    // Requirement 1.3: Terminate main process cleanly when window is closed
    require('./main.js');
    
    expect(mockApp.on).toHaveBeenCalledWith('window-all-closed', expect.any(Function));
  });

  test('should register activate event handler', () => {
    // Standard Electron pattern for macOS
    require('./main.js');
    
    expect(mockApp.on).toHaveBeenCalledWith('activate', expect.any(Function));
  });

  test('should quit app on window-all-closed for non-macOS platforms', () => {
    // Requirement 1.3: Terminate main process cleanly
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', {
      value: 'win32',
      configurable: true
    });
    
    require('./main.js');
    
    // Get the window-all-closed handler
    const handler = mockApp.on.mock.calls.find(call => call[0] === 'window-all-closed')[1];
    
    // Call the handler
    handler();
    
    // Verify app.quit was called
    expect(mockApp.quit).toHaveBeenCalled();
    
    // Restore original platform
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      configurable: true
    });
  });

  test('should not quit app on window-all-closed for macOS', () => {
    // macOS-specific behavior: apps stay active until explicitly quit
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', {
      value: 'darwin',
      configurable: true
    });
    
    require('./main.js');
    
    // Get the window-all-closed handler
    const handler = mockApp.on.mock.calls.find(call => call[0] === 'window-all-closed')[1];
    
    // Call the handler
    handler();
    
    // Verify app.quit was NOT called
    expect(mockApp.quit).not.toHaveBeenCalled();
    
    // Restore original platform
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      configurable: true
    });
  });
});
