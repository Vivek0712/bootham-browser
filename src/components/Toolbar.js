import React, { useState, useEffect, useRef } from 'react';
import './Toolbar.css';

function Toolbar({ tabs, activeTabId, onNavigate, agentMode, onToggleAgent }) {
  const [urlInput, setUrlInput] = useState('');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const webviewRef = useRef(null);

  const activeTab = tabs.find(t => t.id === activeTabId);

  useEffect(() => {
    if (activeTab) {
      const url = activeTab.url;
      setUrlInput((url === 'about:blank' || url.includes('landing.html')) ? '' : url);
    }
  }, [activeTab]);

  const normalizeUrl = (url) => {
    const trimmed = url.trim();
    if (!trimmed) return '';
    
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
      return 'https://' + trimmed;
    }
    
    return trimmed;
  };

  const handleNavigate = () => {
    const normalizedUrl = normalizeUrl(urlInput);
    if (normalizedUrl && activeTabId) {
      onNavigate(activeTabId, normalizedUrl);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleNavigate();
    }
  };

  const handleBack = () => {
    const webview = document.getElementById(`webview-${activeTabId}`);
    if (webview && webview.canGoBack()) {
      webview.goBack();
    }
  };

  const handleForward = () => {
    const webview = document.getElementById(`webview-${activeTabId}`);
    if (webview && webview.canGoForward()) {
      webview.goForward();
    }
  };

  const handleReload = () => {
    const webview = document.getElementById(`webview-${activeTabId}`);
    if (webview) {
      webview.reload();
    }
  };

  useEffect(() => {
    const updateNavButtons = () => {
      const webview = document.getElementById(`webview-${activeTabId}`);
      if (webview) {
        setCanGoBack(webview.canGoBack());
        setCanGoForward(webview.canGoForward());
      }
    };

    const interval = setInterval(updateNavButtons, 100);
    return () => clearInterval(interval);
  }, [activeTabId]);

  return (
    <div className="toolbar">
      <button className="nav-btn" onClick={handleBack} disabled={!canGoBack}>
        ←
      </button>
      <button className="nav-btn" onClick={handleForward} disabled={!canGoForward}>
        →
      </button>
      <button className="nav-btn" onClick={handleReload}>
        ⟳
      </button>
      <input
        type="text"
        className="url-input"
        placeholder="Enter URL..."
        value={urlInput}
        onChange={(e) => setUrlInput(e.target.value)}
        onKeyPress={handleKeyPress}
      />
      <button 
        className={`agent-toggle-btn ${agentMode ? 'active' : ''}`}
        onClick={onToggleAgent}
        title="Toggle Pei Agent Mode"
      >
        🤖 Pei Agent
      </button>
    </div>
  );
}

export default Toolbar;
