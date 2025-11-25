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
        <Sidebar isOpen={agentMode} />
      </div>
    </div>
  );
}

export default App;
