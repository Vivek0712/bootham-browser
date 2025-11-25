// Renderer process script for browser UI
// Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.5

const webview = document.getElementById('webview');
const urlInput = document.getElementById('url-input');
const backBtn = document.getElementById('back-btn');
const forwardBtn = document.getElementById('forward-btn');
const reloadBtn = document.getElementById('reload-btn');

/**
 * Set webview dimensions to fill container
 * Electron webview requires explicit pixel dimensions
 */
function resizeWebview() {
  const container = document.getElementById('webview-container');
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  webview.style.width = width + 'px';
  webview.style.height = height + 'px';
  webview.style.display = 'flex';
}

// Initialize webview size
document.addEventListener('DOMContentLoaded', () => {
  resizeWebview();
  setTimeout(resizeWebview, 100);
});

// Resize webview when window resizes
window.addEventListener('resize', resizeWebview);

/**
 * Normalizes URL by prepending https:// if no protocol is present
 * Requirement 2.2: Prepend "https://" to URLs without protocol
 */
function normalizeUrl(url) {
  const trimmed = url.trim();
  if (!trimmed) return '';
  
  // Check if URL has a protocol
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return 'https://' + trimmed;
  }
  
  return trimmed;
}

/**
 * Navigate to the specified URL
 * Requirement 2.1: Load specified URL using navigation methods
 */
function navigateToUrl(url) {
  const normalizedUrl = normalizeUrl(url);
  if (normalizedUrl) {
    webview.src = normalizedUrl;
  }
}

/**
 * Update navigation button states based on history
 * Requirements: 3.3, 3.4
 */
function updateNavigationButtons() {
  backBtn.disabled = !webview.canGoBack();
  forwardBtn.disabled = !webview.canGoForward();
}

// Event Listeners

// Handle URL input submission
// Requirement 2.1: Navigate when user enters URL and presses Enter
urlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    navigateToUrl(urlInput.value);
  }
});

// Back button - Requirement 3.1: Navigate to previous page
backBtn.addEventListener('click', () => {
  if (webview.canGoBack()) {
    webview.goBack();
  }
});

// Forward button - Requirement 3.2: Navigate to next page
forwardBtn.addEventListener('click', () => {
  if (webview.canGoForward()) {
    webview.goForward();
  }
});

// Reload button - Requirement 3.5: Reload current page
reloadBtn.addEventListener('click', () => {
  webview.reload();
});

// Webview event handlers

// Update URL bar when page starts loading
// Requirement 2.3: Display current URL during page load
webview.addEventListener('did-start-loading', () => {
  urlInput.value = webview.getURL();
  updateNavigationButtons();
});

// Update URL bar when navigation completes
// Requirement 2.4: Update address bar with final URL including redirects
webview.addEventListener('did-navigate', () => {
  urlInput.value = webview.getURL();
  updateNavigationButtons();
});

// Handle in-page navigation (e.g., redirects)
// Requirement 2.4: Update address bar after redirects
webview.addEventListener('did-navigate-in-page', () => {
  urlInput.value = webview.getURL();
  updateNavigationButtons();
});

// Update navigation buttons when page finishes loading
webview.addEventListener('did-finish-load', () => {
  updateNavigationButtons();
});

// Initialize navigation buttons on load
webview.addEventListener('dom-ready', () => {
  updateNavigationButtons();
});

// Debug: Log sizes to help diagnose layout issues
function logSizes() {
  const container = document.getElementById('webview-container');
  console.log('Window size:', window.innerWidth, 'x', window.innerHeight);
  console.log('Container size:', container.clientWidth, 'x', container.clientHeight);
  console.log('Webview computed style:', {
    width: window.getComputedStyle(webview).width,
    height: window.getComputedStyle(webview).height,
    display: window.getComputedStyle(webview).display
  });
}

// Log sizes on load and resize
window.addEventListener('load', () => {
  setTimeout(logSizes, 100);
});

window.addEventListener('resize', logSizes);
