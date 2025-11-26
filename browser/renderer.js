// Renderer process script for browser UI with tab support
// Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.5

const urlInput = document.getElementById('url-input');
const backBtn = document.getElementById('back-btn');
const forwardBtn = document.getElementById('forward-btn');
const reloadBtn = document.getElementById('reload-btn');
const newTabBtn = document.getElementById('new-tab-btn');
const tabsContainer = document.getElementById('tabs-container');
const webviewContainer = document.getElementById('webview-area');

// Agent mode elements
const agentToggle = document.getElementById('agent-toggle');
const agentPanel = document.getElementById('agent-panel');
const agentClose = document.getElementById('agent-close');
const agentPrompt = document.getElementById('agent-prompt');
const agentSubmit = document.getElementById('agent-submit');
const agentStop = document.getElementById('agent-stop');
const agentLog = document.getElementById('agent-log');

// Tab management
let tabs = [];
let activeTabId = null;
let nextTabId = 1;

// Agent mode state
let agentInitialized = false;
let agentRunning = false;
let agentTabId = null;
let currentUserQuestionResolve = null;

// Landing page URL
const LANDING_URL = window.location.href.replace('browser.html', 'landing.html');

/**
 * Create a new tab
 */
function createTab(url = 'about:blank') {
  const tabId = nextTabId++;
  
  // Create webview wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'webview-wrapper';
  wrapper.id = `webview-wrapper-${tabId}`;
  
  // Create webview element
  const webview = document.createElement('webview');
  webview.id = `webview-${tabId}`;
  webview.src = url;
  wrapper.appendChild(webview);
  webviewContainer.appendChild(wrapper);
  
  // Create tab element
  const tab = document.createElement('div');
  tab.className = 'tab';
  tab.id = `tab-${tabId}`;
  
  const tabTitle = document.createElement('span');
  tabTitle.className = 'tab-title';
  tabTitle.textContent = 'New Tab';
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'tab-close';
  closeBtn.textContent = '×';
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    closeTab(tabId);
  };
  
  tab.appendChild(tabTitle);
  tab.appendChild(closeBtn);
  tab.onclick = () => switchTab(tabId);
  tabsContainer.appendChild(tab);
  
  // Setup webview event listeners
  setupWebviewListeners(webview, tabId);
  
  // Store tab data
  tabs.push({
    id: tabId,
    webview,
    wrapper,
    tab,
    tabTitle,
    url
  });
  
  // Resize webview after creation
  setTimeout(() => resizeWebview(webview), 50);
  
  return tabId;
}

/**
 * Setup event listeners for a webview
 */
function setupWebviewListeners(webview, tabId) {
  webview.addEventListener('did-start-loading', () => {
    if (activeTabId === tabId) {
      const url = webview.getURL();
      urlInput.value = (url === 'about:blank' || url.includes('landing.html')) ? '' : url;
      updateNavigationButtons();
    }
  });
  
  webview.addEventListener('did-navigate', () => {
    if (activeTabId === tabId) {
      const url = webview.getURL();
      urlInput.value = (url === 'about:blank' || url.includes('landing.html')) ? '' : url;
      updateNavigationButtons();
    }
    updateTabTitle(tabId);
  });
  
  webview.addEventListener('did-navigate-in-page', () => {
    if (activeTabId === tabId) {
      const url = webview.getURL();
      urlInput.value = (url === 'about:blank' || url.includes('landing.html')) ? '' : url;
      updateNavigationButtons();
    }
  });
  
  webview.addEventListener('did-finish-load', () => {
    if (activeTabId === tabId) {
      updateNavigationButtons();
    }
    updateTabTitle(tabId);
  });
  
  webview.addEventListener('page-title-updated', (e) => {
    updateTabTitle(tabId, e.title);
  });
  
  webview.addEventListener('dom-ready', () => {
    if (activeTabId === tabId) {
      updateNavigationButtons();
    }
  });
}

/**
 * Update tab title
 */
