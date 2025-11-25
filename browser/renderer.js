// Renderer process script for browser UI with tab support
// Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.5

const urlInput = document.getElementById('url-input');
const backBtn = document.getElementById('back-btn');
const forwardBtn = document.getElementById('forward-btn');
const reloadBtn = document.getElementById('reload-btn');
const newTabBtn = document.getElementById('new-tab-btn');
const tabsContainer = document.getElementById('tabs-container');
const webviewContainer = document.getElementById('webview-container');

// Tab management
let tabs = [];
let activeTabId = null;
let nextTabId = 1;

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
  const width = webviewContainer.clientWidth;
  const height = webviewContainer.clientHeight;
  
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
