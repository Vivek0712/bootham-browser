import React, { useState, useEffect, useRef } from 'react';
import { Spotlight } from './ui/spotlight';
import { ShootingStars } from './ui/shooting-stars';
import { StarsBackground } from './ui/stars-background';
import './Sidebar.css';

function Sidebar({ isOpen, onCreateAgentTab }) {
  const [agentInitialized, setAgentInitialized] = useState(false);
  const [agentRunning, setAgentRunning] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [logs, setLogs] = useState([]);
  const [userQuestion, setUserQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const logContainerRef = useRef(null);

  useEffect(() => {
    if (isOpen && !agentInitialized) {
      initializeAgent();
    }

    // Listen for agent events
    if (window.electron && window.electron.ipcRenderer) {
      window.electron.ipcRenderer.on('agent:event', handleAgentEvent);
    }

    return () => {
      if (window.electron && window.electron.ipcRenderer) {
        window.electron.ipcRenderer.removeListener('agent:event', handleAgentEvent);
      }
    };
  }, [isOpen, agentInitialized]);

  useEffect(() => {
    // Auto-scroll logs
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const initializeAgent = async () => {
    try {
      addLog('Initializing agent service...', 'system');
      
      if (!window.electron || !window.electron.ipcRenderer) {
        addLog('Error: Electron IPC not available', 'error');
        return;
      }
      
      const result = await window.electron.ipcRenderer.invoke('agent:initialize', 'us-west-2');
      
      if (result && result.success) {
        setAgentInitialized(true);
        addLog('Agent service initialized successfully', 'system');
      } else {
        addLog(`Failed to initialize agent: ${result ? result.error : 'No response'}`, 'error');
      }
    } catch (error) {
      addLog(`Error initializing agent: ${error.message}`, 'error');
    }
  };

  const handleAgentEvent = (event, eventData) => {
    const { type, data } = eventData;
    
    switch (type) {
      case 'agent-start':
        addLog(`Starting agent with prompt: ${data.prompt}`, 'system');
        break;
      case 'agent-complete':
        addLog('Agent execution completed', 'system');
        setAgentRunning(false);
        break;
      case 'agent-error':
        addLog(`Agent error: ${data.error}`, 'error');
        setAgentRunning(false);
        break;
      case 'log':
        addLog(data.message, data.type);
        break;
      case 'tool-execute':
        addLog(`Executing tool: ${data.tool}`, 'system');
        break;
      case 'ask-user':
        setUserQuestion(data.question);
        break;
    }
  };

  const addLog = (message, type = 'system') => {
    // Format the message for better readability
    let formattedMessage = message;
    
    if (type === 'assistant') {
      try {
        // Try to parse JSON and format it nicely
        const parsed = JSON.parse(message);
        if (parsed.content && Array.isArray(parsed.content)) {
          // Extract text from content array
          const textContent = parsed.content
            .filter(item => item.text)
            .map(item => item.text)
            .join('\n');
          
          if (textContent) {
            formattedMessage = textContent;
          }
        }
      } catch (e) {
        // Not JSON or parsing failed, use as is
      }
    }
    
    setLogs(prev => [...prev, { message: formattedMessage, type, timestamp: Date.now() }]);
  };

  const executePrompt = async () => {
    if (!prompt.trim()) {
      addLog('Please enter a prompt', 'error');
      return;
    }

    if (!agentInitialized) {
      addLog('Agent not initialized. Initializing now...', 'system');
      await initializeAgent();
      if (!agentInitialized) {
        addLog('Failed to initialize agent. Cannot execute prompt.', 'error');
        return;
      }
    }

    try {
      setAgentRunning(true);
      addLog(`User: ${prompt}`, 'user');
      addLog('Preparing agent workspace...', 'system');

      // Create agent tab via parent component
      const agentTabId = await onCreateAgentTab();
      
      if (!agentTabId) {
        throw new Error('Failed to create agent tab');
      }

      addLog('Agent workspace ready. Executing prompt...', 'system');
      const result = await window.electron.ipcRenderer.invoke('agent:execute', prompt, agentTabId);
      
      if (result && !result.success) {
        addLog(`Error: ${result.error}`, 'error');
      } else if (!result) {
        addLog('Error: No response from agent service', 'error');
      }
      
      setPrompt('');
    } catch (error) {
      addLog(`Error executing prompt: ${error.message}`, 'error');
      console.error('Agent execution error:', error);
    } finally {
      setAgentRunning(false);
    }
  };

  const submitUserAnswer = async () => {
    if (!userAnswer.trim()) return;

    try {
      await window.electron.ipcRenderer.invoke('agent:respond', userAnswer);
      addLog(`User answered: ${userAnswer}`, 'user');
      setUserQuestion(null);
      setUserAnswer('');
    } catch (error) {
      addLog(`Error submitting answer: ${error.message}`, 'error');
    }
  };

  const stopAgent = async () => {
    try {
      await window.electron.ipcRenderer.invoke('agent:stop');
      addLog('Agent stopped by user', 'system');
      setAgentRunning(false);
    } catch (error) {
      addLog(`Error stopping agent: ${error.message}`, 'error');
    }
  };

  return (
    <div 
      className={`sidebar ${isOpen ? 'open' : 'closed'}`}
      style={{
        backgroundColor: isOpen ? '#0a1628' : 'transparent'
      }}
    >
      <div className="sidebar-canvas-wrapper">
        <StarsBackground
          starDensity={0.0004}
          allStarsTwinkle={true}
          twinkleProbability={0.9}
          minTwinkleSpeed={0.6}
          maxTwinkleSpeed={1.8}
        />
        <ShootingStars
          minSpeed={20}
          maxSpeed={40}
          minDelay={600}
          maxDelay={2500}
          starColor="#06b6d4"
          trailColor="#3b82f6"
          starWidth={18}
          starHeight={2}
        />
        <Spotlight
          gradientFirst="radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(190, 100%, 50%, .4) 0, hsla(210, 100%, 60%, .2) 50%, hsla(230, 100%, 50%, 0) 80%)"
          gradientSecond="radial-gradient(50% 50% at 50% 50%, hsla(180, 100%, 50%, .3) 0, hsla(200, 100%, 60%, .15) 80%, transparent 100%)"
          gradientThird="radial-gradient(50% 50% at 50% 50%, hsla(220, 100%, 60%, .25) 0, hsla(240, 100%, 50%, .1) 80%, transparent 100%)"
          translateY={-150}
          width={500}
          height={1400}
          smallWidth={250}
          duration={6}
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
            <span className="status-text">{agentRunning ? 'Working...' : 'Ready'}</span>
          </div>
          
          <div className="agent-log" ref={logContainerRef}>
            {logs.map((log, index) => {
              // Format message for display
              let displayMessage = log.message;
              
              // If it's still JSON, try to format it
              if (typeof displayMessage === 'string' && displayMessage.startsWith('{')) {
                try {
                  const parsed = JSON.parse(displayMessage);
                  displayMessage = JSON.stringify(parsed, null, 2);
                } catch (e) {
                  // Keep as is
                }
              }
              
              return (
                <div key={index} className={`log-entry log-${log.type}`}>
                  <pre className="log-content">{displayMessage}</pre>
                </div>
              );
            })}
            
            {userQuestion && (
              <div className="user-question">
                <div className="user-question-text">❓ {userQuestion}</div>
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && submitUserAnswer()}
                  placeholder="Your answer..."
                  autoFocus
                />
                <button onClick={submitUserAnswer}>Submit Answer</button>
              </div>
            )}
          </div>
        </div>
        <div className="sidebar-input-container">
          <textarea
            className="agent-input"
            placeholder="Ask the ghost... 👻"
            rows="3"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                executePrompt();
              }
            }}
            disabled={agentRunning}
          />
          {agentRunning ? (
            <button className="agent-send-btn agent-stop-btn" onClick={stopAgent}>
              <span>⏹ Stop</span>
            </button>
          ) : (
            <button className="agent-send-btn" onClick={executePrompt}>
              <span>🚀 Execute</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