function updateTabTitle(tabId, title) {
  const tabData = tabs.find(t => t.id === tabId);
  if (!tabData) return;
  
  if (title) {
    tabData.tabTitle.textContent = title;
  } else {
    const url = tabData.webview.getURL();
    if (url && url !== 'about:blank' && !url.includes('landing.html')) {
      try {
        const urlObj = new URL(url);
        tabData.tabTitle.textContent = urlObj.hostname || 'New Tab';
      } catch {
        tabData.tabTitle.textContent = 'New Tab';
      }
    } else {
      tabData.tabTitle.textContent = 'New Tab';
    }
  }
}

/**
 * Switch to a specific tab
 */
function switchTab(tabId) {
  const tabData = tabs.find(t => t.id === tabId);
  if (!tabData) return;
  
  // Deactivate current tab
  tabs.forEach(t => {
    t.tab.classList.remove('active');
    t.wrapper.classList.remove('active');
  });
  
  // Activate new tab
  tabData.tab.classList.add('active');
  tabData.wrapper.classList.add('active');
  activeTabId = tabId;
  
  // Update UI
  const currentUrl = tabData.webview.getURL();
  urlInput.value = (currentUrl === 'about:blank' || currentUrl.includes('landing.html')) ? '' : currentUrl;
  updateNavigationButtons();
  resizeWebview(tabData.webview);
}

/**
 * Close a tab
 */
function closeTab(tabId) {
  const index = tabs.findIndex(t => t.id === tabId);
  if (index === -1) return;
  
  const tabData = tabs[index];
  
  // Remove DOM elements
  tabData.tab.remove();
  tabData.wrapper.remove();
  
  // Remove from array
  tabs.splice(index, 1);
  
  // If closing active tab, switch to another
  if (activeTabId === tabId) {
    if (tabs.length > 0) {
      const newActiveTab = tabs[Math.max(0, index - 1)];
      switchTab(newActiveTab.id);
    } else {
      activeTabId = null;
      urlInput.value = '';
    }
  }
  
  // Create new tab if all closed
  if (tabs.length === 0) {
    const newTabId = createTab(LANDING_URL);
    switchTab(newTabId);
  }
}

/**
 * Normalizes URL by prepending https:// if no protocol is present
 * Requirement 2.2: Prepend "https://" to URLs without protocol
 */
function normalizeUrl(url) {
  const trimmed = url.trim();
  if (!trimmed) return '';
  
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return 'https://' + trimmed;
  }
  
  return trimmed;
}

/**
 * Navigate to the specified URL in active tab
 * Requirement 2.1: Load specified URL using navigation methods
 */
function navigateToUrl(url) {
  const normalizedUrl = normalizeUrl(url);
  if (!normalizedUrl || !activeTabId) return;
  
  const tabData = tabs.find(t => t.id === activeTabId);
  if (tabData) {
    tabData.webview.src = normalizedUrl;
  }
}

/**
 * Update navigation button states based on history
 * Requirements: 3.3, 3.4
 */
function updateNavigationButtons() {
  if (!activeTabId) {
    backBtn.disabled = true;
    forwardBtn.disabled = true;
    return;
  }
  
  const tabData = tabs.find(t => t.id === activeTabId);
  if (tabData) {
    backBtn.disabled = !tabData.webview.canGoBack();
    forwardBtn.disabled = !tabData.webview.canGoForward();
  }
}

/**
 * Set webview dimensions to fill container
 * Electron webview requires explicit pixel dimensions
 */
function resizeWebview(webview) {
  const container = document.getElementById('webview-area');
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  webview.style.width = width + 'px';
  webview.style.height = height + 'px';
  webview.style.display = 'flex';
}

/**
 * Resize all webviews
 */
function resizeAllWebviews() {
  tabs.forEach(t => resizeWebview(t.webview));
}

// Event Listeners

// New tab button
newTabBtn.addEventListener('click', () => {
  const newTabId = createTab(LANDING_URL);
  switchTab(newTabId);
});

// URL input submission
urlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    navigateToUrl(urlInput.value);
  }
});

// Back button - Requirement 3.1: Navigate to previous page
backBtn.addEventListener('click', () => {
  if (!activeTabId) return;
  const tabData = tabs.find(t => t.id === activeTabId);
  if (tabData && tabData.webview.canGoBack()) {
    tabData.webview.goBack();
  }
});

