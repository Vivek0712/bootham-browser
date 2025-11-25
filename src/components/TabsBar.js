import React from 'react';
import { WavyBackground } from './ui/wavy-background';
import './TabsBar.css';

function TabsBar({ tabs, activeTabId, onTabClick, onTabClose, onNewTab }) {
  return (
    <div className="tabs-bar-wrapper">
      <WavyBackground
        containerClassName="tabs-bar-wavy-container"
        className="tabs-bar-wavy-content"
        colors={[
          "rgba(168, 85, 247, 0.3)",
          "rgba(244, 114, 182, 0.3)",
          "rgba(251, 113, 133, 0.3)",
        ]}
        waveWidth={30}
        backgroundFill="rgba(26, 10, 46, 1)"
        blur={5}
        speed="slow"
        waveOpacity={0.3}
      >
        <div className="tabs-bar">
          <div className="tabs-container">
            {tabs.map(tab => (
              <div
                key={tab.id}
                className={`tab ${activeTabId === tab.id ? 'active' : ''}`}
                onClick={() => onTabClick(tab.id)}
              >
                <span className="tab-title">{tab.title}</span>
                <button
                  className="tab-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button className="new-tab-btn" onClick={onNewTab} title="New Tab">
            +
          </button>
        </div>
      </WavyBackground>
    </div>
  );
}

export default TabsBar;
