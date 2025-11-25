import React from 'react';
import { CanvasRevealEffect } from './ui/canvas-reveal-effect';
import { Spotlight } from './ui/spotlight';
import { ShootingStars } from './ui/shooting-stars';
import { StarsBackground } from './ui/stars-background';
import './Sidebar.css';

function Sidebar({ isOpen }) {
  console.log('Sidebar isOpen:', isOpen); // Debug log
  
  return (
    <div 
      className={`sidebar ${isOpen ? 'open' : 'closed'}`}
      style={{
        backgroundColor: isOpen ? '#1a0a2e' : 'transparent'
      }}
    >
      <div className="sidebar-canvas-wrapper">
        <StarsBackground
          starDensity={0.0003}
          allStarsTwinkle={true}
          twinkleProbability={0.8}
          minTwinkleSpeed={0.5}
          maxTwinkleSpeed={1.5}
        />
        <ShootingStars
          minSpeed={15}
          maxSpeed={35}
          minDelay={800}
          maxDelay={3000}
          starColor="#ec4899"
          trailColor="#a855f7"
          starWidth={15}
          starHeight={2}
        />
        <Spotlight
          gradientFirst="radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(330, 100%, 60%, .4) 0, hsla(300, 100%, 50%, .2) 50%, hsla(280, 100%, 40%, 0) 80%)"
          gradientSecond="radial-gradient(50% 50% at 50% 50%, hsla(330, 100%, 60%, .3) 0, hsla(300, 100%, 50%, .15) 80%, transparent 100%)"
          gradientThird="radial-gradient(50% 50% at 50% 50%, hsla(0, 100%, 50%, .25) 0, hsla(330, 100%, 40%, .1) 80%, transparent 100%)"
          translateY={-150}
          width={500}
          height={1400}
          smallWidth={250}
          duration={7}
          xOffset={50}
        />
        <div className="sidebar-gradient-overlay" />
        <div className="sidebar-grid-pattern" />
      </div>
      <div className="sidebar-content">
        <div className="sidebar-header">
          <div className="ghost-icon">👻</div>
          <h2 className="sidebar-title">Pei Agent</h2>
          <p className="sidebar-subtitle">Ghost AI Assistant</p>
        </div>
        <div className="sidebar-body">
          <div className="agent-status">
            <div className="status-indicator"></div>
            <span className="status-text">Haunting Mode Active</span>
          </div>
          <div className="agent-info">
            <p className="info-text">Your supernatural AI companion is ready to assist you through the web...</p>
          </div>
        </div>
        <div className="sidebar-input-container">
          <textarea
            className="agent-input"
            placeholder="Ask the ghost... 👻"
            rows="3"
          />
          <button className="agent-send-btn">
            <span>Send</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              style={{ width: '16px', height: '16px' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
