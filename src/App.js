import React, { useState, useEffect } from 'react';
import TabsBar from './components/TabsBar';
import Toolbar from './components/Toolbar';
import WebviewContainer from './components/WebviewContainer';
import Sidebar from './components/Sidebar';
import './App.css';

const LANDING_URL = 'about:blank';

function App() {
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [nextTabId, setNextTabId] = useState(1);
  const [agentMode, setAgentMode] = useState(false);

  useEffect(() => {
    // Create initial tab
    createTab(LANDING_URL);
  }, []);

  const createTab = (url = LANDING_URL) => {
    const tabId = nextTabId;
    setNextTabId(nextTabId + 1);

    const newTab = {
      id: tabId,
      title: 'New Tab',
      url: url
    };

    setTabs(prevTabs => [...prevTabs, newTab]);
    setActiveTabId(tabId);

    return tabId;
  };

  const closeTab = (tabId) => {
    const index = tabs.findIndex(t => t.id === tabId);
    if (index === -1) return;

    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);

    if (activeTabId === tabId) {
      if (newTabs.length > 0) {
        const newActiveTab = newTabs[Math.max(0, index - 1)];
        setActiveTabId(newActiveTab.id);
      } else {
        setActiveTabId(null);
      }
    }

    if (newTabs.length === 0) {
      createTab(LANDING_URL);
    }
  };

  const updateTabTitle = (tabId, title) => {
    setTabs(prevTabs =>
      prevTabs.map(tab =>
        tab.id === tabId ? { ...tab, title } : tab
      )
    );
  };

  const updateTabUrl = (tabId, url) => {
    setTabs(prevTabs =>
      prevTabs.map(tab =>
        tab.id === tabId ? { ...tab, url } : tab
      )
    );
  };

  const toggleAgentMode = () => {
    setAgentMode(!agentMode);
  };

  const createAgentTab = async () => {
    // Use current active tab if it exists and has a webview, otherwise create new one
    let tabId = activeTabId;
    let isNewTab = false;
    
    // Check if current tab has a webview (not landing page)
    const currentTab = tabs.find(t => t.id === activeTabId);
    if (!currentTab || !currentTab.url || currentTab.url === 'about:blank') {
      // Create a new tab with a minimal URL to ensure webview creation
      tabId = createTab('data:text/html,<html><body>Agent initializing...</body></html>');
      isNewTab = true;
    }
    
    // Wait for the webview to be ready and get its WebContents ID
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('Timeout waiting for agent tab webview');
        reject(new Error('Timeout waiting for agent tab'));
      }, 15000);

      let checkCount = 0;
      const maxChecks = 150; // 15 seconds with 100ms intervals

      const checkWebview = () => {
        checkCount++;
        const webview = document.getElementById(`webview-${tabId}`);
        
        if (webview) {
          console.log('Found webview element for tab', tabId);
          
          let resolved = false;
          
          const onReady = () => {
            if (resolved) return;
            resolved = true;
            clearTimeout(timeout);
            
            // Give it extra time to fully initialize
            setTimeout(() => {
              try {
                const webContentsId = webview.getWebContentsId();
                console.log('Got WebContents ID:', webContentsId);
                resolve(webContentsId);
              } catch (error) {
                console.error('Error getting WebContents ID:', error);
                reject(error);
              }
            }, 500);
          };

          // Listen for dom-ready
          webview.addEventListener('dom-ready', onReady, { once: true });
          
          // Also try to get ID immediately in case it's already ready
          setTimeout(() => {
            if (resolved) return;
            try {
              const id = webview.getWebContentsId();
              if (id) {
                console.log('Webview already ready with ID:', id);
                resolved = true;
                clearTimeout(timeout);
                resolve(id);
              }
            } catch (e) {
              // Not ready yet, wait for dom-ready event
              console.log('Webview not ready yet, waiting for dom-ready...');
            }
          }, 200);
        } else {
          // Webview not found yet, keep checking
          if (checkCount < maxChecks) {
            setTimeout(checkWebview, 100);
          } else {
            clearTimeout(timeout);
            reject(new Error('Webview element not found after maximum checks'));
          }
        }
      };

      // Start checking after a short delay to let React render
      setTimeout(checkWebview, 100);
    });
  };

  return (
    <div className="app">
      <TabsBar
        tabs={tabs}
        activeTabId={activeTabId}
        onTabClick={setActiveTabId}
        onTabClose={closeTab}
        onNewTab={() => createTab(LANDING_URL)}
      />
      <Toolbar
        tabs={tabs}
        activeTabId={activeTabId}
        onNavigate={updateTabUrl}
        agentMode={agentMode}
        onToggleAgent={toggleAgentMode}
      />
      <div className="main-content">
        <WebviewContainer
          tabs={tabs}
          activeTabId={activeTabId}
          onTitleUpdate={updateTabTitle}
          onUrlUpdate={updateTabUrl}
        />
        <Sidebar isOpen={agentMode} onCreateAgentTab={createAgentTab} />
      </div>
    </div>
  );
}

export default App;