// Forward button - Requirement 3.2: Navigate to next page
forwardBtn.addEventListener('click', () => {
  if (!activeTabId) return;
  const tabData = tabs.find(t => t.id === activeTabId);
  if (tabData && tabData.webview.canGoForward()) {
    tabData.webview.goForward();
  }
});

// Reload button - Requirement 3.5: Reload current page
reloadBtn.addEventListener('click', () => {
  if (!activeTabId) return;
  const tabData = tabs.find(t => t.id === activeTabId);
  if (tabData) {
    tabData.webview.reload();
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const initialTabId = createTab(LANDING_URL);
  switchTab(initialTabId);
  setTimeout(resizeAllWebviews, 100);
});

// Resize webviews when window resizes
window.addEventListener('resize', resizeAllWebviews);

// Agent Mode Functions

/**
 * Toggle agent panel visibility
 */
function toggleAgentPanel() {
  const isHidden = agentPanel.classList.contains('hidden');
  
  if (isHidden) {
    agentPanel.classList.remove('hidden');
    agentToggle.textContent = '🤖 Hide Agent';
    
    // Initialize agent if not already done
    if (!agentInitialized) {
      initializeAgent();
    }
  } else {
    agentPanel.classList.add('hidden');
    agentToggle.textContent = '🤖 Agent Mode';
  }
}

/**
 * Initialize the agent service
 */
async function initializeAgent() {
  try {
    addAgentLog('Initializing agent service...', 'system');
    
    // Check if electron IPC is available
    if (!window.electron || !window.electron.ipcRenderer) {
      addAgentLog('Error: Electron IPC not available', 'error');
      return;
    }
    
    // Use IPC to initialize agent in main process
    const result = await window.electron.ipcRenderer.invoke('agent:initialize', 'us-west-2');
    
    if (result && result.success) {
      agentInitialized = true;
      addAgentLog('Agent service initialized successfully', 'system');
    } else {
      addAgentLog(`Failed to initialize agent: ${result ? result.error : 'No response'}`, 'error');
    }
  } catch (error) {
    addAgentLog(`Error initializing agent: ${error.message}`, 'error');
  }
}

/**
 * Execute agent prompt
 */
async function executeAgentPrompt() {
  const prompt = agentPrompt.value.trim();
  
  if (!prompt) {
    addAgentLog('Please enter a prompt', 'error');
    return;
  }
  
  if (!agentInitialized) {
    addAgentLog('Agent not initialized. Initializing now...', 'system');
    await initializeAgent();
    if (!agentInitialized) {
      addAgentLog('Failed to initialize agent. Cannot execute prompt.', 'error');
      return;
    }
  }
  
  try {
    agentRunning = true;
    agentSubmit.style.display = 'none';
    agentStop.style.display = 'block';
    agentPrompt.disabled = true;
    
    addAgentLog(`User: ${prompt}`, 'user');
    
    // Create a new tab for agent actions
    addAgentLog('Creating agent tab...', 'system');
    agentTabId = createTab('about:blank');
    
    // Get the webview for the agent tab
    const agentTabData = tabs.find(t => t.id === agentTabId);
    if (!agentTabData) {
      throw new Error('Failed to create agent tab');
    }
    
    // Wait for webview to be fully attached and ready
    addAgentLog('Waiting for agent tab to be ready...', 'system');
    await new Promise((resolve, reject) => {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error('Timeout waiting for webview to be ready'));
        }
      }, 10000);
      
      const onReady = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          // Give it a bit more time to ensure it's fully ready
          setTimeout(resolve, 1000);
        }
      };
      
      // Listen for dom-ready event
      agentTabData.webview.addEventListener('dom-ready', onReady, { once: true });
      
      // Also check if it's already ready
      setTimeout(() => {
        try {
          const id = agentTabData.webview.getWebContentsId();
          if (id) {
            onReady();
          }
        } catch (e) {
          // Not ready yet, wait for event
        }
      }, 100);
    });
    
    // Switch to the agent tab after it's ready
    switchTab(agentTabId);
    
    const webContentsId = agentTabData.webview.getWebContentsId();
    addAgentLog(`Agent tab ready (WebContents ID: ${webContentsId})`, 'system');
    
    // Execute the prompt
    addAgentLog('Sending prompt to agent service...', 'system');
    const result = await window.electron.ipcRenderer.invoke('agent:execute', prompt, webContentsId);
    
    if (result && !result.success) {
      addAgentLog(`Error: ${result.error}`, 'error');
    } else if (!result) {
      addAgentLog('Error: No response from agent service', 'error');
    }
  } catch (error) {
    addAgentLog(`Error executing prompt: ${error.message}`, 'error');
    console.error('Agent execution error:', error);
  } finally {
    agentRunning = false;
    agentSubmit.style.display = 'block';
    agentStop.style.display = 'none';
    agentPrompt.disabled = false;
    agentPrompt.value = '';
  }
}

