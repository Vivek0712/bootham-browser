import React, { useEffect, useRef } from 'react';
import LandingPage from './LandingPage';
import './WebviewContainer.css';

function WebviewContainer({ tabs, activeTabId, onTitleUpdate, onUrlUpdate }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const resizeWebviews = () => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      tabs.forEach(tab => {
        const webview = document.getElementById(`webview-${tab.id}`);
        if (webview) {
          webview.style.width = width + 'px';
          webview.style.height = height + 'px';
          webview.style.display = 'flex';
        }
      });
    };

    resizeWebviews();
    window.addEventListener('resize', resizeWebviews);
    
    const resizeTimer = setTimeout(resizeWebviews, 100);

    return () => {
      window.removeEventListener('resize', resizeWebviews);
      clearTimeout(resizeTimer);
    };
  }, [tabs]);

  useEffect(() => {
    tabs.forEach(tab => {
      const webview = document.getElementById(`webview-${tab.id}`);
      if (!webview || webview.dataset.listenersAdded) return;

      webview.dataset.listenersAdded = 'true';

      webview.addEventListener('did-navigate', () => {
        const url = webview.getURL();
        onUrlUpdate(tab.id, url);
        updateTitle(tab.id, webview);
      });

      webview.addEventListener('did-finish-load', () => {
        updateTitle(tab.id, webview);
      });

      webview.addEventListener('page-title-updated', (e) => {
        if (e.title) {
          onTitleUpdate(tab.id, e.title);
        }
      });
    });
  }, [tabs]);

  const updateTitle = (tabId, webview) => {
    const url = webview.getURL();
    if (url && url !== 'about:blank' && !url.includes('landing.html')) {
      try {
        const urlObj = new URL(url);
        onTitleUpdate(tabId, urlObj.hostname || 'New Tab');
      } catch {
        onTitleUpdate(tabId, 'New Tab');
      }
    } else {
      onTitleUpdate(tabId, 'New Tab');
    }
  };

  const isLandingPage = (url) => {
    return !url || url === 'about:blank' || url.includes('landing.html');
  };

  return (
    <div className="webview-container" ref={containerRef}>
      {tabs.map(tab => (
        <div
          key={tab.id}
          className={`webview-wrapper ${activeTabId === tab.id ? 'active' : ''}`}
        >
          {isLandingPage(tab.url) ? (
            <LandingPage />
          ) : (
            <webview
              id={`webview-${tab.id}`}
              src={tab.url}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default WebviewContainer;