/**
 * Stop agent execution
 */
async function stopAgent() {
  try {
    await window.electron.ipcRenderer.invoke('agent:stop');
    addAgentLog('Agent stopped by user', 'system');
  } catch (error) {
    addAgentLog(`Error stopping agent: ${error.message}`, 'error');
  }
}

/**
 * Add log entry to agent panel
 */
function addAgentLog(message, type = 'system') {
  const entry = document.createElement('div');
  entry.className = `log-entry log-${type}`;
  
  // Format message if it's JSON
  try {
    const parsed = JSON.parse(message);
    entry.textContent = JSON.stringify(parsed, null, 2);
  } catch {
    entry.textContent = message;
  }
  
  agentLog.appendChild(entry);
  agentLog.scrollTop = agentLog.scrollHeight;
}

/**
 * Handle agent events from main process
 */
function handleAgentEvent(event, eventData) {
  const { type, data } = eventData;
  
  switch (type) {
    case 'agent-start':
      addAgentLog(`Starting agent with prompt: ${data.prompt}`, 'system');
      break;
      
    case 'agent-complete':
      addAgentLog('Agent execution completed', 'system');
      break;
      
    case 'agent-error':
      addAgentLog(`Agent error: ${data.error}`, 'error');
      break;
      
    case 'log':
      addAgentLog(data.message, data.type);
      break;
      
    case 'tool-execute':
      addAgentLog(`Executing tool: ${data.tool} with params: ${JSON.stringify(data.params)}`, 'system');
      break;
      
    case 'ask-user':
      showUserQuestion(data.question);
      break;
  }
}

/**
 * Show user question in agent panel
 */
function showUserQuestion(question) {
  const questionDiv = document.createElement('div');
  questionDiv.className = 'user-question';
  
  const questionText = document.createElement('div');
  questionText.className = 'user-question-text';
  questionText.textContent = `❓ ${question}`;
  
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Your answer...';
  
  const submitBtn = document.createElement('button');
  submitBtn.textContent = 'Submit Answer';
  submitBtn.onclick = async () => {
    const answer = input.value.trim();
    if (answer) {
      // Send response to main process
      await window.electron.ipcRenderer.invoke('agent:respond', answer);
      questionDiv.remove();
      addAgentLog(`User answered: ${answer}`, 'user');
    }
  };
  
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      submitBtn.click();
    }
  });
  
  questionDiv.appendChild(questionText);
  questionDiv.appendChild(input);
  questionDiv.appendChild(submitBtn);
  
  agentLog.appendChild(questionDiv);
  agentLog.scrollTop = agentLog.scrollHeight;
  input.focus();
}

// Agent Mode Event Listeners

agentToggle.addEventListener('click', toggleAgentPanel);
agentClose.addEventListener('click', toggleAgentPanel);
agentSubmit.addEventListener('click', executeAgentPrompt);
agentStop.addEventListener('click', stopAgent);

agentPrompt.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && e.ctrlKey) {
    executeAgentPrompt();
  }
});

// Listen for agent events from main process
// Wait for DOM to be ready before setting up IPC listeners
window.addEventListener('DOMContentLoaded', () => {
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.on('agent:event', handleAgentEvent);
  }
});
